const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");
const { Client, Config, CheckoutAPI, Modification, hmacValidator } = require("@adyen/api-library");
const model = require("./models");
const OrderModel = require("./models").order;
const moment = require("moment");
const CryptoJS = require("crypto-js");
const btoa = require("btoa");
const request = require("request");
const common = require("./utils/common");

// init app
const app = express();
// setup request logging
app.use(morgan("dev"));
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve client from build folder
app.use(express.static(path.join(__dirname, "build")));

// enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
  path: "./.env",
});

// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);
const modification = new Modification(client);
const validator = new hmacValidator();

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.
const paymentDataStore = {};
// in memory store for transaction
const paymentStore = {};
const originStore = {};

/* ################# API ENDPOINTS ###################### */
app.get("/api/getPaymentDataStore", async (req, res) => res.json(paymentStore));

// Get payment methods
app.post("/api/getPaymentMethods", async (req, res) => {
  try {
    const response = await checkout.paymentMethods({
      channel: "Web",
      merchantAccount: process.env.MERCHANT_ACCOUNT,
    });
    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Submitting a payment
app.post("/api/initiatePayment/:orderId?", async (req, res) => {
  const currency = findCurrency(req.body.paymentMethod.type);
  // find shopper IP from request
  const shopperIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    // unique ref for the transaction
    const orderRef = uuid();
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.payments({
      amount: {
        currency: "SEK",
        value: 0,
        //  value: 1000
      }, // value is 10€ in minor units
      reference: orderRef, // required
      merchantAccount: process.env.MERCHANT_ACCOUNT, // required
      channel: "Web", // required
      additionalData: {
        // required for 3ds2 native flow
        allow3DS2: false,
      },
      origin: "http://localhost:8080", // required for 3ds2 native flow
      browserInfo: req.body.browserInfo, // required for 3ds2
      shopperIP, // required by some issuers for 3ds2
      // we pass the orderRef in return URL to get paymentData during redirects
      returnUrl: `http://localhost:8080/api/handleShopperRedirect?orderRef=${orderRef}`, // required for 3ds2 redirect flow
      paymentMethod: req.body.paymentMethod,
      billingAddress: req.body.billingAddress,
      shopperReference: req.params.orderId,
      storePaymentMethod: "true",
      shopperInteraction: "Ecommerce",
      recurringProcessingModel: "Subscription",
    });

    const { action } = response;
    const orderId = req.params.orderId;
    paymentStore[orderRef] = {
      amount: {
        currency,
        //  value: 1000
      },
      reference: orderRef,
    };

    if (action) {
      paymentDataStore[orderRef] = action.paymentData;
      const originalHost = new URL(req.headers["referer"]);
      if (originalHost) {
        originStore[orderRef] = originalHost.origin;
      }
    } else {
      paymentStore[orderRef].paymentRef = response.pspReference;
      paymentStore[orderRef].status = response.resultCode;
    }
    //update db that payment initiated
    console.log("response", response);
    if (response.resultCode === "Authorised") {
      this.updateOrderStatus(orderId, {
        orderStatus: "PAYMENT AUTHORIZED",
      });
      //send request to create account and then update the status in db
      this.createAccount(orderId).then((accountData) => {
        if (accountData.resultInfo.resultCode == 0 || accountData.resultInfo.resultCode == 200) {
          this.updateOrderStatus(orderId, {
            orderStatus: "ACCOUNT CREATED",
            ariaAccountID: accountData.acctCreateAccountResponseDetails.ariaAccountNo,
          });

          //add Payment Method
          this.addPaymethod(
            accountData.acctCreateAccountResponseDetails.ariaAccountNo,
            orderId
            //response.additionalData["recurring.recurringDetailReference"]
          ).then((paymentMethodData) => {
            if (paymentMethodData.resultInfo.resultCode == 0) {
              this.updateOrderStatus(orderId, {
                orderStatus: "PAYMENT METHOD ADDED",
              });

              //add Billing Group
              this.addBillingGroup(paymentMethodData.acctManagePayMethodResponseDetails.ariaPayMethodID, orderId).then(
                (billingGroupData) => {
                  if (billingGroupData.resultInfo.resultCode == 0) {
                    this.updateOrderStatus(orderId, {
                      orderStatus: "BILLING GROUP ADDED",
                      ariaBillingGroupID:
                        billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO.ariaBillingGroupID,
                    });

                    //add subscription
                    this.addSubscription(orderId, billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO).then(
                      (subsInformation) => {
                        if (subsInformation.resultInfo.resultCode == 0) {
                          this.updateOrderStatus(orderId, {
                            orderStatus: "SUBSCRIPTION ADDED",
                          });
                        } else {
                          //subscription Failed
                        }
                      }
                    );
                  } else {
                    //billing Group Failed
                  }
                }
              );
            } else {
              //paymentMethod failure
            }
          });
        } else {
          ///account failure
        }
      });
    } else {
    }
    //call method to create account and return data

    //send request to create billing group and update the status
    res.json([response, orderRef]); // sending a tuple with orderRef as well to be used in in submitAdditionalDetails if needed
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

app.post("/api/submitAdditionalDetails", async (req, res) => {
  // Create the payload for submitting payment details
  const payload = {
    details: req.body.details,
    paymentData: req.body.paymentData,
  };

  try {
    // Return the response back to client
    // (for further action handling or presenting result to shopper)
    const response = await checkout.paymentsDetails(payload);

    if (!response.action) {
      paymentStore[req.query.orderRef].paymentRef = response.pspReference;
      paymentStore[req.query.orderRef].status = response.resultCode;
    }
    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Handle all redirects from payment type
app.all("/api/handleShopperRedirect", async (req, res) => {
  // Create the payload for submitting payment details
  console.log("req", req);
  const orderRef = req.query.orderRef;
  const redirect = req.method === "GET" ? req.query : req.body;
  const details = {};
  if (redirect.payload) {
    details.payload = redirect.payload;
  } else if (redirect.redirectResult) {
    details.redirectResult = redirect.redirectResult;
  } else {
    details.MD = redirect.MD;
    details.PaRes = redirect.PaRes;
  }
  const originalHost = originStore[orderRef] || "";
  const payload = {
    details,
    paymentData: paymentDataStore[orderRef],
  };

  try {
    const response = await checkout.paymentsDetails(payload);
    if (response.resultCode) {
      paymentStore[orderRef].paymentRef = response.pspReference;
      paymentStore[req.query.orderRef].status = response.resultCode;
    }
    // Conditionally handle different result codes for the shopper
    switch (response.resultCode) {
      case "Authorised":
        res.redirect(`${originalHost}/status/success`);
        break;
      case "Pending":
      case "Received":
        res.redirect(`${originalHost}/status/pending`);
        break;
      case "Refused":
        res.redirect(`${originalHost}/status/failed`);
        break;
      default:
        res.redirect(`${originalHost}/status/error?reason=${response.resultCode}`);
        break;
    }
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.redirect(`${originalHost}/status/error?reason=${err.message}`);
  }
});

// Cancel or Refund a payment
app.post("/api/cancelOrRefundPayment", async (req, res) => {
  // Create the payload for cancelling payment
  const payload = {
    merchantAccount: process.env.MERCHANT_ACCOUNT, // required
    originalReference: paymentStore[req.query.orderRef].paymentRef, // required
    reference: uuid(),
  };

  try {
    // Return the response back to client
    const response = await modification.cancelOrRefund(payload);
    paymentStore[req.query.orderRef].status = "Refund Initiated";
    paymentStore[req.query.orderRef].modificationRef = response.pspReference;
    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Receive webhook notifications
app.post("/api/webhook/notification", async (req, res) => {
  // get the notification request from POST body
  const notificationRequestItems = req.body.notificationItems;

  notificationRequestItems.forEach(({ NotificationRequestItem }) => {
    console.info("Received webhook notification", NotificationRequestItem);
    // Process the notification based on the eventCode
    if (NotificationRequestItem.eventCode === "CANCEL_OR_REFUND") {
      if (validator.validateHMAC(NotificationRequestItem, process.env.ADYEN_HMAC_KEY)) {
        const payment = findPayment(NotificationRequestItem.pspReference);

        if (NotificationRequestItem.success === "true") {
          // update with additionalData.modification.action
          if (
            "modification.action" in NotificationRequestItem.additionalData &&
            "refund" === NotificationRequestItem.additionalData["modification.action"]
          ) {
            payment.status = "Refunded";
          } else {
            payment.status = "Cancelled";
          }
        } else {
          // update with failure
          payment.status = "Refund failed";
        }
      } else {
        console.error("NotificationRequest with invalid HMAC key received");
      }
    } else {
      // do nothing
      console.info("skipping non actionable webhook");
    }
  });

  res.send("[accepted]");
});

/* ################# end API ENDPOINTS ###################### */

/**
 * @name placeOrder
 * @description Get order Details and return Order id back
 */
app.post("/api/placeOrder", async (req, res) => {
  const accountInfo = req.body.accInfo;
  const billingInfo = req.body.billingInfo;
  const subsInfo = req.body.subsInfo;

  //add this request info in table

  //send back an order ID
  try {
    const dbParams = {
      orderDetails: JSON.stringify(req.body),
      orderStatus: "INITIATED",
    };
    const order = await OrderModel.create(dbParams);
    console.log(order.dataValues, "order");
    const response = {
      error: "false",
      statusCode: 200,
      orderId: order.dataValues.id,
      returnUrl: "http://localhost:3000/checkout/dropin/" + order.dataValues.id,
    };
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});
/** ############################### DB Operations ##################### */
exports.updateOrderStatus = async (orderId, params) => {
  const dbParams = params;
  const order = await OrderModel.update(dbParams, {
    where: {
      id: orderId,
    },
  });
};

exports.createAccount = async (orderId) => {
  const order = await this.getRequestParamsByOrderId(orderId);
  return new Promise((resolve, reject) => {
    const params = JSON.parse(order.orderDetails);
    const acctUrl =
      "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/Stampen/STMAccountManagement/STMAcctCreateAccountPwd";

    this.sendRequest(params.accountInfo, acctUrl).then((response) => {
      resolve(response.body);
    });
  });
};

exports.addPaymethod = async (accountNo, recurringId) => {
  return new Promise((resolve, reject) => {
    const params = {
      acctManagePayMethodDetails: {
        acctManagePayMethodActionInfo: {
          acctManagePayMethodAction: "ADD",
        },
        acctManagePayMethodADD: {
          ariaAgreementID: recurringId,
          ariaAccountID: "",
          ariaAccountNo: accountNo,
        },
      },
    };

    const acctUrl =
      "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/AccountManagement/AcctManagePayMethod";

    this.sendRequest(params, acctUrl).then((response) => {
      resolve(response.body);
    });
  });
};
exports.addBillingGroup = async (paymentMethodId, orderId) => {
  const order = await this.getRequestParamsByOrderId(orderId);
  return new Promise((resolve, reject) => {
    const orderDetails = JSON.parse(order.orderDetails);
    const params = {
      acctManageBillingGroupDetails: [
        {
          actionDirective: "ADD",
          ariaAccountNo: order.ariaAccountID,
          acctManageBillingGroupDetailsADD: {
            titleCode: orderDetails.subsInfo.titleCode,
            billingGroupStatus: "ACTIVE",
            notifyMethod: "XML",
            paymentOption: "METHODS",
            payOptionInfo: {
              payOptionID: "CREDITCARD",
              payOptionVariant: "STANDARD",
              paymentEANNum: "",
              paymentEANRequisitionNum: "",
            },
            paymentMethodInfo: {
              primaryPaymentMethodID: paymentMethodId, //the value get back from payment API
              backupPaymentMethodID: "",
            },
            statementContactDetails: null,
          },
        },
      ],
    };
    const billingUrl =
      "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/AccountManagement/AcctManageBillingGroup";

    this.sendRequest(params, billingUrl).then((response) => {
      resolve(response.body);
    });
  });
};
exports.addSubscription = async (orderId, billingInfo) => {
  const order = await this.getRequestParamsByOrderId(orderId);
  return new Promise((resolve, reject) => {
    const orderDetails = JSON.parse(order.orderDetails);
    const params = {
      subsManageSubscriptionAccountDetails: {
        ariaAccountID: "",
        ariaAccountNo: order.ariaAccountID,
        ownerTitleCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.ownerTitleCode,
        ownerTitleDomain: "",
      },
      subsManageSubscriptionDetails: [
        {
          actionDirective: "ADD",
          subsManageSubscriptionDetailsADD: {
            ariaPlanNo: order.orderDetails.subsInfo.ariaPlanNo,
            ariaPlanID: order.orderDetails.subsInfo.ariaPlanID,
            productType: order.orderDetails.subsInfo.productType,
            productTypeVariant: "STANDARD",
            titleCode: orderDetails.subsInfo.titleCode,
            titleDomain: order.orderDetails.subsInfo.titleDomain,
            ariaPlanRateScheduleID: order.orderDetails.subsInfo.ariaPlanRateScheduleID,
            numberOfUnits: order.orderDetails.subsInfo.numberOfUnits,
            ariaBillingGroupID: billingInfo.ariaBillingGroupID,
            ariaDunningGroupID: billingInfo.ariaDunningGroupID,
            currencyCode: "sek",
            billingFreqRecurring: order.orderDetails.subsInfo.billingFreqRecurring,
            billingFreqUsage: order.orderDetails.subsInfo.billingFreqUsage,
            selectedDeliveryDays: "",
            selectedDeliveryCharges: "",
            channelCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.channelCode,
            sourceCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.sourceCode,
            activationDate: null,
            subsManageSubscriptionAddInfo: {
              subscriptionInfo1: "",
              subscriptionInfo2: "",
              subscriptionInfo3: "",
            },
            subsManageSubscriptionCampaignDetail: order.orderDetails.subsInfo.subsManageSubscriptionCampaignDetail,
            subsManageSubscriptionDiscountDetail: order.orderDetails.subsInfo.subsManageSubscriptionDiscountDetail,
          },
        },
      ],
    };
    const subsUrl =
      "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/SubscriptionManagement/SubsManageSubscriptions";

    this.sendRequest(params, subsUrl).then((response) => {
      resolve(response.body);
    });
  });
};
exports.getRequestParamsByOrderId = async (orderId) => {
  //get order by id
  const orderInfo = await OrderModel.findOne({
    where: { id: orderId },
  });
  //get json parse string

  return orderInfo;
};

/** ################ AMPS Methods ########################## */
/**
 * @name   sendRequest
 * @param  {object} {params}
 * @return {object | undefined}
 * @summary make request and attach security header
 *
 */

exports.sendRequest = (additionalParams, endPoint) => {
  return new Promise((resolve, reject) => {
    const authToken = "gIW6EsgWyQmkkIVLZaKG";
    const ampsUserId = "75";
    const gmtTime = moment().utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    const signatureValue = this.generateToken(authToken, ampsUserId, gmtTime, "", 0, "", 1);

    let params = {
      msgAuthDetails: {
        clientNo: ampsUserId,
        requestDateTime: gmtTime,
        signatureValue: signatureValue,
        ariaAccountID: "",
        ariaAccountNo: 0,
        UserID: "",
        signatureVersion: 1,
      },
    };
    if (additionalParams) {
      params = { ...params, ...additionalParams };
    }

    var clientServerOptions = {
      uri: endPoint,
      json: true,
      body: params,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    request(clientServerOptions, function (error, response) {
      if (response) {
        //  return resolve(JSON.stringify(common.responseMaker(response.statusCode, response.body)));
        return resolve(response);
      } else {
        return reject(error);
      }
    });
  });
};
/**
 * @name   generateToken
 * @param  {object} {authKey}
 * @param  {object} {clientNo}
 * @param  {object} {ariaAccountID}
 * @param  {object} {ariaAccountNo}
 * @param  {object} {UserID}
 * @return {string} amps authentication token
 * @summary by using differtnt security algorithm generate
 * authentication token
 *
 */

exports.generateToken = (authKey, clientNo, requestDateTime, ariaAccountID, ariaAccountNo, UserID) => {
  const concatString = clientNo + "|" + requestDateTime + "|" + ariaAccountID + "|" + ariaAccountNo + "|" + UserID + "|" + authKey;

  return btoa(common.hex2a(CryptoJS.SHA256(common.utf16Converter(concatString)).toString()));
};
/* ################# CLIENT ENDPOINTS ###################### */

// Handles any requests that doesn't match the above
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* ################# end CLIENT ENDPOINTS ###################### */

/* ################# UTILS ###################### */

function findCurrency(type) {
  switch (type) {
    case "wechatpayqr":
    case "alipay":
      return "CNY";
    case "dotpay":
      return "PLN";
    case "boletobancario":
      return "BRL";
    default:
      return "EUR";
  }
}

function findPayment(pspReference) {
  const payments = Object.values(paymentStore).filter((v) => v.modificationRef === pspReference);
  if (payments.length > 0) {
    console.error("More than one payment found with same modification PSP reference");
  }
  return payments[0];
}

/* ################# end UTILS ###################### */

// Start server
const PORT = process.env.PORT || 8080;
model.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
});

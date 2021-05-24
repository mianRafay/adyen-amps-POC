/**
 * @author: Abdur Rafay
 * @description: route managment file for order APIs
 *
 */
const { Client, Config, CheckoutAPI, Modification, hmacValidator } = require("@adyen/api-library");
const router = require("express").Router();
const moment = require("moment");
const CryptoJS = require("crypto-js");
const btoa = require("btoa");
const request = require("request");
const common = require("../../utils/common");
const OrderServices = require("../../services/orders");
const { uuid } = require("uuidv4");
// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);
const modification = new Modification(client);
const validator = new hmacValidator();
const path = require("path");
const middleware = require("../../utils/middleware");

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.
const paymentDataStore = {};
// in memory store for transaction
const paymentStore = {};
const originStore = {};
const defaultSubscription = {
  offeringDetail: {
    productTypeVariant: "STANDARD",
    productTypeVariantCnt: 0,
    productPriceModel: "STANDARD",
    titleCode: "SM",
    offeringSeqNo: 1,
    productType: "DIGITAL",
    offeringSortSequence: 0,
    offeringUUID: "cbd543e4-d9a9-481e-8add-22e43b7a2fb1",
    dateEarliestDeliveryChange: "",
    titleDomain: "stampen.se",
    isPurchaseRestricted: false,
    offeringType: "PRODUCT",
    isDeliveryRestricted: false,
    isPaymentRestricted: true,
    paymentMethodReqd: [
      {
        paymentMethodReqd: "ANY",
      },
    ],
    offeringNameTranslations: {
      solmRefTransNo: "0",
      solmTranslationEntry: [
        {
          solmLocaleID: "SE-SVENSKA",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB-SHORT",
          solmRefTransText: null,
        },
      ],
    },
    offeringDescTranslations: {
      solmRefTransNo: "0",
      solmTranslationEntry: [
        {
          solmLocaleID: "SE-SVENSKA",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB-SHORT",
          solmRefTransText: null,
        },
      ],
    },
    offeringDiscountApplied: false,
  },
  offeringPlanDetail: {
    offeringPlanRates: [
      {
        ariaScheduleNo: "379955",
        costVAT: null,
        costInclVAT: null,
        ariaScheduleName: "SM-C-DIGITAL-FREECUSTOMER-SEK-01",
        discountedCostExclVAT: null,
        ariaScheduleID: "SM-C-DIGITAL-FREECUSTOMER-SEK-01",
        currencyCode: "sek",
        scheduleNameTranslations: {
          solmRefTransNo: "980000379955",
          solmTranslationEntry: [
            {
              solmLocaleID: "System_US_English_locale",
              solmRefTransText: "SM-C-DIGITAL-FREECUSTOMER-SEK-01",
            },
          ],
        },
        offeringPlanRateServices: [],
        billingFreqUsage: 1,
        isDefault: true,
        billingFreqRecurring: 1,
        costExclVAT: null,
        discountedCostVAT: null,
        discountedCostInclVAT: null,
      },
    ],
    offeringEligibleForBundles: false,
    offeringPlanRateOverview: [],
    offeringEligibleForDiscounts: false,
    planAccessDays: "DDDDDDD",
    subsGetEligibleOfferingsSharingInfo: null,
    ariaPlanID: "SM-C-DIGITAL-FREECUSTOMER",
    subsGetEligibleOfferingsPrimaryTitle: [
      {
        titleNameTranslations: {
          solmRefTransNo: "17",
          solmTranslationEntry: [
            {
              solmLocaleID: "SE-SVENSKA",
              solmRefTransText: "Stampen Media",
            },
          ],
        },
        titleDescTranslations: {
          solmRefTransNo: "18",
          solmTranslationEntry: [
            {
              solmLocaleID: "SE-SVENSKA",
              solmRefTransText: "Stampen title code to support the News Letter product",
            },
          ],
        },
        titleCode: "SM",
        titleName: "Stampen Media",
        titleDesc: "Stampen Media",
      },
    ],
    subsGetEligibleOfferingsDigitalTitle: [
      {
        subsGetEligibleOfferingsAccessFeatures: [
          {
            accessFeature: "NEWSLETTER",
          },
        ],
        subsGetEligibleOfferingsTitleDetails: {
          titleNameTranslations: {
            solmRefTransNo: "17",
            solmTranslationEntry: [
              {
                solmLocaleID: "SE-SVENSKA",
                solmRefTransText: "Stampen Media",
              },
            ],
          },
          titleDescTranslations: {
            solmRefTransNo: "18",
            solmTranslationEntry: [
              {
                solmLocaleID: "SE-SVENSKA",
                solmRefTransText: "Stampen title code to support the News Letter product",
              },
            ],
          },
          titleDesc: "Stampen Media",
          titleName: "Stampen Media",
          titleCode: "SM",
        },
      },
    ],
    ariaPlanNo: 104172,
    planNameTranslations: {
      solmRefTransNo: "0",
      solmTranslationEntry: [
        {
          solmLocaleID: "SE-SVENSKA",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB-SHORT",
          solmRefTransText: null,
        },
      ],
    },
    planDescTranslations: {
      solmRefTransNo: "0",
      solmTranslationEntry: [
        {
          solmLocaleID: "SE-SVENSKA",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB",
          solmRefTransText: null,
        },
        {
          solmLocaleID: "SE-SVENSKA-WEB-SHORT",
          solmRefTransText: null,
        },
      ],
    },
  },
  offeringCampaignDetail: null,
  offeringCampaignList: [],
  offeringBundleDetail: null,
  offeringDiscountDetail: null,
};

router.get("/getPaymentDataStore", async (req, res) => res.json(paymentStore));

// Get payment methods
router.post("/getPaymentMethods", async (req, res) => {
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
router.post("/initiatePayment/:orderId?", async (req, res) => {
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
    if (response.resultCode === "Authorised") {
      OrderServices.updateOrderStatus(orderId, {
        orderStatus: "PAYMENT AUTHORIZED",
      });
      //send request to create account and then update the status in db
      this.createAccount(orderId).then(async (accountData) => {
        if (accountData.resultInfo.resultCode == 0 || accountData.resultInfo.resultCode == 200) {
          await OrderServices.updateOrderStatus(orderId, {
            orderStatus: "ACCOUNT CREATED",
            ariaAccountID: accountData.acctCreateAccountResponseDetails.ariaAccountNo,
          });
          //default subscription
          this.addSubscription(orderId, accountData.acctCreateAccountResponseDetails.acctCreateAccountBillingGroupDetails[0], true).then(
            (defaultSub) => {
              //add Payment Method
              this.addPaymethod(
                accountData.acctCreateAccountResponseDetails.ariaAccountNo,
                orderId
                //response.additionalData["recurring.recurringDetailReference"]
              ).then((paymentMethodData) => {
                if (paymentMethodData.resultInfo.resultCode == 0) {
                  OrderServices.updateOrderStatus(orderId, {
                    orderStatus: "PAYMENT METHOD ADDED",
                  });

                  //add Billing Group
                  this.addBillingGroup(paymentMethodData.acctManagePayMethodResponseDetails.ariaPayMethodID, orderId).then(
                    (billingGroupData) => {
                      if (billingGroupData.resultInfo.resultCode == 0) {
                        OrderServices.updateOrderStatus(orderId, {
                          orderStatus: "BILLING GROUP ADDED",
                          ariaBillingGroupID:
                            billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO.ariaBillingGroupID,
                        });

                        //add subscription
                        this.addSubscription(
                          orderId,
                          billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO,
                          false
                        ).then((subsInformation) => {
                          if (subsInformation.resultInfo.resultCode == 0) {
                            OrderServices.updateOrderStatus(orderId, {
                              orderStatus: "SUBSCRIPTION ADDED",
                            });
                          } else {
                            //subscription Failed
                          }
                        });
                      } else {
                        //billing Group Failed
                      }
                    }
                  );
                } else {
                  //paymentMethod failure
                }
              });
            }
          );
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

router.post("/submitAdditionalDetails", async (req, res) => {
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
router.all("/handleShopperRedirect", async (req, res) => {
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
router.post("/cancelOrRefundPayment", async (req, res) => {
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
router.post("/webhook/notification", async (req, res) => {
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
 * @name orderManageOrder
 * @description Get order Details and return Order id back
 */
router.post("/orderManageOrder", middleware.apiValidator(), async (req, res) => {
  //send back an order ID
  try {
    const dbParams = {
      orderDetails: JSON.stringify(req.body.manageOrderDetails),
      orderStatus: "INITIATED",
    };
    const order = await OrderServices.createOrder(dbParams);
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

/**
 * @name orderRetrieveOrder
 * @description: Send Order Status Back
 */
router.get("/orderRetrieveOrder", async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderDetails = await OrderServices.getRequestParamsByOrderId(orderId);
    const response = {
      error: "false",
      statusCode: 200,
      orderId: orderDetails.id,
      orderStatus: orderDetails.orderStatus,
    };
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

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

exports.createAccount = async (orderId) => {
  const order = await OrderServices.getRequestParamsByOrderId(orderId);
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
  const order = await OrderServices.getRequestParamsByOrderId(orderId);
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
            statementContactDetails: {
              firstName: orderDetails.accountInfo.firstName,
              middleInitials: orderDetails.accountInfo.middleInitials,
              lastName: orderDetails.accountInfo.lastName,
              emailAddress: orderDetails.accountInfo.emailAddress,
              fullName: orderDetails.accountInfo.company || orderDetails.accountInfo.firstName + " " + orderDetails.accountInfo.lastName,
              homePhone: orderDetails.accountInfo.homePhone,
              cellPhone: orderDetails.accountInfo.cellPhone,
              workPhone: orderDetails.accountInfo.workPhone,
              birthDate: orderDetails.accountInfo.birthDate,
              addressLine1: orderDetails.accountInfo.addressLine1,
              addressLine2: orderDetails.accountInfo.addressLine2,
              addressLine3: orderDetails.accountInfo.addressLine3,
              countryCode: orderDetails.accountInfo.countryCode,
              postalCode: orderDetails.accountInfo.postalCode,
              postalCity: orderDetails.accountInfo.postalCity,
              addrLocality: orderDetails.accountInfo.addrLocality,
              addrStateProv: orderDetails.accountInfo.addrStateProv,
              streetName: orderDetails.accountInfo.streetName,
              streetNo: orderDetails.accountInfo.streetNo,
            },
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
exports.addDeliveryAddress = async (orderId) => {
  const order = await OrderServices.getRequestParamsByOrderId(orderId);
  let params = {};
  return new Promise((resolve, reject) => {
    const orderDetails = JSON.parse(order.orderDetails);
    params = {
      distManageAddrAccountInfo: {
        ariaAccountNo: order.ariaAccountID,
      },
      distManageAddrList: [
        {
          distManageAddrActionInfo: { distManageAddrAction: "ADD" },
          distManageAddrInfo: {
            distAddrType: 1,
            distAddrNo: null,
            distAddrName: orderDetails.accountInfo.firstName + " " + orderDetails.accountInfo.lastName,
            //   distAddrLine1: tempDeliverydata.distAddrLine1,
            //   distAddrLine2: tempDeliverydata.distAddrLine2,
            //   distAddrLine3: tempDeliverydata.distAddrLine3,
            distAddrCountryCode: orderDetails.accountInfo.countryCode,
            distAddrPostalCode: orderDetails.accountInfo.postalCode,
            distAddrCity: orderDetails.accountInfo.postalCity,
            // distAddInfo1: tempDeliverydata.distAddInfo1,
            // distAddInfo2: tempDeliverydata.distAddInfo2,
            // distAddInfo3: tempDeliverydata.distAddInfo3,
            distAddrLocality: orderDetails.accountInfo.addrLocality,
            distAddrStateProv: orderDetails.accountInfo.addrStateProv,
            distStreetName: orderDetails.accountInfo.streetName,
            distStreetNo: orderDetails.accountInfo.streetNo,
            distFlatNo: orderDetails.accountInfo.flatNo,
            distFlatSpec: orderDetails.accountInfo.flatSpec,
            distFlatFloor: orderDetails.accountInfo.flatFloor,
            distEntranceNo: orderDetails.accountInfo.entranceNo,
            // distPublAddrNo: orderDetails.accountInfo.streetNo,
            // distCoAddr: orderDetails.accountInfo.streetNo,
          },
        },
      ],
    };
    const addrUrl = "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/DistributionManagement/DistManageAddr";

    this.sendRequest(params, addrUrl).then((response) => {
      resolve(response.body);
    });
  });
};
exports.addSubscription = async (orderId, billingInfo, isDefault = false) => {
  const order = await OrderServices.getRequestParamsByOrderId(orderId);
  let params = {};
  return new Promise((resolve, reject) => {
    const orderDetails = JSON.parse(order.orderDetails);
    if (isDefault) {
      params = {
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
              ariaPlanNo: defaultSubscription.offeringPlanDetail.ariaPlanNo,
              ariaPlanID: defaultSubscription.offeringPlanDetail.ariaPlanID,
              productType: defaultSubscription.offeringDetail.productType,
              productTypeVariant: defaultSubscription.offeringDetail.productTypeVariant,
              titleCode: defaultSubscription.offeringDetail.titleCode,
              titleDomain: defaultSubscription.offeringDetail.titleDomain,
              ariaPlanRateScheduleID: defaultSubscription.offeringPlanDetail.offeringPlanRates[0].ariaScheduleID,
              ariaBillingGroupID: billingInfo.ariaBillingGroupID,
              ariaDunningGroupID: billingInfo.ariaDunningGroupID,
              currencyCode: "sek",
              billingFreqRecurring: defaultSubscription.offeringPlanDetail.offeringPlanRates[0].billingFreqRecurring,
              billingFreqUsage: defaultSubscription.offeringPlanDetail.offeringPlanRates[0].billingFreqUsage,
              channelCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.channelCode,
              sourceCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.sourceCode,
              initialStatusCode: "61",
            },
          },
        ],
      };
    } else {
      params = {
        subsManageSubscriptionAccountDetails: {
          ariaAccountID: "",
          ariaAccountNo: order.ariaAccountID,
          ownerTitleCode: orderDetails.subsInfo.titleCode,
          ownerTitleDomain: "",
        },
        subsManageSubscriptionDetails: [
          {
            actionDirective: "ADD",
            subsManageSubscriptionDetailsADD: {
              ariaPlanNo: orderDetails.subsInfo.ariaPlanNo,
              ariaPlanID: orderDetails.subsInfo.ariaPlanID,
              productType: orderDetails.subsInfo.productType,
              productTypeVariant: "STANDARD",
              titleCode: orderDetails.subsInfo.titleCode,
              titleDomain: orderDetails.subsInfo.titleDomain,
              ariaPlanRateScheduleID: orderDetails.subsInfo.ariaPlanRateScheduleID,
              numberOfUnits: orderDetails.subsInfo.numberOfUnits,
              ariaBillingGroupID: billingInfo.ariaBillingGroupID,
              ariaDunningGroupID: billingInfo.ariaDunningGroupID,
              currencyCode: "sek",
              billingFreqRecurring: orderDetails.subsInfo.billingFreqRecurring,
              billingFreqUsage: orderDetails.subsInfo.billingFreqUsage,
              selectedDeliveryDays: "", //not in free one
              selectedDeliveryCharges: "",
              channelCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.channelCode,
              sourceCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.sourceCode,
              activationDate: null,
              subsManageSubscriptionAddInfo: {
                subscriptionInfo1: "",
                subscriptionInfo2: "",
                subscriptionInfo3: "",
              },
              subsManageSubscriptionCampaignDetail: orderDetails.subsInfo.subsManageSubscriptionCampaignDetail,
              subsManageSubscriptionDiscountDetail: orderDetails.subsInfo.subsManageSubscriptionDiscountDetail,
              //   subsManageSubscriptionAddrInfo: {
              //     distEffectiveStartDate: "2019-02-03",
              //     distEffectiveEndDate: null,
              //     distAddrDeliveryList: [
              //       { distAddrNo: 112233, distDeliveryDays: "DDDDDXX" },
              //       { distAddrNo: 112234, distDeliveryDays: "XXXXXDD" },
              //     ],
              //   },
            },
          },
        ],
      };
    }
    const subsUrl =
      "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/SubscriptionManagement/SubsManageSubscriptions";

    this.sendRequest(params, subsUrl).then((response) => {
      resolve(response.body);
    });
  });
};
/* ################# CLIENT ENDPOINTS ###################### */
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
// Handles any requests that doesn't match the above
// router.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

/* ################# end CLIENT ENDPOINTS ###################### */

module.exports = router;

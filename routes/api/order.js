/**
 * @author: Abdur Rafay
 * @description: route managment file for order APIs
 *
 */
const { Client, Config, CheckoutAPI, Modification, hmacValidator } = require("@adyen/api-library");
const router = require("express").Router();
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
const middleware = require("../../utils/middleware");
const { ORDER_STATUS } = require("../../utils/constants");
const orderController = require("../../controllers/orders");

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.
const paymentDataStore = {};
// in memory store for transaction
const paymentStore = {};
const originStore = {};

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
  const orderId = req.params.orderId;
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
        "riskdata.skipRisk": "true",
        allow3DS2: false,
      },
      origin: process.env.ORIGIN_URL, // required for 3ds2 native flow
      browserInfo: req.body.browserInfo, // required for 3ds2
      shopperIP, // required by some issuers for 3ds2
      // we pass the orderRef in return URL to get paymentData during redirects
      returnUrl: `${process.env.ORIGIN_URL}/api/handleShopperRedirect?orderRef=${orderRef}`, // required for 3ds2 redirect flow
      paymentMethod: req.body.paymentMethod,
      billingAddress: req.body.billingAddress,
      shopperReference: req.params.orderId,
      storePaymentMethod: "true",
      shopperInteraction: "Ecommerce",
      recurringProcessingModel: "Subscription",
    });

    const { action } = response;
    paymentStore[orderRef] = {
      amount: {
        currency,
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
      await OrderServices.updateOrderStatus(orderId, {
        orderStatus: ORDER_STATUS.SUCCESS.PAYMENT,
      });

      const orderData = await OrderServices.getRequestParamsByOrderId(orderId);
      const actionDirective = await JSON.parse(orderData.orderDetails).actionDirective;
      switch (actionDirective) {
        case "ADD":
          {
            const accountCreateData = await orderController.createAccount(orderId, orderData);
            const updatedOrderData = await OrderServices.getRequestParamsByOrderId(orderId);
            const defaultSub = await orderController.addSubscription(
              orderId,
              updatedOrderData,
              accountCreateData.acctCreateAccountResponseDetails.acctCreateAccountBillingGroupDetails[0],
              true
            );
            const paymentMethodData = await orderController.addPaymethod(updatedOrderData, orderId);
            const billingGroupData = await orderController.addBillingGroup(
              orderId,
              paymentMethodData.acctManagePayMethodResponseDetails.ariaPayMethodID,
              updatedOrderData
            );
            const subscriptionData = await orderController.addSubscription(
              orderId,
              updatedOrderData,
              billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO,
              false
            );
          }
          break;
        case "ADD-EXISTING-ACCT":
          {
            const updatedOrderData = await OrderServices.getRequestParamsByOrderId(orderId);
            const paymentMethodData = await orderController.addPaymethod(updatedOrderData, orderId);
            const billingGroupData = await orderController.addBillingGroup(
              orderId,
              paymentMethodData.acctManagePayMethodResponseDetails.ariaPayMethodID,
              updatedOrderData
            );
            const subscriptionData = await orderController.addSubscription(
              orderId,
              updatedOrderData,
              billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO,
              false
            );
          }
          break;
      }
      res.send([response, orderRef]);
    } else {
      OrderServices.updateOrderStatus(orderId, {
        orderFailureModule: "ADEYN FLOW FAILED",
        orderFailureReason: JSON.stringify(response),
      });
    }
  } catch (err) {
    OrderServices.updateOrderStatus(orderId, {
      orderFailureModule: "ADEYN FLOW FAILED",
      orderFailureReason: JSON.stringify(err),
    });
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
  let response;
  try {
    switch (req.body.manageOrderDetails.actionDirective) {
      case "MODIFY":
        response = await orderController.modifyOrder(req);
        break;
      case "REMOVE":
        response = await orderController.deleteOrder(req);
        break;
      case "ADD-EXISTING-BG":
        response = await orderController.createOrderForExistingBilling(req);
        break;
      case "ADD-EXISTING-ACCT":
        response = await orderController.createOrderForExistingAccount(req);
        break;
      default:
        response = await orderController.createOrder(req);
    }

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
      resultInfo: {
        error: "false",
        statusCode: 200,
        orderId: orderDetails.id,
        orderStatus: orderDetails.orderStatus,
        ariaMPINo: orderDetails.ariaMPINo,
        ariaMPIID: orderDetails.ariaMPIID,
        ariaAccountID: orderDetails.ariaAccountID,
        ariaAccountNo: orderDetails.ariaAccountNo,
        ariaBillingGroupID: orderDetails.ariaBillingGroupID,
        orderDetails: orderDetails.orderFailureReason ? JSON.parse(orderDetails.orderDetails) : "",
        orderStatusReason: orderDetails.orderFailureModule,
      },
    };
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

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

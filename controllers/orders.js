const common = require("../utils/common");
const OrderServices = require("../services/orders");

const { ORDER_STATUS } = require("../utils/constants");
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

exports.createAccount = async (orderId, orderData) => {
  try {
    const params = JSON.parse(orderData.orderDetails);
    const acctUrl =
      "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/Stampen/STMAccountManagement/STMAcctCreateAccountPwd";

    const accountCreateData = await common.sendRequest(params.accountInfo, acctUrl);
    if (accountCreateData.resultInfo.resultCode != 0 && accountCreateData.resultInfo.resultCode != 200) {
      await OrderServices.updateOrderStatus(orderId, {
        orderStatus: ORDER_STATUS.FAILURE.ACCOUNT,
        orderFailureReason: JSON.stringify(accountCreateData),
      });
      //throw new Error('Error Occured');
    } else {
      await OrderServices.updateOrderStatus(orderId, {
        orderStatus: ORDER_STATUS.SUCCESS.ACCOUNT,
        ariaAccountNo: accountCreateData.acctCreateAccountResponseDetails.ariaAccountNo,
        ariaAccountID: accountCreateData.acctCreateAccountResponseDetails.ariaAccountID,
      });
    }
    return accountCreateData;
  } catch (e) {
    return e;
  }
};

exports.addPaymethod = async (orderData, orderId) => {
  const params = {
    acctManagePayMethodDetails: {
      acctManagePayMethodActionInfo: {
        acctManagePayMethodAction: "ADD",
      },
      acctManagePayMethodADD: {
        ariaAgreementID: orderId,
        ariaAccountID: "",
        ariaAccountNo: orderData.ariaAccountNo,
      },
    },
  };

  const acctUrl =
    "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/AccountManagement/AcctManagePayMethod";

  const paymentMethodData = await common.sendRequest(params, acctUrl);
  if (paymentMethodData.resultInfo.resultCode !== 0) {
    await OrderServices.updateOrderStatus(orderId, {
      orderStatus: ORDER_STATUS.FAILURE.PAYMENT_METHOD,
      orderFailureReason: JSON.stringify(paymentMethodData),
    });
    res.json([response, orderRef]);
  }
  OrderServices.updateOrderStatus(orderId, {
    orderStatus: ORDER_STATUS.SUCCESS.PAYMENT_METHOD,
  });
  return paymentMethodData;
};

exports.addBillingGroup = async (orderId, paymentMethodId, orderData) => {
  const orderDetails = JSON.parse(orderData.orderDetails);
  const params = {
    acctManageBillingGroupDetails: [
      {
        actionDirective: "ADD",
        ariaAccountNo: orderData.ariaAccountNo,
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
            firstName: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.firstName,
            middleInitials: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.middleInitials,
            lastName: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.lastName,
            emailAddress: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.emailAddress,
            fullName:
              orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.company ||
              orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.firstName +
                " " +
                orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.lastName,
            homePhone: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.homePhone,
            cellPhone: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.cellPhone,
            workPhone: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.workPhone,
            birthDate: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.birthDate,
            addressLine1: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addressLine1,
            addressLine2: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addressLine2,
            addressLine3: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addressLine3,
            countryCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.countryCode,
            postalCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.postalCode,
            postalCity: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.postalCity,
            addrLocality: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addrLocality,
            addrStateProv: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addrStateProv,
            streetName: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.streetName,
            streetNo: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.streetNo,
          },
        },
      },
    ],
  };
  const billingUrl =
    "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/AccountManagement/AcctManageBillingGroup";

  const billingGroupData = await common.sendRequest(params, billingUrl);
  if (billingGroupData.resultInfo.resultCode !== 0) {
    await OrderServices.updateOrderStatus(orderId, {
      orderStatus: ORDER_STATUS.FAILURE.BILLING_GROUP,
    });
  }
  OrderServices.updateOrderStatus(orderId, {
    orderStatus: ORDER_STATUS.SUCCESS.BILLING_GROUP,
    ariaBillingGroupID: billingGroupData.acctManageBillingGroupResponseDetails[0].billingGroupResponseINFO.ariaBillingGroupID,
  });
  return billingGroupData;
};

exports.addDeliveryAddress = async (orderData) => {
  let params = {};

  const orderDetails = JSON.parse(orderData.orderDetails);
  params = {
    distManageAddrAccountInfo: {
      ariaAccountNo: orderData.ariaAccountNo,
    },
    distManageAddrList: [
      {
        distManageAddrActionInfo: { distManageAddrAction: "ADD" },
        distManageAddrInfo: {
          distAddrType: 1,
          distAddrNo: null,
          distAddrName:
            orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.firstName +
            " " +
            orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.lastName,
          //   distAddrLine1: tempDeliverydata.acctCreateAccountRequestDetails.accountContact.distAddrLine1,
          //   distAddrLine2: tempDeliverydata.acctCreateAccountRequestDetails.accountContact.distAddrLine2,
          //   distAddrLine3: tempDeliverydata.acctCreateAccountRequestDetails.accountContact.distAddrLine3,
          distAddrCountryCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.countryCode,
          distAddrPostalCode: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.postalCode,
          distAddrCity: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.postalCity,
          // distAddInfo1: tempDeliverydata.acctCreateAccountRequestDetails.accountContact.distAddInfo1,
          // distAddInfo2: tempDeliverydata.acctCreateAccountRequestDetails.accountContact.distAddInfo2,
          // distAddInfo3: tempDeliverydata.acctCreateAccountRequestDetails.accountContact.distAddInfo3,
          distAddrLocality: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addrLocality,
          distAddrStateProv: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.addrStateProv,
          distStreetName: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.streetName,
          distStreetNo: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.streetNo,
          distFlatNo: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.flatNo,
          distFlatSpec: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.flatSpec,
          distFlatFloor: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.flatFloor,
          distEntranceNo: orderDetails.accountInfo.acctCreateAccountRequestDetails.accountContact.entranceNo,
          // distPublAddrNo: orderDetails.acctCreateAccountRequestDetails.accountContact.accountInfo.streetNo,
          // distCoAddr: orderDetails.acctCreateAccountRequestDetails.accountContact.accountInfo.streetNo,
        },
      },
    ],
  };
  const addrUrl =
    "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAPublishingSuite/DistributionManagement/DistManageAddr";

  const response = await common.sendRequest(params, addrUrl);
  return response;
};

exports.addSubscription = async (orderId, orderData, billingInfo, isDefault = false) => {
  let params = {};

  const orderDetails = JSON.parse(orderData.orderDetails);
  if (isDefault) {
    params = {
      subsManageSubscriptionAccountDetails: {
        ariaAccountID: "",
        ariaAccountNo: orderData.ariaAccountNo,
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

    const defaultSub = await this.sendSubscription(params);
    if (defaultSub.resultInfo.resultCode !== 0) {
      await OrderServices.updateOrderStatus(orderId, {
        orderStatus: ORDER_STATUS.FAILURE.DEFAULT_SUBSCRIPTION,
        orderFailureReason: JSON.stringify(defaultSub),
      });
    }
    return defaultSub;
  } else {
    if (orderDetails.subsInfo.productType !== "DIGITAL") {
      const addressData = await this.addDeliveryAddress(orderData);

      params = {
        subsManageSubscriptionAccountDetails: {
          ariaAccountID: "",
          ariaAccountNo: orderData.ariaAccountNo,
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
              subsManageSubscriptionAddrInfo: {
                distEffectiveStartDate: orderDetails.subsInfo.deliverAddrChangeInfo.distEffectiveStartDate,
                distEffectiveEndDate: null,
                distAddrDeliveryList: [
                  {
                    distAddrNo: addressData.distManageAddrListResponse[0].distManageAddrInfo.distAddrNo,
                    distDeliveryDays: orderDetails.subsInfo.deliverAddrChangeInfo.distDeliveryDays,
                  },
                ],
              },
              subsManageSubscriptionCampaignDetail: orderDetails.subsInfo.subsManageSubscriptionCampaignDetail,
              subsManageSubscriptionDiscountDetail: orderDetails.subsInfo.subsManageSubscriptionDiscountDetail,
            },
          },
        ],
      };
      const subscriptionData = await this.sendSubscription(params);
      if (subscriptionData.resultInfo.resultCode !== 0) {
        await OrderServices.updateOrderStatus(orderId, {
          orderStatus: ORDER_STATUS.FAILURE.SUBSCRIPTION,
          orderFailureReason: JSON.stringify(defaultSub),
        });
      }
      OrderServices.updateOrderStatus(orderId, {
        orderStatus: ORDER_STATUS.SUCCESS.SUBSCRIPTION,
        ariaMPINo: subscriptionData.subsManageSubscriptionResponseDetails[0].ariaPINo,
        ariaMPIID: subscriptionData.subsManageSubscriptionResponseDetails[0].ariaPIID,
      });
      return subscriptionData;
    } else {
      params = {
        subsManageSubscriptionAccountDetails: {
          ariaAccountID: "",
          ariaAccountNo: orderData.ariaAccountNo,
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
            },
          },
        ],
      };
      const subscriptionData = await this.sendSubscription(params);
      if (subscriptionData.resultInfo.resultCode !== 0) {
        await OrderServices.updateOrderStatus(orderId, {
          orderStatus: ORDER_STATUS.FAILURE.SUBSCRIPTION,
          orderFailureReason: JSON.stringify(defaultSub),
        });
      }
      OrderServices.updateOrderStatus(orderId, {
        orderStatus: ORDER_STATUS.SUCCESS.SUBSCRIPTION,
        ariaMPINo: subscriptionData.subsManageSubscriptionResponseDetails[0].ariaPINo,
        ariaMPIID: subscriptionData.subsManageSubscriptionResponseDetails[0].ariaPIID,
      });
      return subscriptionData;
    }
  }
};

exports.sendSubscription = async (params) => {
  const subsUrl =
    "https://eu-stage05.workflow.ariasystems.net/bpa/Stampen_Dev01/PostDataToFlow/ARIAMediaSuite/SubscriptionManagement/SubsManageSubscriptions";

  const response = common.sendRequest(params, subsUrl);
  return response;
};

exports.createOrder = async (req) => {
  const dbParams = {
    orderDetails: JSON.stringify(req.body.manageOrderDetails),
    orderStatus: "INITIATED",
  };
  const order = await OrderServices.createOrder(dbParams);
  const response = {
    resultInfo: {
      error: "false",
      resultCode: 200,
      resultText: `Order # ${dbParams.id} is created successfully`,
      orderId: order.dataValues.id,
      returnUrl: `${process.env.CALLBACK_URL}/checkout/dropin/` + order.dataValues.id,
    },
  };
  return response;
};
exports.createOrderForExistingAccount = async (req) => {
  const requestData = req.body.manageOrderDetails;
  const dbParams = {
    orderDetails: JSON.stringify(requestData),
    orderStatus: "INITIATED",
    ariaAccountID: requestData.accountInfo.acctCreateAccountRequestDetails.ariaAccountID,
    ariaAccountNo: requestData.accountInfo.acctCreateAccountRequestDetails.ariaAccountNo,
  };
  const order = await OrderServices.createOrder(dbParams);
  const response = {
    resultInfo: {
      error: "false",
      resultCode: 200,
      resultText: `Order # ${dbParams.id} is created successfully against Account No: ${requestData.accountInfo.acctCreateAccountRequestDetails.ariaAccountNo} `,
      orderId: order.dataValues.id,
      returnUrl: `${process.env.CALLBACK_URL}/checkout/dropin/` + order.dataValues.id,
    },
  };
  return response;
};
exports.createOrderForExistingBilling = async (req) => {
  const requestData = req.body.manageOrderDetails;
  const dbParams = {
    orderDetails: JSON.stringify(requestData),
    orderStatus: "INITIATED",
    ariaAccountID: requestData.accountInfo.acctCreateAccountRequestDetails.ariaAccountID,
    ariaAccountNo: requestData.accountInfo.acctCreateAccountRequestDetails.ariaAccountNo,
    ariaBillingGroupID: requestData.subsInfo.ariaBillingGroupID,
  };
  const order = await OrderServices.createOrder(dbParams);
  const subscriptionData = await this.addSubscription(order.dataValues.id, order.dataValues, requestData.subsInfo, false);
  const response = {
    resultInfo: {
      error: "false",
      resultCode: 200,
      resultText: `Order # ${dbParams.id} successfully added subscription`,
      orderId: dbParams.id,
    },
  };

  return response;
};

exports.deleteOrder = async (req) => {
  try {
    const requestParams = common.getNotNullObject([req.body.manageOrderDetails.orderInfo])[0];
    const dbParams = {
      isDeleted: "Y",
    };
    // let dbParams = req.bo12.dy.manageOrderDetails.orderInfo;
    const order = await OrderServices.updateOrderStatus(requestParams.orderID, dbParams);
    const response = {
      resultInfo: {
        error: "false",
        resultCode: 200,
        resultText: `Order # ${dbParams.id} deleted successfully`,
        orderId: dbParams.id,
      },
    };
    return response;
  } catch (err) {
    return err;
  }
};

exports.modifyOrder = async (req) => {
  try {
    let dbParams = common.getNotNullObject([req.body.manageOrderDetails.orderInfo])[0];
    dbParams.id = dbParams.orderID;
    delete dbParams.orderID;
    delete dbParams.ariaBillingGroupNo;
    // let dbParams = req.bo12.dy.manageOrderDetails.orderInfo;
    await OrderServices.updateOrderStatus(dbParams.id, dbParams);
    const response = {
      resultInfo: {
        error: "false",
        resultCode: 200,
        resultText: `Order # ${dbParams.id} modified successfully`,
        orderId: dbParams.id,
      },
    };
    return response;
  } catch (err) {
    return err;
  }
};

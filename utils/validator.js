const Joi = require("joi");
const validator = {
  /************************************************** Order Manage Order **************************************************/

  orderManageOrder: Joi.object({
    manageOrderDetails: Joi.object({
      actionDirective: Joi.string().valid("ADD", "MODIFY", "REMOVE", "ADD-EXISTING-BG", "ADD-EXISTING-ACCT").required(),
      orderInfo: Joi.when("actionDirective", {
        is: Joi.exist().valid("REMOVE", "MODIFY"),
        then: Joi.object({
          orderID: Joi.string().required(),
          ariaAccountID: Joi.any(),
          ariaAccountNo: Joi.any(),
          ariaBillingGroupID: Joi.any(),
          ariaBillingGroupNo: Joi.any(),
          ariaMPIID: Joi.any(),
          ariaMPINo: Joi.any(),
          orderStatus: Joi.any(),
          orderStatusReason: Joi.any(),
        }),
      }),
      accountInfo: Joi.when("actionDirective", {
        is: Joi.exist().valid("ADD", "ADD-EXISTING-BG", "ADD-EXISTING-ACCT"),
        then: Joi.object({
          acctCreateAccountRequestDetails: Joi.object({
            ariaAccountID: Joi.string().required(),
            ariaAccountNo: Joi.when("actionDirective", {
              is: Joi.exist().valid("ADD-EXISTING-BG", "ADD-EXISTING-ACCT"),
              then: Joi.string().required(),
            }),
            userID: Joi.string()
              .email({
                minDomainSegments: 2,
                tlds: { allow: false },
              })
              .when("actionDirective", {
                is: Joi.exist().valid("ADD"),
                then: Joi.string().required(),
              }),
            currencyCode: Joi.any(),
            paymentTerms: Joi.any(),
            ownerTitleCode: Joi.when("actionDirective", {
              is: Joi.exist().valid("ADD"),
              then: Joi.string().required(),
            }),
            channelCode: Joi.any(),
            sourceCode: Joi.any(),
            notifyMethod: Joi.any(),
            localeCode: Joi.any(),
            customerType: Joi.string().valid("CONSUMER", "BUSINESS"),
            languageCode: Joi.any(),
            taxpayerID: Joi.any(),
            reservationCode: Joi.any(),
            reservationCodeDate: Joi.any(),
            acctCreateAccountPayOptionInfo: Joi.when("actionDirective", {
              is: Joi.exist().valid("ADD"),
              then: Joi.object().required(),
            }),
            accountContact: Joi.when("actionDirective", {
              is: Joi.exist().valid("ADD"),
              then: Joi.object({
                firstName: Joi.any(),
                lastName: Joi.any(),
                emailAddress: Joi.any(),
                fullName: Joi.any(),
                homePhone: Joi.any(),
                cellPhone: Joi.any(),
                birthDate: Joi.any(),
                addressLine1: Joi.any(),
                addressLine2: Joi.any(),
                addressLine3: Joi.any(),
                countryCode: Joi.any(),
                postalCode: Joi.any(),
                postalCity: Joi.any(),
                streetName: Joi.any(),
                streetNo: Joi.any(),
              }).required(),
            }),
          }),
          STMacctCreateAccountPwdRequestDetails: Joi.when("actionDirective", {
            is: Joi.exist().valid("ADD"),
            then: Joi.object({
              accountPassword: Joi.any(),
            }).required(),
          }),
        }).required(),
      }),
      subsInfo: Joi.when("actionDirective", {
        is: Joi.exist().valid("ADD", "ADD-EXISTING-BG", "ADD-EXISTING-ACCT"),
        then: Joi.object({
          ariaPlanNo: Joi.number().integer().required(),
          ariaPlanID: Joi.string().required(),
          productType: Joi.string().required(),
          productTypeVariant: Joi.string().required(),
          titleCode: Joi.string().required(),
          titleDomain: Joi.string().required(),
          ariaPlanRateScheduleID: Joi.string().required(),
          numberOfUnits: Joi.number().integer().required(),
          currencyCode: Joi.string().required(),
          billingFreqRecurring: Joi.number().integer().required(),
          billingFreqUsage: Joi.number().integer().required(),
          subsManageSubscriptionCampaignDetail: Joi.object().options({ allowUnknown: true }).allow("", null),
          subsManageSubscriptionDiscountDetail: Joi.object().options({ allowUnknown: true }).allow("", null),
          deliverAddrChangeInfo: Joi.object().options({ allowUnknown: true }).allow("", null),
        })
          .required()
          .options({ allowUnknown: true }),
      }),
    }),
  }),
  /************************************************** Retrieve Order **************************************************/
  orderRetrieveOrder: Joi.object({
    // query: {
    orderId: Joi.any().required(),
    // },
  }),
};

module.exports = validator;

# Adyen [online payment](https://docs.adyen.com/checkout) integration demos



## Supported Integrations

**React + Node.js + Express** demos of the following client-side integrations are currently available in this repository:

## Requirements

Node.js 8.0+

## Installation

1. Clone this repo:

```
https://github.com/mianRafay/adyen-amps-POC.git
```

2. Navigate to the root directory and install dependencies:

```
npm install
```

## Usage

1. Create a `./.env` file with your [API key](https://docs.adyen.com/user-management/how-to-get-the-api-key), [Client Key](https://docs.adyen.com/user-management/client-side-authentication) - Remember to add `http://localhost:3000` as an origin for client key, and merchant account name (all credentials are in string format):

```
API_KEY="your_API_key_here"
MERCHANT_ACCOUNT="your_merchant_account_here"
REACT_APP_CLIENT_KEY="your_client_key_here"
ADYEN_HMAC_KEY=yourNotificationSetupHMACkey
```

2. Build & Start the server:

This will create a React production build and start the express server

```
npm run server
```

3. Visit [http://localhost:8080/](http://localhost:8080/) to select an integration type.

To try out integrations with test card numbers and payment method details, see [Test card numbers](https://docs.adyen.com/development-resources/test-cards/test-card-numbers).


## Available Scripts

In the project directory, you can run:

### `npm run server-dev`

Runs the Express app in the development mode.<br />
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

The server will reload if you make edits.<br />

### `npm start`

Runs the React client side app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode for React client side.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm build`

Builds the React client side app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

### `npm eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### To get the adyen checkout URL

**Call This Endpoint**: http://localhost:8080/api/placeOrder

## Sample Request
```
{
    "accountInfo": {
        "acctCreateAccountRequestDetails": {
            "ariaAccountID": "123456789154", //change last two digit of it e.g 123456789156
            "userID": "adyen54@cimetest.com",//change last two digit of it e.g adyen56@cimetest.com
            "paymentTerms": "INVOICE (without Surcharge)",
            "currencyCode": "SEK",
            "ownerTitleCode": "SM",
            "channelCode": "Contact Centre",
            "sourceCode": "rafay@semantixsolutions.co.uk",
            "notifyMethod": "XML",
            "localeCode": "SE-SVENSKA",
            "customerType": "CONSUMER",
            "languageCode": "SE",
            "taxpayerID": "",
            "reservationCode": "E1P1S1L1",
            "reservationCodeDate": "2021-04-26",
            "acctCreateAccountPayOptionInfo": {
                "payOptionID": "INVOICE",
                "payOptionVariant": "WO-SURCHARGE"
            },
            "accountContact": {
                "firstName": "adyen",
                "lastName": "cimtest",
                "emailAddress": "adyen54@cimetest.com", //change last two digit of it e.g adyen56@cimetest.com
                "fullName": "adyen cimtest",
                "homePhone": "",
                "cellPhone": "",
                "birthDate": "1234/56/78",
                "addressLine1": "    ",
                "addressLine2": "",
                "addressLine3": "",
                "countryCode": "SE",
                "postalCode": "",
                "postalCity": "",
                "streetName": "",
                "streetNo": ""
            }
        },
        "STMacctCreateAccountPwdRequestDetails": {
            "accountPassword": null
        }
    },
    "subsInfo": {
        "ariaPlanNo": 104174,
        "ariaPlanID": "GP-CB-DIGITAL-EPF7",
        "productType": "DIGITAL",
        "productTypeVariant": "STANDARD",
        "titleCode": "GP",
        "titleDomain": "gp.se",
        "ariaPlanRateScheduleID": "GP-C-DIGITAL-EPF7-SEK-01",
        "numberOfUnits": 1,
        "currencyCode": "sek",
        "billingFreqRecurring": 1,
        "billingFreqUsage": 1,
        "subsManageSubscriptionCampaignDetail": "",
        "subsManageSubscriptionDiscountDetail": {
            "discountDesc": "",
            "discountID": "",
            "discountName": "",
            "discountPercentage": "",
            "discountVal": ""
        }
    }
}
```
## Sample Response
```
{
    "error": "false",
    "statusCode": 200,
    "orderId": "efa1b6ac-fcf8-4264-b244-b038cc0fe475",
    "returnUrl": "http://localhost:3000/checkout/dropin/efa1b6ac-fcf8-4264-b244-b038cc0fe475"
}
```

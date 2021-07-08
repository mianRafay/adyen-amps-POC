import { createSlice } from "@reduxjs/toolkit";

export const slice = createSlice({
  name: "payment",
  initialState: {
    error: "",
    paymentMethodsRes: null,
    paymentRes: null,
    paymentDetailsRes: null,
    paymentDataStoreRes: null,
    config: {
      paymentMethodsConfiguration: {
        ideal: {
          showImage: false,
        },
        card: {
          hasHolderName: false,
          holderNameRequired: false,
          name: "Credit or debit card",
          enableStoreDetails: false,
          amount: {
            // value: 1000, // 10€ in minor units
            currency: "EUR",
          },
        },
      },
      locale: "en_US",
      showPayButton: true,
      clientKey: process.env.REACT_APP_CLIENT_KEY,
      environment: "test",
    },
  },
  reducers: {
    paymentMethods: (state, action) => {
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        res.paymentMethods = res.paymentMethods.filter((it) =>
          ["eps", "scheme", "dotpay", "giropay", "ideal", "directEbanking", "bcmc", "paysafecard"].includes(it.type)
        );
        state.paymentMethodsRes = res;
      }
    },
    payments: (state, action) => {
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        state.paymentRes = res;
      }
    },
    paymentDetails: (state, action) => {
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        state.paymentDetailsRes = res;
      }
    },
    paymentDataStore: (state, action) => {
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        state.paymentDataStoreRes = res;
      }
    },
  },
});

export const { paymentMethods, payments, paymentDetails, paymentDataStore } = slice.actions;

export const getPaymentMethods = (orderId) => async (dispatch) => {
  const response = await fetch("/api/getPaymentMethods/" + orderId, {
    method: "POST",
  });
  dispatch(paymentMethods([await response.json(), response.status]));
};
export const getPaymentMethodsSelfService = (orderId) => async (dispatch) => {
  const response = await fetch("/api/getPaymentMethodsSelfService/", {
    method: "POST",
  });
  dispatch(paymentMethods([await response.json(), response.status]));
};

export const initiatePaymentSelfService = (accountNo, billingGroupNo, data) => async (dispatch) => {
  const response = await fetch("/api/initiatePaymentSelfService/" + accountNo + "/" + billingGroupNo, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  dispatch(payments([await response.json(), response.status]));
};
export const initiatePayment = (orderId, data) => async (dispatch) => {
  const response = await fetch("/api/initiatePayment/" + orderId, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  dispatch(payments([await response.json(), response.status]));
};

export const submitAdditionalDetails = (data, orderRef) => async (dispatch) => {
  const response = await fetch(`/api/submitAdditionalDetails?orderRef=${orderRef}`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  dispatch(paymentDetails([await response.json(), response.status]));
};

export const getPaymentDataStore = () => async (dispatch) => {
  const response = await fetch("/api/getPaymentDataStore");
  dispatch(paymentDataStore([await response.json(), response.status]));
};

export const cancelOrRefundPayment = (orderRef) => async (dispatch) => {
  await fetch(`/api/cancelOrRefundPayment?orderRef=${orderRef}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  dispatch(getPaymentDataStore());
};

export default slice.reducer;

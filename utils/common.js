const moment = require("moment");
const request = require("request");
const CryptoJS = require("crypto-js");
const btoa = require("btoa");
const util = require("util");
const requestPromise = util.promisify(request);
const common = {
  /**
   * @name  utf16Converter
   * @param  {string} {str}
   * @return {string | undefined}
   * @summary convert javascript UTF8 into UTF16
   *
   */
  utf16Converter: (str) => {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
      c = str.charCodeAt(i++);
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          out += str.charAt(i - 1);
          break;
        case 12:
        case 13:
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
          out += str.charAt(i - 1);
          break;
        case 14:
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0));
          break;
      }
    }

    var byteArray = new Uint8Array(out.length * 2);
    for (var j = 0; j < out.length; j++) {
      byteArray[j * 2] = out.charCodeAt(j); // & 0xff;
      byteArray[j * 2 + 1] = out.charCodeAt(j) >> 8; // & 0xff;
    }

    return String.fromCharCode.apply(String, byteArray);
  },

  /**
   * @name  hex2a
   * @param  {string} {key}
   * @return {string | undefined}
   * @summary convert hex2asci
   *
   */
  hex2a: (key) => {
    var str = "";
    for (var i = 0; i < key.length; i += 2) {
      str += String.fromCharCode(parseInt(key.substr(i, 2), 16));
    }
    return str;
  },
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

  generateToken: async (authKey, clientNo, requestDateTime, ariaAccountID, ariaAccountNo, UserID) => {
    const concatString = clientNo + "|" + requestDateTime + "|" + ariaAccountID + "|" + ariaAccountNo + "|" + UserID + "|" + authKey;
    return btoa(common.hex2a(CryptoJS.SHA256(common.utf16Converter(concatString)).toString()));
  },

  getNotNullObject: (params) => {
    const filledProps = params.map((el) => {
      // Loop the property names of `el`, creating a new object
      // with the ones whose values aren't `null`.
      // `reduce` is commonly used for doing this:
      return Object.keys(el).reduce((newObj, key) => {
        const value = el[key];
        if (value !== null) {
          newObj[key] = value;
        }
        return newObj;
      }, {});
    });

    return filledProps;
  },
  /**
   * @name   errorObject
   * @param  {object} {params}
   * @return {object}
   * @summary always return error object
   *
   */
  errorObject: (errCode = 500, errMsg = "Internal Server Error") => {
    return {
      message: errMsg,
      errorCode: errCode,
    };
  },
  /** ################ AMPS Methods ########################## */
  /**
   * @name   sendRequest
   * @param  {object} {params}
   * @return {object | undefined}
   * @summary make request and attach security header
   *
   */

  sendRequest: async (additionalParams, endPoint) => {
    const authToken = "gIW6EsgWyQmkkIVLZaKG";
    const ampsUserId = "75";
    const gmtTime = moment().utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    const signatureValue = await common.generateToken(authToken, ampsUserId, gmtTime, "", 0, "", 1);

    try {
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

      const clientServerOptions = {
        uri: endPoint,
        json: true,
        body: params,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };
      const ampsRequest = await requestPromise(clientServerOptions);
      return ampsRequest.body;
    } catch (err) {
      console.error(err);
    }
  },

  /**
   * @name  errorResponseMaker
   * @param  {string} {code}
   * @param  {any} {body}
   * @return {object}
   * @summary Get current date and time
   *
   */
  errorResponseMaker: (error, errorMsg) => {
    const errorBody = error.name;
    let errorMessage = "";
    let code = 500;
    switch (errorBody) {
      case "SequelizeValidationError":
        errorMessage = "Invalid Request Format";
        code = 400;
        break;
      case "RecordExistError":
        for (const property in error.fields) {
          errorMessage = error.fields[property];
        }
        code = 422;
        break;
      case "ValidationError":
        errorMessage = errorMsg ? errorMsg : "Invalid Request Format";
        code = 422;
        break;
      case "NoRecordFound":
        errorMessage = errorMsg ? errorMsg : "No Record Exist";
        code = 400;
        break;
      case "NoLinkFound":
        errorMessage = errorMsg ? errorMsg : "Invalid Link Provided";
        code = 400;
        break;
      case "BlockedAccess":
        errorMessage = errorMsg ? errorMsg : "Following has blocked access";
        code = 403;
        break;
      default:
        errorMessage = "Internal Server Error";
        code = 500;
    }
    // "resultInfo": {
    //     "error": "false",
    //     "resultCode": 200,
    //     "resultText": "Order # undefined is created successfully",
    return { resultInfo: { error: true, resultCode: code, resultText: errorMessage } };
  },
};

module.exports = common;

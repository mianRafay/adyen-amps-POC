const AuthService = require("../services/auth");
const validator = require("./validator");
const common = require("./common");
const Crypto = require("crypto-js");

const middleware = {
  apiValidator: (schema = false, type = false) => {
    return (req, res, next) => {
      const token = req.body["x-access-token"] || req.query["x-access-token"] || req.headers["x-access-token"];
      //if token is not there just send back token is missing
      if (!token) {
        return res.status(401).json({
          statusCode: 401,
          error: true,
          message: "key can not be null, please provide valid key value.",
        });
      } else {
        //check key if exist in table
        const apiKey = Crypto.SHA256(token).toString(Crypto.enc.Hex);
        const params = {
          condition: { key: apiKey, is_active: "Y" },
        };
        AuthService.getApiKeys(params)
          .then((response) => {
            if (!response || response?.length === 0) {
              return res.status(401).json({
                resultInfo: {
                  resultCode: 401,
                  error: true,
                  resultText: "Unauthorized access. Invalid key value",
                },
              });
            } else {
              if (schema) {
                const { error } = type === "body" ? validator[schema].validate(req[type]) : validator[schema].validate(req[type]);
                const valid = error == null;
                if (valid) {
                  next();
                } else {
                  const { details } = error;
                  const message = details
                    .map((i) => i.message)
                    .join(",")
                    .replace(/".*?"/, "");

                  const errorValue = common.errorResponseMaker(error, details[0].path[details[0].path.length - 1] + message);
                  return res.status(errorValue.resultInfo.resultCode).json(errorValue);
                  // next();
                }
              } else {
                next();
              }
            }
          })
          .catch((err) => {
            console.error(err);
            return res.status(401).json({
              resultInfo: {
                resultCode: 401,
                error: true,
                resultText: "Unauthorized access. Invalid key value",
              },
            });
          });
      }
    };
  },
};

module.exports = middleware;

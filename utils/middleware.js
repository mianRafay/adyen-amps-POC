const AuthService = require("../services/auth");
const Crypto = require("crypto-js");

const middleware = {
  apiValidator: () => {
    return (req, res, next) => {
      const token = req.body.authDetails?.key || req.query.key;
      //if token is not there just send back token is missing
      if (!token)
        return res.status(401).json({
          statusCode: 401,
          error: true,
          message: "key can not be null, please provide valid key value.",
        });
      //check key if exist in table
      const apiKey = Crypto.SHA256(token).toString(Crypto.enc.Hex);
      const params = {
        condition: { key: apiKey, is_active: "Y" },
      };
      AuthService.getApiKeys(params)
        .then((response) => {
          if (!response || response?.length === 0) {
            return res.status(401).json({
              statusCode: 401,
              error: true,
              message: "Unauthorized access. Invalid key value",
            });
          } else {
            next();
          }
        })
        .catch((err) => {
          console.error(err);
          return res.status(401).json({
            statusCode: 401,
            error: true,
            message: "Unauthorized access. Invalid key value",
          });
        });
    };
  },
};

module.exports = middleware;

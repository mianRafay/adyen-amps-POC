const ApiKeyModel = require("../models").api_key;

/**
 * @name   getApiKeys
 * @param  {object} {params}
 * @return {object }
 * @summary delete activitydetail record on the basis of activity_record_ID
 */

exports.getApiKeys = (params) => {
  return new Promise((resolve, reject) => {
    let condition = params.condition ? params.condition : { is_active: "Y" };

    ApiKeyModel.findAll({
      raw: true,
      attributes: ["id", "user_id", "email"],
      limit: params.limit,
      offset: params.offset,
      where: { ...condition },
      order: [[params.orderBy ? params.orderBy : "id", params.order ? params.order : "ASC"]],
    }).then((result) => {
      if (result) {
        resolve(result);
      } else {
        resolve(false);
      }
    });
  });
};

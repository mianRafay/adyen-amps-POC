const OrderModel = require("../models").order;

exports.updateOrderStatus = async (orderId, params) => {
  try {
    const dbParams = params;
    const order = await OrderModel.update(dbParams, {
      where: {
        id: orderId,
      },
      returning: true,
      plain: true,
    });
    return order;
  } catch (err) {
    console.err(err);
  }
};

exports.getRequestParamsByOrderId = async (orderId) => {
  //get order by id
  const orderInfo = await OrderModel.findOne({
    where: { id: orderId },
  });
  //get json parse string

  return orderInfo;
};

exports.createOrder = async (dbParams) => {
  try {
    const order = await OrderModel.create(dbParams);
    return order;
  } catch (err) {
    console.err(err);
  }
};

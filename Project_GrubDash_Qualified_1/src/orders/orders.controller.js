const path = require("path");
const { findIndex } = require("../data/orders-data");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(request, response) {
  response.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo } = {} } = req.body;
  const { data: { mobileNumber } = {} } = req.body;
  const { data: { dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function hasDeliverTo(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    return next();
  }
  next({ status: 400, message: "A 'deliverTo' property is required." });
}

function hasMobile(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    return next();
  }
  next({ status: 400, message: "A 'mobileNumber' property is required." });
}

function hasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes && dishes.length > 0 && Array.isArray(dishes)) {
    return next();
  }
  next({ status: 400, message: "A 'dish' property is required." });
}

function hasValidDishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.forEach((dish) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0.`,
      });
    }
  });
  next();
}

function orderExists(request, response, next) {
  const { orderId } = request.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    response.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function idMatches(request, response, next) {
  const { order } = response.locals;
  const { data: { id } = {} } = request.body;
  const { orderId } = request.params;
  if (!id || order.id === id) {
    return next();
  }
  return next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];

function resultStatusIsValid(request, response, next) {
  const { data: { status } = {} } = request.body;
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Value of the 'status' property must be one of ${validStatus}. Received: ${status}`,
  });
}

function orderStatusPending(request, response, next) {
  const { status } = response.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function read(request, response) {
  response.json({ data: response.locals.order });
}

function update(request, response) {
  const { orderId } = request.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  const { data: { deliverTo } = {} } = request.body;
  const { data: { mobileNumber } = {} } = request.body;
  const { data: { dishes } = {} } = request.body;
  const { data: { status } = {} } = request.body;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  foundOrder.status = status;

  response.json({ data: foundOrder });
}

function destroy(request, response) {
  const { orderId } = request.params;
  const index = orders.findIndex((order) => order.id == orderId);
  orders.splice(index, 1);

  response.sendStatus(204);
}

module.exports = {
  list,
  create: [hasDeliverTo, hasMobile, hasDishes, hasValidDishQuantity, create],
  read: [orderExists, read],
  update: [
    orderExists,
    idMatches,
    hasDeliverTo,
    hasMobile,
    hasDishes,
    hasValidDishQuantity,
    resultStatusIsValid,
    update,
  ],
  delete: [orderExists, orderStatusPending, destroy],
};

const path = require("path");
const { hasUncaughtExceptionCaptureCallback } = require("process");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function create(req, res) {
  const { data: { name } = {} } = req.body;
  const { data: { description } = {} } = req.body;
  const { data: { image_url } = {} } = req.body;
  const { data: { price } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function hasName(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    return next();
  }

  next({ status: 400, message: "A 'name' property is required." });
}

function hasDescription(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    return next();
  }
  next({ status: 400, message: "A 'description' property is required." });
}

function hasURL(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    return next();
  }
  next({ status: 400, message: "A 'image_url' property is required." });
}

function hasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price && price > 0 && typeof price === "number") {
    return next();
  }
  next({ status: 400, message: "A 'price' property is required." });
}

function dishExists(request, response, next) {
  const { dishId } = request.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    response.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function idMatches(request, response, next) {
  const { dish } = response.locals;
  const { data: { id } = {} } = request.body;
  const { dishId } = request.params;
  if (!id || dish.id === id) {
    return next();
  }
  return next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function list(request, response) {
  response.json({ data: dishes });
}

function read(request, response) {
  response.json({ data: response.locals.dish });
}

function update(request, response) {
  const { dishId } = request.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const { data: { name } = {} } = request.body;
  const { data: { description } = {} } = request.body;
  const { data: { price } = {} } = request.body;
  const { data: { image_url } = {} } = request.body;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  response.json({ data: foundDish });
}

// function destroy(request, response, next) {
//   const { dishId } = request.params;
//   const foundDish = dishes.find((dish) => dish.id === dishId);
//   if (foundDish) {
//     response.sendStatus(405);
//   }
// }

// TODO: Implement the /dishes handlers needed to make the tests pass
module.exports = {
  create: [hasName, hasDescription, hasURL, hasPrice, create],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    idMatches,
    hasName,
    hasDescription,
    hasURL,
    hasPrice,
    update,
  ],
};

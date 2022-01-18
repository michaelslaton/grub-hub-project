const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data")); // Use the existing dishes data
const nextId = require("../utils/nextId"); // Use this function to assign ID's when necessary
// TODO: Implement the /dishes handlers needed to make the tests pass


// Validation ------------------------------------------------------------------------------

function hasCreateProps(req,res,next){
  const data = req.body.data

  //If values exist and meet requirements
  if (!data.name || data.name.length === 0 || data.name == ""){ return next({status: 400, message: "Dish must include a name"}) } 
  if (!data.description || data.description.length === 0 || data.description == ""){ return next({status: 400, message: "Dish must include a description"}) } 
  if (!data.price){ return next({status: 400, message: "Dish must include a price"}) } 
  if (!data.image_url || data.name.image_url === 0 || data.image_url == ""){ return next({status: 400, message: "Dish must include a image_url"}) } 

  //Price Requirements
  if (!data.price){ return next({status: 400, message: "Dish must include a price"}) }
  if (data.price <= 0 || !Number.isInteger(data.price)){ return next({status: 400, message: "Dish must have a price that is an integer greater than 0"}) }

  return next()
}

function dishExists(req, res, next) {
  const dishId = Number(req.params.dishId);
  const foundDish = dishes.find((dish) => dish.id == dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${req.params.dishId}.`,
  });
}

// Functionality ---------------------------------------------------------------------------

function list(_req, res, _next) {
  res.json({ data: dishes });
}

function create(req, res, _next) {
  const { data: { name, description, price, image_url } } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(_req, res, _next) {
  const foundDish = res.locals.dish
  if (foundDish) {
    res.status(200).json({ data: foundDish });
  } else {
    res.sendStatus(404);
  }
}

function update(req, res, next) {
  const foundDish = res.locals.dish
  const { data: { id, name, description, price, image_url } } = req.body;

  if(id && id !== foundDish.id){
    return next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${foundDish.id}`})
  }

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.status(200).json({ data: foundDish });

}

module.exports = {
  update: [dishExists, hasCreateProps, update],
  create: [hasCreateProps, create],
  read: [dishExists, read],
  list,
};

const path = require("path");
const { deflateRawSync } = require("zlib");
const orders = require(path.resolve("src/data/orders-data")); // Use the existing order data
const nextId = require("../utils/nextId"); // Use this function to assigh ID's when necessary
// TODO: Implement the /orders handlers needed to make the tests pass


// Validation ------------------------------------------------------------------------------

function hasCreateProps(req,_res,next){
  const data = req.body.data
  const orderDishes = data.dishes;

  //If values exist and meet requirements
  if (!data.deliverTo || data.deliverTo.length === 0 || data.deliverTo == ""){ return next({status: 400, message: "Dish must include a deliverTo"}) } 
  if (!data.mobileNumber || data.mobileNumber.length === 0 || data.mobileNumber == ""){ return next({status: 400, message: "Dish must include a mobileNumber"}) }
  if (!data.dishes || data.dishes.length === 0 || !Array.isArray(data.dishes)){ return next({status: 400, message: "Order must include at least one dish"}) } 

  //Quantity Requirements
  orderDishes.forEach((dish) => {
    if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)){ return next({status: 400, message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`}) }
  })

  return next();
}

function checkStatus(req, _res, next) {
  const data = req.body.data;
  if (!data.status || data.status.length === 0 || data.status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (data.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  return next();
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${req.params.orderId}.`,
    });
  }

// Functionality ---------------------------------------------------------------------------

function list(req,res,next){
    res.json({ data: orders })
}

function create(req, res, _next) {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes, 
    };
  
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
    const foundOrder = res.locals.order;
    res.status(200).json({ data: foundOrder });
  }

function update(req, res, next) {
  const foundOrder = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status, dishes } } = req.body;

  if(id && id !== foundOrder.id){
    return next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${foundOrder.id}`})
  }

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;

  res.status(200).json({ data: foundOrder });
}

function destroy(req, res, next){
    const orderId = req.params.orderId;
    const foundOrder = res.locals.order;
    const foundIndex = orders.findIndex((order) => order.id === orderId);

    if (foundOrder.status !== "pending") {
      return next({
        status: 400,
        message: "An order cannot be deleted unless it is pending",
      });
    }
    
    orders.splice(foundIndex,1);
    res.sendStatus(204);

}

module.exports = {
    read: [orderExists, read],
    update: [orderExists, hasCreateProps, checkStatus, update],
    create: [hasCreateProps, create],
    destroy: [orderExists, destroy],
    list,
}
const express = require('express');
const orderRouter = express.Router();

const {
createOrder,
getOrder
} = require('../controllers/orderController');

const { isAuth } = require('../utils/utils.js');

//Create An Order
orderRouter.get('/', isAuth, createOrder);

//Return Search Results
orderRouter.get('/:CourseId', isAuth, getOrder);

module.exports = orderRouter;
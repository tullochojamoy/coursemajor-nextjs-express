const express = require('express'); //Cargar framework de nodejs
const paypalRouter = express.Router(); //Cargar nucleo router

//Import payouts controller
const { generatePayoutPaypal } = require ('../controllers/paypal.controller.js');

const { isAuth, isSellerOrAdmin } = require('../utils/utils.js');

module.exports = function(){
    paypalRouter.get('/paypal-payout', isAuth, isSellerOrAdmin, generatePayoutPaypal);
    return paypalRouter;
}
const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');
const ErrorResponse = require("./errorResponse");
import connectDB from '../config/db';
import mongoose from 'mongoose';
import nextConnect from 'next-connect';

/*
exports.sendToken = (user, statusCode, res) => {
  console.log('Send Token');

  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    _id: user._id,
    username: user.username,
    email: user.email,
    isSeller: user.isSeller,
    isAdmin: user.isAdmin,
    token,
  });
};
*/

exports.sendToken = (user, statusCode, res) => {
  console.log('Send Token');

  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    _id: user._id,
    username: user.username,
    email: user.email,
    isSeller: user.isSeller,
    isAdmin: user.isAdmin,
    token,
  });
};

const preHandler = (controller) => async(req,res) =>{
  try{
    if (mongoose.connections[0].readyState) {
      return controller(req, res);
    }
    await mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      })
      .then(() => {
        return controller(req, res);
      });

    // const connected = await connectDB();
    // if (!connected){
    //   throw new Error('Database did not start correctly')
    // }
    // return await controller(req,res);
  } catch(error){
    return res.status(500).json({ 
      message: error.message, 
      error: error.message ,
      success: false, 
    });
  }
}

const middleware = nextConnect();
middleware.use(connectDB);
// middleware.use(authMiddleware);
module.exports = {
  preHandler,
  middleware,
};

/*
exports.test2 = () => {
  console.log('route hit 2');
}

export function test(){
  console.log('route hit')
}
*/
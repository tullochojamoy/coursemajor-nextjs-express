const crypto = require('crypto');
const User = require('../models/usersModel');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

exports.facebookRegisterLogin = async (req, res, next) => {
  const { userID, accessToken } = req.body.response;

  if (!userID || !accessToken) {
    return next(new ErrorResponse('Please Try to Login to Facebook Again', 400));
  }

  let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`
  
  const response = await axios.get(urlGraphFacebook);

    const {id, name, email} = response.data;

    try {
      const user = await User.findOne({ email }).select('+facebookId');
  
      const username = name;
      const facebookId = id;
      const imageUrl = response.data.picture.data.url;
      
      if (!user) {
        const user = await User.create({username, email, facebookId, imageUrl, verified:true});
        return sendToken(user, 201, res);
      }

      if (!user.facebookId) {
      user.facebookId=facebookId;
      user.verified=true;
    } else if (user.facebookId!==facebookId){
      return next(new ErrorResponse('Invalid Credentials', 401));
    }

    if (!user.username) {
      user.username=name;
    }

    if (!user.imageUrl) {
      user.imageUrl=imageUrl;
    }

    //console.log(user);

    await user.save();
    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.googleRegisterLogin = async (req, res, next) => {
  const { username, email, googleId, imageUrl } = req.body;

  if (!email || !googleId) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  console.log(googleId);
 
  try {
    const user = await User.findOne({ email }).select('+googleId');
    if (!user) {
      const user = await User.create({username, email, googleId, imageUrl, verified:true});
      return sendToken(user, 201, res);
    }
    console.log(user);

    if (!user.googleId) {
      user.googleId=googleId;
      user.verified=true;
      console.log(googleId);
    } else if (user.googleId!==googleId){
      return next(new ErrorResponse('Invalid Credentials', 401));
    }

    if (!user.username) {
      user.username=username; 
      console.log(username);
    }

    if (!user.imageUrl) {
      user.imageUrl=imageUrl; 
      console.log(imageUrl); 
    }

    await user.save();
    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const user = await User.create({username, email,password,});
      return sendToken(user, 201, res);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid Credentials', 401));
    }
    
    sendToken(user, 200, res);

  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Invalid Credentials', 401));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid Credentials', 401));
    }
    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.forgotpassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('Email could not be sent', 404));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save();

    //EMAIL CONTENT
    // https://coursemajor.herokuapp.com
    const resetUrl = `https://coursemajor.herokuapp.com/passwordreset/${resetToken}`;

    const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password</p>
            <Link to=${resetUrl} clicktracking=off>${resetUrl}</Link>
        `;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: message,
      });

      res.status(200).json({ success: true, data: 'Email Sent' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (error) {
    next(error);
  }
};

exports.userDetails = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return next(new ErrorResponse('User Not Found!', 404));
    }

    res.send(user);
  } catch (error) {
    next(error);
  }
};

exports.resetpassword = async (req, res, next) => {
  //res.send('Reset Password Route');
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid Reset Token', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: 'Password Reset Success',
    });
  } catch (error) {
    next(error);
  }
};

const sendToken = (user, statusCode, res) => {
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

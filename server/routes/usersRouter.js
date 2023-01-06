const express = require('express');
const usersRouter = express.Router();

const {
    facebookRegisterLogin,
    googleRegisterLogin,
    register,
    login,
    forgotpassword,
    userDetails,
    resetpassword,
} = require('../controllers/userController');

const { isAuth } = require('../utils/utils.js');

usersRouter.post('/facebookRegisterLogin', facebookRegisterLogin);

usersRouter.post('/googleRegisterLogin', googleRegisterLogin);

usersRouter.post('/register', register);

usersRouter.post('/login', login);

usersRouter.post('/forgotpassword', forgotpassword);

usersRouter.put('/resetpassword/:resetToken', resetpassword);

usersRouter.get('/', isAuth, userDetails);

module.exports = usersRouter;
const express = require('express');
const courseMajorRouter = express.Router();

const {
enter,
} = require('../controllers/courseMajorController');

courseMajorRouter.post('/entered', enter);

module.exports = courseMajorRouter;
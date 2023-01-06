const express = require('express');
const reviewsRouter = express.Router();

const {
getCourseReviews,
getUserReviews,
createUpdateReviews,
deleteReviews,
editReview
} = require('../controllers/reviewsController');

const { isAuth } = require('../utils/utils.js');

//Return all reviews for a specific course
reviewsRouter.get('/all/:CourseId', getCourseReviews);

//Return User Comments for specific course
reviewsRouter.get('/course/:CourseId', getUserReviews);

//Create or Update a Course
reviewsRouter.post('/createorupdate/:CourseId', isAuth, createUpdateReviews);

//Delete a Review
reviewsRouter.delete('/:CourseId', isAuth, deleteReviews);

//Edit a review
reviewsRouter.put('/edit/:CourseId', isAuth, editReview);

module.exports = reviewsRouter;
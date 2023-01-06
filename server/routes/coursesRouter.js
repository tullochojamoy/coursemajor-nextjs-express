const express = require('express');
const coursesRouter = express.Router();

const {
getAwsImages,
getAllCourses,
searchCourses,
purchasedCourses,
specificCourse,
deleteCourse,
createCourse,
updateCourse,
publishCourse
} = require('../controllers/courseController');

const { isAuth, isSellerOrAdmin } = require('../utils/utils.js');
const { uploadImage, upload } = require("../utils/multer");

//Pipes the image to the frontend using the Get URL
coursesRouter.get('/image/:key', getAwsImages);

//Return all courses
coursesRouter.get('/', getAllCourses);

//Return Search Results
coursesRouter.get('/search/:searchTerm', searchCourses);

//Return buyers purchase courses
coursesRouter.get('/purchased', isAuth, purchasedCourses);

//Return specific course
coursesRouter.get('/:id', specificCourse);

//Delete a course
coursesRouter.delete('/:id', isAuth, isSellerOrAdmin, deleteCourse);

//Create a course
coursesRouter.post('/create', isAuth, createCourse);

//Update a course
coursesRouter.put('/:id', isAuth, uploadImage.single("image"), updateCourse);

//Publish Courses
coursesRouter.put('/published/:courseId', isAuth, publishCourse);

module.exports = coursesRouter;
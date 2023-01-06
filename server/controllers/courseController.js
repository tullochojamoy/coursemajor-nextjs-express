const express = require('express');
//const coursesRouter = express.Router();

const Courses = require('../models/coursesModel');
const Order = require('../models/orderModel');
const Playlist = require('../models/playlistModel');

const { uploadFile, deleteFile, getFileStream } = require('../utils/s3');

//For File Deletion after upload
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

//Pipes the video to the frontend using the Get URL
exports.getAwsImages = async (req, res) => {       
    try {
        const key = String(req.params.key);
        console.log(key);
        if (key!==undefined && key!=="undefined" && key && key!=="jquery.js" && key!=="nicepage.js" && key!=="nicepage.css") {
            const readStream = await getFileStream(key);
            readStream.pipe(res);
        } else {
            console.log('No Key');
        }
    } catch (err) {
        console.log(err)
    }
};

//Return all courses
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Courses.find({published: true});
        res.json(courses);
    } catch (err) {
        res.json({ message: err });
    }
};

//Return Search Results
exports.searchCourses = async (req, res) => {
    try {
        if (req.params.searchTerm) {
        const regex = new RegExp(escapeRegex(req.params.searchTerm), 'gi');
            
            await Courses.find({ "published": true, "title": regex }, function(err, foundCourses) {
                if(err) {
                    console.log(err);
                } else {
                    let noMatch;
                    if(foundCourses.length < 1) {
                        noMatch = "No Results for your Search, Try again with a different term :-)";
                    }
                    res.send({ message: noMatch, foundCourses });
                    //res.json(foundCourses);
                }
            }); 
        }
        //const courses = await Courses.find({published: true});
        //res.json(courses);
    } catch (err) {
        res.json({ message: err });
    }
};

//Return buyers purchase courses
exports.purchasedCourses = async (req, res) => {
    const Orders = await Order.find({ user: req.user._id });
    
    if (!Orders)
    return  res.status(404).json({ success: true, data: "No Courses"});
    
    try {
        let courseId=[];
        Orders.forEach(item => { 
            courseId.push({_id: item.orderItems[0].course});
        });
      
        if (courseId.length !== 0) {
            const orderedCourses= await Courses.find({$or: courseId});
            
            res.json(orderedCourses);
        } else {
            return res.status(404).json({ success: true, data: "Email Sent"});
        }
    } catch (err) {
        res.status(404).json({ success: true, data: "Email Sent"});
    }
};

//Return specific course
exports.specificCourse = async (req, res) => {
    try {
        let courses = await Courses.findById(req.params.id);
        if (!courses)
            return;

        const playlist = await Playlist.findOne({ Course: req.params.id });
        if (!playlist)
            return;
            
        let vidPlaylist=playlist.videoplaylist[0];
        const course = {...courses._doc, Key: vidPlaylist}

        let noMatch;
        let regex;

        if (courses.tags) {
            regex = new RegExp(escapeRegex(courses.tags), 'gi');
        } else if (courses.category) {
            regex = new RegExp(escapeRegex(courses.category), 'gi');
        } else if (courses.subCategory) {
            regex = new RegExp(escapeRegex(courses.subCategory), 'gi');
        } else {
            regex = new RegExp(escapeRegex(courses.title), 'gi');
        }
        const relatedCourses = await Courses.find({ "published": true, $or: [{tags: regex}, {category: courses.category}, {subCategory: courses.subCategory}, {title: regex}] });
      
        if (relatedCourses.length < 1) {
            noMatch = "No Results for your Search, Try again with a different term :-)";
        }
        res.send({course, relatedCourses, message: noMatch});       
    } catch (err) {
        res.send({ message: err });
    }
};

//Delete a course
exports.deleteCourse = async (req, res) => {
    const courses = await Courses.findById(req.params.id);
    if (courses.seller!= req.user.id || !req.user.isAdmin)
        return;
    
    try {
        await deleteFile(courses.imageKey);
        const removedCourse = await Courses.remove({_id: req.params.id});
        res.json(removedCourse);
    } catch (err) {
        res.json({ message: err });
    }
};

//Create a course
exports.createCourse = async (req, res) => {
    console.log("Create Course");
    console.log(req.user._id);

    const course = new Courses({
        title: "Your Favourite Course",
        imageKey: "2afc8b6cf9eac4ba672938e7b792ccdc",
        description: "Sample Description",
        price: 997,
        star: 0,
        seller: req.user._id
    });
    //Save to DB and respond with data (Testing) or errr
    try{
        const savedCourse = await course.save();
        res.json(savedCourse);
        console.log(savedCourse);
    } catch (err) {
        res.json({ message: err });
        console.log(err);
    }
};

//Update a course
exports.updateCourse = async (req, res) => {
    const courseId = req.params.id;
    const course = await Courses.findById(courseId);


    
    if (req.user._id.toString !== course.seller.toString) {
        return res.status(404).send({ message: 'You are not the owner of this course' });
    }

    try {
        let result = null;

        if (req.file) {
            const file = req.file;
            result = await uploadFile(file);
            console.log(result);
            await unlinkFile(file.path);
            if (course.imageKey!=='2afc8b6cf9eac4ba672938e7b792ccdc')
            await deleteFile(course.imageKey);
        }
      
      if (course) {
        if (req.body.name) 
        course.title = req.body.name;
        if (req.body.price)
        course.price = parseInt(req.body.price);
        if (req.file && result)
        course.imageKey = result.Key;
        if (req.body.description)
        course.description = req.body.description;
        if (req.body.category)
        course.category = req.body.category;
        if (req.body.subcategory)
            course.subCategory = req.body.subCategory;
            if (req.body.tags)
            course.tags = req.body.tags;
            
        try {
          const updatedCourse = await course.save();
          res.send({ message: 'course Updated', course: updatedCourse });
        } catch (error) {
          //res.status(404).send({ message: 'Course Not Found' });
        }
      } else {
        //res.status(404).send({ message: 'Course Not Found' });
      }
    } catch(err) {
        res.json(err);
    }
};

//Publish Courses
exports.publishCourse = async (req, res) => {
    console.log(req.params.courseId);
    const course = await Courses.findOne({ _id: req.params.courseId }); 

    if (req.user._id != course.seller) {
        return res.status(404).send({ message: 'You are not the owner of this course' });
    }

    if (!course)
        return res.status(404).send({ message: 'Course Not Found' });

    const playlist = await Playlist.findOne({ Course: req.params.courseId }); 

    if (!playlist)
        return res.status(404).send({ message: 'Playlist Not Found' });
        
    if (playlist.videoplaylist.length !== 0) {
        try{
            if (course.published == true)
                course.published = false;
            else if (course.published == false)
                course.published = true;
        } catch (error) {
            console.log(error);
        }
    } else {
        return res.status(404).send({ message: 'Please Add A Video' });
    }   

    const updatedCourse = await course.save();
    res.send({ message: 'Playlist Updated', course: updatedCourse });
};

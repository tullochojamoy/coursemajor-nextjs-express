const Reviews = require('../models/reviewsModel');

//Return all reviews for a specific course
exports.getCourseReviews = async (req, res) => {
    try {
        const reviews = await Reviews.find({ "course": req.params.CourseId });
        res.json(reviews.sort(reviews.star));
    } catch (err) {
        res.json({ message: err });
    }
};

//Return User Comments for specific course
exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Reviews.find({ "course": req.params.CourseId});
        res.json(reviews);
    } catch (err) {
        res.json({ message: err });
    }
};

exports.createUpdateReviews = async (req, res) => {
    try{
        const existingReview = await Reviews.find({ "course": req.params.CourseId, "user": req.user._id  });

        if (existingReview) {
            existingReview.title = req.body.reviewTitle;
            existingReview.star = parseInt(req.body.review);
            existingReview.message = req.body.reviewMessage;
            const updatedReview = await existingReview.save();
            return res.send({ message: 'review Updated', review: updatedReview });
        }

        const review = new Reviews({
            title: req.body.reviewTitle,
            message: req.body.reviewMessage,
            star: req.body.review,
            course: req.params.CourseId,
            user: req.user._id,
            time: new Date(),
        });

    //Save to DB and respond with data (Testing) or errr
        const savedReview = await review.save();
        res.json(savedReview);
    } catch (err) {
        res.json({ message: err });
    }
};

//Delete a Review
exports.deleteReviews = async (req, res) => {
    const reviews = Reviews.find({"course": req.params.CourseId, "user": req.user._id});
    if (reviews) {        
        try {
            const removedReview = await Reviews.remove({"course": req.params.CourseId, "user": req.user._id});
            res.json(removedReview);
        } catch (err) {
            res.json({ message: err });
        }
    } else {
        console.log("Unable to delelte review");
    }
};

//Edit a review
exports.editReview = async (req, res) => {
    const review = await Reviews.find({ "course": req.params.CourseId, "user": req.user._id  });
    if (review) {
      review.title = req.body.name;
      review.star = parseInt(req.body.star);
      review.description = req.body.description;
      const updatedReview = await review.save();
      res.send({ message: 'review Updated', review: updatedReview });
    } else {
      res.status(404).send({ message: 'Review Not Found' });
    }
};
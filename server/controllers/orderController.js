const Order = require('../models/orderModel.js');
const User = require('../models/usersModel.js');
const Courses = require('../models/coursesModel.js');

//Create An Order
exports.createOrder = async (req, res) => {
      const order = new Order({
        orderItems: req.body.orderItems,
        paymentMethod: req.body.paymentMethod,
        itemsPrice: req.body.itemsPrice,
        taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        seller: req.body.seller,
        user: req.user._id,
      });
      const createdOrder = await order.save();
      const UserId = req.user._id;
      const CourseId = req.body.orderItems[0].course

      const course = await Courses.findOne({_id: CourseId});
      const user = await User.findOne({_id: UserId});

      //If req.user._id is = seller.id then hacker ==true
      if (req.user._id!==course.seller) {
        return user.hackerAlert();
      }

      if (req.body.itemsPrice==course.price) {
        user.updateBalance(course.price);
        await user.save();
      } else {
        return user.hackerAlert();
      }

      return res.status(201).send({ message: 'New Order Created', order: createdOrder });
};

//Get a User's Order for a specific course
exports.getOrder = async (req, res) => {
    const CourseId = req.params.CourseId;

      try {
        const Orders = await Order.find({ user: req.user._id });
        let courseId=[];
        Orders.forEach(item => { 
          courseId.push(item.orderItems[0].course);
        });
        
        let pos = function(element, index, theArray){
          //console.log(element + " - " + index);
          return element == CourseId;
        }

        const courseIndex = courseId.findIndex(pos);
        if (courseIndex>=0) {
          res.json(Orders[courseIndex]);
        } else {
          res.send(false);
        }
        
      } catch (err) {
        res.json({ message: err });
      }
};

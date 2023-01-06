import Order from '../../../models/orderModel';
import Courses from '../../../models/coursesModel';
import User from '../../../models/usersModel';

import { preHandler } from '../../../utils/utils';

import isAuth from '../../../utils/isAuth';

async function handler(req, res) {
  if (req.method === 'GET') {
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
    const CourseId = req.body.orderItems[0].course;

      
    const course = await Courses.findOne({_id: CourseId});
    if(!course) throw new Error('Course Not Found');
    const user = await User.findOne({_id: UserId});
    if(!user) throw new Error('Please login to make changes')

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
  }
}

export default preHandler(isAuth(handler));
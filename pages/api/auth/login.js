const { preHandler } = require('../../../utils/utils');
const ErrorResponse = require('../../../utils/errorResponse');
import User from '../../../models/usersModel';
import sendToken from '../../../utils/utils';
import nextConnect from 'next-connect';

const handler = nextConnect();

handler.post(
  async(req, res)=>{
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ error: 'Please provide an email and password' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error('Invalid Credentials (Email)');
    
    const isMatch = await user.matchPassword('password');
    console.log('hit')
    if (!isMatch)  throw new Error('Invalid Credentials (Password)');

    sendToken(user, 200, res);
  }

)

export default preHandler(handler);
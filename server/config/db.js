const mongoose = require('mongoose');

const connectDB = async() => {
    try{
        await mongoose.connect('mongodb://0.0.0.0:27017', {
            keepAlive: true, 
            //useCreateIndex: true, 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            //useFindAndModify: true
        });
        console.log('DB has been started')
    } catch(error){
        console.log('error in db');
    }
};

module.exports = connectDB;
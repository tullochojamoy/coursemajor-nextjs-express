require('dotenv').config({path: "../.env"});
require('dotenv').config();
const path = require('path'); //Load file path

const express = require('express');

const cors = require('cors');
const errorHandler = require('./middleware/error');

const connectDB = require('./config/db');

const next = require('next');
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(()=>{
    const server = express();

    // example of server edit
    // server.get('/post/:id', (req, res) => {
    //     const actualPage = '/post'
    //     const queryParams = { id: req.params.id }
    //     app.render(req, res, actualPage, queryParams)
    // })

    //Prevent Crashing
    process.on('uncaughtException', function (err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
    }); 

    //Connect to DB
    connectDB();

    //Middlewares
    // only your domian should be alowed to access - cors
    // add rate limiter,like 100 request per 1minute 
    server.use(cors());
    server.use(express.json());
    server.use(express.urlencoded({extended: true}));

    //Import Routes
    const coursesRouter = require('./routes/coursesRouter.js');
    const courseMajorRouter = require('./routes/courseMajorRouter.js');
    const orderRouter = require('./routes/orderRouter.js');
    const routes = require('./routes/paypalRouter.js');
    const playlistRouter = require('./routes/playlistRouter.js');
    const resourceRouter = require('./routes/resourcesRouter.js');
    const reviewsRouter = require('./routes/reviewsRouter.js');
    const usersRouter = require('./routes/usersRouter.js');

    // MIDDLEWARE

    //For PayPal Payouts
    /*
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
        next();
    });
    */
    server.use('/api/paypal', routes());
    server.use('/api/coursemajor', courseMajorRouter);
    server.use('/api/courses', coursesRouter);
    server.use('/api/reviews', reviewsRouter);
    server.use('/api/auth', usersRouter);
    server.use('/api/order', orderRouter);
    server.use('/api/playlist', playlistRouter);
    server.use('/api/config/paypal',  (req, res) => {
        res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
    });


    server.use('/uploads', express.static(path.join(__dirname, '/uploads')));
    // server.use(express.static(path.join(__dirname, '../Frontend/build')));
    // server.get('*', (req, res) =>
    //     res.sendFile(path.join(__dirname, '../Frontend/build/index.html'))
    // );


    server.get('*', (req, res)=>{
        return handle(req, res)
    })



    //Error Handler (Should be the last piece of middleware)
    server.use(errorHandler);

    // ROUTES
    //app.get('/', (req, res) => {
    //    res.send('/ page');
    //})

    const PORT = process.env.PORT || 5000;

    //Listening to server
    const serverVar = server.listen(PORT,(err)=>{
        if(err) throw err;
        console.log(`Server has started on port ${PORT}`)
    })

    //Handling Server Errors in a nice, readable way
    process.on("unhandledRejection", (err, promise) => {
        console.log(`Logged Error: ${err}`);
        serverVar.close(() => process.exit(1));
    })

}).catch((ex)=>{
    console.error(ex);
    process.exit(1);
})
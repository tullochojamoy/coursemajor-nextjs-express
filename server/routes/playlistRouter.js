const express = require('express');
const playlistRouter = express.Router();

const {
videoPipe, 
specificPlaylist, 
createPlaylist, 
addVideo, 
arrangePlaylist, 
updateVideo, 
removeVideo
} = require('../controllers/playlistController');

const { isAuth, isSellerOrAdmin } = require('../utils/utils.js');


//Pipes the video to the frontend using the Get URL
playlistRouter.get('/video/:key', videoPipe);

//Return specific playlist
playlistRouter.get('/:courseId', isAuth, specificPlaylist);

//Create playlist for Course
playlistRouter.post('/create/:courseId', createPlaylist);

//Add Video to Playlist
playlistRouter.put('/:courseId', isAuth, isSellerOrAdmin, addVideo);

//Move Videos in playlist up and down
playlistRouter.put('/arrange/:courseId', isAuth, arrangePlaylist);

//Update a video
playlistRouter.put('/updateVideoDetails/:courseId', isAuth, updateVideo);

//Remove a video
playlistRouter.patch('/remove/:courseId', isAuth, isSellerOrAdmin, removeVideo);

module.exports = playlistRouter;
const express = require('express');
const playlistRouter = express.Router();

const Playlist = require('../models/playlistModel');
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

const { uploadFile, deleteFile, getFileStream } = require('../utils/s3');

//Global Compare Sort Function
function compare(a, b) {
  const bandA = a.Number;
  const bandB = b.Number;

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  } else if (bandA < bandB) {
    comparison = -1;
  }
  return comparison;
}

//Pipes the video to the frontend using the Get URL
exports.videoPipe = async (req, res) => {
  try {
    const key = req.params.key;

    if (
      key!==undefined && 
      key!=="undefined" && 
      key && 
      key!=="jquery.js" && 
      key!=="nicepage.js" && 
      key!=="nicepage.css"
    ) {
      const readStream = await getFileStream(key);
      readStream.pipe(res);
    } else {
      console.log('No Key');
    }
  } catch (err) {
    console.log(err);
  }
};

//Return specific playlist
exports.specificPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ Course: req.params.courseId });
    playlist.videoplaylist = playlist.videoplaylist.sort(compare);
    res.json(playlist);
  } catch (err) {
    res.json({ message: err });
  }
};

//Create playlist for Course
exports.createPlaylist = async (req, res) => {
  const courseId = req.params.courseId;
  const playlist = new Playlist({
    Course: courseId,
  });
  try {
    const savedPlaylist = await playlist.save();
    savedPlaylist.videoplaylist = savedPlaylist.videoplaylist.sort(compare);
    res.json(savedPlaylist);
  } catch (err) {
    res.json({ message: err });
  }
};

//Add Video to Playlist
exports.addVideo = async (req, res) => {
    const playlist = await Playlist.findOne({ Course: req.params.courseId });
    if (playlist) {
      try {
        const file = req.file;
        const result = await uploadFile(file);

        playlist.videoplaylist = [
          ...playlist.videoplaylist,
          {
            Number: playlist.videoplaylist.length + 1,
            Title: req.body.Title,
            Description: req.body.Description,
            Key: result.Key,
          },
        ];
        playlist.Thumbnail = req.body.Thumbnail;
        const updatedPlaylist = await playlist.save();
        updatedPlaylist.videoplaylist =
          updatedPlaylist.videoplaylist.sort(compare);
        res.send({ message: 'Playlist Updated', playlist: updatedPlaylist });
      } catch (error) {
        console.log(error);
      }
    } else {
      res.status(404).send({ message: 'Playlist Not Found' });
    }
};

//Move Videos in playlist up and down
exports.arrangePlaylist = async (req, res) => {
  const up = req.body.up;
  const down = req.body.down;
  const numToUpdate = req.body.numToUpdate;
  console.log('up is' + up);
  console.log('down is' + down);
  console.log('num is' + numToUpdate);

  const playlist = await Playlist.findOne({ Course: req.params.courseId });

  if (!playlist) return res.status(404).send({ message: 'Playlist Not Found' });

  if (numToUpdate === 1 && up)
    return res
      .status(404)
      .send({ message: 'This is the First Video in the playlist' });

  if (numToUpdate === playlist.videoplaylist.length && down)
    return res
      .status(404)
      .send({ message: 'This is the Last Video in the playlist' });

  try {
    if (up) {
      let numToUpdateIndex = playlist.videoplaylist.findIndex(
        (item) => item.Number === numToUpdate
      );
      let secondNumToUpdateIndex = playlist.videoplaylist.findIndex(
        (item) => item.Number === numToUpdate - 1
      );

      if (playlist.videoplaylist[numToUpdateIndex].Number)
        playlist.videoplaylist[numToUpdateIndex].Number -= 1;
      
      if (playlist.videoplaylist[secondNumToUpdateIndex].Number)
        playlist.videoplaylist[secondNumToUpdateIndex].Number += 1;
    }

    if (down) {
      let numToUpdateIndex = await playlist.videoplaylist.findIndex(
        (item) => item.Number == numToUpdate
      );

      console.log('num ' + numToUpdate);
      console.log('First index' + numToUpdateIndex);

      let secondNumToUpdateIndex = await playlist.videoplaylist.findIndex(
        (item) => item.Number == numToUpdate + 1
      );

      console.log(secondNumToUpdateIndex);
      
      if (playlist.videoplaylist[numToUpdateIndex].Number)
        playlist.videoplaylist[numToUpdateIndex].Number += 1;

      if (playlist.videoplaylist[secondNumToUpdateIndex].Number)
        playlist.videoplaylist[secondNumToUpdateIndex].Number -= 1;
    }
  } catch (error) {
    console.log(error);
  }

  const updatedPlaylist = await playlist.save();
  updatedPlaylist.videoplaylist = updatedPlaylist.videoplaylist.sort(compare);
  console.log(updatedPlaylist.videoplaylist);
  res.send({ message: 'Playlist Updated', playlist: updatedPlaylist });
};

//Update a video
exports.updateVideo = async (req, res) => {
    const numToUpdate = req.body.numToUpdate;

    const playlist = await Playlist.findOne({ Course: req.params.courseId });

    if (!playlist)
      return res.status(404).send({ message: 'Playlist Not Found' });

    try {
      let numToUpdateIndex = await playlist.videoplaylist.findIndex(
        (item) => item.Number == numToUpdate
      );
      playlist.videoplaylist[numToUpdateIndex].Title = req.body.title;
      playlist.videoplaylist[numToUpdateIndex].Description =
        req.body.description;
      playlist.Thumbnail = req.body.Thumbnail;
    } catch (error) {
      console.log(error);
    }

    const updatedPlaylist = await playlist.save();
    updatedPlaylist.videoplaylist = updatedPlaylist.videoplaylist.sort(compare);
    res.send({ message: 'Playlist Updated', playlist: updatedPlaylist });
};

//Remove a video
exports.removeVideo = async (req, res) => {
    const NumberToRemove = parseInt(req.body.numberToRemove);

    const playlist = await Playlist.findOne({ Course: req.params.courseId });

    if (!playlist)
      return res.status(404).send({ message: 'Playlist Not Found' });

    try {
      let numToDeleteIndex = playlist.videoplaylist.findIndex(
        (item) => item.Number == NumberToRemove
      );

      await deleteFile(playlist.videoplaylist[numToDeleteIndex].Key);

      playlist.videoplaylist = playlist.videoplaylist.filter((item) => {
        return item.Number !== NumberToRemove;
      });
     

  //Find the largest
  let largest=-1;
  for (let c=0; c<playlist.videoplaylist.length; c++){
    if (largest<playlist.videoplaylist[c].Number){
      largest=playlist.videoplaylist[c].Number
    }
  }
  
  //Array from Smallest to largest and copy the index
  let arrayToUpdate=new Array();
  let currentSmallest={num:largest};
  let previousSmallest=-1;

  for (let e=0; e<playlist.videoplaylist.length; e++){
    currentSmallest.num = largest+1;
    for (let d=0; d<playlist.videoplaylist.length; d++){
      if (playlist.videoplaylist[d].Number>previousSmallest && playlist.videoplaylist[d].Number<currentSmallest.num){
        currentSmallest.num=playlist.videoplaylist[d].Number;
        currentSmallest.index= await playlist.videoplaylist.findIndex(
          (item) => item.Number == currentSmallest.num
        );
      }
    }
    previousSmallest=currentSmallest.num;
    if(!arrayToUpdate[e])
      arrayToUpdate[e]={...arrayToUpdate[e], ...currentSmallest};
    }  //End For

    //Set Playlist to correct values
    for (let numIndex = 0; numIndex < playlist.videoplaylist.length; numIndex++){
      playlist.videoplaylist[ arrayToUpdate[numIndex].index ].Number=numIndex+1;
    }

       
      const updatedPlaylist = await playlist.save();
      updatedPlaylist.videoplaylist = updatedPlaylist.videoplaylist.sort(compare);
      res.send({ message: 'Playlist Updated', playlist: updatedPlaylist });
    } catch (error) {
      console.log(error);
    }
};
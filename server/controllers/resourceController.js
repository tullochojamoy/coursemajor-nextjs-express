const Resources = require('../models/resourcesModel');
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

//Return all resources
exports.getAllResources = async (req, res) => {
    try {
        const resources = await Resources.find({published: true});
        res.json(resources);
    } catch (err) {
        res.json({ message: err });
    }
};

//Return Search Results
exports.searchResources = async (req, res) => {
    try {
        if (req.params.searchTerm) {
        const regex = new RegExp(escapeRegex(req.params.searchTerm), 'gi');
            
            await Resources.find({ "published": true, "title": regex }, function(err, foundResources) {
                if(err) {
                    console.log(err);
                } else {
                    let noMatch;
                    if(foundResources.length < 1) {
                        noMatch = "No Results for your Search, Try again with a different term :-)";
                    }
                    res.send({ message: noMatch, foundResources });
                    //res.json(foundResources);
                }
            }); 
        }
        //const resources = await Resources.find({published: true});
        //res.json(resources);
    } catch (err) {
        res.json({ message: err });
    }
};

//Return buyers purchase resources
exports.purchasedResources = async (req, res) => {
    const Orders = await Order.find({ user: req.user._id });
    
    if (!Orders)
    return  res.status(404).json({ success: true, data: "No Resources"});
    
    try {
        let resourceId=[];
        Orders.forEach(item => { 
            resourceId.push({_id: item.orderItems[0].resource});
        });
      
        if (resourceId.length !== 0) {
            const orderedResources= await Resources.find({$or: resourceId});
            
            res.json(orderedResources);
        } else {
            return res.status(404).json({ success: true, data: "Email Sent"});
        }
    } catch (err) {
        res.status(404).json({ success: true, data: "Email Sent"});
    }
};

//Return specific resource
exports.specificResource = async (req, res) => {
    try {
        let resources = await Resources.findById(req.params.id);
        if (!resources)
            return;

        const playlist = await Playlist.findOne({ Resource: req.params.id });
        if (!playlist)
            return;
            
        let vidPlaylist=playlist.videoplaylist[0];
        const resource = {...resources._doc, Key: vidPlaylist}

        let noMatch;
        let regex;

        if (resources.tags) {
            regex = new RegExp(escapeRegex(resources.tags), 'gi');
        } else if (resources.category) {
            regex = new RegExp(escapeRegex(resources.category), 'gi');
        } else if (resources.subCategory) {
            regex = new RegExp(escapeRegex(resources.subCategory), 'gi');
        } else {
            regex = new RegExp(escapeRegex(resources.title), 'gi');
        }
        const relatedResources = await Resources.find({ "published": true, $or: [{tags: regex}, {category: resources.category}, {subCategory: resources.subCategory}, {title: regex}] });
      
        if (relatedResources.length < 1) {
            noMatch = "No Results for your Search, Try again with a different term :-)";
        }
        res.send({resource, relatedResources, message: noMatch});       
    } catch (err) {
        res.send({ message: err });
    }
};

//Delete a resource
exports.deleteResource = async (req, res) => {
    const resources = await Resources.findById(req.params.id);
    if (resources.seller!= req.user.id || !req.user.isAdmin)
        return;
    
    try {
        await deleteFile(resources.imageKey);
        const removedResource = await Resources.remove({_id: req.params.id});
        res.json(removedResource);
    } catch (err) {
        res.json({ message: err });
    }
};

//Create a resource
exports.createResource = async (req, res) => {
    const resource = new Resources({
        title: "Your Favourite Resource",
        imageKey: "2afc8b6cf9eac4ba672938e7b792ccdc",
        description: "Sample Description",
        price: 997,
        star: 0,
        seller: req.user._id
    });
    //Save to DB and respond with data (Testing) or errr
    try{
        const savedResource = await resource.save();
        res.json(savedResource);
    } catch (err) {
        res.json({ message: err });
    }
};

//Update a resource
exports.updateResource = async (req, res) => {
    const resourceId = req.params.id;
    const resource = await Resources.findById(resourceId);
    
    if (req.user._id != resource.seller) {
        return res.status(404).send({ message: 'You are not the owner of this resource' });
    }

    try {

      let result = null;
    if (req.file) {
        const file = req.file;
        result = await uploadFile(file);
        await unlinkFile(file.path);
        if (resource.imageKey!=='2afc8b6cf9eac4ba672938e7b792ccdc')
        await deleteFile(resource.imageKey);
      }
      
      if (resource) {
        if (req.body.name) 
        resource.title = req.body.name;
        if (req.body.price)
        resource.price = parseInt(req.body.price);
        if (req.file && result)
        resource.imageKey = result.Key;
        if (req.body.description)
        resource.description = req.body.description;
        if (req.body.category)
        resource.category = req.body.category;
        if (req.body.subcategory)
            resource.subCategory = req.body.subCategory;
            if (req.body.tags)
            resource.tags = req.body.tags;
            
        try {
          const updatedResource = await resource.save();
          res.send({ message: 'resource Updated', resource: updatedResource });
        } catch (error) {
          //res.status(404).send({ message: 'Resource Not Found' });
        }
      } else {
        //res.status(404).send({ message: 'Resource Not Found' });
      }
    } catch(err) {

    }
};

//Publish Resources
exports.publishResource = async (req, res) => {
    console.log(req.params.resourceId);
    const resource = await Resources.findOne({ _id: req.params.resourceId }); 

    if (req.user._id != resource.seller) {
        return res.status(404).send({ message: 'You are not the owner of this resource' });
    }

    if (!resource)
        return res.status(404).send({ message: 'Resource Not Found' });

    const playlist = await Playlist.findOne({ Resource: req.params.resourceId }); 

    if (!playlist)
        return res.status(404).send({ message: 'Playlist Not Found' });
        
    if (playlist.videoplaylist.length !== 0) {
        try{
            if (resource.published == true)
                resource.published = false;
            else if (resource.published == false)
                resource.published = true;
        } catch (error) {
            console.log(error);
        }
    } else {
        return res.status(404).send({ message: 'Please Add A Video' });
    }   

    const updatedResource = await resource.save();
    res.send({ message: 'Playlist Updated', resource: updatedResource });
};

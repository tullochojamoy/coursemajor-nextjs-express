const express = require('express');
const resourcesRouter = express.Router();

const {
getAwsImages,
getAllResources,
searchResources,
purchasedResources,
specificResource,
deleteResource,
createResource,
updateResource,
publishResource
} = require('../controllers/resourceController');

const { isAuth, isSellerOrAdmin } = require('../utils/utils.js');
const { uploadImage, upload } = require("../utils/multer");

//Pipes the image to the frontend using the Get URL
resourcesRouter.get('/image/:key', isAuth, getAwsImages);

//Return all resources
resourcesRouter.get('/', getAllResources);

//Return Search Results
resourcesRouter.get('/search/:searchTerm', searchResources);

//Return buyers purchase resources
resourcesRouter.get('/purchased', isAuth, purchasedResources);

//Return specific resource
resourcesRouter.get('/:id', specificResource);

//Delete a resource
resourcesRouter.delete('/:id', isAuth, isSellerOrAdmin, deleteResource);

//Create a resource
resourcesRouter.post('/create', isAuth, createResource);

//Update a resource
resourcesRouter.put('/:id', isAuth, uploadImage.single("image"), updateResource);

//Publish Resources
resourcesRouter.put('/published/:resourceId', isAuth, publishResource);

module.exports = resourcesRouter;
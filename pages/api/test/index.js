//import cloudinary from 'cloudinary';
import formidable from 'formidable';

/*
cloudinary.config({ 
  cloud_name: '', 
  api_key: '', 
  api_secret: '' 
});
*/

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = "./";
  form.keepExtensions = true;
  await form.parse(req, (err, fields, files) => {
    /*
    cloudinary.v2.uploader.upload(files.image.path, function(error, result) {
      res.status(200).json({
        success: true,
        data: result.secure_url
      })
    });
    */
    console.log(fields)
});
}



/*

export const config = {
    api: {
        bodyParser : false,
    },
};

export default function handler(req, res) {
    try {
        console.log(req.body.name);
    } catch (err) {
        console.log(err);
    }
}
*/
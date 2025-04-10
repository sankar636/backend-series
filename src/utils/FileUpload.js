import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// upload image,video from local storage to cloudnary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto", folder: "my_uploads" })
        // file has been uploaded successifully
        console.log("File uploaded successifully on cloudinary", response);
        // console.log("Trying to delete:", localFilePath);
        // console.log(fs.existsSync(localFilePath));        
        //(11)
        // to delete the file if the file uploaded in the cloudinary succissfuly
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response
    } catch (error) {
        console.log("Error in uploading the file", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null
    }
}

export { uploadOnCloudinary }


// Upload an image(Written in cloudinary)
//  const uploadResult = await cloudinary.uploader
//  .upload(
//      'https://res.cloudinary.com/cloud_name/image/upload/getting-started/shoes.jpg', {
//          public_id: 'shoes',
//      }
//  )
//  .catch((error) => {
//      console.log(error);
//  });

// console.log(uploadResult);
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (filePath) => {
    try {
        if (!filePath) {
            throw new Error('No file path provided');
        }
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto'
        });
        //console.log("Upload successful:", result.secure_url);
        fs.unlinkSync(filePath); // Remove file after upload
        return result;
    } catch (error) {
       fs.unlinkSync(filePath);
       throw new Error('Error uploading image to Cloudinary');
    }
};

export {uploadImage};

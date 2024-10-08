import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)  return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("File is uploaded successfully on : ", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); //Remove the locally saved temporary file as the upload operation got failed.
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    if (!publicId)  return null;

    const response = await cloudinary.uploader.destroy(publicId)

    return response;
}

export { uploadOnCloudinary, deleteFromCloudinary }
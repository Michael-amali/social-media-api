const cloudinary = require("cloudinary");
const { config } = require("dotenv");
config();

const Cloudinary = cloudinary.v2;
Cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const FileUpload = async (file, res)=>{
    return new Promise((resolve)=>{
        Cloudinary.uploader.upload(file, {folder: '/social_media'}, (error, data)=>{
            if(error){
                res.status(500).json('Failed to upload image');
            }
            
            resolve(data?.secure_url);
        } );
    });
}


const FileDelete = async (fileUrl, res)=>{
    if(!fileUrl){
        return res.status(400).json({msg: 'No image selected'});
    }

    Cloudinary.uploader.destroy(fileUrl, async(err, result)=>{
        if(err){
            return res.status(500).json({msg: "Something went wrong, file not deleted"});
        }

    })
}


module.exports = {
    FileUpload: FileUpload,
    FileDelete: FileDelete
}
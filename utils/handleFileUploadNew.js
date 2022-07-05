const formidable = require("formidable");
const { FileUpload } = require("../utils/fileUpload.util");


const handleUpload = (req, res, next) =>{
    const form = new formidable.IncomingForm();
    console.log(req.body)

    form.parse(req, async (error, fields, files)=>{
        if(error){
            return res.status(500).json(error);
        }

        const media_count = Object.keys(files).length;
        const media_keys = Object.keys(files);
        let imageUrls = [];

        for(let i=0; i < media_count; i++){
            const file = (files[media_keys[i]]).filepath;
            const file_url = await FileUpload(file, res);
            imageUrls.push(file_url);
        }
        console.log(imageUrls, 'sure')
    })
    res.status(200).json("file has been uploaded successfully");
    next();
}

module.exports = {
    handleUpload,
}
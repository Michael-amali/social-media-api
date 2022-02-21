const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

// import formidable, { IncomingForm } from "formidable";
const formidable = require("formidable");
const { FileUpload, FileDelete } = require("../utils/fileUpload.util");
const authenticate = require("../middlewares/auth.middleware");



// CREATE POST
router.post("/", authenticate.verifyToken, async (req, res)=> {

    // const form = new formidable.IncomingForm();

    // form.parse(req, async (error, fields, files)=>{
    //     if(error){
    //         return res.status(500).json(error);
    //     }

    //     const { userId, desc, img } = fields;
        // const media_count = Object.keys(files).length;
        // const media_keys = Object.keys(files);
        // let imageUrl = "";

        // for(let i=0; i < media_count; i++){
        //     const file = (files[media_keys[i]]).filepath;
        //     const file_url = await FileUpload(file, res);
        //     imageUrl = file_url;
        // }

        try {
            const newPost = new Post({
                userId: req.body.userId,
                desc: req.body.desc,
                img: req.body.img, 
            });
            // const newPost = new Post(req.body);
    
            const savedPost = await newPost.save();
            return res.status(200).json(savedPost);
    
        }
        catch(err){
            return res.status(500).json("Network error: Something went wrong");
        }

    // });

})

// get a post
router.get("/find/:id", authenticate.verifyToken, async (req, res)=>{
     
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            res.status(404).json("Post not found")
        } 
        res.status(201).json(post);
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
});

// get timeline posts (i.e. the posts of the user and the people the user followers)
router.get("/timeline/:userId", authenticate.verifyToken, async (req, res)=>{
    try {
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({userId: currentUser._id}).sort({ createdAt: 'desc'}).exec();
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({userId: friendId}).sort({ createdAt: 'desc'}).exec();
            })
        )
        
        res.status(200).json(userPosts.concat(...friendPosts));
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
});

// update post [id in this case is the post id]
router.put("/:id", authenticate.verifyToken, async (req, res)=>{
     
    try {
        const post =  await Post.findById(req.params.id);
        if(post.userId === req.body.userId){

            try{
                await post.updateOne({$set: req.body});
                res.status(200).json("Post has been updated");
                
            }
            catch(err){
                return res.status(500).json(err);
            }
        }
        else{
            return res.status(403).json("You can only update your post")
        }
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
});

// delete post
// [id in this case is the post id]
router.delete("/:id/:userId", authenticate.verifyToken, async (req, res)=>{
     
    try {
        const post = await Post.findById(req.params.id);
        if(post.userId === req.params.userId){
            
            try{
                await post.deleteOne();
                if(post.img){
                    // Retrieving public_id from url of cloudinary image
                    let cloudImgName = post.img.split('/').slice(-1)[0].split('.')[0];
                    let cloudPublicID = 'social-media/'+cloudImgName;

                    await FileDelete(cloudPublicID, res);
                }
 
                res.status(200).json("Post has been deleted");
            }
            catch(err){
                return res.status(500).json("Network error: Something went wrong");
            }
        }
        else{
            return res.status(403).json("You can only delete your post");
        }
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
});

// Delete image from cloudinary
router.delete('/:userId/:imageUrl/remove', authenticate.verifyToken, async (req, res)=>{
    let imageUrl = req.params.imageUrl;

    try{
        // Retrieving public_id from url of cloudinary image
        let cloudImgName = imageUrl;
        let cloudPublicID = 'social-media/'+cloudImgName;

        await FileDelete(cloudPublicID, res);
        res.status(200).json("Image has been deleted");
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }

})

// Like / dislike post
router.put("/:id/like/:userId", authenticate.verifyToken, async (req, res)=>{

        try {
            const post = await Post.findById(req.params.id);
            
            if(!post.likes.includes(req.params.userId)){
                await post.updateOne({ $push: { likes: req.params.userId}});
                res.status(200).json("Post has been liked");
            }
            else{
                await post.updateOne({ $pull: { likes: req.params.userId}});
                res.status(200).json("Post has been disliked");
            }
        }
        catch(err){
            return res.status(500).json("Network error: Something went wrong");
        } 
});


// get user's all posts
router.get('/profile/:username/:id', authenticate.verifyToken, async (req, res)=>{
    try{
        const user = await User.findOne({username: req.params.username});
        if(req.params.id === user._id.toString()){
            const posts = await Post.find({userId: user._id}).sort({ createdAt: 'desc'}).exec();
            return res.status(200).json(posts);
        }
        else {
            return res.status(400).json("Posts not found")
        }
   
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
})


module.exports = router;
const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");



// CREATE POST
router.post("/", async (req, res)=> {

    try {
        // const newPost = new Post({
        //     userId: req.body.userId,
        //     desc: req.body.desc,
        //     img: req.body.desc, 
        // });
        const newPost = new Post(req.body);

        const savedPost = await newPost.save();
        res.status(200).json(savedPost);

    }
    catch(err){
        return res.status(500).json(err);
    }
})

// get a post
router.get("/find/:id", async (req, res)=>{
     
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            res.status(404).json("Post not found")
        } 
        res.status(201).json(post);
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// get timeline posts (i.e. the posts of the user and the people the user followers)
router.get("/timeline/:userId", async (req, res)=>{
    try {
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({userId: currentUser._id});
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({userId: friendId});
            })
        )
        
        res.status(200).json(userPosts.concat(...friendPosts));
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// update post [id in this case is the post id]
router.put("/:id", async (req, res)=>{
     
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
        return res.status(500).json(err);
    }
});

// delete post
// [id in this case is the post id]
router.delete("/:id", async (req, res)=>{
     
    try {
        const post =  await Post.findById(req.params.id);
        if(post.userId === req.body.userId){

            try{
                await post.deleteOne();
                res.status(200).json("Post has been deleted");
                
            }
            catch(err){
                return res.status(500).json(err);
            }
        }
        else{
            return res.status(403).json("You can only delete your post")
        }
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// Like / dislike post
router.put("/:id/like", async (req, res)=>{

        try {
            const post = await Post.findById(req.params.id);
            console.log(post)
            
            if(!post.likes.includes(req.body.userId)){
                await post.updateOne({ $push: { likes: req.body.userId}});
                res.status(200).json("Post has been liked");
            }
            else{
                await post.updateOne({ $pull: { likes: req.body.userId}});
                res.status(200).json("Post has been disliked");
            }
        }
        catch(err){
            return res.status(500).json(err);
        } 
});


module.exports = router;
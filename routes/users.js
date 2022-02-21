const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const paginate = require("../middlewares/pagination.middleware");
const authenticate = require("../middlewares/auth.middleware");

// get a user
router.get("/find", authenticate.verifyToken, async (req, res)=>{
    const userId = req.query.userId;
    const username = req.query.username;

    try {
        // You can get user by using /users/find?userId=61ed23addb78f9829511fcd0 OR /users/find?username=myk
        const user = userId ? await User.findById(userId) : await User.findOne({username: username});
        if(!user){
            res.status(404).json("User not found")
        }
        let {password, ...others} = user._doc;
        res.status(201).json(others);
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// get all users
// http://localhost:4000/api/users?page=1&limit=2 to get paginated result
router.get("/", authenticate.verifyToken, paginate.Paginate(User),  async (req, res)=>{

    if(res.paginatedResult){
        const result = res.paginatedResult;
        // In this case the paginatedResult is only being console.logged.
        console.log(result);
    }

     
    try {
        const users = await User.find();
        if(!users){
            res.status(404).json("Users not found")
        }
        res.status(200).json(users);
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// update user
router.put("/:id", authenticate.verifyToken, async (req, res)=>{
     
    try {
        if(req.body.userId === req.params.id || req.body.isAdmin){

            //if user tries to update the password  
            if(req.body.password){
                try{
                    const salt = await bcrypt.genSalt(10);
                    req.body.password = await bcrypt.hash(req.body.password, salt);
                }
                catch(err){
                    return res.status(500).json(err);
                }
            }
            try{
                const updatedUser = await User.findByIdAndUpdate(req.params.id, {$set: req.body});
                res.status(200).json("Account has been updated");
                console.log(updatedUser);
            }
            catch(err){
                return res.status(500).json(err);
            }
        }
        else{
            return res.status(403).json("You update can only your account")
        }
    }
    catch(err){
        return res.status(500).json(err);
    }
});
// delete user
router.delete("/:id", authenticate.verifyToken, async (req, res)=>{
     
    try {
        if(req.body.userId === req.params.id || req.body.isAdmin){
            const user = await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account deleted");
       }
        else{
            return res.status(403).json("You can only delete your account")
        }
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// Follow user
router.put("/:id/follow", authenticate.verifyToken, async (req, res)=>{
    if(req.body.userId !== req.params.id || req.body.isAdmin){
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if(!user.followers.includes(req.body.userId)){
                await user.updateOne({ $push: { followers: req.body.userId}});
                await currentUser.updateOne({ $push: { followings: req.params.id}});
                res.status(200).json("User has been followed successfully");

            }
            else{
                res.status(403).json("You already follow the user")
            }

        }
        catch(err){
            return res.status(500).json(err);
        }

   }
    else{
        return res.status(403).json("You can not follow yourself")
    }
     
});

// Unfollow user
router.put("/:id/unfollow", authenticate.verifyToken, async (req, res) => {
    if(req.body.userId !== req.params.id || req.body.isAdmin){
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if(user.followers.includes(req.body.userId)){
                await user.updateOne({ $pull: { followers: req.body.userId}});
                await currentUser.updateOne({ $pull: { followings: req.params.id}});
                res.status(200).json("User has been unfollowed successfully");

            }
            else{
                res.status(403).json("You don't followed the user")
            }

        }
        catch(err){
            return res.status(500).json(err);
        }

   }
    else{
        return res.status(403).json("You can not follow yourself")
    }
     
});


// Get friends
router.get('/friends/:userId', authenticate.verifyToken, async(req, res)=>{
    try{
        const user = await User.findById(req.params.userId);
        const friends = await Promise.all(
            user.followings.map((friendId)=>{
                return User.findById(friendId);
            })
        );

        // Since we don't want all the fields of the friends, we will extract what we want
        let friendList = [];
        friends.map((friend)=>{
            const { _id, username, profilePicture } = friend;
            friendList.push({ _id, username, profilePicture });
        });
        return res.status(200).json(friendList);

    }
    catch(err){
        return res.status(500).json(err);
    }
})


// search users
router.post("/", authenticate.verifyToken, async (req, res)=>{

    const username = req.body.searchTerm.username.trim();
     
    try {
        // return users based on username using the characters typed in the req.body
        const users = await User.find({username: { $regex: `^${username}`, $options: 'i'}});
        if(!users){
            res.status(404).json("Users not found")
        }
        res.status(200).json(users);
    }
    catch(err){
        return res.status(500).json(err);
    }
});

module.exports = router;
const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// get a user
router.get("/find", async (req, res)=>{
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
router.get("/", async (req, res)=>{
     
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
router.put("/:id", async (req, res)=>{
     
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
            return res.status(403).json("You update only your account")
        }
    }
    catch(err){
        return res.status(500).json(err);
    }
});
// delete user
router.delete("/:id", async (req, res)=>{
     
    try {

        if(req.body.userId === req.params.id || req.body.isAdmin){
            const user = await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account deleted");
       }
        else{
            return res.status(403).json("You can only update your account")
        }
    }
    catch(err){
        return res.status(500).json(err);
    }
});

// Follow user
router.put("/:id/follow", async (req, res)=>{
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
router.put("/:id/unfollow", async (req, res) => {
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
                res.status(403).json("You dont followed the user")
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

module.exports = router;
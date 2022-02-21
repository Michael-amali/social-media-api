const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
router.post("/register", async (req, res)=>{

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        // create user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });

        // save user and respond
        const savedUser = await newUser.save();
        return res.status(201).json(savedUser);
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
})

// LOGIN
router.post("/login", async (req, res)=>{
    try{
        const user = await User.findOne({email: req.body.email});
        if(!user){
            return res.status(404).json("User not found")
        }
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if(!validPassword){
            res.status(400).json("Wrong credential")
        }
        
        const accessToken = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SEC,
            { expiresIn:"3d" }
        )
        let {password, ...others} = user._doc;
        return res.status(201).json({...others, accessToken});
    }
    catch(err){
        console.log(err, 'errror')
        return res.status(500).json("Network error: Something went wrong");
    }


})

module.exports = router;
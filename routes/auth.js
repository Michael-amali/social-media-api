const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const _ = require("lodash");

const sgMail = require("@sendgrid/mail");


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
            return res.status(400).json("Wrong credential")
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


// FORGOT PASSWORD
router.put("/forgot-password", async (req, res)=>{
    const { email } = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json("User with this email does not exists");
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
            },
            process.env.RESET_PASSWORD_KEY,
            { expiresIn:"3d" }
        )

        console.log(accessToken)

        // node mailer configuration 1 ////////////////////////////////////////
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'michaelacheampongy@gmail.com',
                pass: process.env.MAIL_TEST_PASS
            }
        });
        // node mailer configuration 2 ///////////////////////////////////////////
        let mailOptions = {
            from: "legends@gmail.com",
            to: email,
            subject: "Reset password",
            html: `
                <h1>Please click on given link to reset your password</h2>
                <p><small>${process.env.CLIENT_URL}/reset_password/${accessToken}</small></p>
            `
        }

        // Update the user resetLink field
        await user.updateOne({resetLink: accessToken});

        // sending email using nodeMailer  ///////////////////////////////////////
        transporter.sendMail(mailOptions, (err, data)=>{
            if(err){
                console.log(err);
                return res.status(500).json('Something went wrong');
            }
                console.log('Email sent');
            return res.status(200).json('Email has been sent, kindly follow the instruction');
        });


        // sendGrid configuration 1 ////////////////////////////
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        // sendGrid configuration 2 ////////////////////////
        // const message = {
        //     to: {
        //         name: user.username,
        //         email: email
        //     },
        //     subject: "Reset password",
        //     html: `
        //         <h1>Please click on given link to reset your password</h2>
        //         <p><small>${process.env.CLIENT_URL}/reset_password/${accessToken}</small></p>
        //     `
        // }

        // Sending mail using sendGrid ///////////////////////////////////////////
        // sgMail.send(message).then((response)=>{
        //     console.log('Email sent', response)
        //     return res.status(200).json('Email has been sent, kindly follow the instruction');
        // }).catch((err)=>{
        //     console.log(err);
        //     return res.status(500).json('Something went wrong');
        
        // });


    }
    catch(err){
        console.log(err, 'error')
        return res.status(500).json("Network error: Something went wrong");
    }
    
})


// RESET PASSWORD
router.put("/reset-password", (req, res)=>{
    const { resetLink, newPass } = req.body;
    if(resetLink){
        jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, (error, decodedData)=>{
            if(error){
                return res.status(401).json("Incorrect token")
            }

            User.findOne({resetLink: resetLink}, async(err, user)=>{
                if(err || !user){
                    return res.status(400).json("User with this token does not exist");
                }
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPass, salt);
                const obj = {
                    password: hashedPassword
                }

                // By so doing, we will update the user with the new password
                user = _.extend(user, obj);
                user.save((err, result)=>{
                    if(err){
                        return res.status(400).json("Reset password error")
                    }
                    else{
                        return res.status(200).json("Your password has been changed successfully");
                    }
                })
            })
        })
    }
    else{
        return res.status(500).json("Network error: Something went wrong, Authentication error"); 
    }
})

module.exports = router;
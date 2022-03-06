const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const _ = require("lodash");
const sgMail = require("@sendgrid/mail");
const mailgun = require("mailgun-js");





// REGISTER
router.post("/register", async (req, res)=>{

    try{
        const user = await User.findOne({email: req.body.email});
        if(!user){
            return res.status(404).json("Email already exists")
        }

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
        // let transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: 'michaelacheampongy@gmail.com',
        //         pass: process.env.MAIL_TEST_PASS
        //     }
        // });
        // node mailer configuration 2 ///////////////////////////////////////////
        // let mailOptions = {
        //     from: "legends@gmail.com",
        //     to: email,
        //     subject: "Reset password",
        //     html: `
        //         <h1>Please click on given link to reset your password</h2>
        //         <p><small>${process.env.CLIENT_URL}/reset_password/${accessToken}</small></p>
        //     `
        // }

        // Update the user resetLink field
        await user.updateOne({resetLink: accessToken});

        // sending email using nodeMailer 3 ///////////////////////////////////////
        // transporter.sendMail(mailOptions, (err, data)=>{
        //     if(err){
        //         console.log(err);
        //         return res.status(500).json('Something went wrong');
        //     }
        //         console.log('Email sent');
        //     return res.status(200).json('Email has been sent, kindly follow the instruction');
        // });


        // sendGrid configuration 1 ////////////////////////////
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        // sendGrid configuration 2 ////////////////////////
        const message = {
            from: 'michael.acheampong@amalitech.com',
            to: {
                name: user.username,
                email: email
            },
            templateId: process.env.SENDGRID_RESET_PASS_TEMPLATE_ID,
            personalizations: [
              {
                to: [{email: email}],
                dynamic_template_data: {
                  subject: "Reset Password",
                  name: user.username,
                  url: `${process.env.CLIENT_URL}/reset_password/${accessToken}`,
                  email: email,
                },
              },
            ],
        }

        // Sending mail using sendGrid 3 ///////////////////////////////////////////
        sgMail.send(message).then((response)=>{
            console.log('Email sent', response)
            return res.status(200).json('Email has been sent, kindly follow the instruction');
        }).catch((err)=>{
            console.log(err);
            return res.status(500).json('Something went wrong');
        
        });


        // mailGun configuration 1 ////////////////////////////
        // const DOMAIN = "sandbox1c4c44beac254dd1ac0c8259dadebfc5.mailgun.org";
        // const mg = mailgun({apiKey: "71bfb4a9b324e8c4503b015191d13f84-e2e3d8ec-ef559e29", domain: DOMAIN});

        // mailGun configuration 2 ////////////////////////////
        // const data = {
        //     from: "Mailgun Sandbox <postmaster@sandbox1c4c44beac254dd1ac0c8259dadebfc5.mailgun.org>",
        //     // to: the recipient email must be added at mailGun dasboard for the recipicient to verify before the recipient can get messages
        //     to: email,
        //     subject: "Reset password",
        //     text: 'home',
        //     html: `
        //         <h1>Please click on given link to reset your password</h2>
        //         <p><small>${process.env.CLIENT_URL}/reset_password/${accessToken}</small></p>
        //     `
        // };

        // Sending mail using mailGun ///////////////////////////////////////////
        // mg.messages().send(data, (err, body) => {
        //     if(err){
        //         console.log(err);
        //         return res.status(500).json('Something went wrong');
        //     }
        //         console.log('Email sent');
        //     return res.status(200).json('Email has been sent, kindly follow the instruction');
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


// LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy();

    return res.status(200).json("Log out successful");
});

module.exports = router;
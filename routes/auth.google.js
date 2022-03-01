const router = require("express").Router();
const passport = require('passport');
const jwt = require("jsonwebtoken");

// const clientUrl = 'http://localhost:8081';
const clientUrl = process.env.CLIENT_URL;



// @description Auth with Google
// @route GET /auth/google
router.get("/auth/google", passport.authenticate('google', {scope: ['profile', 'email']}));

// @description Google Auth callback
// @route GET /auth/google/callback
router.get("/auth/google/callback", passport.authenticate('google', { 
    successRedirect: clientUrl,
    failureRedirect: `${clientUrl}/login`
}));

router.get('/dashboard', (req, res)=>{
    res.send('You have successfully logged in using Oauth');
});

// google auth failure
router.get('/login/failed', (req, res)=>{                                                                                                                                                                                                                                                                                                                                                                                                
    res.status(401).json('failure');
});

// google auth success
router.get('/login/success', (req, res)=>{
    if(req.user){
        const accessToken = jwt.sign(
            {
                id: req.user._id,
                email: req.user.email
            },
            process.env.JWT_SEC,
            { expiresIn:"3d" }
        );

        res.status(200).json({
            msg:'success',
            success: true,
            user: req.user, 
            accessToken: accessToken
        });
    }

});



module.exports = router;
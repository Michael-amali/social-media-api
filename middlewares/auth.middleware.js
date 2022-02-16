const jwt = require("jsonwebtoken");

// verifyToken fxn will check and save user into the req.user 
const verifyToken = (req, res, next) =>{
    const authHeader = req.headers['authorization'];

    if(authHeader){
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SEC, (err, user)=> {
            if(err){
                return res.status(403).json("Token is not valid!");
            }
            req.user = user; 
            next();
        })
    }else{
        return res.status(401).json("You are not authenticated!");
    }
}

module.exports = {
    verifyToken,
}
const express = require("express");
const dotenv = require("dotenv");
dotenv.config()
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const authRoute = require("./routes/auth");
const conversationRoute = require("./routes/conversations");
const messageRoute = require("./routes/messages");
const notificationRoute = require("./routes/notifications");

const multer = require("multer");

// oauth related
const authGoogleRoute = require('./routes/auth.google');
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const passport = require("passport");
// Passport config Google
require('./config/passport.config')(passport);



mongoose.connect(process.env.MONGO_URL)
    .then(()=>{
        console.log("DB connection successful");
    })
    .catch((err)=>{ 
        console.log(err);
    })



// Setting storage in MongoDB -- oauth related
const store = new MongoDBSession({
    uri: process.env.MONGO_URL,
    collection: "mySessions"
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
}));

// Passport middleware  -- oauth related
app.use(passport.initialize());
app.use(passport.session());



app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors({ credentials:true, origin: true }));



const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, "images");
    },
    filename: (req, file, cb)=>{
        cb(null, "myimage.jpeg");
    }
})

const upload = multer({storage: storage});

app.post("/api/upload", upload.single("file"), (req, res)=>{
    res.status(200).json("file has been uploaded successfully");
})


app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/auth", authRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/notifications", notificationRoute);
app.use(authGoogleRoute);


app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server started");
})
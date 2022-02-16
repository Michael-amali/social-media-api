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
const multer = require("multer");

mongoose.connect(process.env.MONGO_URL)
    .then(()=>{
        console.log("DB connection successful");
    })
    .catch((err)=>{
        console.log(err);
    })

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());




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

app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server started");
})
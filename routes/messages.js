const router = require("express").Router();
const Message = require("../models/Message");
const authenticate = require("../middlewares/auth.middleware");

// create message
router.post('/', authenticate.verifyToken, async(req, res)=>{

    const newMessage = new Message(req.body);
    try{
        const savedMessage = await newMessage.save();
        return res.status(200).json(savedMessage);
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    } 
});

// Get messages
router.get('/:conversationId', authenticate.verifyToken, async(req, res)=>{
    try {
        const messages = await Message.find({conversationId: req.params.conversationId});
        return res.status(200).json(messages);
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    } 
});


module.exports = router;
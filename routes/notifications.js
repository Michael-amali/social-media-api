const router = require("express").Router();
const Notification = require("../models/Notification");
const authenticate = require("../middlewares/auth.middleware");
const Conversation = require("../models/Conversation");


// create notification
router.post('/', authenticate.verifyToken, async(req, res)=>{

    const newNotification = new Notification(req.body);
    try{
        const savedNotification = await newNotification.save();
        return res.status(200).json(savedNotification);
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    } 
});

// Get notifications
router.get('/:senderId', authenticate.verifyToken, async(req, res)=>{
    try {
        const notifications = await Notification.find({receiverId: req.params.senderId});
        return res.status(200).json(notifications);
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    } 
});


// delete one notification referring to one conversation
router.delete("/:conversationId/:id", authenticate.verifyToken, async (req, res)=>{
    try {
        const notification = await Notification.findOne({conversationId: req.params.conversationId});
		if(!notification){
			return res.status(201).json("Notification already deleted")
		}
        
        if(notification.receiverId === req.params.id){
            try{
                await notification.deleteOne(); 
                return res.status(200).json("Notification has been deleted");
            }
            catch(err){
                return res.status(500).json("Network error: Something went wrong");
            }
        }
        else{
            return res.status(403).json("You can only delete your your notification");
        }
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
});


// delete all notifications pertaining a user 
router.delete("/:id", authenticate.verifyToken, async (req, res) => {
    try {
        await Notification.deleteMany({receiverId: req.params.id});
        return res.status(200).json("Notification has been deleted");
    }
    catch(err){
        return res.status(500).json("Network error: Something went wrong");
    }
});


module.exports = router;
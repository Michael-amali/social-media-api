const router = require("express").Router();
const Conversation = require("../models/Conversation");
const authenticate = require("../middlewares/auth.middleware");

// create conversation
router.post('/', async (req, res)=>{

    const conversation = await Conversation.findOne({
        members: {$all: [req.body.senderId, req.body.receiverId]}
    })
    // There's no existing conversation so create new one
    if(!conversation){
        const newConversation = new Conversation({
            members: [req.body.senderId, req.body.receiverId]
        });

        try{
            const savedConversation = await newConversation.save();
            return res.status(200).json(savedConversation);
        }
        catch(err){
            return res.status(500).json(err);
        } 
    }
    // It means the sender and receiver have already created conversation, so return the old conversation
    else {
        return res.status(200).json(conversation);
    }

});


// get conv of user
router.get('/:userId', async(req, res)=>{
    try{
        // it will go through each conversation and check members array to see if userId is in the array, if so, it will return the conversations
        const conversation = await Conversation.find({
            members: {$in: [req.params.userId]}
        })
        return res.status(200).json(conversation);
    } 
    catch(err){
        return res.status(500).json(err);
    } 
});


// get conv includes two userId
router.get('/find/:firstUserId/:secondUserId', async(req, res)=>{
    try{
        // it will go through each conversation and check members array to see if firstUserId and secondUserId is in the array, if so, it will return the conversations
        const conversation = await Conversation.findOne({
            members: {$all: [req.params.firstUserId, req.params.secondUserId]}
        })
        return res.status(200).json(conversation);
    } 
    catch(err){
        return res.status(500).json(err);
    } 
})


// delete conversation - my-inclusion
router.delete('/:userId/:partnerId/:conversationId', authenticate.verifyToken, async(req, res)=>{

    try{
       const conversation = await Conversation.findOne({
            members: {$all: [req.params.userId, req.params.partnerId]}
        })

        if(conversation._id.toString() === req.params.conversationId){
            try {
                await conversation.deleteOne()
                return res.status(200).json('Conversation successfully deleted');
            }
            catch(err){
                return res.status(500).json(err);
            } 
        }
        else{
            return res.status(403).json("You can only delete your conversation");
        }
    }
    catch(err){
        return res.status(500).json(err);
    } 
})


module.exports = router;
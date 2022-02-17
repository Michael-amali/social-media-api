const router = require("express").Router();
const Conversation = require("../models/Conversation");

// create conversation
router.post('/', async (req, res)=>{

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
})



module.exports = router;
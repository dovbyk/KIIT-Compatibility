const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

//Submit Test Answers
router.post('/test', auth, async (req, res) => {
  const {answers} = req.body;
  try{
    if(!answers || Object.keys(answers).length !== 10) {
      return res.status(400).json({msg: 'Answer all 10 questions'});
    }
    const validKeys = Array.from({ length: 10 }, (_, i) => i.toString());
    if (!Object.keys(answers).every(key => validKeys.includes(key))) {
      return res.status(400).json({ msg: 'Answer keys must be 0 to 9' });
    }
      const user = await User.findById(req.user.id);
      if(user.answers.size > 0){
        return res.status(403).json({msg: 'Test already taken'});
      } 
    user.answers = new Map(Object.entries(answers));
      await user.save();
      res.json({msg: 'Answers submitted succesfully'});
    } catch(error){
      res.status(500).json({msg: 'Server error'});
    }
});

//List online users
router.get('/users', auth, async (req,res) => {
  try{
    const users = await User.find({ isOnline: true}).select('username _id gender compatibilityRequests phoneNumber sentRequests');
    console.log('Users returned:', users); // Log full response
    res.json(users);
  } catch (error){
    console.error('Users fetch error:', error);
    res.status(500).json({msg: 'Server error'});
  }
});

//Calculate compatibility
router.post('/compatibility', auth, async (req, res) =>{
  const {targetUserId} = req.body;
  try{
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(targetUserId);
    if(!targetUser) return res.status(404).json({msg: 'User not found'});

    if (user.gender === targetUser.gender){
      return res.status(403).json({msg: 'Only allowed with opposite genders'});
    }

    const userAnswers = user.answers;
    const targetAnswers = targetUser.answers;
    if(userAnswers.size === 0 || targetAnswers.size === 0){
      return res.status(400).json({msg: 'Both must complete the test'});
    }

    let matches =0;
    for (let i=0; i<10; i++){
      const key = i.toString();
      if(userAnswers.get(key) === targetAnswers.get(key)) matches++;
    }
    const score = (matches /10) * 100;
    res.json({score});
  } catch(error){
    res.status(500).json({msg: 'Server error'});
  }
});

//Request Phone Number
router.post('/request', auth, async (req, res) => {
  const {targetUserId, score} = req.body;
  console.log('Received req payload:', req.body);
  try{
    if(!targetUserId || typeof score !== 'number'){
      return res.status(400).json({msg: 'Invalid targetUserId or score'});
    }

    if(score < 60) return res.status(403).json({msg: 'You are not compatible enough to request! Keep searching...'});
    
    const user = await User.findById(req.user?.id);
    if(!user) return res.status(401).json({msg: 'user not authenticated'});
    
    const targetUser = await User.findById(targetUserId);
    if(!targetUser) return res.status(404).json({msg: 'User not found'});

    if(user.gender === targetUser.gender) {
      return res.status(403).json({msg: 'Requests not allowed'});
    }

    const alreadySent = user.sentRequests.some(
      r => r.targetUserId.toString() === targetUserId
    );
    console.log('Already sent request to this user:', alreadySent);
    if (alreadySent) return res.status(400).json({ msg: 'You have already sent a request to this user' });

    const existingRequest = targetUser.compatibilityRequests.find(
      request => request.requesterId.toString() === req.user.id
    );
    console.log('Existing request:', existingRequest || 'None');
    if (existingRequest) return res.status(400).json({msg: 'Request already send'});

    targetUser.compatibilityRequests.push({requesterId: req.user.id, score});
    user.sentRequests.push({ targetUserId, score });

    await Promise.all([targetUser.save(), user.save()]);
    console.log('Request saved:', targetUser.compatibilityRequests);
    res.json({msg: 'Request send'});
  } catch (error){
    console.log('Request error', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ msg: messages.join(' ') });
    }
    res.status(500).json({msg: 'Server error'});
  }
});


//Approve/Deny Request
router.post('/approve', auth, async (req, res) => {
  const {requesterId, approved} = req.body;
  try{
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ msg: 'User not authenticated' });
    
    const requestIndex = user.compatibilityRequests.findIndex(
      r => r.requesterId.toString() === requesterId
    );
    if (requestIndex === -1) return res.status(404).json({ msg: 'Request not found' });
    

    const request = user.compatibilityRequests[requestIndex];

    request.approved = approved;
    if (approved) {
      request.phoneNumber = user.phoneNumber; 
    }
    const response = approved ? { phoneNumber: user.phoneNumber } : { msg: 'Request denied' };

    const sender = await User.findById(requesterId);
    if (sender) {
      const sentRequest = sender.sentRequests.find(
        r => r.targetUserId.toString() === req.user.id
      );
      if (sentRequest) {
        sentRequest.approved = approved;
        if (approved) sentRequest.phoneNumber = user.phoneNumber;
        await sender.save();
        console.log('Sender updated:', sender.sentRequests);
      }
    }

    user.compatibilityRequests.splice(requestIndex,1);
    await user.save();

    res.json(response);
  } catch(error){
    res.status(500).json({msg: 'Server error'});
  }
});

module.exports = router;


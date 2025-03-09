const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

router.post('/register-firebase', async (req, res) => {
  const { username, email, phoneNumber, gender, password, isVerified } = req.body;
  console.log('Received registration:', req.body);
  try {
    if (!username || !email || !phoneNumber || !gender || !password || !isVerified) {
      return res.status(400).json({ msg: 'All fields required—don’t skimp out, mate!' });
    }

    const emailRegex = /^[0-9]+@kiit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: 'Email must be a valid KIIT student ID (e.g., 22012345@kiit.ac.in)' });
    }

    const phoneRegex = /^\+\d{11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ msg: 'Phone must be +91XXXXXXXXXX format!' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists—someone beat you to the punch!' });

    user = new User({
      username,
      email,
      phoneNumber,
      gender,
      password: await bcrypt.hash(password, 10),
      isVerified: true
    });
    await user.save();
    console.log('User saved:', email);
    res.json({ msg: 'Registration complete! Time to log in and find your match!' });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    res.status(500).json({ msg: 'Server error—gremlins strike again!' });
  }
});


// Login: Email and Password (No OTP)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide both email and password—don’t be shy!' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Email not found:', email);
      return res.status(400).json({ msg: 'Email not registered—did you forget to join the party?' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Email not verified—check your inbox, mate!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for:', email);
      return res.status(400).json({ msg: 'Incorrect password—did you fat-finger it?' });
    }

    user.isOnline = true;
    await user.save();
    console.log('User logged in:', email);

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error—someone tripped over the cables!' });
  }
});

module.exports = router;

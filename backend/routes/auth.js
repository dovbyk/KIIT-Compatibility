// Add these routes to your auth.js file

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory OTP store (for demonstration - in production use Redis or database)
const otpStore = {};

// Check if email/phone already exists
router.post('/check-user', async (req, res) => {
  const { email, phoneNumber } = req.body;
  try {
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: 'Email already registered. Please use a different email.' });
    }
    
    const existingPhone = await User.findOne({ phoneNumber: formattedPhone });
    if (existingPhone) {
      return res.status(400).json({ msg: 'Phone number already registered. Please use a different number.' });
    }
    
    res.status(200).json({ msg: 'Email and phone are available' });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Send email OTP
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Validate email format (KIIT student email)
    const emailRegex = /^[0-9]+@kiit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format. Use your KIIT student email.' });
    }
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with expiry (15 minutes)
    otpStore[email] = {
      otp,
      expires: Date.now() + 15 * 60 * 1000
    };
    
    // Configure email transporter (replace with your SMTP settings)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ msg: 'OTP sent to your email' });
  } catch (error) {
    console.error('Email OTP error:', error);
    res.status(500).json({ msg: 'Failed to send OTP. Please try again.' });
  }
});

// Verify email OTP
router.post('/verify-email-otp', (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Check if OTP exists and is valid
    const otpData = otpStore[email];
    
    if (!otpData) {
      return res.status(400).json({ msg: 'OTP not found. Please request a new one.' });
    }
    
    if (Date.now() > otpData.expires) {
      delete otpStore[email];
      return res.status(400).json({ msg: 'OTP expired. Please request a new one.' });
    }
    
    if (otpData.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP. Please try again.' });
    }
    
    // OTP verified successfully
    delete otpStore[email]; // Clear OTP after successful verification
    res.status(200).json({ msg: 'Email verification successful' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ msg: 'Verification failed. Please try again.' });
  }
});

// Register user (after both email and phone verification)
router.post('/register', async (req, res) => {
  const { username, email, phoneNumber, gender, password, isVerified } = req.body;
  
  try {
    // All validations should be done in the verification steps
    // Just one final check
    if (!username || !email || !phoneNumber || !gender || !password || !isVerified) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      phoneNumber,
      gender,
      password: await bcrypt.hash(password, 10),
      isVerified: true
    });
    
    await user.save();
    res.status(201).json({ msg: 'Registration successful! You can now log in.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Registration failed. Please try again.' });
  }
});

module.exports = router;

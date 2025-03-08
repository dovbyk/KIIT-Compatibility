const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const User = require('./models/User'); // Your User model

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (unchanged)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS  // Your App Password
  }
});

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Email OTP
app.post('/auth/send-email-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = generateOTP();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Email OTP for KIIT Compatibility',
    text: `Your OTP is: ${otp}. It’s valid for 10 minutes, mate!`
  };

  try {
    await transporter.sendMail(mailOptions);
    // Store OTP temporarily (e.g., in-memory or DB)
    // For simplicity, we’ll pass it back to frontend to store—production needs a DB!
    res.json({ msg: 'Email OTP sent', otp }); // Temp for dev
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email OTP' });
  }
});

// Register Endpoint (unchanged from earlier)
app.post('/auth/register-firebase', async (req, res) => {
  const { username, email, phoneNumber, gender, password, isVerified } = req.body;
  try {
    const user = new User({ username, email, phoneNumber, gender, password, isVerified });
    await user.save();
    res.json({ msg: 'User registered successfully—welcome aboard!' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

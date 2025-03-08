const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// CORS config
app.use(cors({
  origin: 'https://kiit-compatibility.vercel.app', // Your frontend
  methods: ['GET', 'POST'], // Allow these methods
  allowedHeaders: ['Content-Type'] // Allow this header
}));

app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is not defined—check Render env vars!');
  process.exit(1);
}
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected—ready to roll!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const otpStore = new Map();

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
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
    res.json({ msg: 'Email OTP sent' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email OTP' });
  }
});

app.post('/auth/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);
  if (!stored) return res.status(400).json({ error: 'No OTP found—send it first!' });
  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired—try again!' });
  }
  if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  otpStore.delete(email);
  res.json({ msg: 'Email OTP verified' });
});

app.post('/auth/register-firebase', async (req, res) => {
  const { username, email, phoneNumber, gender, password, isVerified } = req.body;
  try {
    const user = new User({ username, email, phoneNumber, gender, password, isVerified });
    await user.save();
    res.json({ msg: 'User registered successfully—welcome aboard!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

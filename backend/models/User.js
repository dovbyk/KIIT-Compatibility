const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true, match: [/^[0-9]+@kiit\.ac\.in$/, "Invalid email! Only @kiit.ac.in emails are allowed."]},
  password: {type: String},
  phoneNumber: {type: String, required: true, unique: true, match: [/^\d{10}$/,'Phone number must be a 10-digit number.' ]},
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  
  otp: {type: String},
  isVerified: {type: Boolean, default: false},


  answers: { type: Map, of: String, default: new Map() },
  compatibilityRequests: [{
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    approved: { type: Boolean, default: null } // null: pending, true: approved, false: denied
  }],
  sentRequests: [{
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    approved: { type: Boolean, default: null },
    phoneNumber: { type: String, default: null } // Store phone number on approval
  }],
  isOnline: { type: Boolean, default: false } // Track logged-in status

}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);

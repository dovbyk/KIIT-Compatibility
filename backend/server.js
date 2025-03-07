const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app=express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
}));


//connect to database
if(process.env.NODE_ENV !== 'test'){
connectDB();
}

//Middleware
app.use(express.json());

//routes
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/test'));

module.exports = app;

if(require.main === module){
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

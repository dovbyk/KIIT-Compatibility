const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if(!token) return res.status(401).json({msg: 'No token'});

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('Auth middleware - Decoded user:', req.user);
    next();
  } catch (error){
    console.error('Auth middleware error:', error);
    res.status(401).json({msg: 'Token not valid'});
  }
};

module.exports = auth;

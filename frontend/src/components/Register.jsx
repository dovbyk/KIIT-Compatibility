// This implementation builds on your existing Register.jsx component
// Focus on the key changes needed for the verification flow

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

const Register = () => {
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  
  // Verification states
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verificationStep, setVerificationStep] = useState(1); // 1: Initial form, 2: OTP verification
  
  // UI states
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Validators
  const validateEmail = (email) => /^[0-9]{8}@kiit\.ac\.in$/.test(email);
  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  // Initial form submission - starts verification process
  const handleStartVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate all required fields
    if (!username || !email || !phoneNumber || !gender || !password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email must be in format: 22012345@kiit.ac.in');
      setLoading(false);
      return;
    }
    
    if (!validatePhone(phoneNumber)) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }
    
    try {
      // 1. Check if email/phone already exists
      const checkRes = await axios.post('/api/auth/check-user', { email, phoneNumber });
      
      // 2. Send email OTP
      await sendEmailOtp();
      
      // 3. Setup phone verification
      setupPhoneVerification();
      
      // Move to next step
      setVerificationStep(2);
    } catch (err) {
      console.error('Verification setup error:', err);
      setError(err.response?.data?.msg || 'Error starting verification process');
    } finally {
      setLoading(false);
    }
  };

  // Send email OTP
  const sendEmailOtp = async () => {
    try {
      const res = await axios.post('/api/auth/send-email-otp', { email });
      setIsEmailOtpSent(true);
      setMessage(prev => prev + 'Email OTP sent successfully. ');
    } catch (err) {
      throw new Error(err.response?.data?.msg || 'Failed to send email OTP');
    }
  };

  // Setup Firebase phone verification
  const setupPhoneVerification = async () => {
    try {
      // Create invisible reCAPTCHA
      const verifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA verified')
      }, auth);
      
      // Render the reCAPTCHA
      await verifier.render();
      
      // Send OTP to phone
      const fullPhone = `+91${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, verifier);
      
      // Store confirmation result for later verification
      window.confirmationResult = confirmationResult;
      
      setIsPhoneOtpSent(true);
      setMessage(prev => prev + 'Phone OTP sent successfully.');
    } catch (err) {
      console.error('Phone verification error:', err);
      throw new Error('Failed to send phone OTP');
    }
  };

  // Final form submission - verify OTPs and register user
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!emailOtp || !phoneOtp) {
      setError('Both OTPs are required');
      setLoading(false);
      return;
    }
    
    try {
      // 1. Verify email OTP
      const emailVerifyRes = await axios.post('/api/auth/verify-email-otp', {
        email,
        otp: emailOtp
      });
      
      // 2. Verify phone OTP
      if (!window.confirmationResult) {
        throw new Error('Phone verification session expired');
      }
      
      const phoneCredential = await window.confirmationResult.confirm(phoneOtp);
      
      // 3. Register user after both verifications are successful
      const registerPayload = {
        username,
        email,
        phoneNumber: `+91${phoneNumber}`,
        gender,
        password,
        isVerified: true
      };
      
      const registerRes = await axios.post('/api/auth/register', registerPayload);
      
      // Success - show message and redirect to login
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Verification/registration error:', err);
      setError(err.response?.data?.msg || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate form based on verification step
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        
        {/* Error and success messages */}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
        
        {/* Initial registration form */}
        {verificationStep === 1 && (
          <form onSubmit={handleStartVerification}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your username"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="22012345@kiit.ac.in"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-200 border border-r-0 rounded-l">+91</span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) setPhoneNumber(value);
                  }}
                  className="w-full p-3 border rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10-digit number"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create a password"
                required
              />
            </div>
            
            {/* reCAPTCHA container */}
            <div id="recaptcha-container"></div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Register'}
            </button>
            
            <p className="mt-4 text-center text-gray-600">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </form>
        )}
        
        {/* OTP verification form */}
        {verificationStep === 2 && (
          <form onSubmit={handleVerifyAndRegister}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email OTP</label>
              <input
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter OTP sent to your email"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Phone OTP</label>
              <input
                type="text"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter OTP sent to your phone"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Complete Registration'}
            </button>
            
            <p className="mt-4 text-center text-gray-600">
              <button 
                type="button"
                onClick={() => setVerificationStep(1)} 
                className="text-blue-600 hover:underline"
              >
                Back to registration
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;

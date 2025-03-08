import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [otpsSent, setOtpsSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const validateEmail = (email) => /^[0-9]{8}@kiit\.ac\.in$/.test(email);
  const validatePhone = (phoneNumber) => /^\d{10}$/.test(phoneNumber);

  const handleSendOtps = async (e) => {
    e.preventDefault();
    if (!gender || !validateEmail(email) || !validatePhone(phoneNumber)) {
      setError('Fill all fields correctly—email like 22012345@kiit.ac.in, phone 10 digits!');
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'https://compatibility-backend.onrender.com';
    console.log('API URL:', apiUrl); // Debug

    try {
      // Send Email OTP
      const emailRes = await axios.post(`${apiUrl}/auth/send-email-otp`, { email });
      console.log('Email OTP sent:', emailRes.data);

      // Send Phone OTP
      const verifier = new RecaptchaVerifier(recaptchaRef.current, {
        size: 'invisible',
        callback: () => console.log('Recaptcha solved—phone OTP on the way!')
      }, auth);
      await verifier.render();
      const fullPhoneNumber = `+91${phoneNumber}`;
      const phoneResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      window.confirmationResult = phoneResult;
      console.log('Phone OTP sent to:', fullPhoneNumber);

      setOtpsSent(true);
      setMessage('OTPs sent to your email and phone—check both!');
    } catch (err) {
      console.error('OTP send error:', err);
      setError(`Failed to send OTPs—${err.response?.data?.error || err.message}`);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Set a password—don’t leave us guessing!');
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'https://compatibility-backend.onrender.com';

    try {
      // Verify Email OTP with backend
      const emailVerifyRes = await axios.post(`${apiUrl}/auth/verify-email-otp`, { email, otp: emailOtp });
      console.log('Email OTP verified:', emailVerifyRes.data);

      // Verify Phone OTP with Firebase
      const phoneCredential = await window.confirmationResult.confirm(phoneOtp);
      console.log('Phone verified:', phoneCredential.user.phoneNumber);

      // Register with backend
      const payload = {
        username,
        email,
        phoneNumber: `+91${phoneNumber}`,
        gender,
        password,
        isVerified: true
      };
      console.log('Sending to backend:', payload);
      const res = await axios.post(`${apiUrl}/auth/register-firebase`, payload);
      console.log('Backend response:', res.data);
      setMessage(res.data.msg);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Verification error:', err.response?.data?.error || err.message);
      setError(`Verification failed—${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
        {!otpsSent ? (
          <form onSubmit={handleSendOtps}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Email (e.g., 22012345@kiit.ac.in)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Phone Number (10 digits)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-200 border border-r-0 rounded-l">+91</span>
                <input type="text" value={phoneNumber} onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) setPhoneNumber(value);
                }} className="w-full p-2 border rounded-r" required />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div ref={recaptchaRef} id="recaptcha-container"></div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Register</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Email OTP</label>
              <input type="text" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Phone OTP</label>
              <input type="text" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Set Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Verify & Register</button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/" className="text-blue-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

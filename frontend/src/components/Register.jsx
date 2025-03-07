import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, sendEmailVerification } from './firebase';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Just the 10 digits
  const [gender, setGender] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => /^[0-9]+@kiit\.ac\.in$/.test(email);
  const validatePhone = (phoneNumber) => /^\d{10}$/.test(phoneNumber);

  const handleSendEmailLink = async (e) => {
    e.preventDefault();
    if (!gender || !validateEmail(email) || !validatePhone(phoneNumber)) {
      setError('Fill all fields correctly—email like 22012345@kiit.ac.in, phone 10 digits!');
      return;
    }

    try {
      const userCredential = await auth.signInAnonymously(); // Temp user
      await auth.currentUser.updateEmail(email);
      await sendEmailVerification(auth.currentUser, {
        url: 'https://kiit-compatibility.vercel.app/register',
        handleCodeInApp: true
      });
      console.log('Email verification link sent to:', email);
      setEmailLinkSent(true);
      setMessage('Email verification link sent—click it to proceed!');
    } catch (err) {
      console.error('Email link send error:', err);
      setError('Failed to send email link—gremlins at it again!');
    }
  };

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    try {
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) {
        setError('Click the email link first—don’t skip the queue!');
        return;
      }

      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('Recaptcha solved—phone OTP on the way!')
      }, auth);
      const fullPhoneNumber = `+91${phoneNumber}`; // Add +91 here
      const phoneResult = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
      window.confirmationResult = phoneResult;
      setPhoneOtpSent(true);
      console.log('Phone OTP sent to:', fullPhoneNumber);
      setMessage('Phone OTP sent—enter it to finish!');
    } catch (err) {
      console.error('Phone OTP send error:', err);
      setError(`Failed to send phone OTP—${err.message}`);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Set a password—don’t leave us guessing!');
      return;
    }

    try {
      const phoneCredential = await window.confirmationResult.confirm(phoneOtp);
      console.log('Phone verified:', phoneCredential.user.phoneNumber);

      const payload = {
        username,
        email,
        phoneNumber: `+91${phoneNumber}`, // Add +91 for backend
        gender,
        password,
        isVerified: true
      };
      console.log('Sending to backend:', payload);
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register-firebase`, payload);    
      console.log('Backend response:', res.data);
      setMessage(res.data.msg);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Verification error:', err);
      setError(`Invalid phone OTP—${err.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
        {!emailLinkSent ? (
          <form onSubmit={handleSendEmailLink}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Email (e.g., 22012345@kiit.ac.in)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Phone Number (10 digits)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-200 border border-r-0 rounded-l">+91</span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only digits
                    if (value.length <= 10) setPhoneNumber(value); // Max 10 digits
                  }}
                  className="w-full p-2 border rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6372542699"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Send Email Link</button>
          </form>
        ) : !phoneOtpSent ? (
          <form onSubmit={handleSendPhoneOtp}>
            <p className="text-sm text-gray-600 mb-4">Email link sent—click it, then hit below!</p>
            <div id="recaptcha-container"></div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Send Phone OTP</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Phone OTP</label>
              <input
                type="text"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Set Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
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

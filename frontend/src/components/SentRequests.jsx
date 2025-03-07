import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SentRequests = () => {
  const [sentRequests, setSentRequests] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token used:', token); // Log token
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { 'x-auth-token': token },
      });
      console.log('Full users response:', res.data); // Log full response
      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded user ID:', decoded.user.id); // Log user ID
      const currentUser = res.data.find(u => u._id === decoded.user.id);
      console.log('Current user:', currentUser); // Log current user
      if (!currentUser || !currentUser.sentRequests) {
        console.log('No sentRequests found for current user');
        setSentRequests([]);
        return;
      }
      const sentStatus = currentUser.sentRequests.map(req => ({
        targetUserId: req.targetUserId,
        username: res.data.find(u => u._id === req.targetUserId.toString())?.username || 'Unknown',
        score: req.score,
        approved: req.approved,
        phoneNumber: req.phoneNumber
      }));
      console.log('Mapped sent requests:', sentStatus);
      setSentRequests(sentStatus);
    } catch (err) {
      console.error('Fetch sent requests error:', err.response);
      setError(err.response?.data.msg || 'Failed to fetch sent requests');
    }
  };

  useEffect(() => {
    fetchSentRequests();
    const interval = setInterval(fetchSentRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Sent Requests</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {sentRequests.length > 0 ? (
        <div className="space-y-4">
          {sentRequests.map(req => (
            <div key={req.targetUserId} className="flex justify-between items-center bg-white p-4 rounded shadow">
              <span className="text-gray-700">
                Sent to {req.username} - Score: {req.score}%
                {req.approved === true && ` - Approved (Phone: ${req.phoneNumber})`}
                {req.approved === false && ' - Denied'}
                {req.approved === null && ' - Pending'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No sent requests</p>
      )}
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-6 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default SentRequests;
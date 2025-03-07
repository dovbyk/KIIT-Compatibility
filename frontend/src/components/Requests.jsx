import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { 'x-auth-token': token },
      });
      const currentUser = res.data.find(u => u._id === JSON.parse(atob(token.split('.')[1])).user.id);
      console.log('Fetched user data:', currentUser);
      console.log('Fetched requests:', currentUser?.compatibilityRequests || []);
      setRequests(currentUser?.compatibilityRequests || []);
    } catch (err) {
      console.error('Fetch requests error:', err.response);
      setError(err.response?.data.msg || 'Failed to fetch requests');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (requesterId, approved) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/approve', { requesterId, approved }, {
        headers: { 'x-auth-token': token },
      });
      setMessage(approved ? `Phone number shared: ${res.data.phoneNumber}` : 'Request denied');
      await fetchRequests(); // Refresh to clear the request
    } catch (err) {
      setError(err.response?.data.msg || 'Failed to process request');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Pending Requests</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.requesterId} className="flex justify-between items-center bg-white p-4 rounded shadow">
              <span className="text-gray-700">User ID: {req.requesterId} - Score: {req.score}%</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleResponse(req.requesterId, true)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleResponse(req.requesterId, false)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No pending requests</p>
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

export default Requests;
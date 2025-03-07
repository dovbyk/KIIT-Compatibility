import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [compatScores, setCompatScores] = useState({}); // Score per user
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For request success/error
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { 'x-auth-token': token },
        });
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const current = res.data.find(u => u._id === decoded.user.id);
        setCurrentUser(current);
        setUsers(res.data);
      } catch (err) {
        setError('Failed to fetch users');
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleTest = () => navigate('/test');
  const handleRequests = () => navigate('/requests');
  const handleSentRequests = () => navigate('/sent-requests');

  const checkCompatibility = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/compatibility', { targetUserId }, {
        headers: { 'x-auth-token': token },
      });
      setCompatScores(prev => ({ ...prev, [targetUserId]: res.data.score }));
    } catch (err) {
      setError(err.response?.data.msg || 'Failed to check compatibility');
    }
  };

  const sendRequest = async (targetUserId) => {
    try {
      const score = compatScores[targetUserId];
      if (!score) {
        setError('Check compatibility first');
        return;
      }
      if (score <= 60) {
        setError('Score too low to send request');
        return;
      }
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/request', { targetUserId, score }, {
        headers: { 'x-auth-token': token },
      });
      setMessage(res.data.msg);
      setCompatScores(prev => ({ ...prev, [targetUserId]: null })); // Clear score after sending
    } catch (err) {
      setError(err.response?.data.msg || 'Failed to send request');
    }
  };

  const hasSentRequest = (targetUserId) => {
    return currentUser?.sentRequests?.some(r => r.targetUserId.toString() === targetUserId) || false;
  };

  const oppositeGenderUsers = users.filter(user => user.gender !== currentUser?.gender);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="space-x-2">
          <button onClick={handleTest} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Take Test</button>
          <button onClick={handleRequests} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">View Requests</button>
          <button onClick={handleSentRequests} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Sent Requests</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>
      </div>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
      {currentUser && (
        <div className="mb-6">
          <p className="text-lg">Welcome, {currentUser.username} ({currentUser.gender})</p>
        </div>
      )}
      <h3 className="text-xl font-semibold mb-4">
        Compatible Users ({currentUser?.gender === 'male' ? 'Female' : 'Male'})
      </h3>
      <div className="grid gap-4">
        {oppositeGenderUsers.map(user => (
          <div key={user._id} className="flex justify-between items-center bg-white p-4 rounded shadow">
            <span className="text-gray-700">{user.username} ({user.gender})</span>
            <div className="flex items-center space-x-2">
              {compatScores[user._id] && (
                <span className="text-gray-700">Score: {compatScores[user._id]}%</span>
              )}
              <button
                onClick={() => checkCompatibility(user._id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Check Compatibility
              </button>
              <button
                onClick={() => sendRequest(user._id)}
                className={`px-4 py-2 rounded text-white ${
                  compatScores[user._id] && !hasSentRequest(user._id)
                    ? 'bg-indigo-500 hover:bg-indigo-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={!compatScores[user._id] || hasSentRequest(user._id)}
              >
                {hasSentRequest(user._id) ? 'Request Sent' : 'Send Request'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
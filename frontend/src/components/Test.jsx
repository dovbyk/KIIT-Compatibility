import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Test = () => {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasTakenTest, setHasTakenTest] = useState(false);
  const navigate = useNavigate();

  const questions = [
    { id: '0', text: 'Favorite season?', options: ['A: Spring', 'B: Summer', 'C: Fall', 'D: Winter'] },
    { id: '1', text: 'Morning or night person?', options: ['A: Morning', 'B: Night'] },
    { id: '2', text: 'Favorite color?', options: ['A: Blue', 'B: Red', 'C: Green', 'D: Yellow'] },
    { id: '3', text: 'Preferred weekend activity?', options: ['A: Movies', 'B: Hiking', 'C: Reading', 'D: Gaming'] },
    { id: '4', text: 'Favorite food?', options: ['A: Pizza', 'B: Sushi', 'C: Burgers', 'D: Pasta'] },
    { id: '5', text: 'Ideal vacation?', options: ['A: Beach', 'B: Mountains', 'C: City', 'D: Countryside'] },
    { id: '6', text: 'Music taste?', options: ['A: Pop', 'B: Rock', 'C: Hip-Hop', 'D: Classical'] },
    { id: '7', text: 'Pet preference?', options: ['A: Dog', 'B: Cat', 'C: Bird', 'D: None'] },
    { id: '8', text: 'Work style?', options: ['A: Team', 'B: Solo'] },
    { id: '9', text: 'Coffee or tea?', options: ['A: Coffee', 'B: Tea'] },
  ];

  useEffect(() => {
    const checkTestStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { 'x-auth-token': token },
        });
        const currentUser = res.data.find(u => u._id === JSON.parse(atob(token.split('.')[1])).user.id);
        if (currentUser.answers && Object.keys(currentUser.answers).length > 0) {
          setHasTakenTest(true);
          setMessage('You have already taken the test.');
        }
      } catch (err) {
        setError('Failed to check test status');
      }
    };
    checkTestStatus();
  }, []);

  const handleAnswer = (id, option) => {
    setAnswers({ ...answers, [id]: option.charAt(0) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length !== 10) {
      setError('Please answer all 10 questions');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/test', { answers }, {
        headers: { 'x-auth-token': token },
      });
      setMessage(res.data.msg);
      setHasTakenTest(true);
    } catch (err) {
      setError(err.response?.data.msg || 'Failed to submit test');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Compatibility Test</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
      {hasTakenTest ? (
        <p className="text-gray-700 text-center">Your test is complete. Return to the dashboard to continue.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map(q => (
            <div key={q.id} className="bg-white p-4 rounded shadow">
              <p className="text-lg font-semibold mb-2">{q.text}</p>
              <div className="flex flex-wrap gap-4">
                {q.options.map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      onChange={() => handleAnswer(q.id, option)}
                      className="h-4 w-4 text-blue-500"
                      required
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Submit Test
          </button>
        </form>
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

export default Test;
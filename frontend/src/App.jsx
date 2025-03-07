import {Routes, Route} from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Test from './components/Test';
import Requests from './components/Requests';
import SentRequests from './components/SentRequests'; 

function App(){
  return (
  <div className="min-h-screen bg-gray-50">
    <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/test" element={<Test />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/sent-requests" element={<SentRequests />} />
    </Routes>
  </div>
);
}

export default App;

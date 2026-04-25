import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import image from '../assets/project_nameAndLogo.png';
const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);

  const startInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/interview/start`, {
        targetRole: role,
        targetCompany: company,
        jobDescription: jd
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { interviewId, message } = res.data;
      navigate(`/interview/${interviewId}`, { state: { initialMessage: message }});
    } catch (err) {
      console.error(err);
      alert(`Failed to start interview check ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        {/* <h1 className="gradient-text">Dashboard</h1> */}
        <img src={image} alt="Logo" style={{ width: '36%', height: '55%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Hello, {user?.name}</span>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </header>

      <div className="glass-panel animate-fade-in">
        <h2 style={{ marginBottom: '1.5rem' }}>Start New Interview</h2>
        <form onSubmit={startInterview}>
          <div className="input-group">
            <label>Target Role (e.g. Frontend Developer)</label>
            <input type="text" className="input-field" value={role} onChange={e => setRole(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Target Company (e.g. Google) - Optional</label>
            <input type="text" className="input-field" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Job Description - Optional</label>
            <textarea 
              className="input-field" 
              rows="5"
              value={jd} 
              onChange={e => setJd(e.target.value)} 
              placeholder="Paste the job description here..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <button type="submit" className="btn mt-2" disabled={loading}>
            {loading ? 'Preparing...' : 'Start Interview'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;

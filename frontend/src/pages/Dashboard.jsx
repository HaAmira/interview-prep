import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');
  const [interviewType, setInterviewType] = useState('role');
  const [techStack, setTechStack] = useState('');
  const [loading, setLoading] = useState(false);

  const startInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/interview/start`, {
        interviewType,
        techStack: interviewType === 'tech-stack' ? techStack : undefined,
        targetRole: interviewType === 'role' ? role : undefined,
        targetCompany: interviewType === 'role' ? company : undefined,
        jobDescription: interviewType === 'role' ? jd : undefined
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

      <div className="glass-panel animate-fade-in">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Start New Interview</h2>
        
        <div className="tab-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            className={`btn ${interviewType === 'role' ? '' : 'btn-secondary'}`} 
            onClick={() => setInterviewType('role')}
            style={{ flex: 1 }}
          >
            Role Based
          </button>
          <button 
            type="button"
            className={`btn ${interviewType === 'tech-stack' ? '' : 'btn-secondary'}`} 
            onClick={() => setInterviewType('tech-stack')}
            style={{ flex: 1 }}
          >
            Tech Stack Based
          </button>
        </div>

        <form onSubmit={startInterview}>
          {interviewType === 'role' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="input-group">
                <label>Tech Stack (e.g. ReactJS, Node.js, Python, AWS)</label>
                <input type="text" className="input-field" value={techStack} onChange={e => setTechStack(e.target.value)} required placeholder="Enter the specific technologies..." />
              </div>
            </>
          )}

          <button type="submit" className="btn mt-2" disabled={loading}>
            {loading ? 'Preparing...' : 'Start Interview'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;

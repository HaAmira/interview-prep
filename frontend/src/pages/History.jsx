import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const History = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/interview/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterviews(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading History...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h1 className="gradient-text" style={{ marginBottom: '2rem' }}>Interview History</h1>

      <div className="glass-panel animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        {interviews.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No past interviews found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Date & Time</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Topic/Role</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Score</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(interview => (
                  <tr key={interview._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(interview.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{interview.interviewType === 'tech-stack' ? 'Tech Stack' : 'Role Base'}</td>
                    <td style={{ padding: '1rem' }}>{interview.interviewType === 'tech-stack' ? interview.techStack : interview.targetRole}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        background: interview.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: interview.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {interview.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: interview.score >= 70 ? 'var(--success)' : (interview.score ? 'var(--danger)' : 'var(--text-muted)') }}>
                      {interview.score !== undefined && interview.score !== null ? `${interview.score}/100` : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        className="btn" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => navigate(`/feedback/${interview._id}`)}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

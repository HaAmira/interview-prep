import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const Feedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/interview/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterview(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Feedback...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="gradient-text">Interview Performance Review</h1>
        <button className="btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </header>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3>Role: <span style={{ color: 'var(--text-muted)' }}>{interview.targetRole}</span></h3>
            {interview.targetCompany && <h4>Company: <span style={{ color: 'var(--text-muted)' }}>{interview.targetCompany}</span></h4>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '2.5rem', color: interview.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>
              {interview.score}/100
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Overall Score</div>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Detailed Feedback:</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '8px' }}>
            {interview.feedback || "Feedback processing..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

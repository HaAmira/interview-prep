import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Volume2 } from 'lucide-react';
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

  const playMessage = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Feedback...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <header className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="gradient-text">Interview Performance Review</h1>
        <button className="btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </header>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div className="feedback-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            {interview.interviewType === 'tech-stack' ? (
              <h3>Tech Stack: <span style={{ color: 'var(--text-muted)' }}>{interview.techStack}</span></h3>
            ) : (
              <>
                <h3>Role: <span style={{ color: 'var(--text-muted)' }}>{interview.targetRole}</span></h3>
                {interview.targetCompany && <h4>Company: <span style={{ color: 'var(--text-muted)' }}>{interview.targetCompany}</span></h4>}
              </>
            )}
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

      <div className="glass-panel animate-fade-in">
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Conversation Log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {interview.messages && interview.messages.filter(m => m.role !== 'system').map((m, idx) => (
            <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {m.role === 'user' ? 'You' : 'Interviewer'}
                </div>
                {m.role === 'ai' && (
                  <button 
                    onClick={() => playMessage(m.content)}
                    className="btn btn-secondary"
                    style={{ padding: '4px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                    title="Play Message"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <div style={{
                background: m.role === 'user' ? 'var(--primary)' : 'rgba(30, 41, 59, 1)',
                padding: '12px 18px',
                borderRadius: '16px',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: m.role === 'ai' ? '4px' : '16px',
                lineHeight: '1.5',
                border: m.role === 'ai' ? '1px solid var(--border-color)' : 'none'
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {(!interview.messages || interview.messages.length === 0) && (
            <div style={{ color: 'var(--text-muted)' }}>No conversation data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;

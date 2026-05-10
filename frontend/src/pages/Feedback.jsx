import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, CircleHelp, Volume2, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const getVerdictTone = (verdict = '') => {
  const normalized = verdict.toLowerCase();

  if (normalized.includes('not')) {
    return {
      label: 'Not correct',
      color: 'var(--danger)',
      background: 'rgba(239, 68, 68, 0.14)',
      icon: XCircle
    };
  }

  if (normalized.includes('partial')) {
    return {
      label: 'Partially correct',
      color: 'var(--warning, #f59e0b)',
      background: 'rgba(245, 158, 11, 0.14)',
      icon: AlertTriangle
    };
  }

  if (normalized.includes('correct')) {
    return {
      label: 'Correct',
      color: 'var(--success)',
      background: 'rgba(16, 185, 129, 0.14)',
      icon: CheckCircle2
    };
  }

  return {
    label: verdict || 'Not assessed',
    color: 'var(--text-muted)',
    background: 'rgba(148, 163, 184, 0.14)',
    icon: CircleHelp
  };
};

const parseLegacyFeedback = (feedback = '') => {
  const lines = feedback.split('\n').map(line => line.trim()).filter(Boolean);
  const readListAfter = (title) => {
    const start = lines.findIndex(line => line.toLowerCase().startsWith(title.toLowerCase()));
    if (start === -1) return [];

    const result = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^[A-Za-z ]+:$/.test(lines[i]) || /^\d+\.\s+Question:/i.test(lines[i]) || /^Score:/i.test(lines[i])) break;
      result.push(lines[i].replace(/^-\s*/, ''));
    }
    return result;
  };

  const questionReviews = [];
  let current = null;

  lines.forEach(line => {
    const questionMatch = line.match(/^\d+\.\s+Question:\s*(.*)$/i);
    if (questionMatch) {
      if (current) questionReviews.push(current);
      current = { question: questionMatch[1] };
      return;
    }

    if (!current) return;

    if (/^Candidate answer:/i.test(line)) current.candidateAnswer = line.replace(/^Candidate answer:\s*/i, '');
    if (/^Verdict:/i.test(line)) current.verdict = line.replace(/^Verdict:\s*/i, '');
    if (/^Correct answer:/i.test(line)) current.correctAnswer = line.replace(/^Correct answer:\s*/i, '');
    if (/^How to answer the interviewer:/i.test(line)) current.interviewerAnswerTip = line.replace(/^How to answer the interviewer:\s*/i, '');
  });

  if (current) questionReviews.push(current);

  return {
    strengths: readListAfter('Strengths:'),
    weakTopics: readListAfter('Weak Topics:'),
    suggestions: readListAfter('Suggestions for Improvement:'),
    questionReviews
  };
};

const normalizeReport = (interview) => {
  const structuredReport = interview.feedbackReport;
  const hasStructuredData = structuredReport && (
    structuredReport.strengths?.length ||
    structuredReport.weakTopics?.length ||
    structuredReport.suggestions?.length ||
    structuredReport.questionReviews?.length
  );
  const report = hasStructuredData ? structuredReport : parseLegacyFeedback(interview.feedback);

  return {
    strengths: Array.isArray(report.strengths) ? report.strengths : [],
    weakTopics: Array.isArray(report.weakTopics) ? report.weakTopics : [],
    suggestions: Array.isArray(report.suggestions) ? report.suggestions : [],
    questionReviews: Array.isArray(report.questionReviews) ? report.questionReviews : [],
  };
};

const hasReportData = (interview) => {
  const report = normalizeReport(interview);
  return Boolean(
    report.strengths.length ||
    report.weakTopics.length ||
    report.suggestions.length ||
    report.questionReviews.length
  );
};

const Section = ({ title, children }) => (
  <section className="glass-panel animate-fade-in" style={{ marginBottom: '1.25rem' }}>
    <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{title}</h3>
    {children}
  </section>
);

const EmptyText = ({ children }) => (
  <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{children}</div>
);

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

        if (res.data.status === 'completed' && !hasReportData(res.data)) {
          const regenerated = await axios.post(
            `${API_URL}/api/interview/${id}/end`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setInterview({ ...res.data, ...regenerated.data, status: 'completed' });
          return;
        }

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
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Feedback...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error: {error}</div>;

  const report = normalizeReport(interview);
  const questionReviews = report.questionReviews;

  return (
    <div style={{ padding: '2rem', maxWidth: '1050px', margin: '0 auto', width: '100%' }}>
      <header className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">Interview Performance Review</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {interview.interviewType === 'tech-stack'
              ? `Tech Stack: ${interview.techStack || 'N/A'}`
              : `Role: ${interview.targetRole || 'N/A'}${interview.targetCompany ? ` at ${interview.targetCompany}` : ''}`}
          </div>
        </div>
        <button className="btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </header>

      <section className="glass-panel animate-fade-in" style={{ marginBottom: '1.25rem' }}>
        <div className="feedback-header-info" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Overall Result</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Review your strong areas, weak topics, per-question performance, correct answers, and a practical way to improve.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: interview.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>
              {interview.score ?? 0}/100
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Overall Score</div>
          </div>
        </div>
      </section>

      <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem' }}>
        <Section title="Strong Areas">
          {report.strengths.length ? (
            <ul className="report-list">
              {report.strengths.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : (
            <EmptyText>No clear strengths were captured yet.</EmptyText>
          )}
        </Section>

        <Section title="Weak Topics">
          {report.weakTopics.length ? (
            <ul className="report-list">
              {report.weakTopics.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : (
            <EmptyText>No major weak topic was detected.</EmptyText>
          )}
        </Section>
      </div>

      <Section title="How To Improve">
        {report.suggestions.length ? (
          <ul className="report-list">
            {report.suggestions.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : (
          <EmptyText>Practice answering with a direct point, short reasoning, and one concrete example.</EmptyText>
        )}
      </Section>

      <Section title="Question Performance">
        {questionReviews.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questionReviews.map((item, index) => {
              const tone = getVerdictTone(item.verdict);
              const VerdictIcon = tone.icon;

              return (
                <article
                  key={`${item.question}-${index}`}
                  className="report-question-card"
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    background: 'rgba(15, 23, 42, 0.32)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>Question {index + 1}</div>
                      <h4 style={{ color: 'var(--text-main)', lineHeight: 1.35 }}>{item.question || 'Question not captured'}</h4>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap',
                        color: tone.color,
                        background: tone.background,
                        borderRadius: '999px',
                        padding: '0.4rem 0.7rem',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <VerdictIcon size={16} />
                      {tone.label}
                    </div>
                  </div>

                  <div className="question-detail-grid">
                    <div>
                      <div className="report-label">Your Answer</div>
                      <p className="report-text">{item.candidateAnswer || 'No answer captured.'}</p>
                    </div>
                    <div>
                      <div className="report-label">Why This Result</div>
                      <p className="report-text">{item.whyIncorrect || item.verdict || 'The answer was assessed from your response quality.'}</p>
                    </div>
                    <div>
                      <div className="report-label">Correct Answer</div>
                      <p className="report-text">{item.correctAnswer || 'No correct answer was generated.'}</p>
                    </div>
                    <div>
                      <div className="report-label">How To Tell Interviewer</div>
                      <p className="report-text">{item.interviewerAnswerTip || 'Start with the answer, explain the reasoning, and add one example.'}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyText>No question-level report is available for this interview.</EmptyText>
        )}
      </Section>

      <Section title="Conversation Log">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {interview.messages && interview.messages.filter(m => m.role !== 'system').map((m, idx) => (
            <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
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
              <div
                style={{
                  background: m.role === 'user' ? 'var(--primary)' : 'rgba(30, 41, 59, 1)',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  lineHeight: 1.5,
                  border: m.role === 'ai' ? '1px solid var(--border-color)' : 'none'
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {(!interview.messages || interview.messages.length === 0) && (
            <EmptyText>No conversation data available.</EmptyText>
          )}
        </div>
      </Section>
    </div>
  );
};

export default Feedback;

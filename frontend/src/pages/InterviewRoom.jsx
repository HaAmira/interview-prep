import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Mic, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const InterviewRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const shouldListenRef = useRef(false);
  const animationRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isEndingRef = useRef(false);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsListening(false);
    setAudioLevel(0);
  }, []);

  const speakText = useCallback((text) => {
    if (isEndingRef.current || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (location.state?.initialMessage) {
      setMessages([{ role: 'ai', content: location.state.initialMessage }]);
      speakText(location.state.initialMessage);
    }
  }, [location.state, speakText]);

  useEffect(() => {
    isEndingRef.current = isEnding;
  }, [isEnding]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const detectAudioLevel = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      if (!shouldListenRef.current) {
        audioContext.close();
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      setAudioLevel(average);
      animationRef.current = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const handleListen = async () => {
    if (loading || isEnding) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Speech Recognition not supported.');
        return;
      }

      if (isListening) {
        stopListening();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      detectAudioLevel(stream);

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      finalTranscriptRef.current = '';
      shouldListenRef.current = true;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscriptRef.current += `${transcript} `;
          } else {
            interimTranscript += transcript;
          }
        }

        setInput(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
      };

      recognition.onend = () => {
        if (!shouldListenRef.current || isEndingRef.current) return;

        try {
          recognitionRef.current?.start();
        } catch (err) {
          console.error('Auto-restart failed', err);
        }
      };

      recognition.start();
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim() || loading || isEnding) return;

    const userMessage = input.trim();
    setInput('');
    finalTranscriptRef.current = '';

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/interview/${id}/reply`,
        { content: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiReply = res.data.message;
      setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
      speakText(aiReply);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    if (loading || isEnding) return;

    if (!window.confirm('End interview and generate feedback?')) return;

    setIsEnding(true);
    isEndingRef.current = true;
    stopListening();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/interview/${id}/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/feedback/${id}`);
    } catch (err) {
      console.error(err);
      setIsEnding(false);
      isEndingRef.current = false;
      alert('Failed to end interview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}
      >
        <h2 className="gradient-text">Live Interview Room</h2>

        <button
          className="btn btn-secondary"
          onClick={endInterview}
          disabled={loading || isEnding}
        >
          {isEnding ? 'Ending...' : 'End Interview'}
        </button>
      </header>

      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem'
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <strong>{m.role === 'user' ? 'You' : 'Interviewer'}</strong>
            <div>{m.content}</div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={handleListen}
            disabled={loading || isEnding}
            className={`btn ${isListening ? '' : 'btn-secondary'}`}
            style={{
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              background: isListening ? 'var(--danger)' : ''
            }}
          >
            <Mic size={20} />
          </button>

          {isListening && (
            <div
              style={{
                width: '50px',
                height: '5px',
                background: 'gray',
                marginTop: '6px'
              }}
            >
              <div
                style={{
                  width: `${Math.min(audioLevel * 2, 100)}%`,
                  height: '100%',
                  background: 'lime'
                }}
              />
            </div>
          )}
        </div>

        <input
          className="input-field"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or type..."
          disabled={loading || isEnding}
        />

        <button
          type="submit"
          className="btn"
          disabled={loading || isEnding || !input.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default InterviewRoom;

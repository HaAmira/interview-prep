// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { Mic, Send, SquareDashedBottomCode } from 'lucide-react';
// import axios from 'axios';

// const InterviewRoom = () => {
//   const { id } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const messagesEndRef = useRef(null);

//   const [audioLevel, setAudioLevel] = useState(0);
//   const [isSpeaking, setIsSpeaking] = useState(false);

//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);
//   const dataArrayRef = useRef(null);
//   const animationRef = useRef(null);

// const recognitionRef = useRef(null);
// const streamRef = useRef(null);

// const finalTranscriptRef = useRef('');

//   useEffect(() => {
//     if (location.state?.initialMessage) {
//       setMessages([{ role: 'ai', content: location.state.initialMessage }]);
//       speakText(location.state.initialMessage);
//     }
//   }, [location.state]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   useEffect(() => {

//   return () => {

//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//     }

//     if (animationRef.current) {
//       cancelAnimationFrame(animationRef.current);
//     }

//   };

// }, []);

//   const speakText = (text) => {
//     if ('speechSynthesis' in window) {
//       window.speechSynthesis.cancel();
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate = 1.0;
//       utterance.pitch = 1.0;
//       window.speechSynthesis.speak(utterance);
//     }
//   };

//   // const handleListen = () => {
//   //   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//   //   if (!SpeechRecognition) {
//   //     alert("Your browser does not support Speech Recognition. Please use text input or Chrome/Edge.");
//   //     return;
//   //   }

//   //   const recognition = new SpeechRecognition();
//   //   recognition.continuous = false;
//   //   recognition.interimResults = false;
//   //   recognition.lang = 'en-US';

//   //   recognition.onstart = () => setIsListening(true);
//   //   recognition.onresult = (e) => {
//   //     const transcript = e.results[0][0].transcript;
//   //     setInput(transcript);
//   //     setIsListening(false);
//   //   };
//   //   recognition.onerror = () => setIsListening(false);
//   //   recognition.onend = () => setIsListening(false);

//   //   if (isListening) {
//   //     recognition.stop();
//   //     setIsListening(false);
//   //   } else {
//   //     recognition.start();
//   //   }
//   // };

//   // const handleListen = async () => {
//   //   try {
//   //     const SpeechRecognition =
//   //       window.SpeechRecognition || window.webkitSpeechRecognition;

//   //     if (!SpeechRecognition) {
//   //       alert("Speech Recognition not supported.");
//   //       return;
//   //     }

//   //     if (isListening && recognitionRef.current) {

//   //     recognitionRef.current.stop();

//   //     if (animationRef.current) {
//   //       cancelAnimationFrame(animationRef.current);
//   //     }

//   //     setIsListening(false);
//   //     setIsSpeaking(false);

//   //     return;
//   //   }

//   //     const stream = await navigator.mediaDevices.getUserMedia({
//   //       audio: true
//   //     });

//   //     streamRef.current = stream;

//   //     detectAudioLevel(stream);

//   //     const recognition = new SpeechRecognition();

//   //     recognitionRef.current = recognition;

//   //     recognition.continuous = false;
//   //     recognition.interimResults = false;
//   //     recognition.lang = "en-US";

//   //     recognition.onstart = () => setIsListening(true);

//   //     // recognition.onresult = (e) => {
//   //     //   const transcript = e.results[0][0].transcript;
//   //     //   setInput(transcript);
//   //     //   setIsListening(false);
//   //     // };

//   //     // recognition.onerror = () => setIsListening(false);

//   //     // recognition.onend = () => {
//   //     //   setIsListening(false);
//   //     //   cancelAnimationFrame(animationRef.current);
//   //     //   setIsSpeaking(false);
//   //     // };

//   //     // recognition.start();

//   //     recognition.onresult = (e) => {

//   //     let transcript = '';

//   //     for (let i = e.resultIndex; i < e.results.length; i++) {

//   //       transcript += e.results[i][0].transcript;

//   //     }

//   //     setInput(transcript);

//   //   };

//   //   recognition.onerror = (event) => {
//   //     console.error("Speech error:", event.error);
//   //   };

//   //   // 🔥 AUTO RESTART (Fix 10s timeout)

//   //   recognition.onend = () => {

//   //     if (isListening) {

//   //       recognition.start();

//   //     }

//   //   };

//   //   recognition.start();

//   //   } catch (error) {
//   //     console.error(error);
//   //   }
//   // };

//   const handleListen = async () => {

//   try {

//     const SpeechRecognition =
//       window.SpeechRecognition ||
//       window.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech Recognition not supported.");
//       return;
//     }

//     // Toggle OFF
//     if (isListening && recognitionRef.current) {

//       recognitionRef.current.stop();

//       cancelAnimationFrame(animationRef.current);

//       setIsListening(false);
//       setIsSpeaking(false);

//       return;
//     }

//     const stream =
//       await navigator.mediaDevices.getUserMedia({
//         audio: true
//       });

//     streamRef.current = stream;

//     detectAudioLevel(stream);

//     const recognition =
//       new SpeechRecognition();

//     recognitionRef.current = recognition;

//     recognition.continuous = true;
//     recognition.interimResults = true;
//     recognition.lang = 'en-US';

//     finalTranscriptRef.current = '';

//     recognition.onstart = () => {

//       setIsListening(true);

//     };

//     recognition.onresult = (event) => {

//       let interimTranscript = '';

//       for (
//         let i = event.resultIndex;
//         i < event.results.length;
//         i++
//       ) {

//         const transcript =
//           event.results[i][0].transcript;

//         if (event.results[i].isFinal) {

//           finalTranscriptRef.current +=
//             transcript + ' ';

//         } else {

//           interimTranscript += transcript;

//         }

//       }

//       // Combine final + interim
//       setInput(
//         finalTranscriptRef.current +
//         interimTranscript
//       );

//     };

//     recognition.onerror = (event) => {

//       console.error(
//         "Speech recognition error:",
//         event.error
//       );

//     };

//     // Auto restart when stopped

//     recognition.onend = () => {

//       if (isListening) {

//         recognition.start();

//       }

//     };

//     recognition.start();

//   } catch (error) {

//     console.error(error);

//   }

// };

//   const sendMessage = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userMessage = input;
//     setInput('');
//     setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
//     setLoading(true);

//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.post(`http://localhost:5000/api/interview/${id}/reply`, { content: userMessage }, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       const aiReply = res.data.message;
//       setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
//       speakText(aiReply);
//     } catch (err) {
//       console.error(err);
//       alert('Failed to send message');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const endInterview = async () => {
//     if (!window.confirm("Are you sure you want to end the interview and generate feedback?")) return;
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       await axios.post(`http://localhost:5000/api/interview/${id}/end`, {}, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       navigate(`/feedback/${id}`);
//     } catch (err) {
//       console.error(err);
//       alert('Failed to end interview');
//     } finally {
//       setLoading(false);
//     }
//   };


//   const detectAudioLevel = (stream) => {
//     audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

//     const source = audioContextRef.current.createMediaStreamSource(stream);

//     analyserRef.current = audioContextRef.current.createAnalyser();
//     analyserRef.current.fftSize = 256;

//     source.connect(analyserRef.current);

//     const bufferLength = analyserRef.current.frequencyBinCount;
//     dataArrayRef.current = new Uint8Array(bufferLength);

//     const checkVolume = () => {
//       analyserRef.current.getByteFrequencyData(dataArrayRef.current);

//       let sum = 0;
//       for (let i = 0; i < bufferLength; i++) {
//         sum += dataArrayRef.current[i];
//       }

//       const average = sum / bufferLength;
//       setAudioLevel(average);

//       // speaking detection threshold
//       if (average > 20) {
//         setIsSpeaking(true);
//       } else {
//         setIsSpeaking(false);
//       }

//       animationRef.current = requestAnimationFrame(checkVolume);
//     };

//     checkVolume();
//   };

//   useEffect(() => {

//   return () => {

//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//     }

//     if (animationRef.current) {
//       cancelAnimationFrame(animationRef.current);
//     }

//   };

// }, []);

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
//       <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
//         <h2 className="gradient-text">Live Interview Room</h2>
//         <button className="btn btn-secondary" onClick={endInterview} disabled={loading} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
//           End Interview
//         </button>
//       </header>

//       <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
//         <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
//           {messages.map((m, idx) => (
//             <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
//               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: m.role === 'user' ? 'right' : 'left' }}>
//                 {m.role === 'user' ? 'You' : 'Interviewer'}
//               </div>
//               <div style={{
//                 background: m.role === 'user' ? 'var(--primary)' : 'rgba(30, 41, 59, 1)',
//                 padding: '12px 18px',
//                 borderRadius: '16px',
//                 borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
//                 borderBottomLeftRadius: m.role === 'ai' ? '4px' : '16px',
//                 lineHeight: '1.5',
//                 border: m.role === 'ai' ? '1px solid var(--border-color)' : 'none'
//               }}>
//                 {m.content}
//               </div>
//             </div>
//           ))}
//           {loading && (
//             <div style={{ alignSelf: 'flex-start' }}>
//               <div style={{ background: 'rgba(30, 41, 59, 1)', padding: '12px 18px', borderRadius: '16px', color: 'var(--text-muted)' }}>
//                 Interviewer is typing...
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
//           <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
//             {/* <button 
//               type="button" 
//               onClick={handleListen}
//               className={`btn ${isListening ? '' : 'btn-secondary'}`}
//               style={{ padding: '12px', borderRadius: '50%', width: '48px', height: '48px', flexShrink: 0, background: isListening ? 'var(--danger)' : '' }}
//               title="Click to speak"
//             >
//               <Mic size={20} />
//             </button> */}

//             <div style={{ position: 'relative' }}>

//               <button
//                 type="button"
//                 onClick={handleListen}
//                 className={`btn ${isListening ? '' : 'btn-secondary'}`}
//                 style={{
//                   padding: '12px',
//                   borderRadius: '50%',
//                   width: '48px',
//                   height: '48px',
//                   flexShrink: 0,
//                   background: isListening ? 'var(--danger)' : ''
//                 }}
//               >
//                 <Mic size={20} />
//               </button>

//               {/* 🔊 Speaking Indicator */}
//               {isSpeaking && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     top: '-5px',
//                     right: '-5px',
//                     width: '12px',
//                     height: '12px',
//                     background: 'lime',
//                     borderRadius: '50%',
//                     animation: 'pulse 1s infinite'
//                   }}
//                 />
//               )}
//               {isListening && (
//                 <div
//                   style={{
//                     width: '50px',
//                     height: '5px',
//                     background: 'gray',
//                     borderRadius: '4px',
//                     marginTop: '6px',
//                     overflow: 'hidden'
//                   }}
//                 >
//                   <div
//                     style={{
//                       width: `${Math.min(audioLevel * 2, 100)}%`,
//                       height: '100%',
//                       background: 'lime',
//                       transition: 'width 0.1s'
//                     }}
//                   />
//                 </div>
//               )}

//             </div>
//             <input
//               className="input-field"
//               style={{ flex: 1, marginBottom: 0 }}
//               value={input}
//               onChange={e => setInput(e.target.value)}
//               placeholder="Type your answer or use the microphone..."
//               disabled={loading || isListening}
//             />
//             <button type="submit" className="btn" disabled={loading || !input.trim() || isListening}>
//               <Send size={20} />
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InterviewRoom;


import React, { useState, useEffect, useRef } from 'react';
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

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const messagesEndRef = useRef(null);

  const recognitionRef = useRef(null);
  const animationRef = useRef(null);
  const finalTranscriptRef = useRef('');

  /* ===============================
     Initial AI Message
  =============================== */

  useEffect(() => {
    if (location.state?.initialMessage) {
      setMessages([
        { role: 'ai', content: location.state.initialMessage }
      ]);

      speakText(location.state.initialMessage);
    }
  }, [location.state]);

  /* ===============================
     Auto Scroll
  =============================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  /* ===============================
     Text To Speech
  =============================== */

  const speakText = (text) => {

    if ('speechSynthesis' in window) {

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);

    }

  };

  /* ===============================
     Audio Level Detection
  =============================== */

  const detectAudioLevel = (stream) => {

    const audioContext =
      new (window.AudioContext ||
        window.webkitAudioContext)();

    const analyser =
      audioContext.createAnalyser();

    const source =
      audioContext.createMediaStreamSource(stream);

    source.connect(analyser);

    analyser.fftSize = 256;

    const bufferLength =
      analyser.frequencyBinCount;

    const dataArray =
      new Uint8Array(bufferLength);

    const checkVolume = () => {

      analyser.getByteFrequencyData(
        dataArray
      );

      let sum = 0;

      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }

      const average =
        sum / bufferLength;

      setAudioLevel(average);

      if (average > 20) {
        setIsSpeaking(true);
      } else {
        setIsSpeaking(false);
      }

      animationRef.current =
        requestAnimationFrame(checkVolume);

    };

    checkVolume();

  };

  /* ===============================
     Handle Mic Listening
  =============================== */

  // const handleListen = async () => {

  //   try {

  //     const SpeechRecognition =
  //       window.SpeechRecognition ||
  //       window.webkitSpeechRecognition;

  //     if (!SpeechRecognition) {

  //       alert(
  //         "Speech Recognition not supported in this browser."
  //       );

  //       return;

  //     }

  //     // Toggle OFF
  //     if (isListening) {

  //       recognitionRef.current.stop();

  //       cancelAnimationFrame(
  //         animationRef.current
  //       );

  //       setIsListening(false);
  //       setIsSpeaking(false);

  //       return;

  //     }

  //     const stream =
  //       await navigator.mediaDevices.getUserMedia({
  //         audio: true
  //       });

  //     detectAudioLevel(stream);

  //     const recognition =
  //       new SpeechRecognition();

  //     recognitionRef.current =
  //       recognition;

  //     recognition.continuous = true;
  //     recognition.interimResults = true;
  //     recognition.lang = 'en-US';

  //     finalTranscriptRef.current = '';

  //     recognition.onstart = () => {

  //       setIsListening(true);

  //     };

  //     recognition.onresult = (event) => {

  //       let interimTranscript = '';

  //       for (
  //         let i = event.resultIndex;
  //         i < event.results.length;
  //         i++
  //       ) {

  //         const transcript =
  //           event.results[i][0].transcript;

  //         if (event.results[i].isFinal) {

  //           finalTranscriptRef.current +=
  //             transcript + ' ';

  //         } else {

  //           interimTranscript += transcript;

  //         }

  //       }

  //       setInput(
  //         finalTranscriptRef.current +
  //         interimTranscript
  //       );

  //     };

  //     recognition.onerror = (event) => {

  //       console.error(
  //         "Speech error:",
  //         event.error
  //       );

  //     };

  //     // Restart automatically
  //     recognition.onend = () => {

  //       if (isListening) {

  //         try {

  //           recognition.start();

  //         } catch (err) {

  //           console.log(err);

  //         }

  //       }

  //     };

  //     recognition.start();

  //   } catch (error) {

  //     console.error(error);

  //   }

  // };

  // const recognitionRef = useRef(null);
const restartIntervalRef = useRef(null);

// const finalTranscriptRef = useRef('');

const handleListen = async () => {

  try {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported.");
      return;
    }

    /* ========= TOGGLE OFF ========= */

    if (isListening) {

      if (recognitionRef.current) {
        // Prevent auto-restart before stopping
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }

      cancelAnimationFrame(animationRef.current);

      setIsListening(false);
      setIsSpeaking(false);

      return;
    }

    /* ========= GET MIC ========= */

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    detectAudioLevel(stream);

    /* ========= CREATE RECOGNITION ========= */

    const recognition =
      new SpeechRecognition();

    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    finalTranscriptRef.current = '';

    recognition.onstart = () => {

      console.log("Recognition started");

      setIsListening(true);

    };

    recognition.onresult = (event) => {

      let interimTranscript = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {

          finalTranscriptRef.current +=
            transcript + ' ';

        } else {

          interimTranscript += transcript;

        }

      }

      setInput(
        finalTranscriptRef.current +
        interimTranscript
      );

    };

    recognition.onerror = (event) => {

      console.error(
        "Speech error:",
        event.error
      );

    };

    recognition.onend = () => {
      // Auto-restart recognition if it was not explicitly toggled off
      if (isListening) {
        console.log("Auto-restarting recognition...");
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Auto-restart failed", err);
        }
      }
    };

    recognition.start();

  } catch (error) {

    console.error(error);

  }

};

  /* ===============================
     Send Message
  =============================== */

  const sendMessage = async (e) => {

    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = input;

    setInput('');

    finalTranscriptRef.current = '';

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage }
    ]);

    setLoading(true);

    try {

      const token =
        localStorage.getItem('token');

      const res =
        await axios.post(
          `${API_URL}/api/interview/${id}/reply`,
          { content: userMessage },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      const aiReply =
        res.data.message;

      setMessages(prev => [
        ...prev,
        { role: 'ai', content: aiReply }
      ]);

      speakText(aiReply);

    } catch (err) {

      console.error(err);

      alert('Failed to send message');

    } finally {

      setLoading(false);

    }

  };

  /* ===============================
     End Interview
  =============================== */

  const endInterview = async () => {

    if (
      !window.confirm(
        "End interview and generate feedback?"
      )
    ) return;

    setLoading(true);

    try {

      const token =
        localStorage.getItem('token');

      await axios.post(
        `${API_URL}/api/interview/${id}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate(`/feedback/${id}`);

    } catch (err) {

      console.error(err);

      alert('Failed to end interview');

    } finally {

      setLoading(false);

    }

  };

  /* ===============================
     Cleanup
  =============================== */

  useEffect(() => {

    return () => {

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

    };

  }, []);

  useEffect(() => {

  return () => {

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

  };

}, []);

  /* ===============================
     UI
  =============================== */

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

      {/* Header */}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}
      >

        <h2 className="gradient-text">
          Live Interview Room
        </h2>

        <button
          className="btn btn-secondary"
          onClick={endInterview}
        >
          End Interview
        </button>

      </header>

      {/* Chat */}

      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem'
        }}
      >

        {messages.map((m, i) => (

          <div
            key={i}
            style={{
              marginBottom: '1rem'
            }}
          >

            <strong>
              {m.role === 'user'
                ? 'You'
                : 'Interviewer'}
            </strong>

            <div>
              {m.content}
            </div>

          </div>

        ))}

        <div ref={messagesEndRef} />

      </div>

      {/* Input */}

      <form
        onSubmit={sendMessage}
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >

        {/* Mic */}

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
            className={`btn ${
              isListening
                ? ''
                : 'btn-secondary'
            }`}
            style={{
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              background:
                isListening
                  ? 'var(--danger)'
                  : ''
            }}
          >

            <Mic size={20} />

          </button>

          {/* Sound Level Bar */}

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

        {/* Input */}

        <input
          className="input-field"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="Speak or type..."
        />

        <button
          type="submit"
          className="btn"
        >

          <Send size={20} />

        </button>

      </form>

    </div>

  );

};

export default InterviewRoom;
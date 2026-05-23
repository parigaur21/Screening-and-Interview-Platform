import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Star, AlertCircle, Loader2, Award, ArrowRight, RefreshCw } from 'lucide-react';

export default function MockInterview({ candidate, onFinishInterview, API_BASE_URL }) {
  const [interviewId, setInterviewId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [answerInput, setAnswerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time evaluation states
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [answersEvaluations, setAnswersEvaluations] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState('');

  const messagesEndRef = useRef(null);

  // Scroll chat window to the bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Start interview session automatically on load
  useEffect(() => {
    if (candidate) {
      startInterviewSession();
    }
  }, [candidate]);

  const startInterviewSession = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/interviews/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id })
      });

      const result = await response.json();
      
      if (result.success) {
        setInterviewId(result.data.interviewId);
        setCurrentQuestion(result.data.question);
        setQuestionIndex(result.data.currentQuestionIndex);
        
        // Setup initial messages
        setMessages([
          {
            id: `init-${Date.now()}`,
            sender: 'Interviewer',
            content: result.data.question,
            timestamp: new Date()
          }
        ]);
        
        // Fetch any existing progress history (in case candidate resumes interview)
        fetchHistory(candidate.id);
      } else {
        setError(result.message || 'Failed to start interview session.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend API failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (candidateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/interviews/${candidateId}`);
      const result = await response.json();
      
      if (result.success && result.data.messages.length > 0) {
        // Map messages into standard formats
        const mapped = result.data.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          score: msg.score,
          feedback: msg.feedback,
          timestamp: new Date(msg.created_at)
        }));

        setMessages(mapped);

        // Map evaluation itemized logs
        const candAnswers = mapped.filter(m => m.sender === 'Candidate');
        const evals = candAnswers.map((ans, idx) => ({
          question: `Stage #${idx + 1} Question`,
          score: ans.score,
          feedback: ans.feedback
        }));
        
        setAnswersEvaluations(evals);

        // Update score
        if (candAnswers.length > 0) {
          const total = candAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);
          setCumulativeScore(Math.round(total / candAnswers.length));
        }

        // Check if finished
        if (result.data.session.status === 'Completed') {
          setIsCompleted(true);
          setFinalFeedback(result.data.session.overall_feedback);
          setQuestionIndex(result.data.session.current_question_index);
        } else {
          setQuestionIndex(result.data.session.current_question_index);
          const aiMsgs = mapped.filter(m => m.sender === 'Interviewer');
          if (aiMsgs.length > 0) {
            setCurrentQuestion(aiMsgs[aiMsgs.length - 1].content);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching session logs:', err);
    }
  };

  const handleSubmitResponse = async (e) => {
    e?.preventDefault();
    const cleanAnswer = answerInput.trim();
    
    if (!cleanAnswer || isLoading || isCompleted) return;

    setIsLoading(true);
    setError('');
    setAnswerInput('');
    setIsVoiceActive(false);

    // Immediately push candidate response to chat locally for fluid UI
    const candMsgId = `cand-temp-${Date.now()}`;
    const newCandidateMsg = {
      id: candMsgId,
      sender: 'Candidate',
      content: cleanAnswer,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newCandidateMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/interviews/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          answer: cleanAnswer
        })
      });

      const result = await response.json();

      if (result.success) {
        const data = result.data;

        // Append the AI grading details to candidate message
        setMessages(prev => prev.map(m => m.id === candMsgId ? {
          ...m,
          score: data.evaluation.score,
          feedback: data.evaluation.feedback
        } : m));

        // Add to active evaluations dashboard
        const newEval = {
          question: `Stage #${questionIndex + 1} Question`,
          score: data.evaluation.score,
          feedback: data.evaluation.feedback
        };
        
        const updatedEvals = [...answersEvaluations, newEval];
        setAnswersEvaluations(updatedEvals);

        // Update score
        const scoresSum = updatedEvals.reduce((acc, curr) => acc + curr.score, 0);
        const newAvg = Math.round(scoresSum / updatedEvals.length);
        setCumulativeScore(newAvg);

        if (data.isCompleted) {
          // Finished interview sequence!
          setIsCompleted(true);
          setFinalFeedback(data.feedback);
          setQuestionIndex(3);
          
          setMessages(prev => [...prev, {
            id: `ai-finish-${Date.now()}`,
            sender: 'Interviewer',
            content: `Thank you, ${candidate.name}. The interview is now complete. I have calculated your average score and compiled your technical feedback profile. Excellent effort!`,
            timestamp: new Date()
          }]);
        } else {
          // Progress questions
          setQuestionIndex(data.currentQuestionIndex);
          setCurrentQuestion(data.question);
          
          setMessages(prev => [...prev, {
            id: `ai-msg-${Date.now()}`,
            sender: 'Interviewer',
            content: data.question,
            timestamp: new Date()
          }]);
        }
      } else {
        setError(result.message || 'Failed to submit response.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server lost. Unable to post interview answer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulates a premium voice recognition engine typing into the text field
  const toggleVoiceSimulation = () => {
    if (isCompleted || isLoading) return;

    if (isVoiceActive) {
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      setError('');
      
      const templates = [
        `In my experience, deploying applications using Docker containers is fundamental to DevOps stability. We configure standardized multi-stage Dockerfiles that cache dependencies cleanly, reducing our package sizes to under 100MB. For routing inside EC2, we place a reverse proxy like Nginx in front of our services, which maps ports, filters SSL handshakes, and serves static files rapidly to optimize response load times.`,
        `For cloud architecture database management, configuring strict AWS Security Groups is critical for security. We isolate our RDS PostgreSQL instances inside private subnets and set incoming rules to strictly allow port 5432 ingress only from the designated EC2 instance security group ID. This restricts open network traffic and makes database access impossible from public internet endpoints.`,
        `When designing high-performance REST APIs with Node.js and Express, we implement robust database abstraction layers. We establish connection pools with pg to manage concurrent PostgreSQL queries without leakage. Additionally, we isolate routing schemes under specific controller segments, build validation middleware, and configure dynamic environment switching so that it automatically runs on local mock databases during development cycles.`
      ];

      // Auto-populate simulated voice answer after brief delay to show off UI
      setTimeout(() => {
        setAnswerInput(templates[questionIndex % templates.length]);
      }, 1000);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">AI Mock Interview Room</h1>
          <p className="page-subtitle">Candidate: <strong style={{ color: 'var(--color-secondary)' }}>{candidate.name}</strong> • Target: {candidate.job_title}</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={onFinishInterview}
          style={{ fontSize: '0.85rem' }}
        >
          Exit Interview Room
        </button>
      </div>

      {error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.75rem 1rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem'
        }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      <div className="interview-grid">
        {/* Left Side: Conversational Chat Pane */}
        <div className="glass-card chat-panel" style={{ padding: 0 }}>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`chat-bubble ${msg.sender === 'Candidate' ? 'candidate' : 'ai'}`}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem', alignSelf: msg.sender === 'Candidate' ? 'flex-end' : 'flex-start' }}>
                  <span>{msg.sender === 'Candidate' ? candidate.name : 'AI Recruiter'}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="bubble-inner">
                  {msg.content}
                </div>
                
                {/* Real-time individual answer feedback summary block in chat */}
                {msg.sender === 'Candidate' && msg.score && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--color-secondary)', 
                    background: 'rgba(6, 182, 212, 0.05)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    marginTop: '0.35rem',
                    lineHeight: '1.4'
                  }}>
                    <strong>AI Eval Score:</strong> {msg.score}% <br />
                    <strong>Feedback:</strong> {msg.feedback}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble ai">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                  <span>AI Recruiter</span>
                  <span>•</span>
                  <span>Analysing...</span>
                </div>
                <div className="bubble-inner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Evaluating response details and generating next stage...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat text input and voice simulation control bar */}
          <div className="chat-input-area">
            {isVoiceActive && (
              <div className="audio-status-pill" style={{ position: 'absolute', transform: 'translateY(-56px)', zIndex: 100 }}>
                <div className="pulse-indicator" />
                <span>Simulating High-Fidelity Speech Recognition Capture...</span>
              </div>
            )}

            <button 
              type="button"
              className="btn btn-secondary"
              style={{ 
                padding: '0.75rem', 
                borderRadius: '50%',
                color: isVoiceActive ? 'var(--color-secondary)' : 'var(--text-muted)',
                borderColor: isVoiceActive ? 'var(--color-secondary)' : 'var(--border-glass)',
                background: isVoiceActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent'
              }}
              onClick={toggleVoiceSimulation}
              title={isVoiceActive ? 'Mute Speech simulation' : 'Simulate Candidate Speech answering'}
              disabled={isCompleted || isLoading}
            >
              {isVoiceActive ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <form onSubmit={handleSubmitResponse} style={{ flexGrow: 1, display: 'flex', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder={isCompleted ? "Interview completed." : "Type your professional engineering response..."} 
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                disabled={isCompleted || isLoading}
                style={{ borderRadius: '24px' }}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.75rem', borderRadius: '50%' }}
                disabled={isCompleted || isLoading || !answerInput.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Operational Assessment Dashboard */}
        <div className="metrics-panel">
          
          {/* Radial Cumulative Gauge Card */}
          <div className="glass-card metrics-gauge-card">
            <div className="radial-progress" style={{ '--percentage': cumulativeScore }}>
              <div className="radial-progress-value">{cumulativeScore}%</div>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Cumulative Evaluation Score</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              {isCompleted ? 'Final Hiring Grade' : `Stage ${questionIndex} of 3`}
            </p>
          </div>

          {/* Itemized Question Feedbacks Ledger */}
          <div className="glass-card" style={{ flexGrow: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Response Evaluations</h3>
            
            {answersEvaluations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Waiting for response submissions... Answers will be graded in real-time.
              </div>
            ) : (
              <div className="eval-block">
                {answersEvaluations.map((ev, i) => (
                  <div key={i} className="eval-item">
                    <div className="eval-header">
                      <span style={{ color: 'var(--text-primary)' }}>{ev.question}</span>
                      <span style={{ color: ev.score >= 75 ? 'var(--color-success)' : ev.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                        {ev.score}%
                      </span>
                    </div>
                    <div className="eval-feedback-text">
                      {ev.feedback}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Finished State Summary Card */}
            {isCompleted && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: 'rgba(99, 102, 241, 0.1)', 
                border: '1px solid rgba(99, 102, 241, 0.2)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  <Award size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Executive Decision dossier</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {finalFeedback}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
                  <span>Recruiter Status:</span>
                  <span className={`status-tag ${cumulativeScore >= 75 ? 'status-selected' : 'status-rejected'}`} style={{ fontSize: '0.7rem' }}>
                    {cumulativeScore >= 75 ? 'Hired / Selected' : 'File Closed'}
                  </span>
                </div>
                
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '1rem' }}
                  onClick={onFinishInterview}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

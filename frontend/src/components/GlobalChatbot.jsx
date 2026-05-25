import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';

const SUGGESTIONS = [
  'What is ResuScreen?',
  'How does resume screening work?',
  'Where are the mock interview prep videos?',
  'How do I create a custom job?',
  'Can I configure local API keys?'
];

// Keywords database to detect related queries
const RELATED_KEYWORDS = [
  'resu', 'screen', 'resume', 'cv', 'job', 'candidate', 'interview', 'voice',
  'video', 'settings', 'threshold', 'devops', 'sre', 'cloud', 'aws', 'docker',
  'kubernetes', 'k8s', 'terraform', 'ci/cd', 'pipeline', 'api', 'key', 'gemini',
  'openai', 'sqlite', 'database', 'platform', 'system', 'admin', 'login', 'signup',
  'react', 'vite', 'node', 'express', 'fit score', 'hiring', 'recruiter', 'jenkins',
  'security', 'devsecops', 'prometheus', 'alert', 'metrics', 'architecture'
];

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there! I am the ResuScreen Platform Assistant. Ask me anything about the screening tool, DevOps jobs, system settings, or SRE interview rooms!',
      isRelated: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const checkIsRelated = (query) => {
    const lowerQuery = query.toLowerCase();
    return RELATED_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
  };

  const handleSendMessage = (textToSend) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: cleanText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const isRelated = checkIsRelated(cleanText);
      let responseText = '';

      if (isRelated) {
        responseText = getRelatedResponse(cleanText);
      } else {
        responseText = `⚠️ Access Restricted: Unrelated Query Detected.\n\nI am the ResuScreen Platform Assistant. I am strictly authorized to answer questions regarding the ResuScreen screening application, DevOps/SRE job descriptions, candidates, system configurations, and platform engineering topics.\n\nYour query ("${cleanText.substring(0, 40)}${cleanText.length > 40 ? '...' : ''}") falls outside this domain. Please ask a platform-specific question!`;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: responseText,
        isRelated,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 850);
  };

  const getRelatedResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes('what is resuscreen') || q.includes('what is this website') || q.includes('what does this platform do')) {
      return 'ResuScreen is a premium, AI-powered DevOps Screening & Interview Platform. It automates candidate resume screening, performs semantic fit scoring against target roles, holds interactive AI voice-synthesized mock interviews, and supports technical prep tutorials for candidates.';
    }
    
    if (q.includes('resume screening') || q.includes('upload') || q.includes('screen') || q.includes('cv')) {
      return 'You can screen candidate resumes in the "Screen Resume" tab. Simply fill in the candidate name, email, target position, and upload a .txt, .md, .pdf, or .docx file. The backend will validate the file to ensure it is a valid CV and screen it against the job stack requirements in real-time.';
    }

    if (q.includes('prep') || q.includes('video') || q.includes('tutorial') || q.includes('youtube')) {
      return 'We have built a premium "Prep Videos" center in your navigation panel! You can watch real mock interviews for SRE, DevOps, Cloud Architects, DevSecOps, Frontend Architects, and Data Platform Engineers. Each video includes expert key takeaways, interactive shell command checklists, and common Q&A cards!';
    }

    if (q.includes('interview') || q.includes('voice') || q.includes('mock')) {
      return 'To start a mock interview, go to the "Candidates" tab and click "Begin AI Interview Room" on any candidate profile. The room features automated voice synthesis (reads questions aloud), live response grading, and an interactive response telemetry panel.';
    }

    if (q.includes('job') || q.includes('create') || q.includes('position')) {
      return 'You can view active listings on the Dashboard. To publish a new job, click "Create Job Posting" in the sidebar and enter the title, description, and technology stack. The system will seed candidate records automatically to get you started!';
    }

    if (q.includes('setting') || q.includes('api') || q.includes('key') || q.includes('gemini') || q.includes('openai')) {
      return 'In the "System Settings" tab, you can override default AI LLM settings by inputting custom Gemini or OpenAI keys. You can also adjust the auto-fit threshold index, change the interviewer persona tone (e.g. Strict Technical Lead vs. Encouraging Mentor), customize question counts, and toggle text-to-speech voice controls.';
    }

    if (q.includes('devops') || q.includes('sre') || q.includes('kubernetes') || q.includes('docker') || q.includes('terraform')) {
      return 'ResuScreen is built for modern platform engineering roles. The jobs seeded support core technologies like AWS, Docker, Kubernetes, Terraform, Prometheus, Alertmanager, and GitHub Actions CI/CD automation pipelines.';
    }

    if (q.includes('tech stack') || q.includes('database') || q.includes('sqlite') || q.includes('postgresql')) {
      return 'The ResuScreen backend is built with Node.js and Express, using SQLite locally (automatic zero-setup database.sqlite) and supporting PostgreSQL on AWS RDS for production. The frontend is a React application built with Vite and designed using glassmorphic dark CSS patterns.';
    }

    return 'That is a relevant topic! You can explore the corresponding features inside the sidebar tabs:\n\n• "Dashboard" to see core system telemetry.\n• "Screen Resume" to upload and test CV validation.\n• "Prep Videos" to view DevOps interview walkthroughs.\n• "System Settings" to customize AI behavior.';
  };

  return (
    <>
      {/* Self-contained CSS for the Chatbot */}
      <style dangerouslySetInnerHTML={{__html: `
        .chatbot-floating-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: 0 8px 32px rgba(6, 182, 212, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justifyContent: center;
          color: #fff;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .chatbot-floating-btn:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 12px 40px rgba(6, 182, 212, 0.6);
        }
        .chatbot-window {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 380px;
          height: 560px;
          background: rgba(10, 15, 30, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: chatSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes chatSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .chatbot-header {
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15));
          border-bottom: 1px solid var(--border-glass);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chatbot-messages-container {
          flex-grow: 1;
          padding: 1.25rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .chat-msg-bubble {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.8rem;
          line-height: 1.45;
          word-wrap: break-word;
        }
        .chat-msg-bubble.bot {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
        }
        .chat-msg-bubble.bot-unrelated {
          align-self: flex-start;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }
        .chat-msg-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, var(--color-primary), #4f46e5);
          color: #fff;
        }
        .chat-typing-dots {
          display: inline-flex;
          gap: 4px;
        }
        .chat-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: dotBounce 1.4s infinite ease-in-out both;
        }
        .chat-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .chat-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .chatbot-suggestions-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.01);
          border-top: 1px solid var(--border-glass);
        }
        .chatbot-suggestion-tag {
          font-size: 0.7rem;
          padding: 0.35rem 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .chatbot-suggestion-tag:hover {
          background: rgba(6, 182, 212, 0.1);
          color: var(--color-secondary);
          border-color: var(--color-secondary);
        }
        .chatbot-input-form {
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border-glass);
          display: flex;
          gap: 0.5rem;
          background: rgba(8, 12, 20, 0.5);
        }
      `}} />

      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <div className="chatbot-floating-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </div>
      )}

      {/* Glassmorphic Active Chatbot Assistant Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header Panel */}
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-secondary)', boxShadow: '0 0 8px var(--color-secondary)' }} />
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ResuScreen Guard
                <Sparkles size={12} style={{ color: 'var(--color-secondary)' }} />
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Message Thread Panel */}
          <div className="chatbot-messages-container">
            {messages.map(msg => {
              const isBot = msg.sender === 'bot';
              const isUnrelatedAlert = isBot && !msg.isRelated;
              return (
                <div
                  key={msg.id}
                  className={`chat-msg-bubble ${isBot ? (isUnrelatedAlert ? 'bot-unrelated' : 'bot') : 'user'}`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {isUnrelatedAlert && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                      <ShieldAlert size={14} /> SECURITY GATEWAY
                    </div>
                  )}
                  {msg.text}
                </div>
              );
            })}

            {isTyping && (
              <div className="chat-msg-bubble bot" style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                <div className="chat-typing-dots">
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Prompts */}
          <div className="chatbot-suggestions-wrapper">
            {SUGGESTIONS.map((sug, i) => (
              <div
                key={i}
                className="chatbot-suggestion-tag"
                onClick={() => handleSendMessage(sug)}
              >
                {sug}
              </div>
            ))}
          </div>

          {/* Text Input Footer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="chatbot-input-form"
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask about screening, jobs, settings..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ height: '36px', fontSize: '0.75rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', paddingLeft: '1rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}
              disabled={!input.trim()}
            >
              <Send size={14} style={{ margin: '0 auto' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

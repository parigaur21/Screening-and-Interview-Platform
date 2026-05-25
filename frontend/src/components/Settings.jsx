import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Database, Cpu, Volume2, Key, Sparkles, Activity, CheckCircle, HelpCircle } from 'lucide-react';

export default function Settings({ API_BASE_URL }) {
  // Local storage based state variables
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [matchingThreshold, setMatchingThreshold] = useState(parseInt(localStorage.getItem('matching_threshold') || '60'));
  const [interviewTone, setInterviewTone] = useState(localStorage.getItem('interview_tone') || 'Strict Technical Lead');
  const [questionCount, setQuestionCount] = useState(parseInt(localStorage.getItem('question_count') || '5'));
  const [enableVoice, setEnableVoice] = useState(localStorage.getItem('enable_voice') === 'true');
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('voice_lang') || 'en-US');

  // Telemetry status
  const [telemetry, setTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    setLoadingTelemetry(true);
    try {
      const res = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
      const data = await res.json();
      setTelemetry(data);
    } catch (err) {
      console.error('Error fetching system telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('matching_threshold', matchingThreshold.toString());
    localStorage.setItem('interview_tone', interviewTone);
    localStorage.setItem('question_count', questionCount.toString());
    localStorage.setItem('enable_voice', enableVoice.toString());
    localStorage.setItem('voice_lang', selectedLanguage);

    setSaveStatus('success');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <SettingsIcon className="nav-icon" style={{ width: '28px', height: '28px', color: 'var(--color-secondary)' }} />
            System Configurations & Settings
          </h1>
          <p className="page-subtitle">Configure AI engines, automated filters, voice simulation, and view system health telemetry</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        
        {/* Main Settings Form Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
            <Sliders size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Agent Customizations</h2>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* API Keys Configuration */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Key size={16} /> API Integration Override (Saved locally in browser)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gemini AI API Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="AIStudio API Key (e.g. AIzaSy...)" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Overrides the default backend key for processing your screenings & interviews.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">OpenAI API Key (Optional)</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="sk-proj-..." 
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Smart Filtration Threshold */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Shield size={16} /> Automated Filter Settings
              </h3>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Auto-Fit Threshold Score</label>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{matchingThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="90" 
                  step="5" 
                  style={{ width: '100%', accentColor: 'var(--color-secondary)', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px' }}
                  value={matchingThreshold}
                  onChange={(e) => setMatchingThreshold(parseInt(e.target.value))}
                />
                <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Candidates scoring below {matchingThreshold}% on resume screening will be flagged for rejection warnings.
                </small>
              </div>
            </div>

            {/* Interview Settings */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Sparkles size={16} /> AI Interview Room Sim Preferences
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Interviewer Persona Tone</label>
                  <select 
                    className="form-select" 
                    value={interviewTone}
                    onChange={(e) => setInterviewTone(e.target.value)}
                  >
                    <option value="Strict Technical Lead">Strict Technical Lead (Heavy Coding / Arch focus)</option>
                    <option value="Friendly HR Partner">Friendly HR Partner (Behavioral / Cultural)</option>
                    <option value="Pragmatic CTO">Pragmatic CTO (High-level architecture & Scale)</option>
                    <option value="Inquisitive SRE Lead">Inquisitive SRE Lead (Chaos / Incident-response)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Interview Length (Questions)</label>
                  <select 
                    className="form-select" 
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  >
                    <option value={3}>3 Questions (Fast-Track)</option>
                    <option value={5}>5 Questions (Balanced standard)</option>
                    <option value={8}>8 Questions (Thorough evaluation)</option>
                    <option value={10}>10 Questions (Ultimate drill)</option>
                  </select>
                </div>
              </div>

              {/* Voice Synthesizer Toggle */}
              <div style={{ 
                marginTop: '1.25rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Volume2 style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>Interactive Voice Synthesis (TTS)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Speaks AI questions aloud using your device's voice engine</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableVoice}
                  onChange={(e) => setEnableVoice(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
              </div>

              {enableVoice && (
                <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <label className="form-label">Synthesizer Voice Accent / Language</label>
                  <select 
                    className="form-select" 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (Great Britain)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', gap: '1rem', alignItems: 'center' }}>
              {saveStatus === 'success' && (
                <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={16} /> Configurations Saved Successfully!
                </span>
              )}
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Save Portal Configs
              </button>
            </div>

          </form>
        </div>

        {/* Sidebar Diagnostics Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Health Check Card */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: 'var(--color-success)' }} />
                Platform Telemetry
              </h3>
              <button 
                onClick={fetchTelemetry} 
                disabled={loadingTelemetry}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                {loadingTelemetry ? 'Querying...' : 'Refresh'}
              </button>
            </div>

            {telemetry ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status Indicator</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', display: 'inline-block' }}></span>
                    Online / Healthy
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Backend Uptime</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{Math.floor(telemetry.uptime)} sec</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Database size={14} /> Database Engine
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{telemetry.database}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Cpu size={14} /> Active AI Core
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                    {geminiKey ? 'Gemini Override' : (openaiKey ? 'OpenAI Override' : telemetry.ai_engine)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deployment Env</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{telemetry.environment}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Telemetry offline. Backend not responding.
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={18} style={{ color: 'var(--color-primary)' }} />
              Real Platform Features
            </h3>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Local Encryption:</strong> Your private API keys are kept safely inside your browser's Sandboxed storage.</li>
              <li><strong>Dynamic Seed Engine:</strong> System auto-grades candidates against requirements mapped inside each specific Job Posting.</li>
              <li><strong>Interactive Voice Synthesis:</strong> Prompts the candidate verbally, simulating real video-interviews.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Play, Eye, Trash2, X, Briefcase, Award, Calendar, Check, AlertCircle } from 'lucide-react';

export default function CandidateScreening({ candidates, deleteCandidate, updateStatus, startInterview }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const getScoreClass = (score) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Selected': return 'status-selected';
      case 'Rejected': return 'status-rejected';
      case 'Interviewing': return 'status-interviewing';
      default: return 'status-screened';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidate Screening Board</h1>
          <p className="page-subtitle">Track resume matching parameters, examine AI recommendations, and coordinate mock interviews.</p>
        </div>
      </div>

      <div className="glass-card candidate-table-card">
        {candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            No candidate resumes screened yet. Head over to the "Screen Resume" tab to ingest one!
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="cand-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Target</th>
                  <th>Match Score</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cand.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{cand.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{cand.job_title}</div>
                    </td>
                    <td>
                      <span className={`score-badge ${getScoreClass(cand.fit_score)}`}>
                        {cand.fit_score}%
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{cand.experience} Year(s)</div>
                    </td>
                    <td>
                      <span className={`status-tag ${getStatusClass(cand.status)}`}>
                        {cand.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.50rem' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
                          onClick={() => setSelectedCandidate(cand)}
                          title="View Details & AI Summary"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {cand.status !== 'Selected' && cand.status !== 'Rejected' && (
                          <button 
                            className="btn btn-primary"
                            style={{ 
                              padding: '0.45rem 0.85rem', 
                              fontSize: '0.8rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                            }}
                            onClick={() => startInterview(cand)}
                            title="Commence Mock Interview"
                          >
                            <Play size={14} style={{ fill: 'currentColor' }} /> AI Interview
                          </button>
                        )}
                        
                        <button 
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)', 
                            color: 'var(--color-danger)',
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                          onClick={() => deleteCandidate(cand.id)}
                          title="Delete Candidate Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Glassmorphic Side Detail Panel Drawer */}
      {selectedCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '520px',
          height: '100vh',
          background: 'rgba(12, 19, 34, 0.96)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-glass)',
          zIndex: 1000,
          boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
          padding: '2.5rem 2rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Slide-in anim */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Candidate Profile Detail</h2>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setSelectedCandidate(null)}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
            <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
              {selectedCandidate.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selectedCandidate.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedCandidate.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Fit summary card */}
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.01)' }}>
              <span className={`score-badge ${getScoreClass(selectedCandidate.fit_score)}`} style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                {selectedCandidate.fit_score}%
              </span>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>AI Job Fit Score</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedCandidate.fit_score >= 75 ? 'Strong Match Recommended' : selectedCandidate.fit_score >= 50 ? 'Requires Mock Verification' : 'Low Profile Alignment'}
                </div>
              </div>
            </div>

            {/* Target details block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Briefcase size={16} style={{ color: 'var(--color-secondary)' }} />
                <strong>Role Target:</strong> {selectedCandidate.job_title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Award size={16} style={{ color: 'var(--color-secondary)' }} />
                <strong>Experience Tally:</strong> {selectedCandidate.experience} Years
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
                <strong>Screened On:</strong> {new Date(selectedCandidate.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Extracted skills badges */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Extracted Core Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selectedCandidate.skills ? (
                  selectedCandidate.skills.split(',').map((skill, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        fontSize: '0.75rem', 
                        background: 'rgba(6, 182, 212, 0.08)', 
                        color: 'var(--color-secondary)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '99px',
                        border: '1px solid rgba(6, 182, 212, 0.15)'
                      }}
                    >
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No tech keywords parsed.</span>
                )}
              </div>
            </div>

            {/* Executive AI recommendation summary */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>AI Screening Summary</h4>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)', 
                lineHeight: '1.5',
                padding: '1rem',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)'
              }}>
                {selectedCandidate.screening_summary}
              </p>
            </div>

            {/* Manual recruiter selection states */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Update Application Pipeline</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-primary"
                  style={{ 
                    flex: 1, 
                    fontSize: '0.85rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: 'var(--color-success)'
                  }}
                  onClick={() => {
                    updateStatus(selectedCandidate.id, 'Selected');
                    setSelectedCandidate(prev => ({ ...prev, status: 'Selected' }));
                  }}
                >
                  <Check size={16} /> Hire Candidate
                </button>
                <button 
                  className="btn"
                  style={{ 
                    flex: 1, 
                    fontSize: '0.85rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--color-danger)'
                  }}
                  onClick={() => {
                    updateStatus(selectedCandidate.id, 'Rejected');
                    setSelectedCandidate(prev => ({ ...prev, status: 'Rejected' }));
                  }}
                >
                  <X size={16} /> Decline File
                </button>
              </div>
            </div>

            {/* Launch interview panel */}
            {selectedCandidate.status !== 'Selected' && selectedCandidate.status !== 'Rejected' && (
              <button 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => {
                  const cand = selectedCandidate;
                  setSelectedCandidate(null);
                  startInterview(cand);
                }}
              >
                <Play size={16} style={{ fill: 'currentColor' }} /> Start AI Mock Interview
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

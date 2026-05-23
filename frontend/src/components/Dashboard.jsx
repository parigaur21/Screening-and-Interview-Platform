import React from 'react';
import { Briefcase, Users, Cpu, CheckCircle, Trash2, MapPin } from 'lucide-react';

export default function Dashboard({ jobs, candidates, setActiveTab, setSelectedJobId, deleteJob }) {
  // Compute analytics
  const totalScanned = candidates.length;
  const interviewingCount = candidates.filter(c => c.status === 'Interviewing').length;
  const selectedCount = candidates.filter(c => c.status === 'Selected').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Talent Acquisition Dashboard</h1>
          <p className="page-subtitle">Real-time resume pipeline analytics and AI screening control hub.</p>
        </div>
      </div>

      {/* Glassmorphic Statistics Board */}
      <div className="stats-grid">
        <div className="glass-card stat-item">
          <div className="stat-icon-wrapper cyan">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalScanned}</div>
            <div className="stat-label">Scanned Resumes</div>
          </div>
        </div>

        <div className="glass-card stat-item">
          <div className="stat-icon-wrapper primary">
            <Cpu size={24} />
          </div>
          <div>
            <div className="stat-value">{interviewingCount}</div>
            <div className="stat-label">Active AI Interviews</div>
          </div>
        </div>

        <div className="glass-card stat-item">
          <div className="stat-icon-wrapper success">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{selectedCount}</div>
            <div className="stat-label">Selected Talents</div>
          </div>
        </div>
      </div>

      {/* Active Job Openings panel */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Active Job Postings</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>{jobs.length} Positions Open</span>
        </div>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No job postings available. Click "Create Job" in the sidebar to add one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map(job => {
              // Calculate how many candidates applied for this job
              const applicantsCount = candidates.filter(c => c.job_id === job.id).length;

              return (
                <div 
                  key={job.id} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto', 
                    gap: '1rem',
                    padding: '1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{job.title}</h3>
                      <span className="status-tag status-screened" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                        {job.department}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span>•</span>
                      <span>{applicantsCount} Screened Candidate(s)</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineBreak: 'strict' }}>
                      {job.description}
                    </p>
                    <div style={{ marginTop: '0.50rem', fontSize: '0.8rem', color: 'var(--color-secondary)' }}>
                      <strong>Stack Requisites:</strong> {job.requirements}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setActiveTab('upload');
                      }}
                    >
                      Screen Resume
                    </button>
                    <button 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: 'var(--color-danger)',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                      onClick={() => deleteJob(job.id)}
                      title="Remove Job Posting"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

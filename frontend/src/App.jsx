import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, ShieldAlert, Users, PlusCircle, HelpCircle, Briefcase, ChevronRight, Menu, Check, Video, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ResumeUploader from './components/ResumeUploader';
import CandidateScreening from './components/CandidateScreening';
import MockInterview from './components/MockInterview';
import Settings from './components/Settings';
import PrepVideos from './components/PrepVideos';
import './styles/theme.css';
import Background3D from './components/Background3D';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
export default function App() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [interviewCandidate, setInterviewCandidate] = useState(null);
  // Custom job posting creator drawer state
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('');
  const [newJobLoc, setNewJobLoc] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobReqs, setNewJobReqs] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchJobs();
    fetchCandidates();
  }, [token]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`);
      const result = await res.json();
      if (result.success) {
        setJobs(result.data);
        if (result.data.length > 0 && !selectedJobId) {
          setSelectedJobId(result.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`);
      const result = await res.json();
      if (result.success) {
        setCandidates(result.data);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to remove this job posting? All applicants will remain in database.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to remove this candidate profile?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateCandidateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const result = await res.json();
      if (result.success) {
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartInterview = (candidate) => {
    setInterviewCandidate(candidate);
    setActiveTab('interview');
  };

  const handleResumeScreenComplete = (newCandidate) => {
    fetchCandidates();
    setActiveTab('candidates');
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess(false);

    if (!newJobTitle || !newJobDesc || !newJobReqs) {
      setDrawerError('Job Title, Description, and Stack Requisites are required fields.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newJobTitle,
          department: newJobDept,
          location: newJobLoc,
          description: newJobDesc,
          requirements: newJobReqs
        })
      });

      const result = await response.json();
      if (result.success) {
        setDrawerSuccess(true);
        setNewJobTitle('');
        setNewJobDept('');
        setNewJobLoc('');
        setNewJobDesc('');
        setNewJobReqs('');
        fetchJobs();
        setTimeout(() => {
          setIsJobDrawerOpen(false);
          setDrawerSuccess(false);
        }, 1500);
      } else {
        setDrawerError(result.message || 'Failed to create job.');
      }
    } catch (err) {
      console.error(err);
      setDrawerError('Connection to backend API failed.');
    }
  };

  if (!token) return null;

  return (
    <div className="app-container">
      <Background3D />
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800
          }}>Æ</div>
          <span className="logo-text">AI ResuScreen</span>
        </div>

        <ul className="nav-list">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="nav-icon" />
            <span>Dashboard</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <FileText className="nav-icon" />
            <span>Screen Resume</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidates')}
          >
            <Users className="nav-icon" />
            <span>Candidates</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon className="nav-icon" />
            <span>System Settings</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'prep' ? 'active' : ''}`}
            onClick={() => setActiveTab('prep')}
          >
            <Video className="nav-icon" />
            <span>Prep Videos</span>
          </li>
          {interviewCandidate && (
            <li 
              className={`nav-item ${activeTab === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveTab('interview')}
            >
              <HelpCircle className="nav-icon" style={{ color: 'var(--color-accent)' }} />
              <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>AI Interview Room</span>
            </li>
          )}

          <li 
            className="nav-item"
            style={{ marginTop: '2rem', border: '1px dashed var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}
            onClick={() => setIsJobDrawerOpen(true)}
          >
            <PlusCircle className="nav-icon" style={{ color: 'var(--color-secondary)' }} />
            <span style={{ color: 'var(--color-secondary)' }}>Create Job Posting</span>
          </li>
        </ul>

        {/* User profile section */}
        <div className="user-profile-section">
          <div className="avatar">U</div>
          <div className="user-info">
            <div className="username">User</div>
            <div className="role">Authenticated</div>
            <button style={{marginTop: '0.5rem'}} onClick={logout}>Logout</button>
            <div style={{marginTop: '0.5rem'}}>
              <a href="/signup" style={{color: 'var(--color-secondary)'}}>Sign Up</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            jobs={jobs}
            candidates={candidates}
            setActiveTab={setActiveTab}
            setSelectedJobId={setSelectedJobId}
            deleteJob={deleteJob}
          />
        )}

        {activeTab === 'upload' && (
          <ResumeUploader 
            jobs={jobs}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
            onScreenComplete={handleResumeScreenComplete}
            API_BASE_URL={API_BASE_URL}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidateScreening 
            candidates={candidates}
            deleteCandidate={deleteCandidate}
            updateStatus={updateCandidateStatus}
            startInterview={handleStartInterview}
          />
        )}

        {activeTab === 'interview' && interviewCandidate && (
          <MockInterview 
            candidate={interviewCandidate}
            onFinishInterview={() => {
              setInterviewCandidate(null);
              setActiveTab('candidates');
              fetchCandidates();
            }}
            API_BASE_URL={API_BASE_URL}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            API_BASE_URL={API_BASE_URL}
          />
        )}

        {activeTab === 'prep' && (
          <PrepVideos />
        )}
      </main>

      {/* Glassmorphic Side Drawer for Creating Custom Jobs */}
      {isJobDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '500px',
          height: '100vh',
          background: 'rgba(8, 12, 20, 0.97)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-glass)',
          zIndex: 1100,
          boxShadow: '-10px 0 40px rgba(0,0,0,0.7)',
          padding: '2.5rem 2rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={22} style={{ color: 'var(--color-secondary)' }} />
              Create Custom Job
            </h2>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}
              onClick={() => setIsJobDrawerOpen(false)}
            >
              ×
            </button>
          </div>

          {drawerError && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}>
              <ShieldAlert size={18} />
              <span>{drawerError}</span>
            </div>
          )}

          {drawerSuccess && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem', 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}>
              <Check size={18} />
              <span>Job Posting published successfully! Seeding pipeline...</span>
            </div>
          )}

          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Cloud DevOps Engineer" 
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Platform Engineering" 
                value={newJobDept}
                onChange={(e) => setNewJobDept(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. San Francisco, CA (Hybrid)" 
                value={newJobLoc}
                onChange={(e) => setNewJobLoc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Job Description</label>
              <textarea 
                className="form-textarea" 
                rows="4"
                placeholder="Describe role responsibilities, team structures, operations models..."
                value={newJobDesc}
                onChange={(e) => setNewJobDesc(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stack Requirements (Comma separated)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. AWS, Docker, Terraform, CI/CD, React" 
                value={newJobReqs}
                onChange={(e) => setNewJobReqs(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Publish Job Listing
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

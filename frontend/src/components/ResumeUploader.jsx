import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ResumeUploader({ jobs, selectedJobId, setSelectedJobId, onScreenComplete, API_BASE_URL }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // AI loading simulator messages to make the screening feel premium and technical
  const STAGES = [
    'Initializing ingestion channel...',
    'Extracting document structure...',
    'Running semantic keywords parse...',
    'Cross-referencing technical skills gaps...',
    'Evaluating experience ratios...',
    'Writing fit scores to AWS RDS...'
  ];

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    
    const allowedExtensions = ['.txt', '.md', '.pdf', '.docx'];
    const fileName = selectedFile.name.toLowerCase();
    const isExtensionValid = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isExtensionValid) {
      setError('The uploaded file is not correct. Only PDF, Word (.docx), TXT, or MD documents are supported.');
      setFile(null);
      return false;
    }
    
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSizeBytes) {
      setError('The uploaded file is not correct. File size exceeds the 5MB limit. Please upload a smaller file.');
      setFile(null);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !selectedJobId || !file) {
      setError('Please provide Name, Email, Target Position, and a Resume File.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    // Dynamic loading stages animation
    let currentStage = 0;
    setLoadingStage(STAGES[0]);
    const stageInterval = setInterval(() => {
      if (currentStage < STAGES.length - 1) {
        currentStage++;
        setLoadingStage(STAGES[currentStage]);
      }
    }, 900);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('jobId', selectedJobId);
      formData.append('resume', file);

      const response = await fetch(`${API_BASE_URL}/candidates`, {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        result = { success: false, message: responseText || `Server responded with status ${response.status}: ${response.statusText}` };
      }

      clearInterval(stageInterval);

      if (result.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Trigger parent dashboard reload
        onScreenComplete(result.data);
      } else {
        setError(result.message || 'Failed to analyze resume.');
      }
    } catch (err) {
      clearInterval(stageInterval);
      console.error(err);
      setError('Connection to backend failed. Make sure the API server is active.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Screen Candidate Resume</h1>
          <p className="page-subtitle">Inject candidate resume into the AI screening model for skill-fit analysis.</p>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '1rem', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>Resume uploaded successfully and processed by AI engine! View results in "Candidates" tab.</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Loader2 className="nav-icon" size={48} style={{ color: 'var(--color-secondary)', animation: 'spin 1.5s linear infinite', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Screen Engine Active</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '1.5rem' }}>{loadingStage}</p>
            
            {/* Spinning keyframes simulation */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} onDragEnter={handleDrag}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Parijat K." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. parijat@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Job Role</label>
              <select 
                className="form-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                required
              >
                <option value="">Select target role...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Resume File (.txt, .md, or pdf/docx simulation)</label>
              
              <div 
                className={`uploader-area ${isDragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="uploader-icon" />
                {file ? (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{file.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      {(file.size / 1024).toFixed(1)} KB • Click to swap file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Drag & drop candidate resume here, or <span style={{ color: 'var(--color-secondary)' }}>browse</span></p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      Supports PDF, Word, TXT, MD documents up to 5MB
                    </p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".txt,.md,.pdf,.docx"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Analyze & Screen Resume
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

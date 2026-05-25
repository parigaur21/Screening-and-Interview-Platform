import React, { useState } from 'react';
import { Play, BookOpen, Terminal, CheckCircle2, Award, Sparkles, Clock, ExternalLink, Video, Shield, Activity, Database, Layers, Search, Code, Cpu } from 'lucide-react';

const mockVideos = [
  {
    id: 'vid-devops',
    role: 'Lead DevOps Engineer',
    title: 'Lead DevOps Engineer Mock Interview: Production K8s & IaC Pipeline',
    channel: 'DevOps Alliance',
    embedUrl: 'https://www.youtube.com/embed/f843XU21-g8',
    duration: '42 mins',
    difficulty: 'Advanced',
    icon: Terminal,
    color: '#06b6d4',
    topics: ['Kubernetes Orchestration', 'Multi-Stage Dockerfiles', 'GitHub Actions', 'Terraform State Locks'],
    keyTakeaways: [
      'Terraform remote state must be secured using AWS S3 with KMS encryption and DynamoDB tables for state lock operations.',
      'Container sizes should be minimized using multi-stage builds and distroless base images to reduce vulnerability footprints.',
      'Deployment rollout strategies (e.g., Canary vs Blue/Green) should always implement precise K8s liveness and readiness probes.'
    ],
    technicalCheatsheet: {
      title: 'Infrastructure-as-Code & K8s Spec',
      commands: [
        { cmd: 'terraform init -backend-config=backend.hcl', desc: 'Initialize Terraform with dynamic backend profile' },
        { cmd: 'kubectl rollout restart deployment/nginx-app', desc: 'Trigger rolling restart for K8s deployment' },
        { cmd: 'docker build --target builder -t app:test .', desc: 'Build specific stage for pipeline validation' }
      ]
    },
    commonQuestions: [
      {
        question: 'How do you prevent race conditions when multiple engineers apply Terraform configurations simultaneously?',
        answer: 'We leverage S3 as our remote backend coupled with a DynamoDB state-locking table. When an engineer triggers terraform apply, Terraform requests a lock in DynamoDB. Any concurrent apply operations are rejected with a LockInfo error until the active run successfully completes and releases the lock.'
      },
      {
        question: 'What is the purpose of distinguishing between Readiness and Liveness probes in Kubernetes?',
        answer: 'Liveness probes check if the container needs to be restarted (e.g., if the application has deadlocked). Readiness probes check if the container is ready to accept incoming network traffic. If a readiness probe fails, the K8s endpoint controller removes the Pod from the Service load balancer, ensuring zero-downtime deployments while the app warms up.'
      }
    ]
  },
  {
    id: 'vid-sre',
    role: 'Senior Site Reliability Engineer (SRE)',
    title: 'SRE Systems Design Mock Interview: Incident Response & Alerting SLOs',
    channel: 'SRE Academy',
    embedUrl: 'https://www.youtube.com/embed/kgYJ3s4Jk5g',
    duration: '38 mins',
    difficulty: 'Expert',
    icon: Activity,
    color: '#a855f7',
    topics: ['SLIs, SLOs & SLAs', 'Error Budget Burn Rates', 'Incident Post-mortems', 'Prometheus Alerts'],
    keyTakeaways: [
      'SLIs measure raw service metrics, SLOs represent target reliability goals, and SLAs define legal commitments to clients.',
      'Error budgets should guide developer velocity; if the budget is depleted, feature releases freeze to focus on stability.',
      'A post-mortem must be completely blameless, focusing on systemic fixes and automated failsafes rather than human error.'
    ],
    technicalCheatsheet: {
      title: 'Site Reliability Alerting Spec',
      commands: [
        { cmd: 'up{job="prometheus"} == 0', desc: 'PromQL alert expression checking if Prometheus targets are offline' },
        { cmd: 'sum(rate(http_requests_total{status=~"5.."}[5m]))', desc: 'Calculate the rolling 5-minute server error rate' },
        { cmd: 'journalctl -u docker.service --since "10 min ago"', desc: 'Query recent systemd logs during immediate outage triage' }
      ]
    },
    commonQuestions: [
      {
        question: 'How would you design a self-healing infrastructure alert for disk saturation?',
        answer: 'I would set a Prometheus alert rule when disk usage exceeds 85%. This alert triggers a webhook in Prometheus Alertmanager, dispatching an event to an automated remediation worker (e.g., AWS Systems Manager runbook). The runbook executes a script to clear temp folders, rotate inactive logs, and prune unused Docker volumes before paging a human operator.'
      },
      {
        question: 'What is an Error Budget and how do you enforce it?',
        answer: 'An Error Budget is the allowable room for error, defined as 100% minus the SLO (e.g., a 99.9% SLO leaves a 0.1% error budget). We track the burn rate of this budget. If our monitoring indicates that we will deplete the monthly error budget before the period ends, we halt production code pushes and redirect engineering focus to bug remediation, reliability, and test coverage.'
      }
    ]
  },
  {
    id: 'vid-cloud-arch',
    role: 'Cloud Infrastructure Architect',
    title: 'Cloud Architect Mock Interview: High Availability Design & Disaster Recovery',
    channel: 'Cloud Architecture Core',
    embedUrl: 'https://www.youtube.com/embed/YpS_jE7kZ4k',
    duration: '51 mins',
    difficulty: 'Expert',
    icon: Layers,
    color: '#06b6d4',
    topics: ['Transit Gateway Routing', 'AWS VPC Isolation', 'Multi-Region Aurora DB', 'RTO and RPO Targets'],
    keyTakeaways: [
      'VPCs should be structured into private subnets for application runtimes and public subnets strictly for ALBs and NAT Gateways.',
      'Multi-region systems require careful data replication planning. Define RTO (Recovery Time Objective) and RPO (Recovery Point Objective) early.',
      'Transit Gateway simplifies full-mesh VPC routing, acting as a cloud router and removing complex peer-to-peer connection tables.'
    ],
    technicalCheatsheet: {
      title: 'Cloud Networking & Route Spec',
      commands: [
        { cmd: 'aws ec2 describe-transit-gateways', desc: 'List active Transit Gateways in the default AWS region' },
        { cmd: 'dig +short database-replica.prod.internal', desc: 'Resolve private Route53 DNS zones to verify routing' },
        { cmd: 'aws sts get-caller-identity', desc: 'Identify active IAM security credentials before deploying architecture' }
      ]
    },
    commonQuestions: [
      {
        question: 'How do you design for a 15-minute RTO and near-zero RPO in an enterprise cloud application?',
        answer: 'This requires a multi-region active-passive or active-active topology. For a near-zero RPO, we employ synchronous database replication (such as AWS Aurora Global Database with sub-second replication delay). For a 15-minute RTO, we configure AWS Route 53 Application Recovery Controller to continuously check endpoint health and automate DNS routing failover within 60 seconds.'
      },
      {
        question: 'How do you securely connect multiple remote office networks and several VPCs?',
        answer: 'I would implement AWS Transit Gateway as a centralized network hub. Each VPC and local VPN tunnel connects to the Transit Gateway. By manipulating Transit Gateway Route Tables, we can isolate development environments from production VPCs while maintaining high-speed sharing of core services (like shared Active Directory).'
      }
    ]
  },
  {
    id: 'vid-devsecops',
    role: 'DevOps Security (DevSecOps) Engineer',
    title: 'DevSecOps Mock Interview: Automated Security Scanning & Compliance Gates',
    channel: 'Cyber Security Ops',
    embedUrl: 'https://www.youtube.com/embed/3e2s6861_0Y',
    duration: '29 mins',
    difficulty: 'Advanced',
    icon: Shield,
    color: '#ef4444',
    topics: ['SAST vs DAST Tools', 'Secrets Detection Systems', 'HashiCorp Vault Engine', 'CIS Benchmark Hardening'],
    keyTakeaways: [
      'SAST scans source code patterns during early build stages; DAST analyzes live running endpoints to detect runtime loopholes.',
      'Secrets must never exist in git history. Implement tools like Trufflehog or GitGuardian inside pre-commit hooks.',
      'Server infrastructure should be validated against CIS (Center for Internet Security) Benchmarks during golden image baking.'
    ],
    technicalCheatsheet: {
      title: 'DevSecOps Secrets & Hardening Spec',
      commands: [
        { cmd: 'vault kv get secret/production/database', desc: 'Retrieve production database credentials securely via API token' },
        { cmd: 'trufflehog git file:///path/to/repo --only-verified', desc: 'Scan local repository history for accidentally committed secrets' },
        { cmd: 'trivy image --severity HIGH,CRITICAL node:18-alpine', desc: 'Scan base container images for known vulnerabilities' }
      ]
    },
    commonQuestions: [
      {
        question: 'Explain the difference between SAST and DAST, and where they fit in a CI/CD pipeline.',
        answer: 'SAST (Static Application Security Testing) is white-box testing that scans raw source code before building (e.g., checking for SQL injection risk or buffer overflows). We run this in the pull-request phase. DAST (Dynamic Application Security Testing) is black-box testing that probes the live running application from the outside. We run DAST in our staging or pre-production deployment stage to discover environment configuration flaws.'
      },
      {
        question: 'How do you securely manage database credentials in a highly auto-scaled Kubernetes cluster?',
        answer: 'We utilize HashiCorp Vault with Kubernetes Auth. Pods are assigned specific Kubernetes Service Accounts. Using a Vault Sidecar Agent injected into the Pod, the application requests dynamic database credentials which are generated on-the-fly with short time-to-lives (e.g., 1 hour) and are automatically rotated. No raw secrets are stored in YAML manifests or Git.'
      }
    ]
  },
  {
    id: 'vid-frontend',
    role: 'Frontend Platform Architect',
    title: 'Frontend Platform Mock Interview: Monorepo Orchestration & Module Federation',
    channel: 'Modern Frontend',
    embedUrl: 'https://www.youtube.com/embed/tM0QG49E5uM',
    duration: '45 mins',
    difficulty: 'Advanced',
    icon: Code,
    color: '#3b82f6',
    topics: ['Module Federation', 'Monorepo Task Caching', 'CDN Edge Rendering', 'Core Web Vitals'],
    keyTakeaways: [
      'Webpack Module Federation enables independent build and deployment of micro-frontend applications with shared state.',
      'Turborepo optimizes pipeline tasks using local and remote file system caching to ensure zero duplicate builds.',
      'Static assets must be pushed to a Geo-distributed CDN with customized stale-while-revalidate caching headers.'
    ],
    technicalCheatsheet: {
      title: 'Frontend Engineering Pipeline Spec',
      commands: [
        { cmd: 'turbo run build --cache-dir=".turbo"', desc: 'Build frontend packages leveraging monorepo caching' },
        { cmd: 'lighthouse --view http://localhost:3000', desc: 'Audit performance and Core Web Vitals from the CLI' },
        { cmd: 'npm dedupe', desc: 'Consolidate duplicate sub-dependencies to reduce bundle size' }
      ]
    },
    commonQuestions: [
      {
        question: 'How does Webpack Module Federation facilitate micro-frontend architectures?',
        answer: 'It allows an application to dynamically load code from a completely separate build at runtime. We define a "Host" shell and "Remote" applications. The Host fetches the entry point (e.g., remoteEntry.js) at runtime. The components are shared without NPM packaging overhead, enabling independent deployment schedules.'
      },
      {
        question: 'How do you optimize Core Web Vitals, specifically Largest Contentful Paint (LCP) in a high-traffic app?',
        answer: 'We implement server-side rendering (SSR) or static site generation with edge rendering. We optimize images through next-gen formats (AVIF/WebP) and ensure the hero image is preloaded (`rel="preload"`). We remove render-blocking Javascript, defer non-critical CSS, and utilize responsive layouts to eliminate layout shifts (CLS).'
      }
    ]
  },
  {
    id: 'vid-data',
    role: 'Data Platform Engineer',
    title: 'Data Platform Engineer Mock Interview: Kafka Streaming & dbt Data Modeling',
    channel: 'Data Ops Academy',
    embedUrl: 'https://www.youtube.com/embed/5H9U5Yj_5iQ',
    duration: '36 mins',
    difficulty: 'Expert',
    icon: Database,
    color: '#10b981',
    topics: ['Apache Kafka Partitioning', 'dbt Modeling & Tests', 'Schema Evolution', 'Snowflake Warehouse Tuning'],
    keyTakeaways: [
      'Kafka partition keys must be selected carefully to ensure even message distribution and avoid bottlenecking consumer groups.',
      'dbt (Data Build Tool) enables SQL data transformations with version control, modular refs, and embedded data testing.',
      'Ingestion layers must enforce schema registry validation to prevent raw corrupt entries from halting warehouse pipelines.'
    ],
    technicalCheatsheet: {
      title: 'Data Platform & Pipeline Spec',
      commands: [
        { cmd: 'dbt test --select "tag:hourly_metrics"', desc: 'Run automated assertions against model outputs' },
        { cmd: 'kafka-topics.sh --bootstrap-server localhost:9092 --create', desc: 'Provision a new high-throughput event topic' },
        { cmd: 'dbt run --models staging.stg_users', desc: 'Compile staging views and materialize database tables' }
      ]
    },
    commonQuestions: [
      {
        question: 'What is the role of the Kafka Schema Registry, and how does it prevent pipeline failures?',
        answer: 'The Schema Registry acts as a centralized repository for schemas. When a producer attempts to write an event, it validates the message against the registered Avro or Protobuf schema. If an event contains malformed data or breaks backward-compatibility rules, it is rejected at the broker entry point, saving downstream consumers from crashing due to unexpected schema drift.'
      },
      {
        question: 'How do you manage staging vs production data isolation when modeling with dbt?',
        answer: 'We leverage dbt environment profiles. In development, target schemas are generated dynamically based on the developer\'s username (e.g., dbt_jdoe). In production, dbt compile and run are executed by the Orchestrator (Airflow/Prefect) which points to production datasets inside Snowflake, isolating the staging warehouses completely from dev queries.'
      }
    ]
  }
];

export default function PrepVideos() {
  const [selectedRole, setSelectedRole] = useState('All');
  const [activeVideo, setActiveVideo] = useState(mockVideos[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAccordion, setActiveAccordion] = useState(0);

  const roles = ['All', ...new Set(mockVideos.map(v => v.role))];

  const filteredVideos = mockVideos.filter(video => {
    const matchesRole = selectedRole === 'All' || video.role === selectedRole;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const VideoIcon = activeVideo.icon;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Technical Mock Interview Library</h1>
          <p className="page-subtitle">Watch professional mock interviews, analyze technical breakdowns, and study standard answers.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Sparkles size={16} style={{ color: 'var(--color-secondary)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Expert Preparations Added</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className="btn"
              style={{
                fontSize: '0.75rem',
                padding: '0.5rem 0.85rem',
                background: selectedRole === role ? 'linear-gradient(135deg, var(--color-primary), #4f46e5)' : 'rgba(255,255,255,0.03)',
                borderColor: selectedRole === role ? 'transparent' : 'var(--border-glass)',
                color: selectedRole === role ? '#fff' : 'var(--text-muted)',
                borderRadius: '8px'
              }}
            >
              {role}
            </button>
          ))}
        </div>
        
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search topics or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8rem', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Grid Layout: Left is list, Right is active player and full breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Video Playlist Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '720px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {filteredVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No matches found for your filter.
            </div>
          ) : (
            filteredVideos.map(video => {
              const IconComp = video.icon;
              const isSelected = activeVideo.id === video.id;
              return (
                <div
                  key={video.id}
                  onClick={() => {
                    setActiveVideo(video);
                    setActiveAccordion(0);
                  }}
                  className="glass-card"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderColor: isSelected ? video.color : 'var(--border-glass)',
                    background: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'rgba(20, 28, 47, 0.25)',
                    transition: 'var(--transition-smooth)',
                    boxShadow: isSelected ? `0 0 15px rgba(255,255,255,0.03)` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      padding: '0.5rem', 
                      borderRadius: '8px', 
                      background: isSelected ? video.color + '20' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? video.color : 'var(--text-dim)'
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: video.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {video.role}
                      </span>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                        {video.title.length > 55 ? video.title.substring(0, 52) + '...' : video.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {video.duration}
                        </span>
                        <span className={`status-tag status-selected`} style={{ background: isSelected ? video.color + '15' : 'rgba(255,255,255,0.03)', color: isSelected ? video.color : 'var(--text-muted)', fontSize: '0.65rem', border: 'none', padding: '0.1rem 0.4rem' }}>
                          {video.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: High-Fidelity Active Player & Notes Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Stunning Glass Card with Framed YouTube Video Embed */}
          <div className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: '#000' }}>
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1rem', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeVideo.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeVideo.role} • Mock Tutorial Video
                </span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                  {activeVideo.title}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Published by <strong style={{ color: 'var(--text-primary)' }}>{activeVideo.channel}</strong>
                </p>
              </div>
              
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeVideo.role + ' Mock Interview')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
              >
                Find More on YouTube <ExternalLink size={14} />
              </a>
            </div>

            {/* Topic Badges inside Active Card */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
              {activeVideo.topics.map((topic, i) => (
                <span key={i} style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--border-glass)', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '6px', 
                  color: 'var(--text-muted)' 
                }}>
                  #{topic}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Study Grid (Expert takeaways & Code cheatsheet) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Takeaways Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'var(--color-secondary)' }} />
                Expert Key Takeaways
              </h3>
              
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none' }}>
                {activeVideo.keyTakeaways.map((takeaway, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    <CheckCircle2 size={16} style={{ color: activeVideo.color, flexShrink: 0, marginTop: '2px' }} />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Cheatsheet & Shell Commands Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} style={{ color: 'var(--color-primary)' }} />
                {activeVideo.technicalCheatsheet.title}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeVideo.technicalCheatsheet.commands.map((cmdItem, i) => (
                  <div key={i} style={{ background: 'rgba(8, 12, 20, 0.6)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>SPEC EXPR #{i+1}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-secondary)', background: 'rgba(6, 182, 212, 0.1)', padding: '0.05rem 0.25rem', borderRadius: '3px' }}>CLI</span>
                    </div>
                    <code style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{cmdItem.cmd}</code>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{cmdItem.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Interactive Common Questions Accordion Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
              Role Interview Simulator: Common Questions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeVideo.commonQuestions.map((q, idx) => {
                const isOpen = activeAccordion === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: isOpen ? 'rgba(255,255,255,0.01)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div 
                      onClick={() => setActiveAccordion(isOpen ? null : idx)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', paddingRight: '1rem' }}>
                        Q: {q.question}
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </div>
                    
                    {isOpen && (
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', height: 'fit-content' }}>
                            Model Answer
                          </span>
                        </div>
                        {q.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

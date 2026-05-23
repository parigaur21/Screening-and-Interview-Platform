import * as db from '../config/db.js';

// Pre-seeded template jobs for high-quality instant presentation
const SEED_JOBS = [
  {
    id: 'job-devops-001',
    title: 'Cloud DevOps Architect',
    department: 'Cloud & Infrastructure',
    location: 'Seattle, WA (Hybrid)',
    description: 'We are seeking a senior DevOps Architect to lead our cloud-native modernization strategies on AWS. In this role, you will be designing Infrastructure as Code solutions, establishing containerized runtime platforms, and optimizing multi-stage CI/CD environments.',
    requirements: 'AWS, Docker, Kubernetes, Terraform, Nginx, PM2, PostgreSQL, CI/CD, GitHub Actions'
  },
  {
    id: 'job-fullstack-002',
    title: 'Senior Full-Stack Developer',
    department: 'Core Product Engineering',
    location: 'Remote, US',
    description: 'Join our agile core engineering squad building scalable web platform features. You will take ownership of responsive front-end dashboard panels, craft high-performance API structures, and architect scalable database schemas.',
    requirements: 'React, Node.js, Express, JavaScript, TypeScript, PostgreSQL, SQLite, Redis, System Architecture'
  },
  {
    id: 'job-ai-003',
    title: 'Generative AI Engineer',
    department: 'AI & Data Science',
    location: 'San Francisco, CA',
    description: 'We are looking for an AI Engineer to design and integrate sophisticated Large Language Model architectures. You will construct pipeline services for custom document ingestion, configure vector embeddings, and coordinate cognitive chat agents.',
    requirements: 'Python, FastAPI, Gemini API, OpenAI API, LLMs, Vector Databases, Python, RAG architectures'
  }
];

/**
 * Automatically seeds template jobs into the database if the database is empty.
 */
export async function seedJobsIfEmpty() {
  try {
    const existing = await db.query('SELECT COUNT(*) as count FROM jobs');
    const count = parseInt(existing[0]?.count || existing[0]?.['COUNT(*)'] || '0');
    
    if (count === 0) {
      console.log('🌱 Database: Seeding job postings...');
      for (const job of SEED_JOBS) {
        await db.execute(
          `INSERT INTO jobs (id, title, department, location, description, requirements)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [job.id, job.title, job.department, job.location, job.description, job.requirements]
        );
      }
      console.log('✅ Database: 3 template jobs seeded.');
    }
  } catch (error) {
    console.error('❌ Failed to seed job postings:', error);
  }
}

/**
 * Gets all jobs.
 */
export async function getAllJobs(req, res) {
  try {
    const jobs = await db.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve jobs.' });
  }
}

/**
 * Creates a new job.
 */
export async function createJob(req, res) {
  try {
    const { title, department, location, description, requirements } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const id = `job-${Date.now()}`;
    await db.execute(
      `INSERT INTO jobs (id, title, department, location, description, requirements)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, title, department || 'General', location || 'Remote', description, requirements || '']
    );

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully.',
      data: { id, title, department, location, description, requirements }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, message: 'Failed to create job posting.' });
  }
}

/**
 * Deletes a job posting.
 */
export async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM jobs WHERE id = $1', [id]);
    res.json({ success: true, message: 'Job posting deleted.' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job.' });
  }
}

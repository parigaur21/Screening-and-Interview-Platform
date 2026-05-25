import dotenv from 'dotenv';
dotenv.config();

// Standard developer skills catalog for matching and local parsing
const SKILL_CATALOG = [
  'javascript', 'typescript', 'react', 'vue', 'angular', 'next.js', 'node.js', 'express',
  'python', 'django', 'flask', 'fastapi', 'java', 'spring boot', 'go', 'golang', 'rust',
  'c++', 'c#', '.net', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'git',
  'ci/cd', 'devops', 'machine learning', 'data science', 'ai', 'html', 'css', 'graphql'
];

// Resume/CV indicator keywords — documents must contain enough of these to be classified as a resume
const RESUME_INDICATORS = [
  'experience', 'education', 'skills', 'projects', 'work history', 'employment',
  'objective', 'summary', 'profile', 'certifications', 'achievements', 'references',
  'resume', 'curriculum vitae', 'cv', 'qualification', 'professional', 'internship',
  'university', 'degree', 'bachelor', 'master', 'phd', 'gpa', 'contact',
  'phone', 'email', 'linkedin', 'github', 'portfolio', 'responsibilities',
  'technical skills', 'soft skills', 'languages', 'awards', 'publications',
  'volunteer', 'extracurricular', 'hobbies', 'interests'
];

// Non-resume indicator keywords — if too many of these appear, it's likely NOT a resume
const NON_RESUME_INDICATORS = [
  'invoice', 'receipt', 'purchase order', 'payment', 'total amount', 'tax',
  'chapter 1', 'chapter 2', 'table of contents', 'abstract', 'introduction',
  'bibliography', 'footnote', 'recipe', 'ingredients', 'preheat',
  'dear sir', 'dear madam', 'sincerely yours', 'to whom it may concern',
  'terms and conditions', 'privacy policy', 'license agreement', 'warranty',
  'balance sheet', 'profit and loss', 'fiscal year', 'quarterly report',
  'patient name', 'diagnosis', 'prescription', 'dosage', 'medical record'
];

/**
 * Validates whether the provided text content is actually a resume/CV.
 * Returns { isResume: boolean, confidence: number, reason: string }
 */
export function validateIsResume(text) {
  if (!text || text.trim().length < 50) {
    return { isResume: false, confidence: 0, reason: 'Document is too short to be a valid resume. Please upload a complete CV/resume.' };
  }

  const lowerText = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).length;

  // 1. Explicitly check for Job Description characteristics
  const jdKeywords = [
    'job description', 'we are looking for', 'about the role', 'join our team', 
    'ideal candidate', 'responsibilities:', 'requirements:', 'who we are', 'about us', 
    'reporting to', 'competitive salary', 'apply for this position', 'candidate profile:',
    'the role:', 'duties include', 'equal opportunity employer', 'position overview'
  ];
  
  let jdHits = 0;
  const matchedJdKeywords = [];
  jdKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      jdHits++;
      matchedJdKeywords.push(keyword);
    }
  });

  if (jdHits >= 2) {
    return {
      isResume: false,
      confidence: 85,
      reason: `This document appears to be a Job Description rather than a candidate resume (detected hiring indicators: ${matchedJdKeywords.slice(0, 3).map(k => `"${k}"`).join(', ')}). Please upload the candidate's actual resume or CV.`
    };
  }

  // 2. Count standard resume indicator matches
  let resumeHits = 0;
  const matchedIndicators = [];
  RESUME_INDICATORS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      resumeHits++;
      matchedIndicators.push(keyword);
    }
  });

  // 3. Count non-resume indicator matches (invoices, receipts, recipes, medical sheets)
  let nonResumeHits = 0;
  const nonResumeMatches = [];
  NON_RESUME_INDICATORS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      nonResumeHits++;
      nonResumeMatches.push(keyword);
    }
  });

  // Decision logic
  // If non-resume indicators dominate, reject
  if (nonResumeHits >= 3 && nonResumeHits > resumeHits) {
    return {
      isResume: false,
      confidence: Math.min(90, nonResumeHits * 15),
      reason: `This document appears to be a non-resume document (detected: ${nonResumeMatches.slice(0, 3).join(', ')}). Please upload a valid resume or CV.`
    };
  }

  // If very few resume indicators found
  if (resumeHits < 3 && wordCount > 100) {
    return {
      isResume: false,
      confidence: 60,
      reason: `This document does not contain enough resume-related content (found only: ${matchedIndicators.join(', ') || 'none'}). A valid resume should include sections like Experience, Skills, Education, etc.`
    };
  }

  // If document is very short and has minimal resume indicators
  if (resumeHits < 2 && wordCount < 100) {
    return {
      isResume: false,
      confidence: 50,
      reason: 'The uploaded content is too brief and lacks resume structure. Please upload a complete resume/CV with your experience, skills, and education.'
    };
  }

  // Passed validation
  const confidence = Math.min(95, 40 + resumeHits * 5);
  return {
    isResume: true,
    confidence,
    reason: `Document validated as resume/CV (matched ${resumeHits} resume indicators: ${matchedIndicators.slice(0, 5).join(', ')}).`
  };
}

/**
 * Parses and evaluates resume text against job requirements.
 */
export async function screenResume(resumeText, jobDescription) {
  // If a Gemini API Key is configured, we can implement the real LLM call!

  if (process.env.GEMINI_API_KEY) {
    try {
      return await screenResumeWithGemini(resumeText, jobDescription);
    } catch (error) {
      console.warn('Gemini screening failed, falling back to OpenAI/local:', error.message);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await screenResumeWithOpenAI(resumeText, jobDescription);
    } catch (error) {
      console.warn('OpenAI screening failed, falling back to local parsing:', error.message);
    }
  }

  // Elegant local adaptive parser
  const text = resumeText.toLowerCase();
  const job = jobDescription.toLowerCase();

  // 1. Skill extraction
  const extractedSkills = [];
  SKILL_CATALOG.forEach(skill => {
    if (text.includes(skill)) {
      extractedSkills.push(skill);
    }
  });

  // 2. Experience extraction (looks for patterns like "5 years", "3+ years", "10 yrs")
  let experienceYears = 2; // Default fallback
  const expPatterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+of\s+experience/gi,
    /(\d+)\+?\s*(?:years?|yrs?)\s+experience/gi,
    /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/gi
  ];

  for (const pattern of expPatterns) {
    const match = pattern.exec(resumeText);
    if (match && match[1]) {
      experienceYears = parseInt(match[1]);
      break;
    }
  }

  // 3. Match calculation
  const jobSkills = [];
  SKILL_CATALOG.forEach(skill => {
    if (job.includes(skill)) {
      jobSkills.push(skill);
    }
  });

  let fitScore = 50; // Starting baseline
  let matchesCount = 0;
  const missingSkills = [];

  if (jobSkills.length > 0) {
    jobSkills.forEach(skill => {
      if (extractedSkills.includes(skill)) {
        matchesCount++;
      } else {
        missingSkills.push(skill);
      }
    });
    const skillMatchPercentage = (matchesCount / jobSkills.length) * 100;
    fitScore = Math.round(skillMatchPercentage * 0.7 + Math.min(experienceYears * 5, 30));
  } else {
    // If no explicit skills found in job, grade based on candidate's raw skill inventory size
    fitScore = Math.min(50 + (extractedSkills.length * 4), 95);
  }

  // Ensure score stays inside bounds
  fitScore = Math.max(10, Math.min(fitScore, 99));

  // 4. Generate recommendations & summary
  let summary = `Candidate shows strong familiarity with ${extractedSkills.slice(0, 4).join(', ')}. `;
  if (experienceYears >= 5) {
    summary += `Boasts a senior profile with an estimated ${experienceYears} years of professional experience. `;
  } else {
    summary += `Possesses a mid/junior profile with around ${experienceYears} years of experience. `;
  }

  if (missingSkills.length > 0) {
    summary += `Key technical gaps identified in: ${missingSkills.slice(0, 3).join(', ')}. `;
  } else {
    summary += `Excellent stack alignment with the job requirements.`;
  }

  return {
    skills: extractedSkills.join(', '),
    experience: experienceYears,
    fitScore,
    summary
  };
}

/**
 * Generates an interview question based on resume skills and progress.
 */
export async function generateNextQuestion(candidate, job, prevMessages = [], questionIndex = 0, tone = 'Strict Technical Lead') {

  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateNextQuestionWithGemini(candidate, job, prevMessages, questionIndex, tone);
    } catch (error) {
      console.warn('Gemini question generation failed, falling back to OpenAI/local:', error.message);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateNextQuestionWithOpenAI(candidate, job, prevMessages, questionIndex, tone);
    } catch (error) {
      console.warn('OpenAI question generation failed, falling back to local simulator:', error.message);
    }
  }

  // Adaptive Question Pool based on index and candidate's skill set
  const skills = (candidate.skills || 'javascript, web development').split(',').map(s => s.trim().toLowerCase());
  const primarySkill = skills[0] || 'software engineering';
  const secondarySkill = skills[1] || 'coding practices';

  const questionsPool = [
    // Question 1: System architecture and experience
    `To start our interview, could you walk me through a challenging project you built using ${primarySkill}? Specifically, what architecture decisions did you make and how did you handle data flow or performance?`,
    
    // Question 2: Deep dive / technical detail
    `Excellent. Moving into specific tech topics, how do you handle state synchronization, asynchronous actions, or caching in applications built with ${primarySkill} or ${secondarySkill}? What are the potential bottlenecks?`,
    
    // Question 3: DevOps & Testing
    `Great. Now, considering the cloud/deployment aspects, how do you approach containerizing a ${primarySkill} application, ensuring smooth CI/CD pipelines, and managing application configuration across environment stages?`
  ];

  return questionsPool[questionIndex % questionsPool.length];
}

/**
 * Evaluates candidate responses to provide constructive score and review feedback.
 */
export async function evaluateAnswer(question, answer, candidateSkills = '') {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateAnswerWithGemini(question, answer);
    } catch (error) {
      console.warn('Gemini answer evaluation failed, falling back to OpenAI/local:', error.message);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await evaluateAnswerWithOpenAI(question, answer, candidateSkills);
    } catch (error) {
      console.warn('OpenAI answer evaluation failed, falling back to local evaluator:', error.message);
    }
  }

  const ans = answer.toLowerCase();
  let score = 50; // Starting baseline
  const constructiveFeedback = [];

  // Keywords that denote depth of explanation
  const technicalKeywords = [
    'architecture', 'scalable', 'performance', 'optimized', 'testing', 'security', 'caching',
    'docker', 'aws', 'database', 'rest api', 'graphql', 'ci/cd', 'components', 'state',
    'handling', 'asynchronous', 'promise', 'async/await', 'redux', 'design pattern', 'schema',
    'monitoring', 'logs', 'pipeline', 'deployment', 'nginx', 'load balancing', 'git', 'auth'
  ];

  let matches = 0;
  technicalKeywords.forEach(kw => {
    if (ans.includes(kw)) {
      matches++;
    }
  });

  score += matches * 7;

  // Length check (very short answers get penalized, rich explanations get rewarded)
  if (ans.split(/\s+/).length < 15) {
    score -= 20;
    constructiveFeedback.push("The response is brief. Expand your answers with specific architectural decisions, libraries used, or coding examples to highlight technical expertise.");
  } else if (ans.split(/\s+/).length > 80) {
    score += 10;
    constructiveFeedback.push("Excellent details and explanation depth provided.");
  }

  score = Math.max(30, Math.min(score, 98));

  if (matches >= 4) {
    constructiveFeedback.push(`Strong explanation of core technical components. You clearly articulated the usage of terms like ${technicalKeywords.filter(kw => ans.includes(kw)).slice(0, 3).join(', ')}.`);
  } else if (matches > 0) {
    constructiveFeedback.push("Solid foundation. For maximum scoring, try referencing concrete engineering paradigms, operational bottlenecks, or specific tools.");
  } else {
    constructiveFeedback.push("Try to incorporate more domain-specific terminology and system engineering practices rather than high-level general statements.");
  }

  return {
    score,
    feedback: constructiveFeedback.join(' ')
  };
}

// ==================== OpenAI API Integrations ====================

async function screenResumeWithOpenAI(resumeText, jobDescription) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = `You are an expert AI Technical Recruiter. Screen the following resume text against the job description.\n\nJob Description:\n${jobDescription}\n\nResume Text:\n${resumeText}\n\nReturn your response strictly in the following JSON format:\n{\n  "skills": "Comma-separated list of top matched technical skills",\n  "experience": "Estimated years of professional experience as an integer",\n  "fitScore": "Matching score between 10 and 100 representing job alignment",\n  "summary": "Concise 3-sentence summary covering background fit, gaps, and recommendations"\n}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { summary: text, skills: '', experience: 0, fitScore: 50 };
  }
}

async function generateNextQuestionWithOpenAI(candidate, job, prevMessages = [], questionIndex = 0, tone = 'Strict Technical Lead') {
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = `You are an AI technical interviewer acting as a: "${tone}". Given the candidate profile and job description, generate a technical interview question for round ${questionIndex + 1}.\n\nCandidate: ${JSON.stringify(candidate)}\nJob: ${JSON.stringify(job)}\n\nReturn only the question text aligned with your interviewer persona tone.`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Describe a technical challenge you solved.';
}

async function evaluateAnswerWithOpenAI(question, answer, candidateSkills = '') {
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = `You are an AI technical interviewer. Given the question, candidate answer, and their skills, provide a JSON with a score (30-98) and a short feedback string.\n\nQuestion: ${question}\nAnswer: ${answer}\nSkills: ${candidateSkills}\n\nReturn JSON: { "score": 0, "feedback": "..." }`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { score: 50, feedback: text };
  }
}

// ==================== Live Gemini API Integrations ====================

async function screenResumeWithGemini(resumeText, jobDescription) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const prompt = `
    You are an expert AI Technical Recruiter. Screen the following resume text against the job description.
    
    Job Description:
    ${jobDescription}
    
    Resume Text:
    ${resumeText}
    
    Return your response strictly in the following JSON format:
    {
      "skills": "Comma-separated list of top matched technical skills",
      "experience": "Estimated years of professional experience as an integer",
      "fitScore": "Matching score between 10 and 100 representing job alignment",
      "summary": "Concise 3-sentence summary covering background fit, gaps, and recommendations"
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  return JSON.parse(rawText.trim());
}

async function generateNextQuestionWithGemini(candidate, job, prevMessages, questionIndex, tone = 'Strict Technical Lead') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const conversationContext = prevMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n');

  const prompt = `
    You are conducting a technical interview for the job: "${job.title}".
    Your interviewer persona tone is: "${tone}". Keep all your questions aligned with this personality context.
    Job Description: ${job.description}
    Candidate Profile:
    - Name: ${candidate.name}
    - Skills: ${candidate.skills}
    - Experience: ${candidate.experience} years
    - Screen Fit Score: ${candidate.fit_score}%
    
    This is question #${questionIndex + 1} of the interview. 
    Here is the history of the conversation so far:
    ${conversationContext}
    
    Formulate the next challenging technical question. Tailor it to the candidate's skills and the job requirements. Keep it professional, yet aligned with your tone persona.
    Return ONLY the question text. Do not write any greetings or side commentary.
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

async function evaluateAnswerWithGemini(question, answer) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `
    Grade the candidate's response to the following interview question.
    
    Question:
    ${question}
    
    Candidate Answer:
    ${answer}
    
    Assess for accuracy, depth, architectural correctness, and practical terminology.
    Return your response strictly in the following JSON format:
    {
      "score": "Numeric score between 0 and 100 based on answer accuracy and quality",
      "feedback": "Constructive 2-3 sentence review mentioning the strengths and weaknesses of the candidate's answer"
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  return JSON.parse(rawText.trim());
}

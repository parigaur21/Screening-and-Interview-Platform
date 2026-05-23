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

/**
 * Parses and evaluates resume text against job requirements.
 */
export async function screenResume(resumeText, jobDescription) {
  // If a Gemini API Key is configured, we can implement the real LLM call!
  if (process.env.GEMINI_API_KEY) {
    try {
      return await screenResumeWithGemini(resumeText, jobDescription);
    } catch (error) {
      console.warn('Gemini screening failed, falling back to local parsing:', error.message);
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
export async function generateNextQuestion(candidate, job, prevMessages = [], questionIndex = 0) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateNextQuestionWithGemini(candidate, job, prevMessages, questionIndex);
    } catch (error) {
      console.warn('Gemini question generation failed, falling back to local simulator:', error.message);
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
      console.warn('Gemini answer evaluation failed, falling back to local evaluator:', error.message);
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

async function generateNextQuestionWithGemini(candidate, job, prevMessages, questionIndex) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const conversationContext = prevMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n');

  const prompt = `
    You are conducting a technical interview for the job: "${job.title}".
    Job Description: ${job.description}
    Candidate Profile:
    - Name: ${candidate.name}
    - Skills: ${candidate.skills}
    - Experience: ${candidate.experience} years
    - Screen Fit Score: ${candidate.fit_score}%
    
    This is question #${questionIndex + 1} of the interview. 
    Here is the history of the conversation so far:
    ${conversationContext}
    
    Formulate the next challenging technical question. Tailor it to the candidate's skills and the job requirements. Keep it professional, encouraging, yet technically deep.
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

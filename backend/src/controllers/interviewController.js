import * as db from '../config/db.js';
import * as aiService from '../services/aiService.js';

/**
 * Starts a new mock interview session for a candidate.
 */
export async function startInterviewSession(req, res) {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'candidateId is required.' });
    }

    // Retrieve candidate and job metadata
    const candidates = await db.query(
      `SELECT c.*, j.title as job_title, j.description as job_description 
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE c.id = $1`,
      [candidateId]
    );

    if (candidates.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    const candidate = candidates[0];

    // Check if an interview session already exists
    const existingSessions = await db.query(
      'SELECT * FROM interviews WHERE candidate_id = $1',
      [candidateId]
    );

    let interviewId;
    let currentQuestionIndex = 0;
    let initialQuestion = '';

    if (existingSessions.length > 0) {
      const activeSession = existingSessions[0];
      interviewId = activeSession.id;
      currentQuestionIndex = activeSession.current_question_index;

      // Fetch the last question generated (if any) or generate a new one
      const lastAiMessages = await db.query(
        `SELECT content FROM messages 
         WHERE interview_id = $1 AND sender = 'Interviewer' 
         ORDER BY created_at DESC LIMIT 1`,
        [interviewId]
      );

      if (lastAiMessages.length > 0) {
        initialQuestion = lastAiMessages[0].content;
      } else {
        initialQuestion = await aiService.generateNextQuestion(candidate, { title: candidate.job_title, description: candidate.job_description }, [], 0);
        const msgId = `msg-${Date.now()}`;
        await db.execute(
          `INSERT INTO messages (id, interview_id, sender, content) VALUES ($1, $2, $3, $4)`,
          [msgId, interviewId, 'Interviewer', initialQuestion]
        );
      }
    } else {
      // Create a brand new session
      interviewId = `int-${Date.now()}`;
      await db.execute(
        `INSERT INTO interviews (id, candidate_id, status, current_question_index)
         VALUES ($1, $2, $3, $4)`,
        [interviewId, candidateId, 'Ongoing', 0]
      );

      // Update candidate routing status to "Interviewing"
      await db.execute(
        `UPDATE candidates SET status = 'Interviewing' WHERE id = $1`,
        [candidateId]
      );

      // Generate the initial interview question
      initialQuestion = await aiService.generateNextQuestion(candidate, { title: candidate.job_title, description: candidate.job_description }, [], 0);
      const msgId = `msg-${Date.now()}`;
      await db.execute(
        `INSERT INTO messages (id, interview_id, sender, content) VALUES ($1, $2, $3, $4)`,
        [msgId, interviewId, 'Interviewer', initialQuestion]
      );
    }

    res.status(200).json({
      success: true,
      data: {
        interviewId,
        candidateId,
        candidateName: candidate.name,
        jobTitle: candidate.job_title,
        currentQuestionIndex,
        question: initialQuestion
      }
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ success: false, message: 'Failed to start interview session.' });
  }
}

/**
 * Handles candidate's response submission, evaluates it, and advances state.
 */
export async function submitCandidateResponse(req, res) {
  try {
    const { interviewId, answer } = req.body;

    if (!interviewId || !answer || answer.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'interviewId and non-empty answer are required.' });
    }

    // 1. Fetch current interview and candidate status
    const interviews = await db.query(
      `SELECT i.*, c.id as candidate_id, c.name as candidate_name, c.skills as candidate_skills,
              j.title as job_title, j.description as job_description
       FROM interviews i
       JOIN candidates c ON i.candidate_id = c.id
       JOIN jobs j ON c.job_id = j.id
       WHERE i.id = $1`,
      [interviewId]
    );

    if (interviews.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    const session = interviews[0];

    if (session.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'This interview has already been completed.' });
    }

    // Get the question the candidate is responding to
    const questionsList = await db.query(
      `SELECT content FROM messages 
       WHERE interview_id = $1 AND sender = 'Interviewer' 
       ORDER BY created_at DESC LIMIT 1`,
      [interviewId]
    );
    const activeQuestion = questionsList[0]?.content || 'Explain your background experience.';

    // 2. Evaluate the answer
    console.log(`🧠 AI Evaluation: Grading candidate's response...`);
    const evaluation = await aiService.evaluateAnswer(activeQuestion, answer, session.candidate_skills);

    // 3. Save candidate's response and grade details
    const candidateMsgId = `msg-cand-${Date.now()}`;
    await db.execute(
      `INSERT INTO messages (id, interview_id, sender, content, score, feedback)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [candidateMsgId, interviewId, 'Candidate', answer, evaluation.score, evaluation.feedback]
    );

    // 4. Progress index
    const nextQuestionIndex = session.current_question_index + 1;
    const maxQuestions = 3; // Standard 3 rounds configuration

    if (nextQuestionIndex >= maxQuestions) {
      // ===== Finalize Interview =====
      console.log(`🏁 AI Evaluation: Completing interview session ${interviewId}...`);
      
      // Calculate overall stats from candidate's answers
      const scoresList = await db.query(
        `SELECT score FROM messages WHERE interview_id = $1 AND sender = 'Candidate'`,
        [interviewId]
      );

      const totalScore = scoresList.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const avgScore = Math.round(totalScore / scoresList.length);

      // Generate a structured overall executive feedback
      let finalFeedback = `Candidate completed all ${maxQuestions} interview stages. `;
      if (avgScore >= 75) {
        finalFeedback += `Demonstrated strong system architecture comprehension and excellent tool familiarity. Strong technical match.`;
      } else if (avgScore >= 50) {
        finalFeedback += `Has a solid junior-to-mid foundation. However, could benefit from expanding explanations with detailed operational paradigms and concrete database structures.`;
      } else {
        finalFeedback += `Responses were generally lacking details or terminology depth. Recommended for training or junior support placement.`;
      }

      // Update session status to completed
      await db.execute(
        `UPDATE interviews 
         SET status = 'Completed', current_question_index = $1, score = $2, overall_feedback = $3 
         WHERE id = $4`,
        [nextQuestionIndex, avgScore, finalFeedback, interviewId]
      );

      // Auto-update candidate recruitment status
      const recruitedStatus = avgScore >= 75 ? 'Selected' : 'Rejected';
      await db.execute(
        `UPDATE candidates SET status = $1 WHERE id = $2`,
        [recruitedStatus, session.candidate_id]
      );

      return res.status(200).json({
        success: true,
        data: {
          isCompleted: true,
          score: avgScore,
          feedback: finalFeedback,
          evaluation: {
            score: evaluation.score,
            feedback: evaluation.feedback
          }
        }
      });
    } else {
      // ===== Advance to Next Question =====
      // Increment session question index
      await db.execute(
        `UPDATE interviews SET current_question_index = $1 WHERE id = $2`,
        [nextQuestionIndex, interviewId]
      );

      // Retrieve all history for Gemini API context
      const chatHistory = await db.query(
        `SELECT sender, content FROM messages WHERE interview_id = $1 ORDER BY created_at ASC`,
        [interviewId]
      );

      const nextQuestion = await aiService.generateNextQuestion(
        { id: session.candidate_id, name: session.candidate_name, skills: session.candidate_skills, fit_score: session.fit_score, experience: session.experience },
        { title: session.job_title, description: session.job_description },
        chatHistory,
        nextQuestionIndex
      );

      // Save the new question
      const interviewerMsgId = `msg-ai-${Date.now()}`;
      await db.execute(
        `INSERT INTO messages (id, interview_id, sender, content) VALUES ($1, $2, $3, $4)`,
        [interviewerMsgId, interviewId, 'Interviewer', nextQuestion]
      );

      res.status(200).json({
        success: true,
        data: {
          isCompleted: false,
          currentQuestionIndex: nextQuestionIndex,
          question: nextQuestion,
          evaluation: {
            score: evaluation.score,
            feedback: evaluation.feedback
          }
        }
      });
    }
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ success: false, message: 'Failed to process interview response.' });
  }
}

/**
 * Returns complete logs and transcripts for an active/completed interview session.
 */
export async function getInterviewDetails(req, res) {
  try {
    const { candidateId } = req.params;

    const sessions = await db.query(
      `SELECT i.*, c.name as candidate_name, c.email as candidate_email, c.fit_score as screening_fit,
              j.title as job_title 
       FROM interviews i
       JOIN candidates c ON i.candidate_id = c.id
       JOIN jobs j ON c.job_id = j.id
       WHERE i.candidate_id = $1`,
      [candidateId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'No interview session found for this candidate.' });
    }
    const session = sessions[0];

    // Fetch messages chronological ledger
    const messages = await db.query(
      `SELECT * FROM messages WHERE interview_id = $1 ORDER BY created_at ASC`,
      [session.id]
    );

    res.json({
      success: true,
      data: {
        session,
        messages
      }
    });
  } catch (error) {
    console.error('Get interview details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interview metrics.' });
  }
}

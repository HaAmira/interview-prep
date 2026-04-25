const express = require('express');
const router = express.Router();
const { groq } = require('../utils/groq');
const Interview = require('../models/Interview');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

router.post('/start', protect, async (req, res) => {
    try {
        const { targetRole, targetCompany, jobDescription, interviewType, techStack } = req.body;
        
        let systemPrompt = '';
        if (interviewType === 'tech-stack') {
             systemPrompt = `You are an expert technical interviewer specializing in the ${techStack} technology stack. 
Your goal is to conduct a realistic, rigorous technical interview focusing on ${techStack}. Ask one question at a time. Probe deeper into their answers. If they don't know something, behave like a real interviewer. 
Start by greeting the candidate, introducing yourself briefly, and asking the first technical question about ${techStack}.`;
        } else {
             systemPrompt = `You are an expert technical and behavioral interviewer for ${targetCompany || 'a top technology company'} interviewing a candidate for the role of ${targetRole}. 
Job Description: ${jobDescription || 'N/A'}. 
Your goal is to conduct a realistic, rigorous interview. Ask one question at a time. Probe deeper into their answers. If they don't know something, behave like a real interviewer. 
Start by greeting the candidate, introducing yourself briefly, and asking the first question.`;
        }

        // Initialize Groq chat
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "assistant", content: "Understood. I will act as the interviewer." },
            { role: "user", content: "Start the interview." }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
        });
        
        const aiMessage = chatCompletion.choices[0]?.message?.content || "";

        const interview = new Interview({
            userId: req.user.id,
            interviewType: interviewType || 'role',
            techStack,
            targetRole,
            targetCompany,
            jobDescription,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'ai', content: aiMessage }
            ]
        });
        await interview.save();

        res.status(201).json({ interviewId: interview._id, message: aiMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/reply', protect, async (req, res) => {
    try {
        const { content } = req.body;
        const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        if (interview.status === 'completed') return res.status(400).json({ message: 'Interview completed' });

        interview.messages.push({ role: 'user', content });
        
        // Reconstruct history
        const history = interview.messages.map(m => {
             if(m.role === 'system'){
                 return { role: "system", content: m.content };
             }
             if(m.role === 'ai') {
                 return { role: "assistant", content: m.content };
             }
             return { role: "user", content: m.content };
        });

        // Insert initial acknowledgment for the system prompt
        history.splice(1, 0, { role: "assistant", content: "Understood. I will act as the interviewer." });

        const chatCompletion = await groq.chat.completions.create({
            messages: history,
            model: "llama-3.3-70b-versatile",
        });
        
        const aiMessage = chatCompletion.choices[0]?.message?.content || "";

        interview.messages.push({ role: 'ai', content: aiMessage });
        await interview.save();

        res.status(200).json({ message: aiMessage });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/end', protect, async (req, res) => {
    try {
        const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        // Generate feedback
        const feedbackPrompt = `The interview is over. Here is the entire conversation:
${interview.messages.map(m => m.role + ': ' + m.content).join('\n')}

Please provide a comprehensive feedback report for the candidate. Focus on the following and format it clearly:
1. Strengths: Highlight what the candidate did well.
2. Weak topics (Areas for improvement): Clearly identify weak topics or concepts the candidate struggled with.
3. Questions and Answers Review: List all the questions asked during the interview along with the candidate's answers.
4. Suggestions for Improvement: For each weak topic or incorrect answer, provide specific, actionable suggestions on how to improve. Please include references to learning materials (e.g., "Source: Check out the React Docs on useEffect" or provide specific concept names to study).
5. Provide an overall score out of 100. Write the score on the exact last line as "Score: X"`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: feedbackPrompt }],
            model: "llama-3.3-70b-versatile",
        });
        const feedbackText = chatCompletion.choices[0]?.message?.content || "";

        let score = 0;
        const scoreMatch = feedbackText.match(/Score:\s*(\d+)/i);
        if (scoreMatch) score = parseInt(scoreMatch[1]);

        interview.status = 'completed';
        interview.feedback = feedbackText;
        interview.score = score;
        await interview.save();

        res.status(200).json({ feedback: feedbackText, score });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/history', protect, async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select('-messages'); // exclude messages to keep payload small
        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

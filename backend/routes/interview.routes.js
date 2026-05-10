const express = require('express');
const router = express.Router();
const { groq } = require('../utils/groq');
const Interview = require('../models/Interview');
const jwt = require('jsonwebtoken');

const MODEL = "llama-3.3-70b-versatile";

const questionFocusAreas = [
    'fundamentals and core concepts',
    'real project experience',
    'debugging and troubleshooting',
    'performance and optimization',
    'security and edge cases',
    'system design trade-offs',
    'testing and maintainability',
    'collaboration and communication',
    'architecture decisions',
    'production incident handling'
];

const liveAnswerRule = `During the live interview:
- Ask exactly one interview question at a time.
- After each candidate answer, respond in this short format only:
  "Verdict: Correct/Partially correct/Not correct - <one short reason>."
  "Next question: <one question>"
- Keep the whole reply under 80 words.
- Do not teach the full correct answer during the live interview. Save detailed correct answers for the final report.
- Never repeat a question that already appears in this interview.
- If the candidate asks to end the interview, tell them to click End Interview and do not ask another question.`;

const clampScore = (score) => Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));

const limitWords = (text = '', maxWords = 22) => {
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length <= maxWords) return words.join(' ');
    return `${words.slice(0, maxWords).join(' ')}...`;
};

const extractJsonObject = (text) => {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch (error) {
        return null;
    }
};

const buildFeedbackText = (report, score) => {
    const questionReviews = Array.isArray(report.questionReviews) ? report.questionReviews : [];
    const strengths = Array.isArray(report.strengths) ? report.strengths : [];
    const weakTopics = Array.isArray(report.weakTopics) ? report.weakTopics : [];
    const suggestions = Array.isArray(report.suggestions) ? report.suggestions : [];

    const lines = [
        'Interview Feedback Report',
        '',
        'Strengths:',
        ...(strengths.length ? strengths.map(item => `- ${item}`) : ['- Not enough strong evidence was captured in the interview.']),
        '',
        'Weak Topics:',
        ...(weakTopics.length ? weakTopics.map(item => `- ${item}`) : ['- No major weak topic was clearly identified.']),
        '',
        'Questions and Answers Review:',
    ];

    if (questionReviews.length) {
        questionReviews.forEach((item, index) => {
            lines.push(
                '',
                `${index + 1}. Question: ${item.question || 'Question not captured'}`,
                `Candidate answer: ${item.candidateAnswer || 'No answer captured'}`,
                `Verdict: ${item.verdict || 'Not assessed'}`,
                `Correct answer: ${item.correctAnswer || 'No model answer available.'}`,
                `How to answer the interviewer: ${item.interviewerAnswerTip || 'Give a direct answer first, then support it with a concise example.'}`
            );
        });
    } else {
        lines.push('- No question and answer pairs were available to review.');
    }

    lines.push(
        '',
        'Suggestions for Improvement:',
        ...(suggestions.length ? suggestions.map(item => `- ${item}`) : ['- Practice answering with a clear point, brief reasoning, and one concrete example.']),
        '',
        `Score: ${score}`
    );

    return lines.join('\n');
};

const formatInitialQuestion = (data, fallbackTopic) => {
    const greeting = limitWords(data.greeting || 'Hello, I will be your interviewer today.', 16);
    const question = data.question || `Can you explain one important concept in ${fallbackTopic}?`;
    return `${greeting}\n\nQuestion: ${question}`;
};

const formatLiveReply = (data) => {
    const allowedVerdicts = ['Correct', 'Partially correct', 'Not correct'];
    const verdict = allowedVerdicts.find(item => item.toLowerCase() === String(data.verdict || '').toLowerCase()) || 'Partially correct';
    const reason = limitWords(data.reason || 'Your answer needs a little more precision.', 18);
    const nextQuestion = data.nextQuestion || 'Can you give a practical example from a project you worked on?';

    return `Verdict: ${verdict} - ${reason}\nNext question: ${nextQuestion}`;
};

const getQuestionFocus = () => {
    const index = Math.floor(Math.random() * questionFocusAreas.length);
    return questionFocusAreas[index];
};

const extractAskedQuestions = (messages = []) => {
    return messages
        .filter(message => message.role === 'ai')
        .flatMap(message => message.content.split('\n'))
        .map(line => line.trim())
        .filter(line => line.includes('?'))
        .map(line => line.replace(/^Next question:\s*/i, '').replace(/^Question:\s*/i, '').trim())
        .filter(Boolean);
};

const extractQuestionFromAiMessage = (content = '') => {
    const nextQuestionMatch = content.match(/Next question:\s*([\s\S]*?\?)/i);
    if (nextQuestionMatch) return nextQuestionMatch[1].trim();

    const questionMatch = content.match(/Question:\s*([\s\S]*?\?)/i);
    if (questionMatch) return questionMatch[1].trim();

    const questions = content.match(/[^?]+\?/g) || [];
    return questions.length ? questions[questions.length - 1].trim() : '';
};

const extractQuestionAnswerPairs = (messages = []) => {
    const pairs = [];
    let pendingQuestion = '';

    messages.forEach(message => {
        if (message.role === 'ai') {
            const question = extractQuestionFromAiMessage(message.content);
            if (question) pendingQuestion = question;
        }

        if (message.role === 'user' && pendingQuestion) {
            pairs.push({
                question: pendingQuestion,
                candidateAnswer: message.content
            });
            pendingQuestion = '';
        }
    });

    return pairs;
};

const normalizeReport = (report) => ({
    strengths: Array.isArray(report.strengths) ? report.strengths : [],
    weakTopics: Array.isArray(report.weakTopics) ? report.weakTopics : [],
    questionReviews: Array.isArray(report.questionReviews) ? report.questionReviews.map(item => ({
        question: item.question || 'Question not captured',
        candidateAnswer: item.candidateAnswer || 'No answer captured',
        verdict: item.verdict || 'Not assessed',
        questionScore: clampScore(parseInt(item.questionScore, 10)),
        correctAnswer: item.correctAnswer || 'No model answer available.',
        interviewerAnswerTip: item.interviewerAnswerTip || 'Give a direct answer first, then support it with a concise example.',
        whyIncorrect: item.whyIncorrect || item.reason || ''
    })) : [],
    suggestions: Array.isArray(report.suggestions) ? report.suggestions : [],
});

const hasUsefulReport = (interview) => {
    if (Array.isArray(interview.feedbackReport?.questionReviews) && interview.feedbackReport.questionReviews.length > 0) {
        return true;
    }

    return Boolean(interview.feedback && /\d+\.\s+Question:/i.test(interview.feedback));
};

const mergeReportWithPairs = (report, pairs) => {
    const normalized = normalizeReport(report);
    const reviewsByQuestion = new Map(
        normalized.questionReviews.map(review => [String(review.question).toLowerCase().trim(), review])
    );

    const questionReviews = pairs.map(pair => {
        const key = String(pair.question).toLowerCase().trim();
        const generated = reviewsByQuestion.get(key);

        return {
            question: pair.question,
            candidateAnswer: pair.candidateAnswer,
            verdict: generated?.verdict || 'Not assessed',
            questionScore: clampScore(parseInt(generated?.questionScore, 10)),
            correctAnswer: generated?.correctAnswer || 'A correct answer could not be generated for this question. Review the topic and compare your answer with official documentation or trusted learning material.',
            interviewerAnswerTip: generated?.interviewerAnswerTip || 'Answer directly first, then add the reasoning and one concrete project example.',
            whyIncorrect: generated?.whyIncorrect || generated?.reason || 'The report generator did not provide a specific explanation for this answer.'
        };
    });

    const weakTopics = normalized.weakTopics.length
        ? normalized.weakTopics
        : questionReviews
            .filter(review => !String(review.verdict).toLowerCase().includes('correct') || String(review.verdict).toLowerCase().includes('partial'))
            .map(review => `Improve the concept behind: ${review.question}`);

    return {
        strengths: normalized.strengths.length ? normalized.strengths : ['Completed the interview questions and provided answers for review.'],
        weakTopics,
        suggestions: normalized.suggestions.length
            ? normalized.suggestions
            : ['Review each weak question, write a 4-5 sentence ideal answer, then practice saying it aloud with one project example.'],
        questionReviews
    };
};

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
        const questionFocus = getQuestionFocus();
        const recentInterviewQuery = {
            userId: req.user.id,
            interviewType: interviewType || 'role'
        };

        if (interviewType === 'tech-stack' && techStack) {
            recentInterviewQuery.techStack = techStack;
        }

        if (interviewType !== 'tech-stack' && targetRole) {
            recentInterviewQuery.targetRole = targetRole;
        }

        const recentInterviews = await Interview.find(recentInterviewQuery)
            .sort({ createdAt: -1 })
            .limit(5)
            .select('messages');
        const recentQuestions = recentInterviews.flatMap(item => extractAskedQuestions(item.messages)).slice(0, 12);
        const recentQuestionRule = recentQuestions.length
            ? `Avoid repeating these questions from the user's recent interviews:\n${recentQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}`
            : '';
        
        let systemPrompt = '';
        if (interviewType === 'tech-stack') {
             systemPrompt = `You are an expert technical interviewer specializing in the ${techStack} technology stack. 
Your goal is to conduct a realistic, rigorous technical interview focusing on ${techStack}. Ask one question at a time. Probe deeper into their answers. If they don't know something, behave like a real interviewer. 
${liveAnswerRule}
${recentQuestionRule}
This interview's question focus should start with ${questionFocus}, then rotate to different topics.
Start by greeting the candidate, introducing yourself briefly, and asking one fresh technical question about ${techStack}.`;
        } else {
             systemPrompt = `You are an expert technical and behavioral interviewer for ${targetCompany || 'a top technology company'} interviewing a candidate for the role of ${targetRole}. 
Job Description: ${jobDescription || 'N/A'}. 
Your goal is to conduct a realistic, rigorous interview. Ask one question at a time. Probe deeper into their answers. If they don't know something, behave like a real interviewer. 
${liveAnswerRule}
${recentQuestionRule}
This interview's question focus should start with ${questionFocus}, then rotate to different topics.
Start by greeting the candidate, introducing yourself briefly, and asking one fresh question for this role.`;
        }

        // Initialize Groq chat
        const messages = [
            {
                role: "system",
                content: `${systemPrompt}
Return only valid JSON with this shape:
{"greeting":"short greeting under 12 words","question":"one fresh interview question"}`
            },
            { role: "user", content: "Start the interview." }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: MODEL,
            temperature: 0.75,
            max_completion_tokens: 180,
            response_format: { type: "json_object" },
        });
        
        const rawMessage = chatCompletion.choices[0]?.message?.content || "";
        const aiMessage = formatInitialQuestion(extractJsonObject(rawMessage) || {}, interviewType === 'tech-stack' ? techStack : targetRole);

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
        
        const askedQuestions = extractAskedQuestions(interview.messages);

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
        history.push({
            role: "system",
            content: `${liveAnswerRule}
Return only valid JSON with this exact shape:
{"verdict":"Correct or Partially correct or Not correct","reason":"one short reason under 18 words","nextQuestion":"one new interview question"}`
        });
        if (askedQuestions.length) {
            history.push({
                role: "system",
                content: `Already asked questions in this interview. Do not repeat or rephrase these as the next question:\n${askedQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}`
            });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: history,
            model: MODEL,
            temperature: 0.45,
            max_completion_tokens: 220,
            response_format: { type: "json_object" },
        });
        
        const rawMessage = chatCompletion.choices[0]?.message?.content || "";
        const aiMessage = formatLiveReply(extractJsonObject(rawMessage) || {});

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
        if (interview.status === 'completed' && hasUsefulReport(interview)) {
            return res.status(200).json({ feedback: interview.feedback, feedbackReport: interview.feedbackReport, score: interview.score });
        }

        const questionAnswerPairs = extractQuestionAnswerPairs(interview.messages);

        // Generate feedback
        const feedbackPrompt = `The interview is over.

Question-answer pairs to review:
${JSON.stringify(questionAnswerPairs, null, 2)}

Return only valid JSON. Do not use markdown.
Use this shape:
{
  "strengths": ["specific strength"],
  "weakTopics": ["specific weak topic"],
  "questionReviews": [
    {
      "question": "exact interview question",
      "candidateAnswer": "candidate's answer or no answer captured",
      "verdict": "Correct/Partially correct/Not correct",
      "questionScore": 0,
      "correctAnswer": "complete correct answer",
      "interviewerAnswerTip": "how the candidate should answer this to an interviewer",
      "whyIncorrect": "short explanation of what was missing or wrong; empty string if correct"
    }
  ],
  "suggestions": ["specific actionable improvement with concept/source to study"]
}

Rules:
- Include exactly ${questionAnswerPairs.length} questionReviews, one for each question-answer pair above.
- Copy each question and candidateAnswer from the provided pairs exactly.
- Do not invent questions that were not asked.
- questionScore must be an integer from 0 to 100 based only on the candidate's answer quality.
- verdict must be exactly one of: Correct, Partially correct, Not correct.
- whyIncorrect must explain what was missing or wrong. If correct, explain briefly why it was correct.
- Give complete correct answers in the final report, but keep wording practical and interview-ready.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: feedbackPrompt }],
            model: MODEL,
            temperature: 0,
            max_completion_tokens: 3500,
            response_format: { type: "json_object" },
        });
        const rawFeedback = chatCompletion.choices[0]?.message?.content || "";
        const report = mergeReportWithPairs(extractJsonObject(rawFeedback) || {}, questionAnswerPairs);
        const questionScores = Array.isArray(report.questionReviews)
            ? report.questionReviews
                .map(item => clampScore(parseInt(item.questionScore, 10)))
                .filter(score => Number.isFinite(score))
            : [];
        const score = questionScores.length
            ? Math.round(questionScores.reduce((sum, value) => sum + value, 0) / questionScores.length)
            : 0;
        const feedbackText = buildFeedbackText(report, score);

        interview.status = 'completed';
        interview.feedback = feedbackText;
        interview.feedbackReport = { ...report, score };
        interview.score = score;
        await interview.save();

        res.status(200).json({ feedback: feedbackText, feedbackReport: interview.feedbackReport, score });

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

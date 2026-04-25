const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['ai', 'user', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const interviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interviewType: { type: String, enum: ['role', 'tech-stack'], default: 'role' },
    techStack: { type: String },
    targetRole: { type: String },
    targetCompany: { type: String },
    jobDescription: { type: String },
    messages: [messageSchema],
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    feedback: { type: String },
    score: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);

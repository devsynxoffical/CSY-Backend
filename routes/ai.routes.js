const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const aiController = require('../controllers/ai.controller');

// All AI routes require authentication
router.use(authenticate);

// Get personalized recommendations
router.get('/recommendations', aiController.getRecommendations);

// Chat with AI Assistant
router.post('/chat', aiController.chat);

module.exports = router;

const { aiAssistantService } = require('../services'); // Ensure service is exported in index
const { logger } = require('../utils');
const { USER_ROLES } = require('../config/constants'); // If exists, otherwise assume string

/**
 * AI Controller
 */
class AIController {

    /**
     * Get personalized recommendations
     */
    async getRecommendations(req, res) {
        try {
            const userId = req.user.id;
            // Get query params for preferences
            const preferences = req.query;

            // Use AI service
            // Note: aiAssistantService export name in services/index.js needs verification. 
            // Usually it's exported as aiAssistantService or similiar.
            // Based on file content it exports new AIAssistantService() directly.
            // Assuming services/index.js exports it correctly.

            const recommendations = await aiAssistantService.generateRecommendations(userId, preferences);

            res.json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            logger.error('Get recommendations failed', { userId: req.user.id, error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to generate recommendations',
                error: error.message
            });
        }
    }

    /**
     * Chat with AI Assistant
     */
    async chat(req, res) {
        try {
            const userId = req.user.id;
            const { message, context } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const response = await aiAssistantService.generateResponse(userId, message, context);

            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            logger.error('AI Chat failed', { userId: req.user.id, error: error.message });
            res.status(500).json({
                success: false,
                message: 'AI service temporarily unavailable',
                error: error.message
            });
        }
    }
}

module.exports = new AIController();

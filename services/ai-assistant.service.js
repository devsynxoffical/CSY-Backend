const { prisma } = require('../models');
const { logger } = require('../utils');

/**
 * AI Assistant Service for handling AI-powered features
 */
class AIAssistantService {
  constructor() {
    this.providers = {
      openai: this.initializeOpenAI(),
      anthropic: this.initializeAnthropic(),
      local: null // For local AI models
    };

    this.activeProvider = process.env.AI_PROVIDER || 'openai';
    this.templates = this.loadTemplates();
  }

  /**
   * Initialize OpenAI provider
   */
  initializeOpenAI() {
    try {
      const OpenAI = require('openai');
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.warn('OpenAI API key not configured');
        return null;
      }
      return new OpenAI({
        apiKey: apiKey
      });
    } catch (error) {
      logger.warn('OpenAI not available', { error: error.message });
      return null;
    }
  }

  /**
   * Initialize Anthropic provider
   */
  initializeAnthropic() {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logger.warn('Anthropic API key not configured');
        return null;
      }
      return new Anthropic({
        apiKey: apiKey
      });
    } catch (error) {
      logger.warn('Anthropic not available', { error: error.message });
      return null;
    }
  }

  /**
   * Load AI conversation templates
   */
  loadTemplates() {
    return {
      welcome: {
        systemPrompt: `You are CSY, an AI assistant for the CSY Pro food delivery and reservation app.
        You help users with:
        - Finding restaurants and businesses
        - Making reservations
        - Placing food orders
        - Getting recommendations
        - Answering questions about the app

        Always be friendly, helpful, and concise. Use Arabic when appropriate but default to English.
        Keep responses under 200 characters when possible.`,

        userPrompt: `Hello! I'm {name}, how can I help you today?`
      },

      restaurant_search: {
        systemPrompt: `Help users find restaurants based on their preferences.
        Consider cuisine type, location, price range, and ratings.
        Provide specific recommendations with brief descriptions.`,

        examples: [
          "I want Italian food near downtown",
          "Show me highly rated restaurants under 200 EGP"
        ]
      },

      order_help: {
        systemPrompt: `Assist users with placing orders and understanding the ordering process.
        Explain menu items, customization options, and delivery information.`,

        examples: [
          "How do I add special instructions to my order?",
          "What's the delivery time for pizza?"
        ]
      },

      reservation_help: {
        systemPrompt: `Help users make reservations at businesses.
        Explain availability, cancellation policies, and reservation requirements.`,

        examples: [
          "I want to book a table for 4 people tomorrow",
          "How far in advance can I make a reservation?"
        ]
      },

      general_support: {
        systemPrompt: `Provide general support for app usage, account management, and troubleshooting.
        Direct users to appropriate help resources when needed.`,

        examples: [
          "How do I change my password?",
          "Why was my order delayed?"
        ]
      }
    };
  }

  /**
   * Generate AI response
   */
  async generateResponse(userId, message, context = {}) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const conversation = await this.getConversationHistory(userId);
      const systemPrompt = this.buildSystemPrompt(user, context);
      const messages = this.buildMessages(conversation, message, systemPrompt);

      let response;
      switch (this.activeProvider) {
        case 'openai':
          response = await this.callOpenAI(messages);
          break;
        case 'anthropic':
          response = await this.callAnthropic(messages);
          break;
        default:
          response = this.generateFallbackResponse(message);
      }

      // Save conversation
      await this.saveConversation(userId, message, response, context);

      logger.info('AI response generated', {
        userId,
        messageLength: message.length,
        responseLength: response.length,
        provider: this.activeProvider
      });

      return {
        response,
        provider: this.activeProvider,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('AI response generation failed', {
        userId,
        error: error.message
      });

      return {
        response: this.generateFallbackResponse(message),
        provider: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(messages) {
    const openai = this.providers.openai;
    if (!openai) {
      throw new Error('OpenAI provider not available');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 300,
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(messages) {
    const anthropic = this.providers.anthropic;
    if (!anthropic) {
      throw new Error('Anthropic provider not available');
    }

    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 300,
      temperature: 0.7,
      system: systemMessage?.content || '',
      messages: conversationMessages
    });

    return response.content[0].text.trim();
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  generateFallbackResponse(message) {
    const fallbackResponses = [
      "I'm here to help! Please try rephrasing your question.",
      "I understand you're asking about our services. Let me connect you with our support team.",
      "For detailed assistance, please visit our help center or contact customer support.",
      "I'm currently experiencing some technical difficulties. Please try again in a moment."
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Build system prompt
   */
  buildSystemPrompt(user, context) {
    let prompt = this.templates.welcome.systemPrompt;

    // Add user context
    if (user) {
      prompt += `\n\nUser Information:
      - Name: ${user.full_name}
      - Location: ${user.governorate_code || 'Unknown'}
      - Preferred Language: ${context.language || 'English'}`;
    }

    // Add context-specific instructions
    if (context.intent) {
      const template = this.templates[context.intent];
      if (template) {
        prompt += `\n\n${template.systemPrompt}`;
      }
    }

    return prompt;
  }

  /**
   * Build messages array for AI
   */
  buildMessages(conversation, newMessage, systemPrompt) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 5 exchanges)
    const recentHistory = conversation.slice(-10); // 5 user + 5 assistant messages
    messages.push(...recentHistory);

    // Add new user message
    messages.push({ role: 'user', content: newMessage });

    return messages;
  }

  /**
   * Get conversation history for user
   */
  async getConversationHistory(userId) {
    // This would typically fetch from a database
    // For now, return empty array (stateless conversations)
    return [];
  }

  /**
   * Save conversation to database
   */
  async saveConversation(userId, userMessage, aiResponse, context) {
    // This would save to a conversations table
    // For now, just log the interaction
    logger.debug('Conversation saved', {
      userId,
      userMessage: userMessage.substring(0, 100),
      aiResponse: aiResponse.substring(0, 100),
      context
    });
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('restaurant') || messageLower.includes('food') ||
        messageLower.includes('eat') || messageLower.includes('menu')) {
      return 'restaurant_search';
    }

    if (messageLower.includes('order') || messageLower.includes('delivery') ||
        messageLower.includes('pickup')) {
      return 'order_help';
    }

    if (messageLower.includes('reservation') || messageLower.includes('book') ||
        messageLower.includes('table')) {
      return 'reservation_help';
    }

    return 'general_support';
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(userId, preferences = {}) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const context = {
        intent: 'restaurant_search',
        preferences,
        language: 'en'
      };

      const prompt = `Based on user preferences and location, recommend 3 restaurants.
      User location: ${user?.governorate_code || 'Unknown'}
      Preferences: ${JSON.stringify(preferences)}

      Format as a numbered list with brief descriptions.`;

      return await this.generateResponse(userId, prompt, context);
    } catch (error) {
      logger.error('Recommendation generation failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Analyze user feedback and generate insights
   */
  async analyzeFeedback(feedbackData) {
    try {
      const prompt = `Analyze this user feedback and provide insights:
      ${JSON.stringify(feedbackData)}

      Provide:
      1. Sentiment (positive/negative/neutral)
      2. Key themes mentioned
      3. Suggested improvements
      4. Overall rating (1-5)`;

      // Use AI to analyze feedback
      const analysis = await this.callOpenAI([
        { role: 'system', content: 'You are a feedback analysis expert.' },
        { role: 'user', content: prompt }
      ]);

      return {
        analysis,
        timestamp: new Date(),
        feedbackId: feedbackData.id
      };
    } catch (error) {
      logger.error('Feedback analysis failed', { error: error.message });
      return {
        analysis: 'Analysis unavailable',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate smart replies for common queries
   */
  generateSmartReplies(queryType) {
    const replies = {
      greeting: [
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
        "Welcome! How may I assist you?"
      ],
      order_status: [
        "I'll check your order status right away.",
        "Let me look up your order information.",
        "I'll get the latest update on your order."
      ],
      delivery_time: [
        "Delivery typically takes 30-45 minutes.",
        "Most orders arrive within 45 minutes.",
        "Delivery time depends on your location and current demand."
      ],
      cancellation: [
        "You can cancel orders within 5 minutes of placement.",
        "Orders can be cancelled before they're confirmed.",
        "Please contact support for cancellation assistance."
      ]
    };

    return replies[queryType] || ["I'm here to help! How can I assist you?"];
  }

  /**
   * Moderate user-generated content
   */
  async moderateContent(content, contentType = 'review') {
    try {
      const prompt = `Analyze this ${contentType} for inappropriate content:

      "${content}"

      Respond with only: SAFE or UNSAFE
      Consider: offensive language, spam, harassment, inappropriate content`;

      const response = await this.callOpenAI([
        { role: 'system', content: 'You are a content moderation expert.' },
        { role: 'user', content: prompt }
      ]);

      const isSafe = response.toLowerCase().includes('safe');

      return {
        isSafe,
        reason: isSafe ? null : 'Content flagged by AI moderation',
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Content moderation failed', { error: error.message });
      // Default to safe if AI fails
      return {
        isSafe: true,
        reason: 'Moderation service unavailable',
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate menu descriptions
   */
  async generateMenuDescription(itemData) {
    try {
      const prompt = `Create an appealing 2-3 sentence description for this menu item:

      Name: ${itemData.name}
      Ingredients: ${itemData.ingredients || 'N/A'}
      Cuisine: ${itemData.cuisine || 'Various'}

      Make it sound delicious and highlight key ingredients.`;

      const description = await this.callOpenAI([
        { role: 'system', content: 'You are a professional food writer.' },
        { role: 'user', content: prompt }
      ]);

      return {
        description: description.trim(),
        generated: true,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Menu description generation failed', { error: error.message });
      return {
        description: itemData.name,
        generated: false,
        error: error.message
      };
    }
  }

  /**
   * Process natural language order requests
   */
  async processOrderRequest(userId, orderText) {
    try {
      const prompt = `Parse this order request and extract structured information:

      "${orderText}"

      Return JSON format:
      {
        "items": [{"name": "item name", "quantity": 1, "customizations": []}],
        "deliveryType": "delivery/pickup",
        "specialInstructions": "",
        "estimatedTotal": 0
      }`;

      const response = await this.callOpenAI([
        { role: 'system', content: 'You are an order parsing expert. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]);

      // Parse the JSON response
      const orderData = JSON.parse(response);

      return {
        parsedOrder: orderData,
        confidence: 'high', // Could be determined by AI confidence score
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Order request processing failed', {
        userId,
        error: error.message
      });
      throw new Error('Could not process order request. Please try again.');
    }
  }

  /**
   * Get AI service health status
   */
  async getHealthStatus() {
    const status = {
      provider: this.activeProvider,
      available: false,
      lastChecked: new Date()
    };

    try {
      // Test the active provider
      switch (this.activeProvider) {
        case 'openai':
          if (this.providers.openai) {
            await this.providers.openai.models.list();
            status.available = true;
          }
          break;
        case 'anthropic':
          if (this.providers.anthropic) {
            // Simple test - in production, use a test API call
            status.available = true;
          }
          break;
      }
    } catch (error) {
      status.error = error.message;
    }

    return status;
  }

  /**
   * Switch AI provider
   */
  switchProvider(provider) {
    if (this.providers[provider]) {
      this.activeProvider = provider;
      logger.info('AI provider switched', { newProvider: provider });
      return true;
    }
    return false;
  }
}

module.exports = new AIAssistantService();

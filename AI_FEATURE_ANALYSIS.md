# AI Feature Analysis - Chat & History Endpoints

## ⚠️ **CRITICAL ISSUE FOUND**

**AI routes are NOT registered in `index.js`!**

The AI routes file exists (`routes/ai.routes.js`) but is **not imported or registered** in the main application file. This means the AI endpoints are **currently not accessible**.

**Fix Required:**
```javascript
// In index.js, add:
const aiRoutes = require('./routes/ai.routes');

// And register it:
app.use('/api/ai', aiRoutes);
```

---

## Current Implementation Status

### ✅ **Available Endpoints** (After fixing registration)

#### 1. **Chat with AI Assistant**
```
POST /api/ai/chat
```

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "message": "What are the best restaurants nearby?",
  "context": {
    "intent": "restaurant_search",  // optional
    "language": "en"                // optional
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your location, I recommend...",
    "provider": "openai",  // or "anthropic", "fallback"
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Features:**
- ✅ Supports OpenAI and Anthropic
- ✅ Fallback responses when AI unavailable
- ✅ Context-aware responses
- ✅ User personalization (name, location)
- ⚠️ **History NOT persisted** (returns empty array)

---

#### 2. **Get Recommendations**
```
GET /api/ai/recommendations
```

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `cuisine` - Filter by cuisine type
- `price_range` - Filter by price
- `location` - Filter by location
- `rating` - Minimum rating

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": "1. Restaurant A - Italian cuisine...",
    "provider": "openai",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## ❌ **Missing Endpoints**

### 1. **Get Chat History** (NOT IMPLEMENTED)
```
GET /api/ai/chat/history
```

**Should Return:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-uuid",
        "messages": [
          {
            "role": "user",
            "content": "What are good restaurants?",
            "timestamp": "2024-01-15T10:00:00.000Z"
          },
          {
            "role": "assistant",
            "content": "I recommend...",
            "timestamp": "2024-01-15T10:00:01.000Z",
            "provider": "openai"
          }
        ],
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

### 2. **Clear Chat History** (NOT IMPLEMENTED)
```
DELETE /api/ai/chat/history
```

**Should Delete:** All conversation history for user

---

### 3. **Get Single Conversation** (NOT IMPLEMENTED)
```
GET /api/ai/chat/history/:conversationId
```

**Should Return:** Specific conversation with all messages

---

## Current Implementation Details

### **Service Layer** (`services/ai-assistant.service.js`)

#### ✅ **Implemented Methods:**

1. **`generateResponse(userId, message, context)`**
   - ✅ Generates AI response
   - ✅ Uses conversation history (but returns empty array)
   - ✅ Saves conversation (but only logs, doesn't persist)

2. **`getConversationHistory(userId)`**
   - ⚠️ **Currently returns empty array** (line 283)
   - ⚠️ **Not connected to database**

3. **`saveConversation(userId, userMessage, aiResponse, context)`**
   - ⚠️ **Currently only logs** (line 289-298)
   - ⚠️ **Not saving to database**

---

## What Needs to Be Implemented

### 1. **Database Model for Conversations**

**Required Prisma Schema:**
```prisma
model Conversation {
  id          String   @id @default(uuid())
  user_id     String
  title       String?  // Auto-generated from first message
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  // Relations
  user        User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  messages    ConversationMessage[]

  @@index([user_id])
  @@index([created_at])
  @@map("conversations")
}

model ConversationMessage {
  id             String   @id @default(uuid())
  conversation_id String
  role           String   // "user" or "assistant"
  content        String
  provider       String?  // "openai", "anthropic", "fallback"
  metadata       Json?    // Additional data
  created_at     DateTime @default(now())

  // Relations
  conversation   Conversation @relation(fields: [conversation_id], references: [id], onDelete: Cascade)

  @@index([conversation_id])
  @@index([created_at])
  @@map("conversation_messages")
}
```

---

### 2. **Update Service Methods**

#### **Update `getConversationHistory()`:**
```javascript
async getConversationHistory(userId, limit = 10) {
  try {
    const messages = await prisma.conversationMessage.findMany({
      where: {
        conversation: {
          user_id: userId
        }
      },
      orderBy: { created_at: 'asc' },
      take: limit * 2, // limit conversations, each has user + assistant
      include: {
        conversation: true
      }
    });

    // Format for AI API (OpenAI/Anthropic format)
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  } catch (error) {
    logger.error('Get conversation history failed', { userId, error: error.message });
    return [];
  }
}
```

#### **Update `saveConversation()`:**
```javascript
async saveConversation(userId, userMessage, aiResponse, context) {
  try {
    // Get or create current conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        user_id: userId,
        updated_at: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Within last 30 minutes
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          user_id: userId,
          title: userMessage.substring(0, 50) // First 50 chars as title
        }
      });
    }

    // Save user message
    await prisma.conversationMessage.create({
      data: {
        conversation_id: conversation.id,
        role: 'user',
        content: userMessage
      }
    });

    // Save AI response
    await prisma.conversationMessage.create({
      data: {
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse,
        provider: context.provider || 'unknown',
        metadata: context
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updated_at: new Date() }
    });

    logger.info('Conversation saved', { userId, conversationId: conversation.id });
  } catch (error) {
    logger.error('Save conversation failed', { userId, error: error.message });
  }
}
```

---

### 3. **Add Controller Methods**

#### **Get Chat History:**
```javascript
async getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: { user_id: userId },
      include: {
        messages: {
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { updated_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.conversation.count({
      where: { user_id: userId }
    });

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get chat history failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history',
      error: error.message
    });
  }
}
```

#### **Clear Chat History:**
```javascript
async clearChatHistory(req, res) {
  try {
    const userId = req.user.id;

    await prisma.conversation.deleteMany({
      where: { user_id: userId }
    });

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    logger.error('Clear chat history failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
}
```

---

### 4. **Add Routes**

```javascript
// In routes/ai.routes.js

// Get chat history
router.get('/chat/history', aiController.getChatHistory);

// Clear chat history
router.delete('/chat/history', aiController.clearChatHistory);

// Get specific conversation
router.get('/chat/history/:conversationId', aiController.getConversation);
```

---

## Current Flow

### **Chat Flow (Current):**
```
1. User sends message → POST /api/ai/chat
2. Service gets conversation history → Returns [] (empty)
3. Service generates AI response
4. Service saves conversation → Only logs (not persisted)
5. Response returned to user
```

### **Chat Flow (Should Be):**
```
1. User sends message → POST /api/ai/chat
2. Service gets conversation history → Returns last 10 messages from DB
3. Service generates AI response (with context from history)
4. Service saves conversation → Persists to database
5. Response returned to user
6. User can retrieve history → GET /api/ai/chat/history
```

---

## API Endpoints Summary

### ✅ **Currently Available:**

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/ai/chat` | Chat with AI | ✅ Working (no history) |
| GET | `/api/ai/recommendations` | Get recommendations | ✅ Working |

### ❌ **Missing Endpoints:**

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/ai/chat/history` | Get chat history | ❌ Not implemented |
| DELETE | `/api/ai/chat/history` | Clear chat history | ❌ Not implemented |
| GET | `/api/ai/chat/history/:id` | Get specific conversation | ❌ Not implemented |

---

## Testing Current Endpoints

### **Test Chat Endpoint:**
```bash
curl -X POST http://localhost:3119/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best restaurants nearby?",
    "context": {
      "intent": "restaurant_search"
    }
  }'
```

### **Test Recommendations:**
```bash
curl -X GET "http://localhost:3119/api/ai/recommendations?cuisine=italian&price_range=medium" \
  -H "Authorization: Bearer <token>"
```

---

## Issues & Recommendations

### **Current Issues:**

1. ❌ **No conversation persistence** - History is lost after server restart
2. ❌ **No history retrieval** - Users can't see past conversations
3. ❌ **No conversation grouping** - All messages are separate
4. ❌ **No database model** - Conversations not stored

### **Recommendations:**

1. ✅ **Add Conversation model** to Prisma schema
2. ✅ **Implement history endpoints** (GET, DELETE)
3. ✅ **Update service methods** to use database
4. ✅ **Add conversation grouping** (group messages by session)
5. ✅ **Add conversation titles** (auto-generate from first message)
6. ✅ **Add pagination** for history retrieval

---

## Environment Variables Required

```env
# AI Provider Configuration
AI_PROVIDER=openai  # or "anthropic"
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Next Steps

1. **Create Prisma migration** for Conversation models
2. **Update service methods** to use database
3. **Add controller methods** for history
4. **Add routes** for history endpoints
5. **Test end-to-end** chat with history


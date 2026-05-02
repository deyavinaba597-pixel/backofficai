import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest, ConversationMessage } from '../types';
import * as agentCore from '../agent/core';
import * as notificationService from '../services/notificationService';
import prisma from '../db/prisma';

const router = Router();

// POST /chat - legacy stateless chat
router.post(
  '/chat',
  [body('message').trim().notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const { message, conversationHistory = [] } = req.body as {
        message: string;
        conversationHistory: ConversationMessage[];
      };

      const response = await agentCore.chat(userId, message, conversationHistory);
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// GET /logs
router.get('/logs', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await notificationService.getAgentLogs(userId, limit);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// POST /conversations - create new conversation
router.post('/conversations', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

// GET /conversations - list user's conversations
router.get('/conversations', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// GET /conversations/:id - get conversation with messages
router.get('/conversations/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

// DELETE /conversations/:id
router.delete('/conversations/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await prisma.conversation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /conversations/:id - update title
router.patch('/conversations/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;

    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data: { title },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /conversations/:id/chat - send message in existing conversation
router.post(
  '/conversations/:id/chat',
  [body('message').trim().notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const conversationId = req.params.id;
      const { message } = req.body as { message: string };

      // Verify conversation belongs to user
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Build history from DB messages
      const conversationHistory: ConversationMessage[] = conversation.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'tool',
        content: m.content,
        tool_call_id: m.toolCallId || undefined,
        name: m.toolName || undefined,
      }));

      // Save user message
      await prisma.message.create({
        data: {
          conversationId,
          role: 'user',
          content: message,
        },
      });

      // Run agent
      const response = await agentCore.chat(userId, message, conversationHistory);

      // Save assistant response
      await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: response.message,
        },
      });

      // Update conversation title if it's the first message
      if (conversation.messages.length === 0 && conversation.title === 'New Conversation') {
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title },
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

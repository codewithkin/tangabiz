// AI Chat Routes with Streaming Support
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { createTatendaAgent, createMemory, type UserRole } from "../ai/agent";
import { sanitizeOutput, checkRequestGuardrail } from "../ai/guardrails/role-guardrail";

export const aiRoutes = new Hono();

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  businessId: z.string(),
  threadId: z.string().optional(), // For conversation continuity
});

const historySchema = z.object({
  businessId: z.string(),
  threadId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// Initialize memory with database connection
let memory: ReturnType<typeof createMemory> | null = null;

function getMemory() {
  if (!memory) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      // Extract the actual postgres URL from prisma+postgres URL
      // For Prisma Accelerate, we need to use a direct connection for memory
      // Using a simple in-memory fallback for now
      memory = createMemory(connectionString);
    }
  }
  return memory;
}

// Chat endpoint with streaming
aiRoutes.post("/chat", requireAuth, zValidator("json", chatSchema), async (c) => {
  const userId = c.get("userId");
  const { message, businessId, threadId } = c.req.valid("json");

  try {
    // Get user's role for this business
    const membership = await db.businessMember.findFirst({
      where: { userId, businessId },
      select: { role: true },
    });

    if (!membership) {
      return c.json({ error: "Not a member of this business" }, 403);
    }

    const role = membership.role as UserRole;
    const conversationId = threadId || `${userId}-${businessId}-${Date.now()}`;

    // Create agent with role-specific access
    const agent = createTatendaAgent(role, getMemory() || undefined);

    // Stream the response using SSE
    return streamSSE(c, async (stream) => {
      try {
        // Generate response with streaming
        const response = await agent.stream(message, {
          threadId: conversationId,
          resourceId: businessId,
          context: {
            userId,
            businessId,
            role,
          },
        });

        let fullContent = "";

        // Stream each chunk
        for await (const chunk of response.textStream) {
          if (chunk) {
            // Sanitize output based on role
            const sanitizedChunk = sanitizeOutput(role, chunk);
            fullContent += sanitizedChunk;

            await stream.writeSSE({
              event: "message",
              data: JSON.stringify({ 
                type: "chunk", 
                content: sanitizedChunk,
                threadId: conversationId,
              }),
            });
          }
        }

        // Send completion event
        await stream.writeSSE({
          event: "message",
          data: JSON.stringify({ 
            type: "done", 
            threadId: conversationId,
            fullContent: sanitizeOutput(role, fullContent),
          }),
        });

        // Store in conversation history
        await db.aiConversation.create({
          data: {
            id: `msg-${Date.now()}`,
            threadId: conversationId,
            userId,
            businessId,
            role: "user",
            content: message,
          },
        });

        await db.aiConversation.create({
          data: {
            id: `msg-${Date.now() + 1}`,
            threadId: conversationId,
            userId,
            businessId,
            role: "assistant",
            content: sanitizeOutput(role, fullContent),
          },
        });

      } catch (error: any) {
        console.error("[AI] Stream error:", error);
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ 
            type: "error", 
            message: "Sorry, I encountered an error. Please try again.",
          }),
        });
      }
    });
  } catch (error: any) {
    console.error("[AI] Chat error:", error);
    return c.json({ error: "Failed to process chat request" }, 500);
  }
});

// Non-streaming chat for simpler use cases
aiRoutes.post("/chat/simple", requireAuth, zValidator("json", chatSchema), async (c) => {
  const userId = c.get("userId");
  const { message, businessId, threadId } = c.req.valid("json");

  try {
    // Get user's role for this business
    const membership = await db.businessMember.findFirst({
      where: { userId, businessId },
      select: { role: true },
    });

    if (!membership) {
      return c.json({ error: "Not a member of this business" }, 403);
    }

    const role = membership.role as UserRole;
    const conversationId = threadId || `${userId}-${businessId}-${Date.now()}`;

    // Create agent with role-specific access
    const agent = createTatendaAgent(role, getMemory() || undefined);

    // Generate response
    const response = await agent.generate(message, {
      threadId: conversationId,
      resourceId: businessId,
      context: {
        userId,
        businessId,
        role,
      },
    });

    const sanitizedResponse = sanitizeOutput(role, response.text);

    // Store in conversation history
    await db.aiConversation.create({
      data: {
        id: `msg-${Date.now()}`,
        threadId: conversationId,
        userId,
        businessId,
        role: "user",
        content: message,
      },
    });

    await db.aiConversation.create({
      data: {
        id: `msg-${Date.now() + 1}`,
        threadId: conversationId,
        userId,
        businessId,
        role: "assistant",
        content: sanitizedResponse,
      },
    });

    return c.json({
      response: sanitizedResponse,
      threadId: conversationId,
    });
  } catch (error: any) {
    console.error("[AI] Simple chat error:", error);
    return c.json({ error: "Failed to process chat request" }, 500);
  }
});

// Get conversation history
aiRoutes.get("/history", requireAuth, zValidator("query", historySchema), async (c) => {
  const userId = c.get("userId");
  const { businessId, threadId, limit } = c.req.valid("query");

  try {
    // Verify membership
    const membership = await db.businessMember.findFirst({
      where: { userId, businessId },
    });

    if (!membership) {
      return c.json({ error: "Not a member of this business" }, 403);
    }

    const where: any = { userId, businessId };
    if (threadId) {
      where.threadId = threadId;
    }

    const messages = await db.aiConversation.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        threadId: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Group by thread
    const threads = messages.reduce((acc, msg) => {
      if (!acc[msg.threadId]) {
        acc[msg.threadId] = [];
      }
      acc[msg.threadId].push(msg);
      return acc;
    }, {} as Record<string, typeof messages>);

    return c.json({ messages, threads });
  } catch (error: any) {
    console.error("[AI] History error:", error);
    return c.json({ error: "Failed to fetch conversation history" }, 500);
  }
});

// Get conversation threads
aiRoutes.get("/threads", requireAuth, zValidator("query", z.object({
  businessId: z.string(),
  limit: z.coerce.number().min(1).max(50).default(20),
})), async (c) => {
  const userId = c.get("userId");
  const { businessId, limit } = c.req.valid("query");

  try {
    // Get unique thread IDs with latest message
    const conversations = await db.aiConversation.findMany({
      where: { userId, businessId },
      orderBy: { createdAt: "desc" },
      distinct: ["threadId"],
      take: limit,
      select: {
        threadId: true,
        content: true,
        createdAt: true,
      },
    });

    return c.json({ threads: conversations });
  } catch (error: any) {
    console.error("[AI] Threads error:", error);
    return c.json({ error: "Failed to fetch threads" }, 500);
  }
});

// Delete a conversation thread
aiRoutes.delete("/threads/:threadId", requireAuth, async (c) => {
  const userId = c.get("userId");
  const threadId = c.req.param("threadId");

  try {
    await db.aiConversation.deleteMany({
      where: { threadId, userId },
    });

    return c.json({ message: "Thread deleted" });
  } catch (error: any) {
    console.error("[AI] Delete thread error:", error);
    return c.json({ error: "Failed to delete thread" }, 500);
  }
});

// Agent info endpoint
aiRoutes.get("/info", async (c) => {
  return c.json({
    name: "Tatenda",
    description: "Your helpful AI assistant for business management",
    capabilities: [
      "View and analyze sales data",
      "Check inventory status",
      "Get customer insights",
      "Search products",
      "View recent transactions",
      "Answer business questions",
    ],
    version: "1.0.0",
  });
});

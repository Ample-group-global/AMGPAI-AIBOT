import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // REST API endpoints for local development (compatible with .NET backend format)
  app.post("/api/AmgPAIAssessment/StartSession", async (req, res) => {
    try {
      const { userId } = req.body;
      const { createAssessmentSession } = await import('../assessmentDb');
      const { getOpeningQuestion } = await import('../assessmentEngine');

      const session = await createAssessmentSession(userId);
      const openingQuestion = getOpeningQuestion();

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          question: openingQuestion,
          stage: 'opening',
          progress: 0
        }
      });
    } catch (error) {
      console.error('[REST API] StartSession error:', error);
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/AmgPAIAssessment/Chat", async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      const {
        getAssessmentSession,
        updateAssessmentSession,
        parseConversationHistory,
        parseScores
      } = await import('../assessmentDb');
      const { processConversation, mergeScores } = await import('../assessmentEngine');

      const session = await getAssessmentSession(sessionId);
      if (!session) {
        res.json({ success: false, error: 'Session not found' });
        return;
      }

      const conversationHistory = parseConversationHistory(session);
      const currentScores = parseScores(session);

      const aiResponse = await processConversation(
        message,
        conversationHistory,
        session.stage as any,
        session.conversationCount,
        currentScores
      );

      // Update conversation history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: message },
        { role: 'assistant' as const, content: aiResponse.next_question }
      ];

      // Merge scores
      const updatedScores = mergeScores(currentScores, aiResponse.scores_update);

      // Update session
      await updateAssessmentSession(sessionId, {
        stage: aiResponse.next_stage,
        conversationCount: session.conversationCount + 1,
        conversationHistory: updatedHistory,
        scores: updatedScores,
        completedAt: aiResponse.next_stage === 'complete' ? new Date() : undefined
      });

      // Calculate progress
      const stageProgress: Record<string, number> = {
        opening: 10,
        risk: 30,
        goals: 50,
        behavior: 70,
        values: 90,
        confirmation: 95,
        complete: 100
      };

      res.json({
        success: true,
        data: {
          reply: aiResponse.next_question,
          stage: aiResponse.next_stage,
          progress: stageProgress[aiResponse.next_stage] || 0,
          isComplete: aiResponse.next_stage === 'complete'
        }
      });
    } catch (error) {
      console.error('[REST API] Chat error:', error);
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

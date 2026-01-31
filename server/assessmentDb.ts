/**
 * 評估會話資料庫操作
 */

import { eq } from "drizzle-orm";
import { assessmentSessions, AssessmentSession, InsertAssessmentSession } from "../drizzle/schema";
import { getDb } from "./db";
import { AssessmentScores } from "./assessmentEngine";
import { Message } from "./_core/llm";

// In-memory storage fallback for development without database
const inMemorySessions = new Map<string, AssessmentSession>();

/**
 * 建立新的評估會話
 */
export async function createAssessmentSession(
  userId?: string
): Promise<AssessmentSession> {
  const db = await getDb();

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newSession: AssessmentSession = {
    id: sessionId,
    odooId: null,
    odooUserId: null,
    userId: userId || null,
    stage: 'opening',
    conversationCount: 0,
    conversationHistory: JSON.stringify([]),
    scores: JSON.stringify({}),
    result: null,
    startTime: new Date(),
    completedAt: null
  };

  // Use database if available, otherwise use in-memory storage
  if (db) {
    const insertData: InsertAssessmentSession = {
      id: sessionId,
      userId: userId || null,
      stage: 'opening',
      conversationCount: 0,
      conversationHistory: JSON.stringify([]),
      scores: JSON.stringify({}),
      result: null,
      startTime: new Date(),
      completedAt: null
    };

    await db.insert(assessmentSessions).values(insertData);

    const result = await db
      .select()
      .from(assessmentSessions)
      .where(eq(assessmentSessions.id, sessionId))
      .limit(1);

    if (result.length === 0) {
      throw new Error('Failed to create session');
    }

    return result[0];
  } else {
    // In-memory fallback
    console.log('[AssessmentDb] Using in-memory storage (no DATABASE_URL configured)');
    inMemorySessions.set(sessionId, newSession);
    return newSession;
  }
}

/**
 * 取得評估會話
 */
export async function getAssessmentSession(
  sessionId: string
): Promise<AssessmentSession | null> {
  const db = await getDb();

  if (db) {
    const result = await db
      .select()
      .from(assessmentSessions)
      .where(eq(assessmentSessions.id, sessionId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } else {
    // In-memory fallback
    return inMemorySessions.get(sessionId) || null;
  }
}

/**
 * 更新評估會話
 */
export async function updateAssessmentSession(
  sessionId: string,
  updates: {
    stage?: string;
    conversationCount?: number;
    conversationHistory?: Message[];
    scores?: Partial<AssessmentScores>;
    result?: any;
    completedAt?: Date;
  }
): Promise<void> {
  const db = await getDb();

  const updateData: any = {};

  if (updates.stage !== undefined) {
    updateData.stage = updates.stage;
  }
  if (updates.conversationCount !== undefined) {
    updateData.conversationCount = updates.conversationCount;
  }
  if (updates.conversationHistory !== undefined) {
    updateData.conversationHistory = JSON.stringify(updates.conversationHistory);
  }
  if (updates.scores !== undefined) {
    updateData.scores = JSON.stringify(updates.scores);
  }
  if (updates.result !== undefined) {
    updateData.result = JSON.stringify(updates.result);
  }
  if (updates.completedAt !== undefined) {
    updateData.completedAt = updates.completedAt;
  }

  if (db) {
    await db
      .update(assessmentSessions)
      .set(updateData)
      .where(eq(assessmentSessions.id, sessionId));
  } else {
    // In-memory fallback
    const session = inMemorySessions.get(sessionId);
    if (session) {
      if (updates.stage !== undefined) session.stage = updates.stage;
      if (updates.conversationCount !== undefined) session.conversationCount = updates.conversationCount;
      if (updates.conversationHistory !== undefined) session.conversationHistory = JSON.stringify(updates.conversationHistory);
      if (updates.scores !== undefined) session.scores = JSON.stringify(updates.scores);
      if (updates.result !== undefined) session.result = JSON.stringify(updates.result);
      if (updates.completedAt !== undefined) session.completedAt = updates.completedAt;
      inMemorySessions.set(sessionId, session);
    }
  }
}

/**
 * 解析會話歷史
 */
export function parseConversationHistory(session: AssessmentSession): Message[] {
  if (!session.conversationHistory) {
    return [];
  }
  try {
    return JSON.parse(session.conversationHistory);
  } catch {
    return [];
  }
}

/**
 * 解析評估分數
 */
export function parseScores(session: AssessmentSession): Partial<AssessmentScores> {
  if (!session.scores) {
    return {};
  }
  try {
    return JSON.parse(session.scores);
  } catch {
    return {};
  }
}

/**
 * 解析評估結果
 */
export function parseResult(session: AssessmentSession): any {
  if (!session.result) {
    return null;
  }
  try {
    return JSON.parse(session.result);
  } catch {
    return null;
  }
}


/**
 * 評估會話資料庫操作
 */

import { eq } from "drizzle-orm";
import { assessmentSessions, AssessmentSession, InsertAssessmentSession } from "../drizzle/schema";
import { getDb } from "./db";
import { AssessmentScores } from "./assessmentEngine";
import { Message } from "./_core/llm";

/**
 * 建立新的評估會話
 */
export async function createAssessmentSession(
  userId?: string
): Promise<AssessmentSession> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newSession: InsertAssessmentSession = {
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

  await db.insert(assessmentSessions).values(newSession);

  const result = await db
    .select()
    .from(assessmentSessions)
    .where(eq(assessmentSessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    throw new Error('Failed to create session');
  }

  return result[0];
}

/**
 * 取得評估會話
 */
export async function getAssessmentSession(
  sessionId: string
): Promise<AssessmentSession | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db
    .select()
    .from(assessmentSessions)
    .where(eq(assessmentSessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
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
  if (!db) {
    throw new Error('Database not available');
  }

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

  await db
    .update(assessmentSessions)
    .set(updateData)
    .where(eq(assessmentSessions.id, sessionId));
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


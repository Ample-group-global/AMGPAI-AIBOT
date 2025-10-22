/**
 * 測試評估系統的基本功能
 */

import { createAssessmentSession, getAssessmentSession, updateAssessmentSession } from './server/assessmentDb';
import { processConversation, mergeScores, recommendTracks, getOpeningQuestion } from './server/assessmentEngine';

async function testAssessmentFlow() {
  console.log('🧪 開始測試評估系統...\n');

  try {
    // 1. 測試創建會話
    console.log('1️⃣ 測試創建評估會話...');
    const session = await createAssessmentSession();
    console.log(`✅ 會話創建成功: ${session.id}\n`);

    // 2. 測試開場問題
    console.log('2️⃣ 測試開場問題...');
    const openingQuestion = getOpeningQuestion();
    console.log(`✅ 開場問題: ${openingQuestion}\n`);

    // 3. 測試 AI 對話處理
    console.log('3️⃣ 測試 AI 對話處理...');
    const testMessage = '我有大約 5 年的投資經驗，主要投資股票和基金。';
    
    const aiResponse = await processConversation(
      testMessage,
      [],
      'opening',
      0,
      {}
    );

    console.log('✅ AI 回應成功:');
    console.log(`   - 分析: ${aiResponse.analysis.substring(0, 100)}...`);
    console.log(`   - 下一階段: ${aiResponse.next_stage}`);
    console.log(`   - 下一個問題: ${aiResponse.next_question.substring(0, 100)}...\n`);

    // 4. 測試分數合併
    console.log('4️⃣ 測試分數合併...');
    const mergedScores = mergeScores({}, aiResponse.scores_update);
    console.log('✅ 分數合併成功:');
    console.log(`   - 風險分數: ${mergedScores.risk.raw} (信心度: ${mergedScores.risk.confidence})`);
    console.log(`   - 時間偏好: ${mergedScores.timeHorizon.raw}\n`);

    // 5. 測試賽道推薦（使用模擬分數）
    console.log('5️⃣ 測試賽道推薦...');
    const mockScores = {
      risk: { raw: 65, confidence: 0.8 },
      timeHorizon: { raw: 70, confidence: 0.8 },
      goalType: 'growth' as const,
      biases: [],
      esg: {
        environmental: 80,
        social: 60,
        governance: 50
      },
      sdgPriorities: [7, 13, 9]
    };

    const recommendations = recommendTracks(mockScores);
    console.log('✅ 賽道推薦成功:');
    recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec.track.name} (匹配度: ${rec.matchScore}%)`);
      console.log(`      理由: ${rec.reason}`);
    });
    console.log('');

    // 6. 測試資料庫更新
    console.log('6️⃣ 測試資料庫更新...');
    await updateAssessmentSession(session.id, {
      stage: 'risk',
      conversationCount: 1,
      conversationHistory: [
        { role: 'user', content: testMessage },
        { role: 'assistant', content: aiResponse.next_question }
      ],
      scores: mergedScores
    });

    const updatedSession = await getAssessmentSession(session.id);
    console.log('✅ 資料庫更新成功');
    console.log(`   - 當前階段: ${updatedSession?.stage}`);
    console.log(`   - 對話輪數: ${updatedSession?.conversationCount}\n`);

    console.log('🎉 所有測試通過！評估系統運作正常。\n');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
    throw error;
  }
}

// 執行測試
testAssessmentFlow()
  .then(() => {
    console.log('✅ 測試完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  });


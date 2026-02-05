export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface InvestorMBTI {
  gs?: { score: number; letter: string };
  di?: { score: number; letter: string };
  lv?: { score: number; letter: string };
  pa?: { score: number; letter: string };
  type_code?: string;
  type_name?: string;
  type_name_en?: string;
  strengths?: string[];
  strengths_en?: string[];
  blind_spots?: string[];
  blind_spots_en?: string[];
}

export interface AssessmentResult {
  sessionId: string;
  investorProfile: {
    type: string;
    summary: string;
    strengths: string[];
    watchPoints: string[];
  };
  scores: {
    investor_mbti?: InvestorMBTI;
  };
}

export interface MBTIDimensionMeta {
  labelZh: string;
  labelEn: string;
  leftZh: string;
  leftEn: string;
  rightZh: string;
  rightEn: string;
  leftLetter: string;
  rightLetter: string;
  color: string;
}

export const MBTI_DIMENSIONS: Record<'gs' | 'di' | 'lv' | 'pa', MBTIDimensionMeta> = {
  gs: {
    labelZh: '風險取向',
    labelEn: 'Risk Orientation',
    leftZh: '穩健型',
    leftEn: 'Stability',
    rightZh: '積極型',
    rightEn: 'Growth',
    leftLetter: 'S',
    rightLetter: 'G',
    color: 'from-blue-500 to-cyan-400',
  },
  di: {
    labelZh: '分析方法',
    labelEn: 'Analysis Method',
    leftZh: '直覺型',
    leftEn: 'Intuition',
    rightZh: '數據型',
    rightEn: 'Data',
    leftLetter: 'I',
    rightLetter: 'D',
    color: 'from-purple-500 to-pink-400',
  },
  lv: {
    labelZh: '決策風格',
    labelEn: 'Decision Style',
    leftZh: '價值型',
    leftEn: 'Values',
    rightZh: '邏輯型',
    rightEn: 'Logic',
    leftLetter: 'V',
    rightLetter: 'L',
    color: 'from-orange-500 to-yellow-400',
  },
  pa: {
    labelZh: '行動模式',
    labelEn: 'Action Mode',
    leftZh: '適應型',
    leftEn: 'Adaptive',
    rightZh: '計劃型',
    rightEn: 'Planner',
    leftLetter: 'A',
    rightLetter: 'P',
    color: 'from-green-500 to-emerald-400',
  },
};

export async function getResult(apiUrl: string, sessionId: string, language: string = 'en'): Promise<ApiResponse<AssessmentResult>> {
  try {
    const response = await fetch(`${apiUrl}/GetResult/${sessionId}?language=${language}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return await response.json() as ApiResponse<AssessmentResult>;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

-- PAIBot Translations - Database Insert Script
-- One row per locale for efficient querying

-- Delete existing translation records if any
DELETE FROM [dbo].[Settings]
WHERE group_name = 'PAIBot' AND setting_type = 'Translation';

-- Insert English translations
INSERT INTO [dbo].[Settings] (
    setting_id, group_name, setting_type, setting_name, setting_code,
    settingdescription, is_active, source_platform, source_name, created_at, updated_at
)
VALUES (
    NEWID(),
    'PAIBot',
    'Translation',
    'English Translations',
    'locale_en',
    N'{
  "common": {
    "loading": "Loading..."
  },
  "home": {
    "header": {
      "title": "Sustainable Investment Assessment"
    },
    "hero": {
      "title": "Discover Your Sustainable Investment Path",
      "subtitle": "Through AI-powered conversation, understand your investment profile and receive personalized sustainable investment recommendations"
    },
    "features": {
      "risk": {
        "title": "Risk Assessment",
        "desc": "Evaluate your risk tolerance and investment capacity",
        "icon": "chart-bar"
      },
      "goals": {
        "title": "Goal Setting",
        "desc": "Define your investment objectives and timeline",
        "icon": "target"
      },
      "values": {
        "title": "Value Alignment",
        "desc": "Match investments with your ESG values",
        "icon": "leaf"
      },
      "behavior": {
        "title": "Behavioral Analysis",
        "desc": "Understand your investment behavior patterns",
        "icon": "lightbulb"
      }
    },
    "benefits": {
      "report": {
        "title": "Detailed Report",
        "desc": "Receive a comprehensive assessment of your investment profile"
      },
      "ai": {
        "title": "AI-Powered Insights",
        "desc": "Leverage advanced AI to analyze your investment preferences"
      },
      "personalized": {
        "title": "Personalized Recommendations",
        "desc": "Get investment suggestions tailored to your unique profile"
      }
    },
    "cta": {
      "button": "Start Assessment",
      "time": "Complete in ~10 minutes"
    },
    "login": {
      "title": "Sign In",
      "subtitle": "Enter your email to receive a verification code",
      "emailLabel": "Email Address",
      "emailPlaceholder": "Enter your email",
      "invalidEmail": "Please enter a valid email address",
      "sendOtp": "Send Verification Code",
      "sending": "Sending...",
      "otpFailed": "Failed to send verification code",
      "otpTitle": "Enter Verification Code",
      "otpSubtitle": "We sent a code to",
      "otpLabel": "Verification Code",
      "otpPlaceholder": "Enter 6-digit code",
      "invalidOtp": "Please enter the verification code",
      "verify": "Verify & Sign In",
      "verifying": "Verifying...",
      "verifyFailed": "Verification failed",
      "resend": "Resend Code",
      "back": "Back"
    },
    "footer": "Sustainable Investment Assessment"
  },
  "assessment": {
    "header": {
      "title": "Investment Propensity Assessment"
    },
    "back": "Back",
    "chat": {
      "assistant": "Assistant",
      "user": "You",
      "you": "You",
      "loading": "Loading...",
      "placeholder": "Enter your answer...",
      "send": "Send",
      "error": "We couldn'\''t process your response. Please try again.",
      "rateLimit": "Our system is currently busy. Please wait a moment and try again."
    },
    "complete": {
      "title": "Assessment Complete!",
      "subtitle": "Redirecting to your results..."
    },
    "close": {
      "title": "Leave Assessment?",
      "description": "Your progress will not be saved. Are you sure you want to leave?",
      "cancel": "Continue",
      "confirm": "Leave"
    },
    "stages": {
      "welcome": "Welcome",
      "compliance_nationality": "Nationality Check",
      "compliance_qualification": "Qualification Check",
      "dimension_gs": "Risk Orientation",
      "dimension_di": "Analysis Method",
      "dimension_lv": "Decision Style",
      "dimension_pa": "Action Mode",
      "summary": "Personality Report",
      "complete": "Complete",
      "rejected": "Assessment Ended"
    },
    "stageLabels": {
      "start": "Start",
      "verify": "Verify",
      "gs": "G/S",
      "di": "D/I",
      "lv": "L/V",
      "pa": "P/A",
      "result": "Result"
    }
  },
  "result": {
    "header": {
      "title": "Assessment Results"
    },
    "loading": "Loading results...",
    "button": {
      "retake": "Retake Assessment",
      "home": "Close"
    },
    "nav": {
      "retake": "Retake"
    },
    "scores": {
      "risk": {
        "title": "Risk Profile",
        "tolerance": "Risk Tolerance",
        "horizon": "Time Horizon"
      },
      "esg": {
        "title": "ESG Preferences",
        "environmental": "Environmental",
        "social": "Social",
        "governance": "Governance"
      }
    },
    "tracks": {
      "title": "Recommended Investment Tracks",
      "sdg": "Related SDGs",
      "reason": "Why this track",
      "match": "Match",
      "examples": "Examples"
    },
    "sdg": {
      "title": "SDG Alignment"
    },
    "error": {
      "title": "Error Loading Results",
      "message": "Unable to load your assessment results. Please try again."
    },
    "footer": "© 2026 Ample Group Global. All rights reserved.",
    "mbti": {
      "strengths": "Strengths",
      "blindSpots": "Blind Spots"
    }
  },
  "ui": {
    "icon": {
      "loading": "loader",
      "time": "clock",
      "complete": "check-circle",
      "user": "user",
      "check": "check",
      "error": "x-circle",
      "assistant": "bot"
    }
  }
}',
    1,
    'PAIBot',
    'System',
    GETDATE(),
    GETDATE()
);

-- Insert Chinese translations
INSERT INTO [dbo].[Settings] (
    setting_id, group_name, setting_type, setting_name, setting_code,
    settingdescription, is_active, source_platform, source_name, created_at, updated_at
)
VALUES (
    NEWID(),
    'PAIBot',
    'Translation',
    'Chinese Translations',
    'locale_zh',
    N'{
  "common": {
    "loading": "載入中..."
  },
  "home": {
    "header": {
      "title": "永續投資性向評估"
    },
    "hero": {
      "title": "探索您的永續投資之路",
      "subtitle": "透過 AI 對話，了解您的投資特質，獲得個人化的永續投資建議"
    },
    "features": {
      "risk": {
        "title": "風險評估",
        "desc": "評估您的風險承受能力和投資能力",
        "icon": "chart-bar"
      },
      "goals": {
        "title": "目標設定",
        "desc": "定義您的投資目標和時間規劃",
        "icon": "target"
      },
      "values": {
        "title": "價值對齊",
        "desc": "將投資與您的 ESG 價值觀相匹配",
        "icon": "leaf"
      },
      "behavior": {
        "title": "行為分析",
        "desc": "了解您的投資行為模式",
        "icon": "lightbulb"
      }
    },
    "benefits": {
      "report": {
        "title": "詳盡報告",
        "desc": "獲得完整的投資性向評估報告"
      },
      "ai": {
        "title": "AI 智能分析",
        "desc": "運用先進 AI 技術分析您的投資偏好"
      },
      "personalized": {
        "title": "個人化推薦",
        "desc": "獲得根據您獨特情況量身定制的投資建議"
      }
    },
    "cta": {
      "button": "開始評估",
      "time": "約 10 分鐘完成"
    },
    "login": {
      "title": "登入",
      "subtitle": "輸入您的電子郵件以接收驗證碼",
      "emailLabel": "電子郵件地址",
      "emailPlaceholder": "請輸入電子郵件",
      "invalidEmail": "請輸入有效的電子郵件地址",
      "sendOtp": "發送驗證碼",
      "sending": "發送中...",
      "otpFailed": "發送驗證碼失敗",
      "otpTitle": "輸入驗證碼",
      "otpSubtitle": "我們已發送驗證碼至",
      "otpLabel": "驗證碼",
      "otpPlaceholder": "請輸入6位數驗證碼",
      "invalidOtp": "請輸入驗證碼",
      "verify": "驗證並登入",
      "verifying": "驗證中...",
      "verifyFailed": "驗證失敗",
      "resend": "重新發送",
      "back": "返回"
    },
    "footer": "永續投資性向評估"
  },
  "assessment": {
    "header": {
      "title": "投資性向評估"
    },
    "back": "返回",
    "chat": {
      "assistant": "助理",
      "user": "您",
      "you": "您",
      "loading": "載入中...",
      "placeholder": "請輸入您的回答...",
      "send": "發送",
      "error": "無法處理您的回覆，請再試一次。",
      "rateLimit": "系統目前繁忙，請稍候再試。"
    },
    "complete": {
      "title": "評估完成！",
      "subtitle": "正在前往您的結果頁面..."
    },
    "close": {
      "title": "離開評估？",
      "description": "您的進度將不會被保存。確定要離開嗎？",
      "cancel": "繼續",
      "confirm": "離開"
    },
    "stages": {
      "welcome": "歡迎",
      "compliance_nationality": "國籍確認",
      "compliance_qualification": "資格確認",
      "dimension_gs": "風險取向",
      "dimension_di": "分析方式",
      "dimension_lv": "決策風格",
      "dimension_pa": "行動模式",
      "summary": "性格報告",
      "complete": "完成",
      "rejected": "評估結束"
    },
    "stageLabels": {
      "start": "開始",
      "verify": "驗證",
      "gs": "G/S",
      "di": "D/I",
      "lv": "L/V",
      "pa": "P/A",
      "result": "結果"
    }
  },
  "result": {
    "header": {
      "title": "評估結果"
    },
    "loading": "載入結果中...",
    "button": {
      "retake": "重新評估",
      "home": "關閉"
    },
    "nav": {
      "retake": "重新評估"
    },
    "scores": {
      "risk": {
        "title": "風險概況",
        "tolerance": "風險承受度",
        "horizon": "投資期限"
      },
      "esg": {
        "title": "ESG 偏好",
        "environmental": "環境",
        "social": "社會",
        "governance": "治理"
      }
    },
    "tracks": {
      "title": "推薦投資賽道",
      "sdg": "相關 SDG",
      "reason": "推薦理由",
      "match": "匹配度",
      "examples": "範例"
    },
    "sdg": {
      "title": "SDG 對齊"
    },
    "error": {
      "title": "載入結果錯誤",
      "message": "無法載入您的評估結果，請重試。"
    },
    "footer": "© 2026 安寶集團。保留所有權利。",
    "mbti": {
      "strengths": "優勢",
      "blindSpots": "盲點"
    }
  },
  "ui": {
    "icon": {
      "loading": "loader",
      "time": "clock",
      "complete": "check-circle",
      "user": "user",
      "check": "check",
      "error": "x-circle",
      "assistant": "bot"
    }
  }
}',
    1,
    'PAIBot',
    'System',
    GETDATE(),
    GETDATE()
);

-- Verify insertion
SELECT setting_code, setting_name, LEN(settingdescription) as json_length
FROM [dbo].[Settings]
WHERE group_name = 'PAIBot' AND setting_type = 'Translation';

/**
 * 投資賽道定義
 * 每個賽道包含風險等級、時間偏好、ESG 特徵與對應的 SDG 目標
 */

export interface InvestmentTrack {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  riskLevel: number; // 0-100，建議風險承受度
  timeHorizon: number; // 0-100，建議投資期限
  sdgs: number[]; // 對應的 SDG 目標編號
  esgProfile: {
    E: number; // 環境分數 0-100
    S: number; // 社會分數 0-100
    G: number; // 治理分數 0-100
  };
  sectors: string[]; // 相關產業
  examples: string[]; // 投資標的範例
}

export const INVESTMENT_TRACKS: InvestmentTrack[] = [
  {
    id: 'renewable_energy',
    name: '再生能源',
    nameEn: 'Renewable Energy',
    description: '投資太陽能、風能、水力等清潔能源技術與基礎設施，推動能源轉型',
    riskLevel: 60,
    timeHorizon: 70,
    sdgs: [7, 13, 9],
    esgProfile: { E: 95, S: 40, G: 50 },
    sectors: ['能源', '公用事業', '工業'],
    examples: ['太陽能電廠', '離岸風電', '綠色氫能', '儲能系統']
  },
  {
    id: 'circular_economy',
    name: '循環經濟',
    nameEn: 'Circular Economy',
    description: '投資廢棄物管理、回收技術、永續材料等循環經濟解決方案',
    riskLevel: 55,
    timeHorizon: 65,
    sdgs: [12, 9, 13],
    esgProfile: { E: 85, S: 45, G: 55 },
    sectors: ['環保', '材料', '工業'],
    examples: ['廢棄物處理', '再生材料', '產品即服務', '生物可分解材料']
  },
  {
    id: 'water_ocean',
    name: '水資源與海洋',
    nameEn: 'Water & Ocean',
    description: '投資水處理技術、海洋保護與永續漁業相關企業',
    riskLevel: 50,
    timeHorizon: 60,
    sdgs: [6, 14, 15],
    esgProfile: { E: 90, S: 50, G: 50 },
    sectors: ['公用事業', '環保', '食品'],
    examples: ['水處理設施', '海水淡化', '永續漁業', '海洋清潔技術']
  },
  {
    id: 'sustainable_agriculture',
    name: '永續農業與糧食',
    nameEn: 'Sustainable Agriculture',
    description: '投資有機農業、植物基蛋白、農業科技等永續糧食系統',
    riskLevel: 65,
    timeHorizon: 60,
    sdgs: [2, 12, 13, 15],
    esgProfile: { E: 80, S: 60, G: 45 },
    sectors: ['農業', '食品', '科技'],
    examples: ['有機農場', '植物肉', '垂直農場', '精準農業']
  },
  {
    id: 'health_wellbeing',
    name: '健康與福祉',
    nameEn: 'Health & Wellbeing',
    description: '投資醫療科技、預防醫學、心理健康等提升人類福祉的產業',
    riskLevel: 45,
    timeHorizon: 55,
    sdgs: [3, 10],
    esgProfile: { E: 30, S: 90, G: 60 },
    sectors: ['醫療', '科技', '服務'],
    examples: ['遠距醫療', '基因治療', '心理健康平台', '健康監測設備']
  },
  {
    id: 'education_inclusion',
    name: '教育與數位包容',
    nameEn: 'Education & Digital Inclusion',
    description: '投資教育科技、數位素養培訓、偏鄉教育資源等促進教育平等的項目',
    riskLevel: 50,
    timeHorizon: 65,
    sdgs: [4, 8, 10],
    esgProfile: { E: 25, S: 85, G: 55 },
    sectors: ['教育', '科技', '服務'],
    examples: ['線上學習平台', '職業培訓', '數位教育工具', '教育內容平台']
  },
  {
    id: 'sustainable_transport',
    name: '永續交通與移動',
    nameEn: 'Sustainable Transport',
    description: '投資電動車、公共運輸、共享經濟等減少碳排放的交通解決方案',
    riskLevel: 70,
    timeHorizon: 75,
    sdgs: [11, 13, 9],
    esgProfile: { E: 85, S: 50, G: 50 },
    sectors: ['汽車', '運輸', '科技'],
    examples: ['電動車製造', '充電基礎設施', '共享單車', '智慧交通系統']
  },
  {
    id: 'financial_inclusion',
    name: '金融包容與社會影響',
    nameEn: 'Financial Inclusion',
    description: '投資微型金融、社會住宅、性別平等等促進社會公平的項目',
    riskLevel: 40,
    timeHorizon: 50,
    sdgs: [1, 5, 8, 10, 11],
    esgProfile: { E: 20, S: 95, G: 65 },
    sectors: ['金融', '房地產', '服務'],
    examples: ['微型貸款', '社會住宅', '女性賦權基金', '普惠金融平台']
  },
  {
    id: 'biodiversity_nature',
    name: '生物多樣性與自然資本',
    nameEn: 'Biodiversity & Nature',
    description: '投資森林保護、生態復育、自然基礎解決方案等保護生物多樣性的項目',
    riskLevel: 55,
    timeHorizon: 80,
    sdgs: [15, 13, 14],
    esgProfile: { E: 100, S: 40, G: 45 },
    sectors: ['環保', '農業', '旅遊'],
    examples: ['森林碳匯', '生態旅遊', '自然復育', '生物多樣性保護基金']
  },
  {
    id: 'tech_innovation',
    name: '科技與創新',
    nameEn: 'Technology & Innovation',
    description: '投資人工智慧、區塊鏈、物聯網等推動永續轉型的創新科技',
    riskLevel: 75,
    timeHorizon: 70,
    sdgs: [9, 11, 16],
    esgProfile: { E: 40, S: 50, G: 70 },
    sectors: ['科技', '軟體', '通訊'],
    examples: ['AI 永續應用', '區塊鏈溯源', '智慧城市', '綠色數據中心']
  }
];

/**
 * SDG 目標名稱對照表
 */
export const SDG_NAMES: Record<number, { name: string; nameEn: string; icon: string }> = {
  1: { name: '消除貧窮', nameEn: 'No Poverty', icon: '🏘️' },
  2: { name: '消除飢餓', nameEn: 'Zero Hunger', icon: '🌾' },
  3: { name: '健康與福祉', nameEn: 'Good Health', icon: '❤️' },
  4: { name: '優質教育', nameEn: 'Quality Education', icon: '📚' },
  5: { name: '性別平等', nameEn: 'Gender Equality', icon: '⚖️' },
  6: { name: '淨水與衛生', nameEn: 'Clean Water', icon: '💧' },
  7: { name: '可負擔的潔淨能源', nameEn: 'Clean Energy', icon: '⚡' },
  8: { name: '就業與經濟成長', nameEn: 'Decent Work', icon: '💼' },
  9: { name: '工業、創新與基礎建設', nameEn: 'Innovation', icon: '🏗️' },
  10: { name: '減少不平等', nameEn: 'Reduced Inequalities', icon: '🤝' },
  11: { name: '永續城市與社區', nameEn: 'Sustainable Cities', icon: '🏙️' },
  12: { name: '責任消費與生產', nameEn: 'Responsible Consumption', icon: '♻️' },
  13: { name: '氣候行動', nameEn: 'Climate Action', icon: '🌍' },
  14: { name: '海洋生態', nameEn: 'Life Below Water', icon: '🌊' },
  15: { name: '陸地生態', nameEn: 'Life on Land', icon: '🌳' },
  16: { name: '和平、正義與健全制度', nameEn: 'Peace & Justice', icon: '⚖️' },
  17: { name: '全球夥伴關係', nameEn: 'Partnerships', icon: '🤝' }
};


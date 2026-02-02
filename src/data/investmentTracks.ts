/**
 * SDG Names - Fallback data when API is not available
 * This is used as a fallback in the result page for SDG icons and names
 * Primary data should come from the API via MasterDataContext
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

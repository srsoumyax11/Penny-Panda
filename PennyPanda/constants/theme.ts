export const UI_COLORS = {
  background: '#FAFAFD',
  surface: '#FFFFFF',
  textMain: '#1e293b',    // Slate 800
  textSecondary: '#64748b', // Slate 500
  primary: '#6366f1',     // Indigo 500, soft blurple matching the mockup
  primaryLight: '#e0e7ff',// Indigo 100
  border: '#f1f5f9',      // Slate 100
  danger: '#ef4444',      // Red 500
  success: '#10B981',     // Emerald 500
  card: '#FFFFFF',        // Kept for backward compat with some components
};

export const CATEGORY_COLORS: Record<string, { bg: string, icon: string }> = {
  'food': { bg: '#FFEDD5', icon: '#F97316' },            // Orange
  'food & dining': { bg: '#FFEDD5', icon: '#F97316' }, // Orange
  'transport': { bg: '#E0F2FE', icon: '#0EA5E9' },       // Blue
  'shopping': { bg: '#DCFCE7', icon: '#22C55E' },        // Green
  'utilities': { bg: '#FEF08A', icon: '#EAB308' },       // Yellow
  'home': { bg: '#F3E8FF', icon: '#A855F7' },            // Purple
  'entertainment': { bg: '#FCE7F3', icon: '#EC4899' },   // Pink
  'demo': { bg: '#F8FAFC', icon: '#64748B' },
  'dummy': { bg: '#F1F5F9', icon: '#64748B' },
};

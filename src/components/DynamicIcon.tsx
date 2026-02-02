'use client';

import {
  ChartBar,
  Target,
  Lightbulb,
  Leaf,
  Clock,
  Check,
  Loader,
  CheckCircle,
  XCircle,
  User,
  Bot,
  HandHelping,
  Wheat,
  HeartPulse,
  GraduationCap,
  Users,
  Droplets,
  Sun,
  Briefcase,
  Factory,
  Scale,
  Building2,
  Recycle,
  ThermometerSun,
  Fish,
  Trees,
  Landmark,
  Handshake,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  // Feature icons
  'chart-bar': ChartBar,
  'target': Target,
  'lightbulb': Lightbulb,
  'leaf': Leaf,
  // UI icons
  'clock': Clock,
  'check': Check,
  'loader': Loader,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'user': User,
  'bot': Bot,
  // SDG icons
  'hand-helping': HandHelping,
  'wheat': Wheat,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'users': Users,
  'droplets': Droplets,
  'sun': Sun,
  'briefcase': Briefcase,
  'factory': Factory,
  'scale': Scale,
  'building-2': Building2,
  'recycle': Recycle,
  'thermometer-sun': ThermometerSun,
  'fish': Fish,
  'trees': Trees,
  'landmark': Landmark,
  'handshake': Handshake,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className = '', size = 24 }: DynamicIconProps) {
  const IconComponent = iconMap[name];

  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }

  // Fallback: if it's an emoji or text, just render it
  return <span className={className}>{name}</span>;
}

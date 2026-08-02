import React from 'react';
import {
  GraduationCap,
  Building2,
  HeartHandshake,
  Zap,
  Calendar,
  Trophy,
  Award,
  User,
  Users,
  Target,
  Briefcase,
  Laptop,
  Star,
  Plus,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface NeonIconProps {
  name?: string;
  className?: string;
}

/**
 * Renders a glowing green neon styled Lucide SVG vector icon
 * matching category, college/organization, or position.
 */
export function NeonIcon({ name = '', className = 'w-4 h-4' }: NeonIconProps) {
  const lower = name.toLowerCase().trim();

  // Green Neon Glow Effect Style
  const glowStyle = 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.85)] stroke-[2.2]';

  // 🎓 Education / College / Student
  if (
    lower.includes('education') ||
    lower.includes('college') ||
    lower.includes('student') ||
    lower.includes('degree')
  ) {
    return <GraduationCap className={`${className} ${glowStyle}`} />;
  }

  // 🏛️ Organization / MVSR / College Campus
  if (
    lower.includes('mvsr') ||
    lower.includes('engineering') ||
    lower.includes('campus') ||
    lower.includes('university') ||
    lower.includes('school') ||
    lower.includes('organization') ||
    lower.includes('institution')
  ) {
    return <Building2 className={`${className} ${glowStyle}`} />;
  }

  // 🤝 NSS / Community / Volunteer
  if (
    lower.includes('nss') ||
    lower.includes('community') ||
    lower.includes('volunteer') ||
    lower.includes('social')
  ) {
    return <HeartHandshake className={`${className} ${glowStyle}`} />;
  }

  // ⚡ IEEE / Tech / Electricity
  if (
    lower.includes('ieee') ||
    lower.includes('electric') ||
    lower.includes('power') ||
    lower.includes('circuit')
  ) {
    return <Zap className={`${className} ${glowStyle}`} />;
  }

  // 📅 Event / Timeline
  if (
    lower.includes('event') ||
    lower.includes('timeline') ||
    lower.includes('date') ||
    lower.includes('year')
  ) {
    return <Calendar className={`${className} ${glowStyle}`} />;
  }

  // 🏆 Hackathon / Winner
  if (
    lower.includes('hackathon') ||
    lower.includes('trophy') ||
    lower.includes('prize') ||
    lower.includes('winner')
  ) {
    return <Trophy className={`${className} ${glowStyle}`} />;
  }

  // 🏅 Achievement / Award
  if (
    lower.includes('achievement') ||
    lower.includes('award') ||
    lower.includes('certif') ||
    lower.includes('honor')
  ) {
    return <Award className={`${className} ${glowStyle}`} />;
  }

  // 👤 Participant / User
  if (
    lower.includes('participant') ||
    lower.includes('user') ||
    lower.includes('individual')
  ) {
    return <User className={`${className} ${glowStyle}`} />;
  }

  // 👥 Team / Member
  if (lower.includes('team') || lower.includes('member') || lower.includes('group')) {
    return <Users className={`${className} ${glowStyle}`} />;
  }

  // 🎯 Organizer / Coordinator / Lead
  if (
    lower.includes('organizer') ||
    lower.includes('coordinator') ||
    lower.includes('target') ||
    lower.includes('lead')
  ) {
    return <Target className={`${className} ${glowStyle}`} />;
  }

  // 💻 Digital / Code / Web
  if (
    lower.includes('digital') ||
    lower.includes('web') ||
    lower.includes('code') ||
    lower.includes('tech')
  ) {
    return <Laptop className={`${className} ${glowStyle}`} />;
  }

  // ⭐ Star / Co-Lead
  if (lower.includes('star') || lower.includes('lead')) {
    return <Star className={`${className} ${glowStyle}`} />;
  }

  // ➕ Custom
  if (lower.includes('custom') || lower.includes('add') || lower.includes('plus')) {
    return <Plus className={`${className} ${glowStyle}`} />;
  }

  // Default fallback
  return <Sparkles className={`${className} ${glowStyle}`} />;
}

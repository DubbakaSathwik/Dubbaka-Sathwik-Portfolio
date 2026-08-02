export interface TagOption {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const PREDEFINED_TAGS: TagOption[] = [
  { id: 'College', label: 'College', icon: '🎓', color: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300' },
  { id: 'NSS', label: 'NSS', icon: '🤝', color: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' },
  { id: 'IEEE', label: 'IEEE', icon: '⚡', color: 'bg-amber-950/70 border-amber-500/40 text-amber-300' },
  { id: 'Event', label: 'Event', icon: '📅', color: 'bg-blue-950/70 border-blue-500/40 text-blue-300' },
  { id: 'Hackathon', label: 'Hackathon', icon: '🏆', color: 'bg-purple-950/70 border-purple-500/40 text-purple-300' },
  { id: 'Achievement', label: 'Achievement', icon: '🏅', color: 'bg-yellow-950/70 border-yellow-500/40 text-yellow-300' },
];

export interface PositionOption {
  id: string;
  label: string;
  icon: string;
}

export const PREDEFINED_POSITIONS: PositionOption[] = [
  { id: 'Student', label: 'Student', icon: '🎓' },
  { id: 'Participant', label: 'Participant', icon: '👤' },
  { id: 'Volunteer', label: 'Volunteer', icon: '🙋' },
  { id: 'Team Member', label: 'Team Member', icon: '👥' },
  { id: 'Organizer', label: 'Organizer', icon: '🎯' },
  { id: 'Student Coordinator', label: 'Student Coordinator', icon: '🧑‍💼' },
  { id: 'Digital Team', label: 'Digital Team', icon: '💻' },
  { id: 'Digital Co-Lead', label: 'Digital Co-Lead', icon: '⭐' },
  { id: 'Custom Position', label: 'Custom Position', icon: '➕' },
];

// Centralized Icon lookup map & function
export const CENTRALIZED_ICONS: Record<string, string> = {
  'College': '🎓',
  'NSS': '🤝',
  'IEEE': '⚡',
  'Event': '📅',
  'Hackathon': '🏆',
  'Achievement': '🏅',
  'Student': '🎓',
  'Participant': '👤',
  'Volunteer': '🙋',
  'Team Member': '👥',
  'Organizer': '🎯',
  'Student Coordinator': '🧑‍💼',
  'Digital Team': '💻',
  'Digital Co-Lead': '⭐',
};

export function getTagOrPositionIcon(val?: string): string {
  if (!val) return '🏷️';
  const trimmed = val.trim();
  if (CENTRALIZED_ICONS[trimmed]) {
    return CENTRALIZED_ICONS[trimmed];
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('college')) return '🎓';
  if (lower.includes('nss')) return '🤝';
  if (lower.includes('ieee')) return '⚡';
  if (lower.includes('event')) return '📅';
  if (lower.includes('hackathon')) return '🏆';
  if (lower.includes('achievement')) return '🏅';
  if (lower.includes('student')) return '🎓';
  if (lower.includes('volunteer')) return '🙋';
  if (lower.includes('lead') || lower.includes('co-lead')) return '⭐';
  if (lower.includes('digital')) return '💻';
  if (lower.includes('organizer')) return '🎯';
  if (lower.includes('team')) return '👥';
  if (lower.includes('participant')) return '👤';
  return '🏷️';
}

// Tech Tag Auto-Suggestions
export const POPULAR_TECH_SUGGESTIONS = [
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'MongoDB',
  'Tailwind CSS',
  'Python',
  'Java',
  'C++',
  'Next.js',
  'Vite',
  'Firebase',
  'PostgreSQL',
  'Canva',
  'Photoshop',
  'Premiere Pro',
  'Figma',
  'Leadership',
  'Public Speaking',
  'Event Management',
  'Community Service',
];

import {
  HeroData,
  AboutData,
  SkillCategory,
  Project,
  CreativeItem,
  JourneyItem,
  GalleryItem,
  BlogPost,
  ResumeOption,
  ContactInfo,
  CMSData,
  IntroData,
} from './types';

export const initialHeroData: HeroData = {
  heading: 'Dubbaka Sathwik',
  subtitle: 'Student • Full-Stack Developer • Creative Designer',
  tagline: 'Developer by Curiosity. Creator by Passion.',
  description:
    "I'm a Computer Science student at MVSR Engineering College, Hyderabad, passionate about building modern web applications and creating engaging digital visuals. My work combines software development with creative design, including web applications, graphic design, poster creation, social media creatives, photo editing, AI-assisted workflows, and video production.",
  primaryBtnText: 'View My Work',
  secondaryBtnText: 'Download Resume',
  tertiaryBtnText: 'Contact Me',
};

export const initialAboutData: AboutData = {
  heading: 'Developer by Curiosity. Creator by Passion.',
  subheading: '3rd Year CSIT Student at MVSR Engineering College\nFull Stack Developer & Creative Designer',
  degree: 'B.E. Computer Science & Information Technology',
  college: 'MVSR Engineering College',
  department: 'Computer Science and Information Technology',
  location: 'MVSR Engineering College • Hyderabad, Telangana, India',
  yearOfStudy: '3rd Year',
  avatarUrl: '',
  bioParagraph1:
    "My journey into technology started with exploring programming and experimentation. As my curiosity grew, I learned full-stack web development with React, Node.js, Express, MongoDB, and MySQL, alongside creating digital designs, poster artworks, video editing, and contributing to college initiatives.",
  bioParagraph2: '',
  bioParagraph3: '',
  bioParagraph4: '',
  bioParagraph5: '',
  leadership: [
    'NSS Digital Co-Lead',
    'IEEE Student Member',
    'Student Coordinator',
  ],
  currentFocus: [
    'Full-Stack Development',
    'Artificial Intelligence',
    'Creative Design',
    'AI-powered Applications',
  ],
  availability: [
    'Open for Internships',
    'Freelance Projects',
  ],
  tags: [
    'Full-Stack Development',
    'Artificial Intelligence',
    'React',
    'Node.js',
    'Creative Design',
    'Open Source Learner',
    'Problem Solver',
    'Continuous Learner',
  ],
  quote:
    "I don't believe great developers are defined by the number of technologies they know—they're defined by their curiosity to keep learning.",
  quoteHighlight:
    'Curiosity has always been my biggest motivation, and I believe it always will be.',
  journeyTitle: 'My Journey',
  philosophyTitle: 'My Philosophy',
  philosophyParagraph1:
    "For me, learning never has a finish line. Every framework, every bug, and every project adds another layer to my understanding. My philosophy is simple: stay curious, keep building, and never stop improving.",
  philosophyParagraph2: '',
  philosophyParagraph3: '',
  stats: [
    { label: 'MVSR Engineering College', value: '3rd Year CSIT' },
    { label: 'Core Projects', value: '12+' },
    { label: 'Active Member', value: 'NSS & IEEE' },
    { label: 'Creative Designs', value: '45+' },
  ],
  showProfileCard: true,
  showQuote: true,
  showJourney: true,
  showPhilosophy: true,
  showSkills: true,
};

import seedData from './seed_data.json';

export const initialSkills: SkillCategory[] = (seedData.skills || []) as SkillCategory[];

export const initialProjects: Project[] = (seedData.projects || []) as Project[];

export const initialCreativePortfolio: CreativeItem[] = (seedData.creativePortfolio || []) as CreativeItem[];

export const initialJourneyItems: JourneyItem[] = (seedData.journey || []) as JourneyItem[];

export const initialGalleryItems: GalleryItem[] = (seedData.gallery || []) as GalleryItem[];

export const initialBlogPosts: BlogPost[] = (seedData.blogs || []) as BlogPost[];

export const initialResumeOptions: ResumeOption[] = (seedData.resumes || []) as ResumeOption[];

export const initialContactInfo: ContactInfo = {
  email: 'dubbakasathwik@gmail.com',
  phone: '+91 8527564839',
  location: 'Hyderabad, Telangana, India',
  availability: 'Open for Internship Opportunities & Freelance Projects',
  instagram: 'wilder_sathwik',
  socials: [
    { platform: 'GitHub', url: 'https://github.com/dubbakasathwik' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/dubbakasathwik' },
    { platform: 'Instagram', url: 'https://instagram.com/wilder_sathwik' },
    { platform: 'Twitter / X', url: 'https://twitter.com/dubbakasathwik' },
    { platform: 'YouTube', url: 'https://youtube.com/@dubbakasathwik' },
    { platform: 'WhatsApp', url: 'https://wa.me/918527564839' },
    { platform: 'Discord', url: 'https://discord.com' },
  ],
  ...(seedData.contactInfo || {}),
};

export const initialIntroData: IntroData = {
  enabled: true,
  firstName: 'Sathwik',
  lastName: 'Dubbaka',
  welcomeText: 'Welcome to my portfolio.',
  subtitleText: 'ENTERING DEVELOPER PORTFOLIO',
  floatingWords: [
    'Full-Stack Developer',
    'React & Node.js',
    'Creative Designer',
    'Artificial Intelligence',
    'Video Editor',
    'Digital Co-Lead',
    'Web Development',
    'Hackathon Lead',
    'NSS Volunteer',
    'Problem Solver',
    'IEEE Coordinator',
    'Student Coordinator',
  ],
  wordsSpeedSeconds: 4.8,
  nameDelaySeconds: 1.2,
  ...(seedData.intro || {}),
};

export const initialCMSData: CMSData = {
  hero: (seedData.hero as HeroData) || initialHeroData,
  about: (seedData.about as AboutData) || initialAboutData,
  skills: initialSkills,
  projects: initialProjects,
  creativePortfolio: initialCreativePortfolio,
  journey: initialJourneyItems,
  gallery: initialGalleryItems,
  blogs: initialBlogPosts,
  resumes: initialResumeOptions,
  contactInfo: initialContactInfo,
  intro: initialIntroData,
  messages: [],
};

export interface HeroData {
  heading: string;
  subtitle: string;
  tagline: string;
  description: string;
  primaryBtnText: string;
  secondaryBtnText: string;
  tertiaryBtnText: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string[];
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
  longDescription?: string;
  category: 'Full-Stack' | 'Web Apps' | 'Tools' | 'Personal' | 'College Projects' | 'Frontend' | 'Backend' | string;
  tags: string[];
  technologies: string[];
  thumbnail: string;
  image?: string;
  images: string[];
  githubUrl?: string;
  demoUrl?: string;
  featured: boolean;
  status: 'Completed' | 'In Progress' | 'Maintained' | string;
  year: string;
}

export type CreativeCategory =
  | 'Video Editing'
  | 'Poster Design'
  | 'Photo Editing'
  | 'Advertisements'
  | 'Instagram Creatives'
  | 'Social Media Posts'
  | 'Project Branding'
  | 'NSS Works'
  | 'College Event Designs'
  | 'Motion Graphics'
  | 'Thumbnail Design'
  | 'Personal Creative Works'
  | string;

export interface CreativeItem {
  id: string;
  title: string;
  category: CreativeCategory;
  shortDescription: string;
  detailedDescription: string;
  softwareUsed: string[];
  tags: string[];
  thumbnail: string;
  images: string[];
  videoUrl?: string;
  platformUrl?: string;
  completionDate: string;
  featured: boolean;
  status: string;
}

export interface JourneyItem {
  id: string;
  year: string;
  title: string;
  organization: string;
  role: string;
  category: 'Education' | 'Engineering' | 'Creative' | 'NSS & Community' | 'Milestone' | 'Achievement' | 'College' | 'NSS' | 'IEEE' | 'Event' | 'Hackathon' | string;
  description: string;
  detailedDescription?: string;
  tags: string[];
  icon?: string;
  image?: string;
  images?: string[];
}

export type GalleryCategory =
  | 'College'
  | 'NSS'
  | 'Hackathons'
  | 'Workspace'
  | 'Photography'
  | 'Creative Designs'
  | 'Posters'
  | 'Events'
  | 'Friends'
  | 'Certificates'
  | 'Behind the Scenes'
  | 'Personal Moments';

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  category: GalleryCategory | string;
  tags: string[];
  technologies?: string[];
  date: string;
  featured: boolean;
  location?: string;
  credentialUrl?: string;
  image: string;
  images?: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  snippet: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  coverImage: string;
  status: 'Published' | 'Draft';
}

export interface ResumeOption {
  id: string;
  title: string;
  filename: string;
  summary: string;
  pdfUrl?: string;
  skills: string[];
  sections: {
    title: string;
    items: {
      heading: string;
      subheading?: string;
      date?: string;
      details: string[];
    }[];
  }[];
}

export interface AboutData {
  heading: string;
  subheading: string;
  bioParagraph1: string;
  bioParagraph2: string;
  bioParagraph3: string;
  bioParagraph4?: string;
  bioParagraph5?: string;
  avatarUrl: string;
  college: string;
  department: string;
  degree?: string;
  location?: string;
  yearOfStudy: string;
  leadership?: string[];
  currentFocus?: string[];
  availability?: string[];
  tags?: string[];
  quote?: string;
  quoteHighlight?: string;
  journeyTitle?: string;
  philosophyTitle?: string;
  philosophyParagraph1?: string;
  philosophyParagraph2?: string;
  philosophyParagraph3?: string;
  stats: {
    label: string;
    value: string;
  }[];
  // Section visibility toggles
  showProfileCard?: boolean;
  showQuote?: boolean;
  showJourney?: boolean;
  showPhilosophy?: boolean;
  showSkills?: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  availability: string;
  instagram: string;
  socials: {
    platform: string;
    url: string;
  }[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  time: string;
  status: 'unread' | 'read' | 'archived';
}

export interface CMSData {
  hero: HeroData;
  about: AboutData;
  skills: SkillCategory[];
  projects: Project[];
  creativePortfolio: CreativeItem[];
  journey: JourneyItem[];
  gallery: GalleryItem[];
  blogs: BlogPost[];
  resumes: ResumeOption[];
  contactInfo: ContactInfo;
  messages: ContactMessage[];
}

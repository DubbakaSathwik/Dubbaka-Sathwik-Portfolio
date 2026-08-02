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
} from './types';

export const initialHeroData: HeroData = {
  heading: 'Dubbaka Sathwik',
  subtitle: 'Student • Full-Stack Developer • Creative Designer',
  tagline: 'Developer by Curiosity. Creator by Passion.',
  description:
    "I'm a Computer Science student at MVSR Engineering College, Hyderabad, passionate about building modern web applications and creating engaging digital visuals. My work combines software development with creative design, including web applications, graphic design, poster creation, social media creatives, photo editing, AI-assisted workflows, and video production. I enjoy transforming ideas into digital experiences that are both functional and visually appealing while continuously learning new technologies and creative tools.",
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
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  bioParagraph1:
    "My journey into technology started much earlier than I ever imagined. Back in school, I began experimenting with Minecraft Mods, texture packs, and game modifications, which became my first introduction to programming. As my curiosity grew, I learned C, Java, Python, and JavaScript, eventually diving into full-stack web development with React, Node.js, Express, MongoDB, and MySQL. Along the way, my team built an AI-powered SQL Query Generator for a GFG Hackathon, sparking my passion for AI development. Alongside coding, I design posters, edit photos, produce promotional reels, and contribute as NSS Digital Co-Lead and an IEEE Student Member at MVSR Engineering College.",
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
    "I don't believe great developers are defined by the number of technologies they know—they're defined by their curiosity to keep learning. My journey began with modifying Minecraft, evolved into building full-stack web applications, and expanded into creative design through posters, photo editing, and video production.",
  quoteHighlight:
    'Curiosity has always been my biggest motivation, and I believe it always will be.',
  journeyTitle: 'My Journey',
  philosophyTitle: 'My Philosophy',
  philosophyParagraph1:
    "For me, learning never has a finish line. Every framework, every bug, every failed attempt, and every successful project adds another layer to my understanding. I am especially fascinated by the future of Artificial Intelligence and developer tools, with a long-term goal of building my own Local AI Coding Agent. My philosophy is simple: stay curious, keep building, and never stop improving. I don't aim to know everything—I aim to become a little better with every project I complete.",
  philosophyParagraph2: '',
  philosophyParagraph3: '',
  stats: [
    { label: 'MVSR Engineering College', value: '3rd Year CSIT' },
    { label: 'Core Projects', value: '12+' },
    { label: 'Active Member', value: 'NSS Digital Co-lead & IEEE Student Member' },
    { label: 'Creative Designs', value: '45+' },
  ],
  showProfileCard: true,
  showQuote: true,
  showJourney: true,
  showPhilosophy: true,
  showSkills: true,
};

export const initialSkills: SkillCategory[] = [
  {
    id: 'skill-1',
    category: 'Programming Languages',
    skills: ['C', 'Java', 'Python', 'JavaScript'],
  },
  {
    id: 'skill-2',
    category: 'Frontend Development',
    skills: ['HTML', 'CSS', 'React', 'Tailwind CSS'],
  },
  {
    id: 'skill-3',
    category: 'Backend Development',
    skills: ['Node.js', 'Express.js'],
  },
  {
    id: 'skill-4',
    category: 'Databases & Servers',
    skills: ['MySQL', 'MongoDB', 'Apache', 'XAMPP'],
  },
  {
    id: 'skill-5',
    category: 'AI Tools',
    skills: ['ChatGPT', 'Gemini', 'Claude', 'Codex', 'DeepSeek', 'Hugging Face', 'Antigravity'],
  },
  {
    id: 'skill-6',
    category: 'Creative Skills',
    skills: [
      'Poster Design',
      'Graphic Design',
      'Photo Editing',
      'Video Editing',
      'Social Media Creatives',
      'AI-assisted Design Workflow',
    ],
  },
  {
    id: 'skill-7',
    category: 'Tools & Utilities',
    skills: ['Git', 'Canva', 'CapCut'],
  },
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'MVSR Campus Event & Workshop Hub',
    summary:
      'Full-stack portal for campus registrations, workshop schedules, and poster announcements.',
    description:
      'A web portal built for MVSR Engineering College students to browse upcoming technical workshops, NSS community drives, and cultural fests. Features instant event registration, downloadable schedules, and interactive poster showcases.',
    category: 'Full-Stack',
    tags: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
    thumbnail:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1000',
    ],
    githubUrl: 'https://github.com/dubbakasathwik/mvsr-event-hub',
    demoUrl: 'https://mvsr-events.vercel.app',
    featured: true,
    status: 'Completed',
    year: '2025',
  },
  {
    id: 'proj-2',
    title: 'AI Creative & Poster Prompt Generator',
    summary:
      'Smart web app that generates creative poster themes, color palettes, and captions for social media posts.',
    description:
      'Designed to streamline graphic design workflows by integrating AI prompt assistants. Generates layout ideas, typography suggestions, and Instagram captions for college clubs and personal projects.',
    category: 'Web Apps',
    tags: ['React', 'JavaScript', 'Gemini API', 'Tailwind CSS'],
    technologies: ['React', 'JavaScript', 'Gemini API', 'Tailwind CSS'],
    thumbnail:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    ],
    githubUrl: 'https://github.com/dubbakasathwik/ai-poster-assistant',
    demoUrl: 'https://ai-poster-assistant.vercel.app',
    featured: true,
    status: 'Completed',
    year: '2025',
  },
  {
    id: 'proj-3',
    title: 'NSS Community Drive Manager',
    summary:
      'Database-backed system for logging NSS volunteer hours, blood donation registries, and photo records.',
    description:
      'Developed with Node.js, Express, and MySQL/XAMPP environment to manage NSS activity records at MVSR Engineering College. Allows admins to update donation drives and publish activity galleries.',
    category: 'Personal',
    tags: ['Node.js', 'Express', 'MySQL', 'HTML/CSS', 'Apache'],
    technologies: ['Node.js', 'Express', 'MySQL', 'XAMPP', 'Apache'],
    thumbnail:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
    ],
    githubUrl: 'https://github.com/dubbakasathwik/nss-drive-manager',
    demoUrl: 'https://nss-mvsr.vercel.app',
    featured: false,
    status: 'Maintained',
    year: '2024',
  },
  {
    id: 'proj-4',
    title: 'CSE Student Task & Lab Submission Planner',
    summary:
      'Minimalist web dashboard to track engineering coursework, lab records, and weekly study schedules.',
    description:
      'Clean, dark-themed productivity web application built with React and Tailwind CSS. Features custom category filters, deadline countdown timers, and local browser persistence.',
    category: 'Personal',
    tags: ['React', 'Tailwind CSS', 'JavaScript', 'HTML5'],
    technologies: ['React', 'Tailwind CSS', 'JavaScript'],
    thumbnail:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=1000',
    ],
    githubUrl: 'https://github.com/dubbakasathwik/student-study-planner',
    demoUrl: 'https://study-planner-sathwik.vercel.app',
    featured: false,
    status: 'Completed',
    year: '2024',
  },
  {
    id: 'proj-5',
    title: 'Sathwik Dynamic Portfolio & CMS',
    summary:
      'Personal operating system and portfolio with integrated Content Management System.',
    description:
      'A production-ready full-stack portfolio featuring Apple and Vercel inspired minimal design, live CMS editing, multi-resume popup generator, markdown blogging, and responsive gallery previews.',
    category: 'Full-Stack',
    tags: ['React 19', 'TypeScript', 'Tailwind CSS', 'Express', 'Vite'],
    technologies: ['React 19', 'TypeScript', 'Tailwind CSS', 'Express'],
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
    ],
    githubUrl: 'https://github.com/dubbakasathwik/sathwik-portfolio-cms',
    demoUrl: 'https://dubbakasathwik.dev',
    featured: true,
    status: 'Completed',
    year: '2026',
  },
];

export const initialCreativePortfolio: CreativeItem[] = [
  {
    id: 'cr-1',
    title: 'MVSR Technical Fest Main Event Poster',
    category: 'College Event Designs',
    shortDescription:
      'High-impact promotional poster designed for college annual technical symposium.',
    detailedDescription:
      'Designed using Canva, Photoshop, and AI image synthesis tools. Featured bold typography, clean event details layout, and custom color accents for high print visibility.',
    softwareUsed: ['Canva', 'Photoshop', 'AI Tools'],
    tags: ['Poster Design', 'College Fest', 'MVSR', 'Canva'],
    thumbnail:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000',
    ],
    completionDate: '2025',
    featured: true,
    status: 'Published',
  },
  {
    id: 'cr-2',
    title: 'NSS Blood Donation Campaign Creatives',
    category: 'NSS Works',
    shortDescription:
      'Social media graphics and poster series advocating blood donation drive on campus.',
    detailedDescription:
      'Crafted Instagram post designs and flex banners for the MVSR NSS Unit. Focused on clear messaging, medical awareness, and volunteer registration QR codes.',
    softwareUsed: ['Canva', 'CapCut', 'Photo Editing'],
    tags: ['NSS Works', 'Social Media Posts', 'Community Service'],
    thumbnail:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
    ],
    completionDate: '2025',
    featured: true,
    status: 'Published',
  },
  {
    id: 'cr-3',
    title: 'Cinematic Reel & Event Highlight Video',
    category: 'Video Editing',
    shortDescription:
      'Dynamic short-form video edit featuring beat syncing, smooth cuts, and sound design.',
    detailedDescription:
      'Edited using CapCut and Premiere Pro. Includes speed ramping, custom color grading, animated captions, and audio beat matching for maximum audience engagement.',
    softwareUsed: ['CapCut', 'Premiere Pro', 'Audition'],
    tags: ['Video Editing', 'Reels', 'CapCut', 'Beat Sync'],
    thumbnail:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1000',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    completionDate: '2025',
    featured: true,
    status: 'Published',
  },
  {
    id: 'cr-4',
    title: 'Instagram Tech & Creative Content Series',
    category: 'Instagram Creatives',
    shortDescription:
      'Carousel graphics and story templates for @wilder_sathwik personal brand.',
    detailedDescription:
      'A series of clean minimalist Instagram carousel posts covering coding tips, design workflows, and student life insights.',
    softwareUsed: ['Canva', 'Photoshop', 'AI Tools'],
    tags: ['Instagram Creatives', 'Social Media Posts', 'Branding'],
    thumbnail:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    ],
    completionDate: '2024',
    featured: false,
    status: 'Published',
  },
  {
    id: 'cr-5',
    title: 'Personal Creative Art & Poster Experiment',
    category: 'Personal Creative Works',
    shortDescription:
      'Abstract digital art and photo manipulation exploring dark aesthetic themes.',
    detailedDescription:
      'Experimental photo editing and digital artwork combining photography with abstract geometric lighting and minimalist text overlays.',
    softwareUsed: ['Photo Editing', 'AI Tools', 'Canva'],
    tags: ['Photo Editing', 'Personal Creative Works', 'Poster Design'],
    thumbnail:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1000',
    ],
    completionDate: '2024',
    featured: false,
    status: 'Completed',
  },
];

export const initialJourneyItems: JourneyItem[] = [
  {
    id: 'j-5',
    year: '8th Class (~2019)',
    title: 'First Spark in Programming (Minecraft Curiosity)',
    organization: 'School Days Curiosity',
    role: 'Curious Beginner',
    category: 'Milestone',
    description:
      'Became curious about Minecraft texture packs and game tweaks. This curiosity ignited my passion for computer programming and technology.',
    detailedDescription:
      'Discovered passion for computer science back in school while exploring {Minecraft texture packs} and game configuration files. Experimented with C programming and problem-solving, turning a simple gamer curiosity into a lifelong engineering aspiration.',
    tags: ['Minecraft', 'C Language', 'First Code', 'Curiosity'],
  },
  {
    id: 'j-4',
    year: '2021 - 2023',
    title: 'Creative Design, Photo & Video Editing Exploration',
    organization: 'Personal Passion Projects',
    role: 'Creative Designer & Video Editor',
    category: 'Creative',
    description:
      'Explored Canva, CapCut, Premiere Pro, photo editing tools, and AI-assisted workflows to produce social media content and posters.',
    detailedDescription:
      'Explored creative media design using {Canva}, {CapCut}, {Adobe Premiere Pro}, and AI graphic synthesis tools. Produced dynamic reel edits, poster designs, and social media branding templates.',
    tags: ['Canva', 'CapCut', 'Photo Editing', 'AI Tools'],
    images: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1000',
    ],
  },
  {
    id: 'j-3',
    year: '2023 - 2024',
    title: 'Full-Stack Web Development & Modern Tech Stack',
    organization: 'Self-Driven Learning & Projects',
    role: 'Full-Stack Developer',
    category: 'Engineering',
    description:
      'Mastered React, Tailwind CSS, Node.js, Express, MongoDB, MySQL, and XAMPP. Built multiple web apps and project tools.',
    detailedDescription:
      'Built a solid foundation in modern full-stack web development through hands-on project creation. Developed production-ready applications using {React 19}, {TypeScript}, {Node.js}, {Express}, {MySQL}, and {MongoDB}. Created custom CMS engines, study planners, and AI-powered web utilities.',
    tags: ['React', 'Node.js', 'Express', 'MySQL', 'MongoDB'],
    images: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
    ],
  },
  {
    id: 'j-1',
    year: '2023 - Present',
    title: 'MVSR Engineering College - 3rd Year CSE Student',
    organization: 'MVSR Engineering College, Hyderabad',
    role: 'Computer Science & Engineering Student',
    category: 'Education',
    description:
      'Pursuing B.E. in Computer Science Engineering. Studying Data Structures, OOP, Database Systems, and Web Engineering.',
    detailedDescription:
      'Pursuing B.E. in Computer Science Engineering (3rd Year) at {MVSR Engineering College, Hyderabad}. Focused on core engineering concepts including {Data Structures & Algorithms}, {Object-Oriented Programming in Java and C++}, {Database Management Systems (MySQL/MongoDB)}, and modern Full-Stack Web Development. Actively participating in college events, technical workshops, and coding challenges.',
    tags: ['CSE', 'Java', 'Python', 'DBMS', 'Web Dev'],
    images: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
    ],
  },
  {
    id: 'j-2',
    year: '2024 - Present',
    title: 'NSS Volunteer & Event Creative Design Lead',
    organization: 'NSS MVSR Unit',
    role: 'Active Volunteer & Designer',
    category: 'NSS & Community',
    description:
      'Contributing to NSS community drives, blood donation camps, clean energy awareness, and college event poster creations.',
    detailedDescription:
      'Serving as an active volunteer and {Event Creative Design Lead} for the {MVSR NSS Unit}. Responsible for designing high-impact flex banners, Instagram promotional graphics, and digital media for social awareness drives including blood donation camps, environmental initiatives, and community outreach programs.',
    tags: ['NSS', 'Community Service', 'Poster Design', 'Leadership'],
    images: [
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=1000',
    ],
  },
];

export const initialGalleryItems: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'Full-Stack Web Engineering Certification',
    description: 'Certified in React.js, Node.js, Express, and Database Architectures for modern web applications.',
    detailedDescription: 'Successfully completed rigorous full-stack web engineering program covering frontend React state management, Express backend API design, database modeling with MongoDB & MySQL, and responsive Tailwind UI design.',
    category: 'Certificates',
    tags: ['Full-Stack', 'Web Dev', 'Certification'],
    technologies: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS'],
    date: '2025',
    featured: true,
    location: 'Online / MVSR CSE',
    credentialUrl: 'https://github.com/dubbakasathwik',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
    ],
  },
  {
    id: 'g-2',
    title: 'NSS Outstanding Community Service Award',
    description: 'Recognized by MVSR Unit for leading volunteer drives, blood donation camps, and campus initiatives.',
    detailedDescription: 'Honored with the NSS Outstanding Community Volunteer Certificate for dedicated leadership in organizing campus blood donation camps, digital literacy workshops, and environmental awareness drives at MVSR Engineering College.',
    category: 'NSS and IEEE',
    tags: ['NSS', 'Community Service', 'Leadership', 'Award'],
    technologies: ['Leadership', 'Event Management', 'Public Relations', 'Community Service'],
    date: '2025',
    featured: true,
    location: 'MVSR Campus, Hyderabad',
    credentialUrl: 'https://mvsrec.edu.in',
    image:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
    ],
  },
  {
    id: 'g-3',
    title: 'College CSE Hackathon Winner - Best Web Innovation',
    description: 'Secured 1st Prize in campus web engineering competition building student event portal.',
    detailedDescription: 'Awarded 1st place in the MVSR CSE Department Hackathon for building an automated campus event management platform featuring real-time registrations, poster showcases, and responsive UI.',
    category: 'Hackathons',
    tags: ['Hackathon', 'Winner', 'Web Dev', 'Innovation'],
    technologies: ['React', 'JavaScript', 'Node.js', 'UI/UX Design'],
    date: '2025',
    featured: true,
    location: 'MVSR CSE Dept, Hyderabad',
    credentialUrl: 'https://github.com/dubbakasathwik',
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000',
    ],
  },
  {
    id: 'g-4',
    title: 'Python Programming & Data Structures Mastery',
    description: 'Certification covering object-oriented Python, algorithm analysis, and dynamic data structures.',
    detailedDescription: 'Comprehensive certification in core Python development, data structure optimization (Trees, Graphs, Sorting), and problem-solving methodologies.',
    category: 'Certificates',
    tags: ['Python', 'Data Structures', 'Certification'],
    technologies: ['Python', 'OOPs', 'Algorithms', 'Data Structures'],
    date: '2024',
    featured: false,
    location: 'Online Certification',
    credentialUrl: 'https://github.com/dubbakasathwik',
    image:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'g-5',
    title: 'Creative Design & Multimedia Excellence Certificate',
    description: 'Awarded for producing 45+ official event posters and video reels for college department fests.',
    detailedDescription: 'Recognized for creative contribution as lead designer for department event posters, promotional video editing, and digital media graphics.',
    category: 'Awards',
    tags: ['Design', 'Video Editing', 'Canva', 'Award'],
    technologies: ['Canva', 'Photoshop', 'CapCut', 'Premiere Pro', 'Graphic Design'],
    date: '2024',
    featured: true,
    location: 'MVSR College Fest',
    credentialUrl: 'https://instagram.com/wilder_sathwik',
    image:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'g-6',
    title: 'IEEE Technical Workshop Certificate of Completion',
    description: 'Completed hands-on workshop on modern web tech, API integrations, and cloud hosting.',
    detailedDescription: 'Participated in intensive IEEE student chapter workshop focusing on REST APIs, Version Control with Git/GitHub, and cloud deployment basics.',
    category: 'Certificates',
    tags: ['IEEE', 'Workshop', 'APIs', 'Git'],
    technologies: ['Git', 'GitHub', 'REST APIs', 'Web Technologies'],
    date: '2024',
    featured: false,
    location: 'IEEE Student Chapter',
    credentialUrl: 'https://github.com/dubbakasathwik',
    image:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'g-7',
    title: 'MVSR CSE Academic & Technical Excellence Recognition',
    description: 'Recognized for consistent academic performance and technical project contributions in 3rd year.',
    detailedDescription: 'Departmental recognition for strong performance in DBMS, Web Technologies, Java Programming, and active technical club involvement.',
    category: 'Academics',
    tags: ['Academics', 'MVSR', 'Computer Science'],
    technologies: ['Java', 'DBMS', 'MySQL', 'Web Development'],
    date: '2024',
    featured: true,
    location: 'MVSR Engineering College',
    credentialUrl: 'https://mvsrec.edu.in',
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
  },
];

export const initialBlogPosts: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'My Journey from Minecraft Mods in 8th Class to Full-Stack Development',
    slug: 'minecraft-mods-to-full-stack-development',
    snippet:
      'How curious experimentation with Minecraft textures and small game tweaks ignited a lifelong passion for computer science and web engineering.',
    content: `Back in 8th class, I was fascinated by Minecraft. What started as simple curiosity about texture packs and game modifications quickly sparked a deep interest in how software works behind the scenes.

### From Modding to Programming

Tinkering with configuration files and basic code logic taught me problem-solving early on. Eventually, that curiosity led me to explore fundamental programming languages like C, Java, and Python.

### Stepping Into Web Development

When I entered Computer Science Engineering at MVSR Engineering College, I turned that interest towards full-stack web development. Learning React, Node.js, Express, and databases (MySQL & MongoDB) allowed me to build functional applications that solve real student and campus needs.

Never underestimate small sparks of curiosity—they often lead to your greatest skills.`,
    date: 'July 2025',
    readTime: '4 min read',
    category: 'Personal Story',
    tags: ['Minecraft', 'Full-Stack', 'Coding Journey', 'MVSR'],
    coverImage:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1000',
    status: 'Published',
  },
  {
    id: 'blog-2',
    title: 'Designing Eye-Catching College Event Posters with Canva & AI Tools',
    slug: 'designing-college-event-posters-canva-ai',
    snippet:
      'Practical tips for engineering students on blending AI design tools, Canva, and clean typography to create striking event posters.',
    content: `As a Computer Science student who loves creative design, I often design posters for MVSR college events and NSS activities.

### Key Principles for Event Posters:

1. **Hierarchy First**: Make the event name and key date/time immediately readable from a distance.
2. **Color Contrast**: Use clean dark backgrounds paired with sharp white and vibrant accent colors.
3. **AI Assistance**: Utilize AI tools like ChatGPT or Gemini to brainstorm catchy taglines, then use Canva or Photoshop for final composition.

Combining tech with creative design allows engineering projects and campus events to stand out!`,
    date: 'June 2025',
    readTime: '5 min read',
    category: 'Creative Design',
    tags: ['Poster Design', 'Canva', 'AI Tools', 'Graphics'],
    coverImage:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    status: 'Published',
  },
  {
    id: 'blog-3',
    title: 'Building Practical Web Apps with React, Express, and MongoDB',
    slug: 'building-practical-web-apps-react-express-mongodb',
    snippet:
      'A student developer guide on setting up full-stack MERN architecture for campus projects and portfolio applications.',
    content: `Building web applications as a student is one of the best ways to solidify classroom computer science concepts.

### Why MERN Stack Works Well:

* **JavaScript Everywhere**: Write frontend React components and backend Node/Express routes in the same language.
* **Flexible Schemas**: MongoDB allows rapid iteration when adding new features.
* **Tailwind CSS Utility Styling**: Achieve clean Vercel/Apple inspired layouts with minimal custom CSS overhead.

Keep building real projects—hands-on practice beats theoretical reading every time!`,
    date: 'May 2025',
    readTime: '6 min read',
    category: 'Web Engineering',
    tags: ['React', 'Express', 'MongoDB', 'Node.js', 'Tailwind CSS'],
    coverImage:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
    status: 'Published',
  },
];

export const initialResumeOptions: ResumeOption[] = [
  {
    id: 'fullstack',
    title: 'Full Stack Developer Resume',
    filename: 'Dubbaka_Sathwik_FullStack_Resume.pdf',
    summary:
      '3rd Year CSE Student at MVSR Engineering College proficient in building modern web applications with React, Node.js, Express, MongoDB, MySQL, and Tailwind CSS. Seeking full-stack engineering internships.',
    skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'JavaScript', 'C', 'Java', 'Python', 'Tailwind CSS', 'Git'],
    sections: [
      {
        title: 'Education',
        items: [
          {
            heading: 'B.E. in Computer Science & Engineering',
            subheading: 'MVSR Engineering College, Hyderabad',
            date: '2023 - 2027 (Currently 3rd Year)',
            details: [
              'Coursework: Data Structures, OOPs in Java/C++, DBMS (MySQL/MongoDB), Web Technologies, Computer Networks.',
              'Active volunteer in NSS MVSR Unit and campus technical workshops.',
            ],
          },
        ],
      },
      {
        title: 'Key Web Projects',
        items: [
          {
            heading: 'MVSR Campus Event & Workshop Hub',
            subheading: 'Full-Stack MERN Application',
            date: '2025',
            details: [
              'Built student registration portal with event schedules and poster showcases using React, Express, and MongoDB.',
              'Implemented dynamic state search and responsive Tailwind CSS layout.',
            ],
          },
          {
            heading: 'AI Creative & Poster Prompt Generator',
            subheading: 'React & AI API Web App',
            date: '2025',
            details: [
              'Developed web app assisting design workflows by generating poster themes and social media captions via AI endpoints.',
            ],
          },
          {
            heading: 'NSS Community Activity Manager',
            subheading: 'Node.js, Express & MySQL System',
            date: '2024',
            details: [
              'Created backend system to track volunteer activity records, blood donation drives, and event galleries.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'creative',
    title: 'Creative Designer & Editor Resume',
    filename: 'Dubbaka_Sathwik_Creative_Designer_Resume.pdf',
    summary:
      'Creative Designer and Video Editor specializing in event poster creation, social media graphics, photo editing, and short-form video production using Canva, CapCut, Premiere Pro, and AI design tools.',
    skills: ['Poster Design', 'Graphic Design', 'Photo Editing', 'Video Editing', 'CapCut', 'Canva', 'Premiere Pro', 'AI Design Workflow'],
    sections: [
      {
        title: 'Creative Experience',
        items: [
          {
            heading: 'Event Poster & Graphics Lead',
            subheading: 'NSS MVSR Unit & College Events',
            date: '2024 - Present',
            details: [
              'Designed 45+ event posters, flex banners, and Instagram stories for college fests, workshops, and NSS blood donation drives.',
              'Combined Canva, AI design tools, and photo editing software for high visual impact.',
            ],
          },
          {
            heading: 'Video Editor & Content Creator',
            subheading: 'Freelance & Instagram (@wilder_sathwik)',
            date: '2023 - Present',
            details: [
              'Edited short-form event highlight reels and promo videos with beat syncing, speed ramping, and custom captions in CapCut & Premiere Pro.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'general',
    title: 'General Student Resume',
    filename: 'Dubbaka_Sathwik_General_Resume.pdf',
    summary:
      'Versatile 3rd Year Computer Science student at MVSR Engineering College combining technical full-stack web development skills with creative design expertise. Open for internships and freelance roles.',
    skills: ['C', 'Java', 'Python', 'JavaScript', 'React', 'Node.js', 'MySQL', 'MongoDB', 'Canva', 'CapCut', 'NSS Volunteer'],
    sections: [
      {
        title: 'Summary of Capabilities',
        items: [
          {
            heading: 'Software & Web Engineering',
            details: [
              'Competent in C, Java, Python, JavaScript, HTML, CSS, React, Express, MySQL, MongoDB, and Git.',
            ],
          },
          {
            heading: 'Creative Design & Multimedia',
            details: [
              'Experienced in poster design, video editing, photo editing, and social media creative creation using Canva, CapCut, and AI tools.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cv',
    title: 'Curriculum Vitae (CV)',
    filename: 'Dubbaka_Sathwik_CV.pdf',
    summary:
      'Comprehensive Curriculum Vitae of Dubbaka Sathwik, Computer Science Undergraduate at MVSR Engineering College, Hyderabad. Detailing academic profile, technical skill set, NSS contributions, and creative portfolio.',
    skills: ['Programming', 'Full-Stack Development', 'Database Management', 'Creative Design', 'NSS Community Service'],
    sections: [
      {
        title: 'Academic Profile',
        items: [
          {
            heading: 'MVSR Engineering College, Hyderabad',
            subheading: 'B.E. Computer Science Engineering (3rd Year)',
            date: '2023 - 2027',
            details: [
              'Core Subjects: Data Structures, DBMS, Java, Python, Computer Networks, Software Engineering.',
            ],
          },
        ],
      },
      {
        title: 'Extracurricular & NSS Service',
        items: [
          {
            heading: 'NSS MVSR Volunteer',
            date: '2024 - Present',
            details: [
              'Organized campus blood donation camps, environmental clean-up drives, and community outreach campaigns.',
            ],
          },
        ],
      },
    ],
  },
];

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
};

export const initialCMSData: CMSData = {
  hero: initialHeroData,
  about: initialAboutData,
  skills: initialSkills,
  projects: initialProjects,
  creativePortfolio: initialCreativePortfolio,
  journey: initialJourneyItems,
  gallery: initialGalleryItems,
  blogs: initialBlogPosts,
  resumes: initialResumeOptions,
  contactInfo: initialContactInfo,
  messages: [
    {
      id: 'msg-1',
      name: 'MVSR Event Coordinator',
      email: 'eventadmin@mvsrec.edu.in',
      subject: 'Poster Design for Upcoming Hackathon',
      message:
        'Hi Sathwik, we loved your NSS poster designs! Can you design a promotional flex poster for our CSE hackathon next month?',
      date: '2026-07-28',
      time: '14:30',
      status: 'unread',
    },
  ],
};

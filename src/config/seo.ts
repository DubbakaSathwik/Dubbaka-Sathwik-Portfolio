import { BlogPost, EventItem, PressMention, Project } from '../types';

export const SITE_CONFIG = {
  baseUrl: 'https://dubbakasathwik.netlify.app',
  siteName: 'Dubbaka Sathwik',
  defaultTitle: 'Dubbaka Sathwik | Full-Stack Developer & AI Software Engineer',
  defaultDescription:
    'Official portfolio of Dubbaka Sathwik. Full-Stack Developer, AI Software Engineer & Cinematic Video Editor specializing in React, Node.js, Next.js, and GenAI.',
  defaultImage: '/uploads/assets/static_about_avatarUrl_a6839352e4.jpg',
  author: {
    name: 'Dubbaka Sathwik',
    alternateNames: ['Sathwik Dubbaka', 'Dubbaka Sathwik Portfolio', 'DubbakaSathwik', 'Sathwik'],
    jobTitle: 'Full-Stack Developer & AI Software Engineer',
    email: 'dubbakasathwik@gmail.com',
    college: 'MVSR Engineering College',
    department: 'Computer Science and Information Technology (CSIT)',
    location: 'Hyderabad, Telangana, India',
    sameAs: [
      'https://github.com/DubbakaSathwik',
      'https://linkedin.com/in/dubbakasathwik',
      'https://instagram.com/wilder_sathwik',
      'https://twitter.com/dubbakasathwik',
      'https://youtube.com/@dubbakasathwik',
    ],
  },
};

export function slugifyText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getProjectSlug(project: Pick<Project, 'id' | 'title' | 'seo'>): string {
  const custom = project.seo?.slug?.trim();
  if (custom) {
    const cleaned = slugifyText(custom);
    if (cleaned) return cleaned;
  }
  const fromTitle = slugifyText(project.title);
  return fromTitle || slugifyText(project.id) || 'project';
}

export function getBlogSlug(post: Pick<BlogPost, 'id' | 'slug' | 'title' | 'seo'>): string {
  const custom = post.seo?.slug?.trim() || post.slug?.trim();
  if (custom) {
    const cleaned = slugifyText(custom);
    if (cleaned) return cleaned;
  }
  return slugifyText(post.title) || slugifyText(post.id) || 'post';
}

export function getBlogRoutePrefix(post: Pick<BlogPost, 'kind'>): '/blog' | '/articles' {
  return post.kind === 'Article' ? '/articles' : '/blog';
}

export function getBlogPath(post: Pick<BlogPost, 'id' | 'slug' | 'title' | 'kind' | 'seo'>): string {
  return `${getBlogRoutePrefix(post)}/${getBlogSlug(post)}`;
}

export function getEventSlug(ev: Pick<EventItem, 'id' | 'slug' | 'title' | 'seo'>): string {
  const custom = ev.seo?.slug?.trim() || ev.slug?.trim();
  if (custom) {
    const cleaned = slugifyText(custom);
    if (cleaned) return cleaned;
  }
  return slugifyText(ev.title) || slugifyText(ev.id) || 'event';
}

export function getPressSlug(item: Pick<PressMention, 'id' | 'slug' | 'title' | 'seo'>): string {
  const custom = item.seo?.slug?.trim() || item.slug?.trim();
  if (custom) {
    const cleaned = slugifyText(custom);
    if (cleaned) return cleaned;
  }
  return slugifyText(item.title) || slugifyText(item.id) || 'feature';
}

export function isItemPublished(item: { visibility?: string; status?: string } | null | undefined): boolean {
  if (!item) return false;
  if (item.visibility === 'Draft' || item.status === 'Draft') return false;
  return true;
}

export function stripFormattingMarkers(text: string = ''): string {
  return String(text || '')
    .replace(/\{\s*bold\s*&\s*highlight\s*\}|\{\s*bold\s*\}|\{\s*highlight\s*\}|\{\s*accent\s*\}|\{\s*italic\s*\}|\{\s*code\s*\}/gi, '')
    .replace(/\[(?:highlight|accent|bold|italic|code)\]([\s\S]*?)\[\/(?:highlight|accent|bold|italic|code)\]/gi, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`#>~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveAbsoluteUrl(pathOrUrl: string, origin?: string): string {
  const base = (origin || SITE_CONFIG.baseUrl).replace(/\/+$/, '');
  if (!pathOrUrl) return `${base}/`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${cleanPath}`;
}

export function applyDynamicDocumentMeta(options: {
  title: string;
  description: string;
  keywords?: string[];
  pathname?: string;
  image?: string;
  ogType?: 'website' | 'profile' | 'article';
  structuredData?: Record<string, any> | null;
}) {
  if (typeof document === 'undefined') return;

  const origin =
    typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : SITE_CONFIG.baseUrl;

  const fullUrl = resolveAbsoluteUrl(options.pathname || '/', origin);
  const fullImage = resolveAbsoluteUrl(options.image || SITE_CONFIG.defaultImage, origin);

  document.title = options.title;

  const setMeta = (selector: string, attrName: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', 'name', 'description', options.description);
  if (options.keywords && options.keywords.length > 0) {
    setMeta('meta[name="keywords"]', 'name', 'keywords', options.keywords.join(', '));
  }

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', fullUrl);

  setMeta('meta[property="og:type"]', 'property', 'og:type', options.ogType || 'website');
  setMeta('meta[property="og:title"]', 'property', 'og:title', options.title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', options.description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', fullUrl);
  setMeta('meta[property="og:image"]', 'property', 'og:image', fullImage);

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', options.title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', options.description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', fullImage);

  const existingLd = document.getElementById('dynamic-route-ldjson');
  if (existingLd) existingLd.remove();

  if (options.structuredData) {
    const script = document.createElement('script');
    script.id = 'dynamic-route-ldjson';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(options.structuredData);
    document.head.appendChild(script);
  }
}

export function buildProjectStructuredData(project: Project, origin?: string) {
  const base = (origin || SITE_CONFIG.baseUrl).replace(/\/+$/, '');
  const slug = getProjectSlug(project);
  const projectUrl = `${base}/projects/${slug}`;
  const cleanDescription =
    project.seo?.metaDescription ||
    stripFormattingMarkers(project.description || project.summary || project.longDescription || '').slice(0, 160);
  const title = project.seo?.seoTitle || `${project.title} — Built by Dubbaka Sathwik`;
  const keywords =
    project.seo?.keywords && project.seo.keywords.length > 0
      ? project.seo.keywords
      : Array.from(
          new Set([
            project.title,
            `${project.title} Dubbaka Sathwik`,
            'Dubbaka Sathwik',
            project.category,
            ...(project.technologies || project.tags || []),
          ])
        ).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${projectUrl}#software`,
        name: project.title,
        headline: title,
        url: pageUrlOrFallback(projectUrl),
        applicationCategory: 'WebApplication',
        operatingSystem: 'Web',
        description: cleanDescription,
        image: resolveAbsoluteUrl(project.thumbnail || project.images?.[0] || SITE_CONFIG.defaultImage, base),
        keywords: keywords.join(', '),
        datePublished: project.year ? `${project.year}-01-01` : '2026-01-01',
        author: {
          '@type': 'Person',
          '@id': `${base}/#dubbaka-sathwik`,
          name: SITE_CONFIG.author.name,
          url: `${base}/`,
        },
        ...(project.demoUrl ? { sameAs: project.demoUrl } : {}),
        ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Dubbaka Sathwik Portfolio',
            item: `${base}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Projects',
            item: `${base}/#projects`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.title,
            item: projectUrl,
          },
        ],
      },
    ],
  };
}

function pageUrlOrFallback(url: string) {
  return url;
}

export function buildBlogStructuredData(post: BlogPost, origin?: string) {
  const base = (origin || SITE_CONFIG.baseUrl).replace(/\/+$/, '');
  const path = getBlogPath(post);
  const fullUrl = `${base}${path}`;
  const isArticle = post.kind === 'Article';
  const description =
    post.seo?.metaDescription ||
    stripFormattingMarkers(post.snippet || post.content || '').slice(0, 160);
  const title = post.seo?.seoTitle || `${post.title} — ${SITE_CONFIG.author.name}`;
  const keywords =
    post.seo?.keywords && post.seo.keywords.length > 0
      ? post.seo.keywords
      : Array.from(new Set([post.title, post.category, SITE_CONFIG.author.name, ...(post.tags || [])])).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isArticle ? 'TechArticle' : 'BlogPosting',
        '@id': `${fullUrl}#article`,
        headline: post.title,
        name: title,
        url: fullUrl,
        description,
        articleSection: post.category,
        keywords: keywords.join(', '),
        image: resolveAbsoluteUrl(post.coverImage || SITE_CONFIG.defaultImage, base),
        datePublished: post.date || '2026-01-01',
        author: {
          '@type': 'Person',
          '@id': `${base}/#dubbaka-sathwik`,
          name: SITE_CONFIG.author.name,
          url: `${base}/`,
        },
        publisher: {
          '@type': 'Person',
          '@id': `${base}/#dubbaka-sathwik`,
          name: SITE_CONFIG.author.name,
          url: `${base}/`,
        },
        mainEntityOfPage: fullUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Dubbaka Sathwik', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${base}/insights` },
          { '@type': 'ListItem', position: 3, name: post.title, item: fullUrl },
        ],
      },
    ],
  };
}

export function buildEventStructuredData(ev: EventItem, origin?: string) {
  const base = (origin || SITE_CONFIG.baseUrl).replace(/\/+$/, '');
  const slug = getEventSlug(ev);
  const fullUrl = `${base}/events/${slug}`;
  const description =
    ev.seo?.metaDescription ||
    stripFormattingMarkers(ev.summary || ev.detailedDescription || '').slice(0, 160);
  const title = ev.seo?.seoTitle || `${ev.title} — ${SITE_CONFIG.author.name}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Event',
        '@id': `${fullUrl}#event`,
        name: ev.title,
        description,
        url: fullUrl,
        startDate: ev.date || '2026-01-01',
        ...(ev.endDate ? { endDate: ev.endDate } : {}),
        eventStatus:
          ev.eventStatus === 'Upcoming'
            ? 'https://schema.org/EventScheduled'
            : 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: ev.venue || 'MVSR Engineering College, Hyderabad',
          address: ev.venue || 'Hyderabad, Telangana, India',
        },
        image: resolveAbsoluteUrl(ev.coverImage || SITE_CONFIG.defaultImage, base),
        organizer: {
          '@type': 'Person',
          '@id': `${base}/#dubbaka-sathwik`,
          name: SITE_CONFIG.author.name,
          url: `${base}/`,
        },
        performer: {
          '@type': 'Person',
          name: SITE_CONFIG.author.name,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Dubbaka Sathwik', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Events', item: `${base}/insights` },
          { '@type': 'ListItem', position: 3, name: ev.title, item: fullUrl },
        ],
      },
    ],
  };
}

export function buildPressStructuredData(item: PressMention, origin?: string) {
  const base = (origin || SITE_CONFIG.baseUrl).replace(/\/+$/, '');
  const slug = getPressSlug(item);
  const fullUrl = `${base}/press/${slug}`;
  const description =
    item.seo?.metaDescription ||
    stripFormattingMarkers(item.summary || item.detailedNotes || '').slice(0, 160);
  const title = item.seo?.seoTitle || `${item.title} — ${item.sourceName} | ${SITE_CONFIG.author.name}`;
  const keywords =
    item.seo?.keywords && item.seo.keywords.length > 0
      ? item.seo.keywords
      : Array.from(
          new Set([item.title, item.sourceName, item.category, SITE_CONFIG.author.name])
        ).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${fullUrl}#mention`,
        headline: item.title,
        name: title,
        url: fullUrl,
        ...(item.externalUrl ? { sameAs: item.externalUrl } : {}),
        description,
        keywords: keywords.join(', '),
        image: resolveAbsoluteUrl(item.coverImage || SITE_CONFIG.defaultImage, base),
        datePublished: item.date || '2026',
        publisher: {
          '@type': 'Organization',
          name: item.sourceName || 'External Publication',
        },
        about: {
          '@type': 'Person',
          '@id': `${base}/#dubbaka-sathwik`,
          name: SITE_CONFIG.author.name,
          url: `${base}/`,
        },
        author: {
          '@type': 'Person',
          '@id': `${base}/#dubbaka-sathwik`,
          name: SITE_CONFIG.author.name,
          url: `${base}/`,
        },
        mainEntityOfPage: fullUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Dubbaka Sathwik', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Features & Press', item: `${base}/#features` },
          { '@type': 'ListItem', position: 3, name: item.title, item: fullUrl },
        ],
      },
    ],
  };
}

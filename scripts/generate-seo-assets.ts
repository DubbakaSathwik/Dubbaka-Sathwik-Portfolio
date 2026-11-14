import fs from 'fs';
import path from 'path';
import {
  SITE_CONFIG,
  buildBlogStructuredData,
  buildEventStructuredData,
  buildPressStructuredData,
  buildProjectStructuredData,
  getBlogPath,
  getBlogSlug,
  getEventSlug,
  getPressSlug,
  getProjectSlug,
  isItemPublished,
  resolveAbsoluteUrl,
  stripFormattingMarkers,
} from '../src/config/seo';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

function loadPortfolioData(): any {
  const candidates = [
    path.join(PUBLIC_DIR, 'static_backup.json'),
    path.join(ROOT, 'static_backup.json'),
    path.join(ROOT, 'src', 'seed_data.json'),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (parsed && typeof parsed === 'object' && parsed.hero) {
          return parsed;
        }
      } catch (e) {}
    }
  }
  return null;
}

function escapeHtml(str: string = ''): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateClean(text: string = '', maxLen = 175): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced).replace(/[,:;.\-–—]+$/, '') + '…';
}

function formatCollegeLocation(about: any): string {
  const college = String(about?.college || 'MVSR Engineering College').trim();
  const location = String(about?.location || 'Hyderabad, Telangana, India').trim();
  if (!location) return college;
  if (location.toLowerCase().includes(college.toLowerCase())) return location;
  return `${college} • ${location}`;
}

function generateRobotsTxt(): string {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  return `# robots.txt for ${SITE_CONFIG.author.name} Portfolio
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

# Explicit AI & LLM Search Crawler Permissions
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${base}/sitemap.xml
# LLMs Knowledge Base: ${base}/llms.txt
# Full LLMs Context: ${base}/llms-full.txt
`;
}

function generateSitemapXml(projects: any[], blogs: any[], events: any[], pressMentions: any[]): string {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${base}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${base}/insights`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
  ];

  for (const p of projects) {
    urls.push({
      loc: `${base}/projects/${getProjectSlug(p)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.9',
    });
  }

  for (const b of blogs) {
    urls.push({
      loc: `${base}${getBlogPath(b)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.85',
    });
  }

  for (const ev of events) {
    urls.push({
      loc: `${base}/events/${getEventSlug(ev)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.85',
    });
  }

  for (const m of pressMentions) {
    urls.push({
      loc: `${base}/press/${getPressSlug(m)}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.85',
    });
  }

  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function generateLlmsTxt(data: any, projects: any[], blogs: any[], events: any[], pressMentions: any[]): string {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  const hero = data.hero || {};
  const about = data.about || {};

  const projectLines = projects
    .map((p: any) => {
      const slug = getProjectSlug(p);
      const summary = truncateClean(
        p.seo?.metaDescription || stripFormattingMarkers(p.description || p.summary || ''),
        180
      );
      return `- [${String(p.title || '').trim()}](${base}/projects/${slug}): ${summary}`;
    })
    .join('\n');

  const blogLines = blogs
    .map((b: any) => {
      const pathUrl = getBlogPath(b);
      const summary = truncateClean(b.seo?.metaDescription || stripFormattingMarkers(b.snippet || ''), 180);
      return `- [${String(b.title || '').trim()}](${base}${pathUrl}): ${summary}`;
    })
    .join('\n');

  const eventLines = events
    .map((ev: any) => {
      const slug = getEventSlug(ev);
      const summary = truncateClean(ev.seo?.metaDescription || stripFormattingMarkers(ev.summary || ''), 180);
      return `- [${String(ev.title || '').trim()}](${base}/events/${slug}): ${ev.eventStatus} Event (${ev.displayDate || ev.date}) — ${summary}`;
    })
    .join('\n');

  const pressLines = pressMentions
    .map((m: any) => {
      const slug = getPressSlug(m);
      const summary = truncateClean(m.seo?.metaDescription || stripFormattingMarkers(m.summary || ''), 180);
      return `- [${String(m.title || '').trim()} — ${m.sourceName}](${base}/press/${slug}): ${summary}${m.externalUrl ? ` (Source: ${m.externalUrl})` : ''}`;
    })
    .join('\n');

  return `# ${SITE_CONFIG.author.name}

> ${hero.subtitle || SITE_CONFIG.author.jobTitle} | ${about.department || 'CSIT'} at ${formatCollegeLocation(about)}.

Official personal portfolio of **${SITE_CONFIG.author.name}** (also known as ${SITE_CONFIG.author.alternateNames.join(', ')}).

## Identity & Quick Facts
- Website: ${base}/
- Email: ${data.contactInfo?.email || SITE_CONFIG.author.email}
- Education: ${about.degree || 'B.E. CSE / CSIT'} at ${about.college || 'MVSR Engineering College'} (${about.yearOfStudy || ''})
- Roles: Full-Stack Developer, AI Software Engineer, Cinematic Video Editor, NSS Co-Lead
- GitHub: https://github.com/DubbakaSathwik
- LinkedIn: https://linkedin.com/in/dubbakasathwik

## Technical Projects Built by ${SITE_CONFIG.author.name}
${projectLines}

${blogs.length > 0 ? `## Blogs & Journal by ${SITE_CONFIG.author.name}\n${blogLines}\n\n` : ''}${events.length > 0 ? `## Events, Hackathons & Workshops\n${eventLines}\n\n` : ''}${pressMentions.length > 0 ? `## Features, Press & External Spotlights\n${pressLines}\n\n` : ''}## Extended Context
- Full technical details, articles & skills: ${base}/llms-full.txt
- Sitemap: ${base}/sitemap.xml
`;
}

function generateLlmsFullTxt(
  data: any,
  projects: any[],
  creative: any[],
  journey: any[],
  gallery: any[],
  blogs: any[],
  events: any[],
  pressMentions: any[]
): string {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  const hero = data.hero || {};
  const about = data.about || {};
  const skills = Array.isArray(data.skills) ? data.skills : [];

  const skillsBlock = skills
    .map((cat: any) => `- **${cat.category}:** ${(cat.skills || []).join(', ')}`)
    .join('\n');

  const projectsBlock = projects
    .map((p: any, idx: number) => {
      const slug = getProjectSlug(p);
      const tech = Array.from(new Set([...(p.technologies || []), ...(p.tags || [])])).join(', ');
      const desc = stripFormattingMarkers(p.longDescription || p.description || p.summary || '');
      const tldr = p.seo?.tldr ? `\n- **Key Takeaway:** ${p.seo.tldr}` : '';
      return `### ${idx + 1}. ${p.title}
- **URL:** ${base}/projects/${slug}
- **Category:** ${p.category} (${p.year || '2026'})
- **Tech Stack:** ${tech}${tldr}
- **Live Demo:** ${p.demoUrl || 'N/A'}
- **GitHub:** ${p.githubUrl || 'N/A'}
- **Overview:** ${desc}`;
    })
    .join('\n\n');

  const blogsBlock = blogs
    .map((b: any, idx: number) => {
      const url = `${base}${getBlogPath(b)}`;
      const body = stripFormattingMarkers(b.content || b.snippet || '').slice(0, 600);
      return `### ${idx + 1}. ${b.title} (${b.kind || 'Blog'})
- **URL:** ${url}
- **Category:** ${b.category} (${b.date})
- **Summary:** ${stripFormattingMarkers(b.tldr || b.snippet || '')}
- **Excerpt:** ${body}`;
    })
    .join('\n\n');

  const eventsBlock = events
    .map((ev: any, idx: number) => {
      const url = `${base}/events/${getEventSlug(ev)}`;
      return `### ${idx + 1}. ${ev.title} (${ev.eventStatus})
- **URL:** ${url}
- **Role:** ${ev.role} | **Venue:** ${ev.venue} | **Date:** ${ev.displayDate || ev.date}
- **Overview:** ${stripFormattingMarkers(ev.detailedDescription || ev.summary || '')}`;
    })
    .join('\n\n');

  const journeyBlock = journey
    .map(
      (j: any) =>
        `- **${j.title}** (${j.year}) — ${j.role} at ${j.organization}: ${stripFormattingMarkers(
          j.detailedDescription || j.description || ''
        )}`
    )
    .join('\n');

  const creativeBlock = creative
    .map(
      (c: any) =>
        `- **${c.title}** [${c.category}, ${c.completionDate}]: ${stripFormattingMarkers(
          c.shortDescription || c.detailedDescription || ''
        )}`
    )
    .join('\n');

  const certBlock = gallery
    .map(
      (g: any) =>
        `- **${g.title}** (${g.category}, ${g.date}): ${stripFormattingMarkers(g.description || '')}`
    )
    .join('\n');

  return `# ${SITE_CONFIG.author.name} — Complete Portfolio & Engineering Knowledge Base

**Official Portfolio:** ${base}/
**Name:** ${SITE_CONFIG.author.name} (${SITE_CONFIG.author.alternateNames.join(' / ')})
**Title:** ${hero.subtitle || SITE_CONFIG.author.jobTitle}
**Email:** ${data.contactInfo?.email || SITE_CONFIG.author.email}
**Location:** ${data.contactInfo?.location || about.location || 'Hyderabad, Telangana, India'}
**Education:** ${about.degree || 'B.E. CSIT'} at ${about.college || 'MVSR Engineering College'}

## Biography
${stripFormattingMarkers(hero.description || '')}

${stripFormattingMarkers(about.bioParagraph1 || '')}

${stripFormattingMarkers(about.bioParagraph2 || '')}

${stripFormattingMarkers(about.bioParagraph3 || '')}

## Technical Skills
${skillsBlock}

## Software & AI Projects by ${SITE_CONFIG.author.name}
${projectsBlock}

${blogs.length > 0 ? `## Technical Articles & Developer Blogs\n${blogsBlock}\n\n` : ''}${events.length > 0 ? `## Events, Hackathons & Workshops\n${eventsBlock}\n\n` : ''}## Experience, Leadership & Journey (College, NSS, IEEE, Hackathons)
${journeyBlock}

## Creative Works & Video Editing
${creativeBlock}

## Certificates & Recognition
${certBlock}
${pressMentions.length > 0 ? `\n## Features, Press & External Spotlights\n${pressMentions
  .map(
    (m: any) =>
      `- **${String(m.title || '').trim()}** (${m.sourceName}, ${m.date}): ${stripFormattingMarkers(
        m.summary || ''
      )}${m.externalUrl ? ` — Source: ${m.externalUrl}` : ''}`
  )
  .join('\n')}` : ''}

## Official Profiles
${Array.from(
  new Set([
    ...SITE_CONFIG.author.sameAs,
    ...pressMentions.map((m: any) => m.externalUrl).filter(Boolean),
  ])
)
  .map((u) => `- ${u}`)
  .join('\n')}
`;
}

function buildHomepageSchema(
  data: any,
  projects: any[],
  blogs: any[],
  events: any[],
  pressMentions: any[]
): Record<string, any> {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  const skills = Array.isArray(data.skills)
    ? data.skills.flatMap((c: any) => c.skills || []).slice(0, 30)
    : [];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${base}/#webpage`,
        url: `${base}/`,
        name: SITE_CONFIG.defaultTitle,
        isPartOf: { '@id': `${base}/#website` },
        about: { '@id': `${base}/#dubbaka-sathwik` },
        mainEntity: { '@id': `${base}/#dubbaka-sathwik` },
      },
      {
        '@type': 'Person',
        '@id': `${base}/#dubbaka-sathwik`,
        name: SITE_CONFIG.author.name,
        alternateName: SITE_CONFIG.author.alternateNames,
        url: `${base}/`,
        jobTitle: SITE_CONFIG.author.jobTitle,
        description: SITE_CONFIG.defaultDescription,
        email: data.contactInfo?.email || SITE_CONFIG.author.email,
        image: resolveAbsoluteUrl(data.about?.avatarUrl || SITE_CONFIG.defaultImage, base),
        alumniOf: {
          '@type': 'EducationalOrganization',
          name: data.about?.college || SITE_CONFIG.author.college,
        },
        knowsAbout: Array.from(
          new Set([
            'Full-Stack Web Development',
            'Artificial Intelligence',
            'Generative AI',
            'Cinematic Video Editing',
            ...skills,
          ])
        ),
        sameAs: Array.from(
          new Set([
            ...SITE_CONFIG.author.sameAs,
            ...pressMentions.map((m: any) => m.externalUrl).filter(Boolean),
          ])
        ),
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: `${base}/`,
        name: SITE_CONFIG.siteName,
        alternateName: SITE_CONFIG.author.alternateNames,
        description: SITE_CONFIG.defaultDescription,
        author: { '@id': `${base}/#dubbaka-sathwik` },
      },
      {
        '@type': 'ItemList',
        '@id': `${base}/#projects-list`,
        name: 'Technical Projects by Dubbaka Sathwik',
        numberOfItems: projects.length,
        itemListElement: projects.map((p: any, idx: number) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'SoftwareApplication',
            name: p.title,
            url: `${base}/projects/${getProjectSlug(p)}`,
            applicationCategory: 'WebApplication',
            operatingSystem: 'Web',
            description:
              p.seo?.metaDescription ||
              stripFormattingMarkers(p.description || p.summary || '').slice(0, 160),
            author: { '@id': `${base}/#dubbaka-sathwik` },
          },
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${base}/#insights-list`,
        name: 'Articles, Blogs, Events & Features by Dubbaka Sathwik',
        numberOfItems: blogs.length + events.length + pressMentions.length,
        itemListElement: [
          ...blogs.map((b: any, idx: number) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${base}${getBlogPath(b)}`,
            name: b.title,
          })),
          ...events.map((ev: any, idx: number) => ({
            '@type': 'ListItem',
            position: blogs.length + idx + 1,
            url: `${base}/events/${getEventSlug(ev)}`,
            name: ev.title,
          })),
          ...pressMentions.map((m: any, idx: number) => ({
            '@type': 'ListItem',
            position: blogs.length + events.length + idx + 1,
            url: `${base}/press/${getPressSlug(m)}`,
            name: `${m.title} — ${m.sourceName}`,
          })),
        ],
      },
    ],
  };
}

function buildHomepageNoscript(
  data: any,
  projects: any[],
  journey: any[],
  blogs: any[],
  events: any[],
  pressMentions: any[]
): string {
  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  const about = data.about || {};
  const skills = Array.isArray(data.skills) ? data.skills : [];

  const projectItems = projects
    .map((p: any) => {
      const slug = getProjectSlug(p);
      const desc = escapeHtml(stripFormattingMarkers(p.description || p.summary || ''));
      const tech = escapeHtml((p.technologies || p.tags || []).join(', '));
      const title = String(p.title || '').trim();
      return `<li><a href="${base}/projects/${escapeHtml(slug)}"><strong>${escapeHtml(
        title
      )}</strong></a> (${escapeHtml(p.category)}): ${desc}${tech ? ` — Technologies: ${tech}` : ''}</li>`;
    })
    .join('\n          ');

  const blogItems = blogs
    .map((b: any) => {
      const url = `${base}${getBlogPath(b)}`;
      return `<li><a href="${escapeHtml(url)}"><strong>${escapeHtml(String(b.title || '').trim())}</strong></a> (${escapeHtml(
        b.kind || 'Blog'
      )}, ${escapeHtml(b.date)}): ${escapeHtml(stripFormattingMarkers(b.snippet || ''))}</li>`;
    })
    .join('\n          ');

  const eventItems = events
    .map((ev: any) => {
      const url = `${base}/events/${getEventSlug(ev)}`;
      return `<li><a href="${escapeHtml(url)}"><strong>${escapeHtml(String(ev.title || '').trim())}</strong></a> (${escapeHtml(
        ev.eventStatus
      )}, ${escapeHtml(ev.displayDate || ev.date)} at ${escapeHtml(ev.venue)}): ${escapeHtml(
        stripFormattingMarkers(ev.summary || '')
      )}</li>`;
    })
    .join('\n          ');

  const journeyItems = journey
    .slice(0, 10)
    .map(
      (j: any) =>
        `<li><strong>${escapeHtml(j.title)}</strong> (${escapeHtml(j.year)}) — ${escapeHtml(
          j.role
        )} at ${escapeHtml(j.organization)}: ${escapeHtml(stripFormattingMarkers(j.description || ''))}</li>`
    )
    .join('\n          ');

  return `<noscript>
      <main>
        <h1>${escapeHtml(SITE_CONFIG.author.name)} — Official Personal Portfolio</h1>
        <p>${escapeHtml(SITE_CONFIG.defaultDescription)}</p>
        <p>${escapeHtml(about.degree || 'CSIT')} at ${escapeHtml(formatCollegeLocation(about))}.</p>
        <section>
          <h2>Technical Projects &amp; AI Systems by ${escapeHtml(SITE_CONFIG.author.name)}</h2>
          <ul>
          ${projectItems}
          </ul>
        </section>${blogs.length > 0 ? `
        <section>
          <h2>Blogs &amp; Journal</h2>
          <ul>
          ${blogItems}
          </ul>
        </section>` : ''}${events.length > 0 ? `
        <section>
          <h2>Events, Hackathons &amp; Workshops</h2>
          <ul>
          ${eventItems}
          </ul>
        </section>` : ''}${pressMentions.length > 0 ? `
        <section>
          <h2>Features, Press &amp; External Spotlights</h2>
          <ul>
          ${pressMentions
            .map((m: any) => {
              const slug = getPressSlug(m);
              return `<li><a href="${base}/press/${escapeHtml(slug)}"><strong>${escapeHtml(
                String(m.title || '').trim()
              )}</strong></a> (${escapeHtml(m.sourceName)}, ${escapeHtml(m.date)}): ${escapeHtml(
                stripFormattingMarkers(m.summary || '')
              )}${m.externalUrl ? ` — <a href="${escapeHtml(m.externalUrl)}" rel="noopener noreferrer">Original Source</a>` : ''}</li>`;
            })
            .join('\n          ')}
          </ul>
        </section>` : ''}
        <section>
          <h2>Skills &amp; Stack</h2>
          <ul>
          ${skills
            .map(
              (s: any) =>
                `<li><strong>${escapeHtml(s.category)}:</strong> ${escapeHtml((s.skills || []).join(', '))}</li>`
            )
            .join('\n          ')}
          </ul>
        </section>
        <section>
          <h2>Experience, NSS &amp; Leadership</h2>
          <ul>
          ${journeyItems}
          </ul>
        </section>
      </main>
    </noscript>`;
}

function injectPageMeta(
  baseHtml: string,
  options: {
    title: string;
    description: string;
    keywords: string[];
    pageUrl: string;
    image: string;
    ogType: string;
    schema: Record<string, any>;
    noscriptBody: string;
  }
): string {
  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(options.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(options.description)}" />`
  );
  html = html.replace(
    /<meta\s+name="keywords"[^>]*>/i,
    `<meta name="keywords" content="${escapeHtml(options.keywords.join(', '))}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(options.pageUrl)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:type"[^>]*>/i,
    `<meta property="og:type" content="${escapeHtml(options.ogType)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(options.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(options.description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(options.pageUrl)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"[^>]*>/i,
    `<meta property="og:image" content="${escapeHtml(options.image)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(options.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(options.description)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"[^>]*>/i,
    `<meta name="twitter:image" content="${escapeHtml(options.image)}" />`
  );
  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${JSON.stringify(options.schema)}</script>`
  );
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${options.noscriptBody}</div>`);
  return html;
}

function run() {
  const data = loadPortfolioData();
  if (!data) {
    console.warn('[SEO Generator] Could not find static_backup.json or seed_data.json. Skipping.');
    return;
  }

  const projects = (data.projects || []).filter(isItemPublished);
  const creative = (data.creativePortfolio || []).filter(isItemPublished);
  const journey = (data.journey || []).filter(isItemPublished);
  const gallery = (data.gallery || []).filter(isItemPublished);
  const blogs = (data.blogs || []).filter(isItemPublished);
  const events = (data.events || []).filter(isItemPublished);
  const pressMentions = (data.pressMentions || []).filter(isItemPublished);

  const robotsTxt = generateRobotsTxt();
  const sitemapXml = generateSitemapXml(projects, blogs, events, pressMentions);
  const llmsTxt = generateLlmsTxt(data, projects, blogs, events, pressMentions);
  const llmsFullTxt = generateLlmsFullTxt(data, projects, creative, journey, gallery, blogs, events, pressMentions);

  const targets = [PUBLIC_DIR];
  if (fs.existsSync(DIST_DIR)) {
    targets.push(DIST_DIR);
  }

  for (const dir of targets) {
    fs.writeFileSync(path.join(dir, 'robots.txt'), robotsTxt, 'utf-8');
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'llms.txt'), llmsTxt, 'utf-8');
    fs.writeFileSync(path.join(dir, 'llms-full.txt'), llmsFullTxt, 'utf-8');
  }

  const base = SITE_CONFIG.baseUrl.replace(/\/+$/, '');
  const distIndexPath = path.join(DIST_DIR, 'index.html');

  if (fs.existsSync(distIndexPath)) {
    let distIndexHtml = fs.readFileSync(distIndexPath, 'utf-8');
    const homepageSchema = buildHomepageSchema(data, projects, blogs, events, pressMentions);
    const homepageNoscript = buildHomepageNoscript(data, projects, journey, blogs, events, pressMentions);

    distIndexHtml = distIndexHtml.replace(
      /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">${JSON.stringify(homepageSchema)}</script>`
    );
    distIndexHtml = distIndexHtml.replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root">${homepageNoscript}</div>`
    );
    fs.writeFileSync(distIndexPath, distIndexHtml, 'utf-8');

    // Pre-render /projects/<slug>/index.html
    for (const p of projects) {
      const slug = getProjectSlug(p);
      const slugDir = path.join(DIST_DIR, 'projects', slug);
      fs.mkdirSync(slugDir, { recursive: true });
      const title = p.seo?.seoTitle || `${p.title} — Built by Dubbaka Sathwik`;
      const description =
        p.seo?.metaDescription ||
        stripFormattingMarkers(p.description || p.summary || p.longDescription || '').slice(0, 158);
      const keywords =
        p.seo?.keywords && p.seo.keywords.length > 0
          ? p.seo.keywords
          : [p.title, `${p.title} Dubbaka Sathwik`, 'Dubbaka Sathwik', p.category, ...(p.technologies || p.tags || [])];
      const image = resolveAbsoluteUrl(p.thumbnail || p.images?.[0] || SITE_CONFIG.defaultImage, base);
      const noscriptBody = `<noscript><main><h1>${escapeHtml(p.title)} — Built by ${escapeHtml(SITE_CONFIG.author.name)}</h1><p>${escapeHtml(stripFormattingMarkers(p.description || p.summary || ''))}</p><p><a href="${base}/">Back to Portfolio</a></p></main></noscript>`;

      const html = injectPageMeta(distIndexHtml, {
        title,
        description,
        keywords,
        pageUrl: `${base}/projects/${slug}`,
        image,
        ogType: 'article',
        schema: buildProjectStructuredData(p, base),
        noscriptBody,
      });
      fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf-8');
    }

    // Pre-render /insights/index.html
    const insightsDir = path.join(DIST_DIR, 'insights');
    fs.mkdirSync(insightsDir, { recursive: true });
    const insightsHtml = injectPageMeta(distIndexHtml, {
      title: `Insights, Articles & Events | ${SITE_CONFIG.siteName}`,
      description:
        'Technical engineering articles, developer blogs, hackathons, IEEE workshops, and NSS campus initiatives by Dubbaka Sathwik.',
      keywords: ['Dubbaka Sathwik blog', 'Dubbaka Sathwik articles', 'Dubbaka Sathwik events', 'MVSR Engineering College'],
      pageUrl: `${base}/insights`,
      image: resolveAbsoluteUrl(SITE_CONFIG.defaultImage, base),
      ogType: 'website',
      schema: homepageSchema,
      noscriptBody: homepageNoscript,
    });
    fs.writeFileSync(path.join(insightsDir, 'index.html'), insightsHtml, 'utf-8');

    // Pre-render /blog/<slug>/index.html & /articles/<slug>/index.html
    for (const b of blogs) {
      const blogPath = getBlogPath(b);
      const cleanRel = blogPath.replace(/^\/+/, '');
      const dir = path.join(DIST_DIR, cleanRel);
      fs.mkdirSync(dir, { recursive: true });
      const title = b.seo?.seoTitle || `${b.title} — ${SITE_CONFIG.author.name}`;
      const description =
        b.seo?.metaDescription || stripFormattingMarkers(b.snippet || b.content || '').slice(0, 158);
      const keywords =
        b.seo?.keywords && b.seo.keywords.length > 0
          ? b.seo.keywords
          : [b.title, b.category, SITE_CONFIG.author.name, ...(b.tags || [])];
      const image = resolveAbsoluteUrl(b.coverImage || SITE_CONFIG.defaultImage, base);
      const noscriptBody = `<noscript><main><h1>${escapeHtml(b.title)}</h1><p>${escapeHtml(stripFormattingMarkers(b.snippet || ''))}</p><p>${escapeHtml(stripFormattingMarkers(b.content || ''))}</p><p><a href="${base}/insights">All Insights</a></p></main></noscript>`;

      const html = injectPageMeta(distIndexHtml, {
        title,
        description,
        keywords,
        pageUrl: `${base}${blogPath}`,
        image,
        ogType: 'article',
        schema: buildBlogStructuredData(b, base),
        noscriptBody,
      });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    }

    // Pre-render /events/<slug>/index.html
    for (const ev of events) {
      const slug = getEventSlug(ev);
      const dir = path.join(DIST_DIR, 'events', slug);
      fs.mkdirSync(dir, { recursive: true });
      const title = ev.seo?.seoTitle || `${ev.title} — ${SITE_CONFIG.author.name}`;
      const description =
        ev.seo?.metaDescription || stripFormattingMarkers(ev.summary || ev.detailedDescription || '').slice(0, 158);
      const keywords =
        ev.seo?.keywords && ev.seo.keywords.length > 0
          ? ev.seo.keywords
          : [ev.title, ev.category, ev.venue, SITE_CONFIG.author.name];
      const image = resolveAbsoluteUrl(ev.coverImage || SITE_CONFIG.defaultImage, base);
      const noscriptBody = `<noscript><main><h1>${escapeHtml(ev.title)}</h1><p>${escapeHtml(ev.venue)} (${escapeHtml(ev.displayDate || ev.date)})</p><p>${escapeHtml(stripFormattingMarkers(ev.detailedDescription || ev.summary || ''))}</p><p><a href="${base}/insights">All Events</a></p></main></noscript>`;

      const html = injectPageMeta(distIndexHtml, {
        title,
        description,
        keywords,
        pageUrl: `${base}/events/${slug}`,
        image,
        ogType: 'article',
        schema: buildEventStructuredData(ev, base),
        noscriptBody,
      });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    }

    // Pre-render /press/<slug>/index.html
    for (const m of pressMentions) {
      const slug = getPressSlug(m);
      const dir = path.join(DIST_DIR, 'press', slug);
      fs.mkdirSync(dir, { recursive: true });
      const title = m.seo?.seoTitle || `${m.title} — ${m.sourceName} | ${SITE_CONFIG.author.name}`;
      const description =
        m.seo?.metaDescription || stripFormattingMarkers(m.summary || m.detailedNotes || '').slice(0, 158);
      const keywords =
        m.seo?.keywords && m.seo.keywords.length > 0
          ? m.seo.keywords
          : [m.title, m.sourceName, m.category, SITE_CONFIG.author.name];
      const image = resolveAbsoluteUrl(m.coverImage || SITE_CONFIG.defaultImage, base);
      const noscriptBody = `<noscript><main><h1>${escapeHtml(m.title)}</h1><p>${escapeHtml(m.sourceName)} (${escapeHtml(m.date)})</p><p>${escapeHtml(stripFormattingMarkers(m.detailedNotes || m.summary || ''))}</p>${m.externalUrl ? `<p><a href="${escapeHtml(m.externalUrl)}" rel="noopener noreferrer">Original Source</a></p>` : ''}<p><a href="${base}/">Back to Portfolio</a></p></main></noscript>`;

      const html = injectPageMeta(distIndexHtml, {
        title,
        description,
        keywords,
        pageUrl: `${base}/press/${slug}`,
        image,
        ogType: 'article',
        schema: buildPressStructuredData(m, base),
        noscriptBody,
      });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    }

    console.log(
      `[SEO Generator] Built sitemap.xml, robots.txt, llms.txt, llms-full.txt, enriched dist/index.html, and pre-rendered ${projects.length} project(s), ${blogs.length} blog/article(s), ${events.length} event(s), ${pressMentions.length} press feature(s), + /insights.`
    );
  } else {
    console.log(
      `[SEO Generator] Updated public/ sitemap.xml, robots.txt, llms.txt, and llms-full.txt (${projects.length} projects, ${blogs.length} blogs, ${events.length} events, ${pressMentions.length} press).`
    );
  }
}

run();

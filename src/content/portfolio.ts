export type ProjectArtKind = 'gate-initiative';

export type ProjectLinkKind = 'live' | 'github' | 'case-study';

export type ContactStatus = 'idle' | 'invalid' | 'sending' | 'success' | 'error';

export interface ProjectLink {
  label: string;
  href?: string;
  kind: ProjectLinkKind;
}

export interface Project {
  slug: string;
  title: string;
  eyebrow: string;
  status: string;
  description: string;
  tags: string[];
  metric?: string;
  liveLabel?: string;
  art?: ProjectArtKind;
  image?: string;
  imageFit?: 'top' | 'center';
  links: ProjectLink[];
  featured?: boolean;
}

export interface StackRow {
  label: string;
  values: string;
}

export interface WhatIDoItem {
  number: string;
  title: string;
  description: string;
  tools: string;
}

export const whatIDoItems: WhatIDoItem[] = [
  {
    number: '01',
    title: 'Design',
    description:
      'Architecture, state machines, data models, service boundaries, and PRDs detailed enough for AI to implement correctly. UI design with Aura.build, Magicpath, and Kombai.',
    tools: 'AURA.BUILD · MAGICPATH · KOMBAI',
  },
  {
    number: '02',
    title: 'Build',
    description:
      'AI writes the code in Qoder IDE, Factory Droid, Zed, or Windsurf (Devin). I review every line, security-scan it, and own the result.',
    tools: 'QODER · DROID · ZED · WINDSURF (DEVIN)',
  },
  {
    number: '03',
    title: 'Ship',
    description:
      'Deployed web apps, a Flutter desktop app with 339 passing tests, and a filesystem daemon with 240 passing tests. All real codebases you can inspect.',
    tools: 'VERIFY · TEST · DEPLOY',
  },
];

export const projects: Project[] = [
  {
    slug: 'thumpiks',
    title: 'ThumPiks',
    eyebrow: 'thumpiks / canvas',
    status: 'STAGING',
    description:
      'SaaS thumbnail studio: two editors — quick and full canvas — with twelve AI tools: model-tiered image generation, inpainting, face swap, auto-layer decompose, CTR scoring, and video frame extraction. Stripe and Polar billing on a credit system with a real free plan. Currently in staging on a domain I own.',
    tags: ['React', 'TypeScript', 'Express', 'Prisma', 'Redis', 'Stripe', 'Polar', 'Playwright'],
    liveLabel: 'THUMBNAIL-MAKER-STUDIO',
    image: '/thumbs/thumpiks.png',
    imageFit: 'top',
    links: [
      {
        label: 'Live site',
        href: 'https://thumbnail-maker-studio.netlify.app/',
        kind: 'live',
      },
      {
        label: 'GitHub / ThumPiks',
        href: 'https://github.com/Brimstow/ThumPiks',
        kind: 'github',
      },
    ],
  },
  {
    slug: 'gate-initiative',
    title: 'gateINITIATIVE',
    eyebrow: 'gateINITIATIVE / watcher',
    status: 'ENFORCING',
    description:
      'Filesystem enforcement daemon for AI-driven development: watches every file change, evaluates it against gates defined in your own documentation, and alerts, logs, or reverts violations. IDE-, VCS-, and CLI-agnostic, with tamper-resistant state and ReDoS-hardened rule parsing. The case study covers the first audit it caught — in its own repo.',
    tags: ['JavaScript', 'Node.js', 'chokidar', 'YAML', 'CLI'],
    metric: '5,000+ LINES · 240 TESTS',
    art: 'gate-initiative',
    links: [
      {
        label: 'Case study / First audit',
        href: '/case-studies/gateinitiative-dogfooding',
        kind: 'case-study',
      },
      {
        label: 'GitHub / gateINITIATIVE',
        href: 'https://github.com/Brimstow/gateINITIATIVE',
        kind: 'github',
      },
    ],
  },
  {
    slug: 'asyndence',
    title: 'Asyndence',
    eyebrow: 'asyndence / timer',
    status: 'DESKTOP',
    description:
      'Desktop focus timer built around ultradian rhythms — it treats recovery as part of the work, not a failure of it. Guided breathing with ambient soundscapes; local-first storage with optional encrypted sync. BLE + HRV biometrics are built and tested — rolling into the guided recovery flow next.',
    tags: ['Flutter', 'Dart', 'Riverpod', 'BLE', 'TTS', 'Biometrics', 'InsForge', 'Desktop'],
    metric: '339 TESTS',
    image: '/thumbs/asyndence.png',
    imageFit: 'center',
    links: [
      {
        label: 'GitHub / Asyndence',
        href: 'https://github.com/Brimstow/Asyndence',
        kind: 'github',
      },
    ],
  },
  {
    slug: 'new-media-tek',
    title: 'New Media Tek',
    eyebrow: 'new media tek / cms',
    status: 'LIVE',
    description:
      'B2B consultancy site I co-founded and built end to end: Astro 5 static shell, a custom visual CMS with live preview, and an AI chatbot capturing leads into InsForge. Security-hardened through a Playwright-driven audit — CSP, XSS sanitization, rate limiting, and two-layer prompt-injection defense with guard prompts held in Netlify Blobs. Pages degrade to hardcoded copy if the database dies.',
    tags: ['React', 'Astro 5', 'Next.js', 'TypeScript', 'InsForge'],
    metric: 'SECURITY AUDIT 78→98 · CHATBOT 20→100',
    liveLabel: 'NEWMEDIATEK.NET',
    image: '/thumbs/new-media-tek.png',
    imageFit: 'top',
    links: [
      {
        label: 'Live site',
        href: 'https://newmediatek.net/',
        kind: 'live',
      },
      {
        label: 'GitHub / New Media Tek',
        href: 'https://github.com/davisk360/new-media-tek',
        kind: 'github',
      },
    ],
  },
];

export const stackRows: StackRow[] = [
  {
    label: 'AI CODING STACK',
    values:
      'Qoder IDE · Factory Droid · Zed · Warp Terminal · Windsurf (Devin) · Cursor (past) · Aura.build · Magicpath · Kombai · OpenRouter / ZenMux (ThumPiks) · Piper/Kokoro TTS (Asyndence)',
  },
  {
    label: 'LOCAL AI INFRA',
    values:
      'llama.cpp · Ollama · llama-swap · Hermes · OpenJarvis',
  },
  {
    label: 'FRONTEND / BACKEND',
    values:
      'TypeScript · React · Astro · Next.js · Tailwind · Bun · Node.js · Express · Prisma · PostgreSQL · Redis · BullMQ',
  },
  {
    label: 'DESKTOP / DEVOPS',
    values:
      'Flutter · Dart · Riverpod · BLE · Docker · Git/Jujutsu · CI/CD',
  },
];

export const values = [
  'Design systems first',
  'Specs are the product',
  'Iterate often, ship fast',
  'AI writes the code, I steer',
];

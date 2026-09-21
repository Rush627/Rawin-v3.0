# RAWIN 3.0 Design & Architecture

Definitive architecture and visual design specification for RAWIN 3.0.
Single source of truth for all human developers and automated coding assistants.

---

## 1. Product Identity

RAWIN 3.0 is a personal developer platform and digital portfolio for Rushan Siddiqui, Full Stack Developer.

### Core Identity Principles
1. Content first: Direct developer communication without marketing filler.
2. Dark editorial foundation: Ink Black provides depth and focus.
3. Pacific Cyan primary signal: The primary brand color, active indicator, and interactive signal.
4. Apricot Cream selective accent: Used sparingly for warm emphasis and secondary focal points.
5. Strategic glass: Glassmorphism used with restraint for floating navigation and elevated cards.
6. Motion with purpose: Motion communicates state transitions, hierarchy, and physical presence.
7. Architectural whitespace: Generous layout structure establishes hierarchy.
8. Performance as design: Smooth 60 FPS interactions across desktop and mobile.

### Canonical Project Names
All documentation, CMS records, and interface references must use these canonical project titles:
- RAWIN v3.0 (Flagship personal portfolio and headless digital platform)
- Strata Commerce (Headless e-commerce platform with edge caching)
- Rawin Horizon (Real-time telemetry and streaming event visualization)
- Rawin Orbit (Intelligent conversational AI system powered by Cloudflare Workers AI)

Legacy titles (such as Zenith Commerce, Pulse Analytics, and Aura Cognitive Assistant) are obsolete and prohibited in public and administrative copy.

---

## 2. Technology Stack

RAWIN 3.0 is built on modern web standards with strict type safety and zero unnecessary runtime overhead:

- Framework: Next.js 16.3.4 (App Router, Turbopack)
- Runtime: Node.js (required for native MongoDB driver, GridFS Web Streams, and crypto)
- UI Library: React 19.2.8 and React DOM 19.2.8
- Language: TypeScript 5 (Strict Mode, ES2017 target)
- Styling: Tailwind CSS v4 using @tailwindcss/postcss and CSS variables
- Database: MongoDB Atlas via MongoDB Node.js Driver v7.6.0
- Media Storage: MongoDB GridFS buckets (site_assets, project_assets, blog_assets)
- Cryptography & Auth: jose v6 (stateless HS256 JWT) and bcryptjs v3 (12 salt rounds)
- AI Inference: Cloudflare Workers AI (@cf/meta/llama-3.2-3b-instruct)
- Graphics Pipeline:
  - Native HTML5 Canvas 2D Field Particle Engine
  - OGL v1.0 (lightweight WebGL for procedural shaders)
  - Three.js v0.180 (3D interactive Orbit Orb)
- Motion & Scrolling: Framer Motion v13 and Lenis v1.3

---

## 3. Design System

### Colors

| Token | Hex / Value | Semantic Role |
|---|---|---|
| `ink-black` | `#101019` | Primary page canvas and dark foundation |
| `pacific-cyan` | `#189BAD` | Primary brand signal, active links, glow highlights |
| `apricot-cream` | `#FCD49E` | Selective secondary highlight and warm accents |
| `foreground` | `#F5F7FA` | Primary high-contrast typography |
| `muted` | `#A1A1AA` | Secondary labels, descriptions, and metadata |
| `surface` | `#161622` | Base container and panel surface |
| `surface-card` | `#191928` | Elevated card surface |
| `surface-border` | `rgba(255, 255, 255, 0.08)` | Default card and panel border |
| `success` | `#22C55E` | Availability status and positive state confirmation |

Brand color rules:
- The letter R in RAWIN always takes Pacific Cyan.
- Never use full-spectrum rainbow gradients.
- Never use bright white as a page background.
- Keep cyan accents focused on interactive elements and key brand anchors.

### Typography

The typographic hierarchy uses three distinct Google Font families loaded with `display: swap`:
1. Primary Body & Sans: Geist Sans (`var(--font-geist-sans)`)
2. Monospace & Technical: Geist Mono (`var(--font-geist-mono)`)
3. Display & Headings: Space Grotesk (`var(--font-space-grotesk)`)

Type Scale:
- `display-xl`: 72px desktop / 42px mobile (Line height: 0.98, Tracking: -0.045em, Space Grotesk)
- `display-lg`: 52px desktop / 36px mobile (Line height: 1.02, Tracking: -0.035em, Space Grotesk)
- `display-md`: 40px desktop / 30px mobile (Line height: 1.08, Tracking: -0.025em, Space Grotesk)
- `heading-lg`: 32px desktop / 26px mobile (Line height: 1.15, Tracking: -0.02em, Space Grotesk)
- `heading-md`: 22px desktop / 19px mobile (Line height: 1.30, Tracking: -0.01em, Space Grotesk)
- `body-lg`: 18px desktop / 17px mobile (Line height: 1.55, Geist Sans)
- `body-md`: 15px desktop / 15px mobile (Line height: 1.55, Geist Sans)
- `body-sm`: 13px desktop / 13px mobile (Line height: 1.45, Geist Sans)
- `mono-eyebrow`: 12px desktop / 11px mobile (Line height: 1.30, Tracking: 0.06em, Geist Mono)

### Surfaces

Surfaces combine dark contrast with subtle glassmorphism:
- `.glass-panel`: `background: rgba(22, 22, 34, 0.70)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.07)`
- `.glass-pill`: `background: rgba(22, 22, 34, 0.65)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(255, 255, 255, 0.09)`
- `.glass-card`: `background: rgba(22, 22, 34, 0.50)`, `backdrop-filter: blur(10px)`, `border: 1px solid rgba(255, 255, 255, 0.06)`
- Card hover elevates with Pacific Cyan border illumination: `border-color: rgba(24, 155, 173, 0.30)`, `transform: translateY(-2px)`

### Motion

Motion principles:
- Animate transform and opacity properties for GPU acceleration.
- Avoid animating expensive properties like filter blur or height directly.
- Page transitions use subtle fade and scale transforms.
- Respect user preference: `@media (prefers-reduced-motion: reduce)` disables continuous loops, particle bursts, and smooth scrolling.

### Interaction

- Custom Cursor: `CustomCursor.tsx` provides pointer tracking with trailing dot physics on desktop. Automatically suppressed on touch devices (`@media (pointer: coarse)`).
- Torch Spotlight: `TorchSpotlight.tsx` renders a radial gradient following mouse coordinates across dark surfaces.
- Haptics: `src/lib/haptics.ts` and `GlobalHaptics.tsx` provide subtle tactile feedback on touch devices via `navigator.vibrate`.

---

## 4. Application Architecture

RAWIN 3.0 uses the Next.js App Router with unified server rendering:
- Server Components by Default: All page entrypoints (`page.tsx`) are Server Components.
- Dynamic Server Rendering: All public and admin pages declare `export const revalidate = 0;` to ensure instant propagation of CMS edits without static redeployments.
- Client Component Boundaries: Interactivity, Canvas renderers, WebGL shaders, and form handlers are cleanly isolated in `"use client"` components.
- Path Aliasing: Configured via `@/*` pointing to `./src/*`.

---

## 5. Public Routes

1. `/` (Home): Hero introduction, role typing, laptop showcase, featured projects deck, tech stack, experience timeline, and footer.
2. `/about`: Developer background narrative, evolution milestones (2022 to 2026), architecture principles, circuit journey, and current focus areas.
3. `/projects`: Complete case study catalog with architecture dossiers, technical problems, solutions, outcomes, and live links.
4. `/blog`: Technical articles catalog with category tag filtering and read-time calculations.
5. `/blog/[slug]`: Markdown article reading view with syntax formatting and Asia/Kolkata publication dates.
6. `/uses`: Daily software stack, development tools, hardware setup, and build methodology.
7. `/resume`: Interactive digital resume, experience timeline, skills matrix, and GridFS PDF download button.
8. `/contact`: Contact channels, direct message submission via Formspree with EmailJS redundancy, and location cards.
9. `/ai`: Dedicated full-screen RAWIN Orbit interface with 3D orb visualizer, shader backgrounds, and owner verification.

---

## 6. Admin Architecture

The administrative portal (`/admin`) provides full site content management and system diagnostics:
- Route Isolation: Handled under `/admin/*` with independent navigation chrome and logout actions.
- Layout Guard: `src/app/admin/layout.tsx` checks session validity via `getAdminSession()`. If unauthenticated, administrative chrome is omitted.
- Route Protection: Every admin page (`/admin`, `/admin/content`, `/admin/projects`, `/admin/blog`, `/admin/settings`) performs server-side verification and redirects to `/admin/login` on failure.
- Admin Sections:
  - `/admin`: Dashboard metrics, database ping latency, post count, and project count.
  - `/admin/login`: Secure login form with sliding-window rate limiting.
  - `/admin/content`: Full CMS site editor and Orbit Knowledge Manager.
  - `/admin/projects`: Project creation, editing, ordering, and GridFS preview uploads.
  - `/admin/blog`: Article creation, editing, tag management, and GridFS cover uploads.
  - `/admin/settings`: Diagnostics, password change, and owner verification code updates.

---

## 7. CMS Architecture

Content is managed without external third-party CMS dependencies. All content is stored natively in MongoDB Atlas and managed through administrative Server Actions.

### Singleton Site Content
The primary site content resides in the `site_content` collection under the singleton document `key: "main"`.
Managed sections:
- `global`: Core brand metadata, availability status, footer copyright, and contact details.
- `home`: Hero copy, badge labels, call-to-action text, and section headings.
- `about`: Bio narrative, timeline milestones, principles, and focus items.
- `contact`: Social channel URLs, placeholder copy, and response messages.
- `resume`: Working status indicator, skills groups, work history, and PDF attachment reference.
- `uses`: Daily stack items, development tools, build steps, and hardware specs.
- `ai`: Orbit introduction, greeting message, and suggested inquiry prompts.
- `assets`: Image metadata for profile photo, brand logo, and favicon.
- `maintenance`: Maintenance mode toggle and notification message.
- `launchExperience`: Launch screen toggle, duration, and display frequency.

### Orbit Knowledge Base
Stored in the `orbit_knowledge` collection. Administered via `/admin/content` (Orbit Knowledge Manager tab). Supports categories: `profile`, `education`, `skills`, `rawin`, `orbit`, `custom`. Injected dynamically into Orbit system prompts.

---

## 8. Database Architecture

- Database Provider: MongoDB Atlas
- Default Database Name: `rawin3` (configurable via `MONGODB_DB_NAME`)
- Connection Pool: Managed via `MongoClient` with `maxPoolSize: 10` and global caching in development.

### Collections Summary
1. `site_content`: Singleton document containing global portfolio configuration.
2. `projects`: Case study records. Indexed on `{ slug: 1 }` (unique), `{ displayOrder: 1, createdAt: -1 }`, and `{ featured: 1, displayOrder: 1 }`.
3. `blogPosts`: Article records. Indexed on `{ slug: 1 }` (unique) and `{ status: 1, publishedAt: -1 }`.
4. `orbit_knowledge`: Grounding context for Orbit. Indexed on `{ category: 1, enabled: 1 }`, `{ enabled: 1, priority: 1, status: 1 }`, and `{ updatedAt: -1 }`.
5. `orbit_security`: Bcrypt hash for owner verification and security metadata.
6. `admins`: Administrator credentials (`email`, `passwordHash`, `lastLoginAt`).
7. `site_assets.files` & `site_assets.chunks`: GridFS bucket for site media.
8. `project_assets.files` & `project_assets.chunks`: GridFS bucket for project screenshots.
9. `blog_assets.files` & `blog_assets.chunks`: GridFS bucket for article covers.

---

## 9. GridFS Media Architecture

All uploaded media is stored directly in MongoDB GridFS buckets:
- Never save uploaded files to local disk storage.
- Never store images or PDFs as Base64 strings inside JSON documents.
- Prior GridFS files are deleted after replacing an asset to prevent orphaned chunks.

### Streaming Endpoints
1. `/api/assets/[type]`: Streams site assets (`profile`, `logo`, `favicon`, `evolution-*`) from `site_assets` bucket. Returns HTTP 307 redirect to `/images/*` if not yet uploaded.
2. `/api/projects/preview/[projectId]`: Streams project preview image from `project_assets` bucket.
3. `/api/blog/cover/[postId]`: Streams post cover from `blog_assets` bucket.
4. `/api/resume/download`: Streams active resume PDF attachment with proper `Content-Disposition`.
5. `/api/resume/upload`: Admin endpoint for uploading PDF documents. Verifies PDF magic bytes (`%PDF-`) and enforces 10MB limit.

Caching: Image streaming routes return `Cache-Control: public, max-age=31536000, immutable`. Resume download returns `Cache-Control: public, max-age=3600, must-revalidate`.

---

## 10. Authentication & Security

- Session Token: Signed JWT using `jose` (`SignJWT`) with HMAC-SHA256 (`HS256`).
- Secret Key: Derived from `SESSION_SECRET`. Server fails closed in production if missing or fewer than 32 characters.
- Cookie Storage: `rawin_admin_session`, `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, max-age 7 days. Enforces `secure: true` in production HTTPS while permitting HTTP on private LAN IPs (192.168.x.x, 10.x.x.x, 127.0.0.1) for local device testing.
- Password Security: Hashed with `bcryptjs` using 12 salt rounds. Plaintext password variables are strictly rejected in production.
- Rate Limiting: In-memory sliding window limiter (`src/lib/rate-limit.ts`) restricts login failures to 5 attempts per 15 minutes per IP.
- Edge Proxy Note: `src/proxy.ts` implements JWT verification logic. Internal admin pages and server actions independently verify sessions as primary defense-in-depth.

---

## 11. RAWIN Orbit

RAWIN Orbit is the integrated AI conversational system available at `/ai`.

### Architecture & Grounding
- Inference: Powered by Cloudflare Workers AI (`@cf/meta/llama-3.2-3b-instruct`).
- Internal Implementation Note: The supporting directory is `src/lib/aura/` containing the Cloudflare AI provider, prompt builder, knowledge compiler, and rate limiting.
- Streaming: Server-Sent Events (SSE) via `POST /api/ai/chat`.
- Knowledge Grounding: Context dynamically assembled from `site_content`, `projects`, `blogPosts`, and `orbit_knowledge`. Cached in-memory with automatic invalidation on CMS updates.

### Identity State Machine & Security
- Token: Cryptographic HMAC token passed via `x-orbit-identity-token`.
- State Machine:
  - `UNKNOWN`: Standard visitor asking public portfolio questions.
  - `CLAIMED_RUSHAN_PENDING_VERIFICATION`: Visitor claiming to be Rushan is challenged for the passcode.
  - `VERIFIED_RUSHAN`: Identity confirmed via bcrypt check. Orbit acknowledges Rushan as its developer and unlocks authorized interaction context.
  - `RUSHAN_VERIFICATION_FAILED`: Failed verification permanently halts passcode attempts for that session.
- Conversation Limits: Maximum 10 turns, 4,000 characters per message, 16,000 characters total history, 1,024 max output tokens.
- Rate Limiting: 20 requests per minute per IP.

---

## 12. Launch Experience 2.0

The Launch Experience (`src/components/launch/LaunchExperience.tsx`) is a full-screen canvas introduction sequence.

### Sequence Flow
1. Phase 1 (Signal Wake): Dark CRT overlay with scanlines, chromatic flicker, and initialization audio/haptic pulse.
2. Phase 2 (Canvas Particle Text): Canvas 2D engine samples typography contours of "RAWIN v3.0" into target particles.
3. Phase 3 (Dispersion Burst): Particles accelerate outward with elastic physics and dissolve into the site background.
4. Phase 4 (Transition to Site): White flash bloom and CRT screen collapse reveal the live portfolio.

### Frequency Controls
Configured in CMS (`site_content.launchExperience`):
- `once`: Displays once per browser using `localStorage`.
- `session`: Displays once per browser tab session using `sessionStorage`.
- `visit`: Displays on every visit to `/`.
- Enabled toggle allows instant administrative deactivation.

---

## 13. Canvas & Particle Systems

The website background features an atmospheric particle field (`src/components/ParticleField.tsx`) powered by the mathematical engine in `src/lib/particles/field-particle-engine.ts`.

### Simulation Dynamics
- Particle Density: Balanced count across desktop and mobile screens.
- Offscreen Text Sampling: Font contours are rendered to an offscreen canvas and sampled to establish resting particle coordinates.
- Restoring Forces: Elastic spring physics return displaced particles to anchor positions with viscous dampening.
- Cursor Interaction: Pointer velocity imparts directional impulse and fluid displacement.
- Automated Idle Suspension: When particle velocities settle below threshold, the `requestAnimationFrame` loop suspends execution, dropping CPU and GPU consumption to zero.
- Reduced Motion: If reduced motion is requested, particles remain stationary without burst animations or pointer disturbance.

---

## 14. WebGL / OGL / Three.js

1. OGL Procedural Shaders (`src/components/orbit/`):
   - `Galaxy.tsx`: Procedural particle vortex with orbital velocity and color gradients.
   - `GradientWaves.tsx`: Flowing trigonometric wave mesh with smooth color oscillation.
   - `FaultyTerminal.tsx`: Scanline CRT terminal aesthetic with customizable noise and jitter.
   - All OGL components use lightweight WebGL pipelines (~10KB overhead) rather than heavy 3D frameworks.

2. Three.js Orbit Orb (`src/components/RawinOrbitOrb.tsx`):
   - Interactive 3D wireframe sphere rendered inside the Orbit AI interface.
   - Responds to audio/streaming activity and mouse interaction.

---

## 15. Responsive Architecture

RAWIN 3.0 uses a mobile-first responsive strategy with five primary breakpoints:
- Phone: `< 640px`
- Large Phone: `640px - 767px`
- Tablet: `768px - 1023px`
- Laptop / Desktop: `1024px - 1439px`
- Wide Desktop: `>= 1440px`

Design Philosophy:
Mobile layouts are not shrunken desktop layouts. Mobile interfaces use dedicated touch layouts, segmented controls, full-width touch cards, and native sheet components.

---

## 16. Mobile Presentation Architecture

Dedicated mobile and desktop component separation:

| Area | Desktop Implementation (`>= 1024px`) | Mobile Implementation (`< 1024px`) |
|---|---|---|
| Projects Section | `SelectedProjectsDeck.tsx` (scroll-pinned 3D card deck) | `MobileSelectedProjects.tsx` (vertical stacked cards) |
| Tech Arsenal | 3D interactive category grid | `MobileTechStack.tsx` (horizontal scrollable chips) |
| Why Work With Me | Multi-column editorial dossier cards | `MobileWhyWorkWithMe.tsx` (compact value proposition stack) |
| Engineering Journey | `EngineeringJourneyCircuit.tsx` (circuit diagram) | `MobileEngineeringJourney.tsx` (vertical chronological timeline) |
| Contact Interface | `DesktopContactView.tsx` (side-by-side terminal & form) | `MobileContactView.tsx` (stacked touch form & direct email sheet) |
| Resume Interface | `ResumeDesktopView.tsx` (editorial side-by-side layout) | `ResumeMobileView.tsx` (segmented category tabs) |
| Site Closing & Footer | Full desktop editorial footer with live status cards | `MobileClosingAndFooter.tsx` (touch navigation & legal sheet) |
| About Narrative | `AboutNarrativePanel.tsx` | `MobileAboutExperience.tsx`, `MobileHowIBuild.tsx`, `MobileAboutCTA.tsx` |

Touch Ergonomics:
- Minimum touch targets meet or exceed 44px by 44px.
- Height calculations use `dvh` units (`.h-stage-full`, `.h-story-mobile`) to prevent iOS Safari dynamic toolbar clipping.
- WebKit date and time inputs include alignment fixes for iOS Safari.

---

## 17. Performance Architecture

- GPU Acceleration: All continuous animations use `transform: translate3d()` and `opacity`.
- Idle Sleep: The Canvas particle simulation automatically halts its animation loop when at rest.
- Smooth Scrolling: Powered by Lenis with passive event listeners and automatic suspension during reduced-motion mode.
- Event Throttling: Pointer move listeners in `CustomCursor.tsx` and `TorchSpotlight.tsx` decouple tracking from React state using `requestAnimationFrame`.
- Next.js Image Optimization: Above-the-fold images use eager loading; below-the-fold assets use lazy loading with explicit width and height to prevent layout shifts.

---

## 18. Contact & Communication

- Primary Channel: Formspree endpoint (`https://formspree.io/f/mblkyvyw`).
- Redundancy Channel: EmailJS browser SDK (`@emailjs/browser`) provides automated secondary dispatch in `ContactView.tsx`.
- Anti-Spam: Honeypot field (`_gotcha`) transparently traps automated bots without user-facing captchas.
- Quick Mail Actions: Desktop provides 1-click Gmail web compose URL; mobile provides deep-link URL scheme (`googlegmail:///co`) with fallback to standard `mailto:`.

---

## 19. Blog System

- Model: `BlogPost` schema in `blogPosts` collection.
- Authoring: Markdown-supported text area with cover image upload and tag assignment.
- Timezone Standard: All editorial dates adhere to `Asia/Kolkata` (IST, UTC+05:30).
- Public View: Tag-filtered cards on `/blog` and article views on `/blog/[slug]`.
- Cover Storage: Uploaded to `blog_assets` GridFS bucket and served via `/api/blog/cover/[postId]`.

---

## 20. Projects System

- Model: `Project` schema in `projects` collection with canonical fallbacks in `src/data/projects.ts`.
- Case Study Detail: Fields include `problem`, `solution`, `role`, `outcome`, `technologies`, `engineeringFocus`, `liveUrl`, `githubUrl`.
- Display: Interactive dossier cards on `/projects` and scroll-driven showcase deck on `/`.
- Screenshot Storage: Uploaded to `project_assets` GridFS bucket and served via `/api/projects/preview/[projectId]`.

---

## 21. Resume System

- Schema: Singleton storage in `site_content.resume`.
- Semantic Status Indicator:
  - `green`: Available for hire
  - `orange`: Currently working on a project
  - `cyan`: Open to select opportunities
  - `gray`: Not currently available
- Downloadable PDF: Uploaded to `site_assets` GridFS bucket with magic byte verification. Served publicly through `/api/resume/download`.
- Fallback: Static resume in `public/Rushan Siddiqui - Resume.pdf`.

---

## 22. Uses System

- Schema: Singleton storage in `site_content.uses`.
- Categories: Daily Stack, Development Stack, How I Build steps, Currently Exploring, and Hardware Setup.
- Display: Multi-column desktop grid with category icons and compact mobile stack.

---

## 23. About System

- Schema: Singleton storage in `site_content.about`.
- Content: Narrative lead paragraphs, Evolution timeline milestones (2022, 2023, 2026), Architecture principles, and Focus areas.
- Visuals: Milestone graphics served from GridFS with fallbacks to `public/images/evolution-*.png`.

---

## 24. Error & Availability Systems

1. Error Handling:
   - `src/app/error.tsx`: Catches client exceptions and renders `RawinErrorView` with reset trigger.
   - `src/app/not-found.tsx`: Renders custom 404 illustration and return link.

2. Availability Polling:
   - `AvailabilityWatcher.tsx`: Client watcher polling `GET /api/availability`.
   - Propagates real-time availability updates to navbar badge and footer status chips without page refreshes.

3. Offline Detection:
   - `OfflineDetector.tsx`: Monitors network connectivity and presents a subtle status toast when the visitor goes offline.

---

## 25. Haptics & Interaction

- Vibration Engine: `src/lib/haptics.ts` wraps `navigator.vibrate` with support checks.
- Preset Patterns: Light click (8ms), medium selection (16ms), impact pulse (24ms), and error buzz (pattern: 30ms, 40ms, 30ms).
- Global Listener: `GlobalHaptics.tsx` automatically triggers light tactile pulses on button, link, and tab interactions across touch-enabled devices.

---

## 26. Environment Configuration

*Variable names and purposes only; secrets are never committed.*

### Production Variables
- `MONGODB_URI`: MongoDB Atlas connection string. Required for database and GridFS storage.
- `SESSION_SECRET`: Secret key (minimum 32 characters) for signing JWT session cookies and Orbit identity tokens.
- `ADMIN_EMAIL`: Primary administrator email for recovery and session fallback.
- `ADMIN_PASSWORD_HASH`: Precomputed bcrypt hash of admin password for environment fallback.
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account identifier for Workers AI inference.
- `CLOUDFLARE_API_TOKEN`: Cloudflare authorization token with Workers AI read permissions.

### Optional Variables
- `MONGODB_DB_NAME`: Database name override (defaults to `rawin3`).
- `CLOUDFLARE_AI_MODEL`: Model override (defaults to `@cf/meta/llama-3.2-3b-instruct`).
- `CLOUDFLARE_AI_ENDPOINT`: Custom proxy endpoint for Cloudflare Workers AI.
- `ORBIT_OWNER_VERIFICATION_CODE`: Initial seed code for Rushan owner verification.
- `NEXT_PUBLIC_SITE_URL`: Base domain origin (e.g. `https://rawin.world`).

### Development Only
- `ADMIN_PASSWORD`: Plaintext password used exclusively by `scripts/seed-admin.js`. Prohibited in production.

---

## 27. Deployment Architecture

- Target Runtime: Node.js 20.x or 22.x LTS.
- Server Architecture: Next.js standalone serverful deployment or containerized Node.js service.
- Serverless Considerations: If hosted on serverless platforms (e.g. Netlify Functions or AWS Lambda), ensure:
  - Node.js runtime is configured (Edge runtime cannot be used due to MongoDB driver and Stream APIs).
  - Request body limits accommodate image uploads (Lambda standard limit is 6MB).
  - External package bundling includes `mongodb` via `next.config.ts`.

---

## 28. Known Constraints

1. Runtime Environment: The MongoDB native driver and GridFS Web Stream pipelines require the Node.js runtime. Edge runtime is not supported.
2. GridFS Persistence: All dynamic uploads rely on MongoDB Atlas. If the database connection is lost, image routes fallback gracefully to static assets in `public/`.
3. In-Memory Limiting: Login and verification rate limiting use in-memory Maps. On serverless platforms with ephemeral instances, rate limits apply per warm instance rather than globally.
4. Payload Limits: In serverless environments, file uploads above 6MB will trigger gateway payload size errors.

---

## 29. Development Rules

1. Single Source of Truth: This document is the visual and architectural authority.
2. Preserve Existing Functionality: Never rewrite working components without explicit instruction.
3. Zero Em Dash Constraint: Never introduce the em dash character anywhere in copy, code, comments, or documentation. Use commas, periods, colons, or normal hyphens.
4. Content Principles: Follow Section 36 Human-First writing principles. Avoid marketing buzzwords, filler subheadings, and invented metrics.
5. Canonical Names: Always use RAWIN v3.0, Strata Commerce, Rawin Horizon, and Rawin Orbit.
6. Verify Before Complete: Always run `npx tsc --noEmit` and `npm run build` before considering tasks finished.
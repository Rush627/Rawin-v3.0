---
description: Definitive visual and interaction system for RAWIN 3.0, combining Vercel-inspired precision and Apple-inspired premium composition with an original RAWIN identity.
name: RAWIN 3.0 Design System
version: 1.0
---

# RAWIN 3.0 Design System

## 1. Design Philosophy

RAWIN 3.0 is a premium personal portfolio for Rushan Siddiqui, Full Stack Developer.

The system combines three influences:

- **Vercel principles:** typography discipline, spacing, technical precision, restrained UI.
- **Apple principles:** generous whitespace, visual storytelling, premium composition, quiet UI chrome, polished interactions.
- **RAWIN identity:** Ink Black, Pacific Cyan, Apricot Cream, strategic glass/liquid-glass surfaces, cursor torch/spotlight, developer-focused content, and performance-first implementation.

These references are **inspiration only**. RAWIN must never become a Vercel or Apple clone.

Core principles:

1. Content first.
2. Dark editorial foundation.
3. Pacific Cyan is the primary brand signal.
4. Apricot Cream is a selective secondary accent.
5. Glass is strategic, not everywhere.
6. Motion communicates hierarchy and feedback.
7. Whitespace creates structure.
8. Performance is part of the design.
9. Original composition always wins.
10. Consistency beats novelty.

## 2. Brand Colors

| Token | Value | Use |
|---|---|---|
| `ink-black` | `#101019` | Primary page background |
| `pacific-cyan` | `#189BAD` | Brand, primary actions, active states, links, torch highlights |
| `apricot-cream` | `#FCD49E` | Selective highlights and warm emphasis |
| `foreground` | `#F5F7FA` | Primary text on dark surfaces |
| `muted` | `#A1A1AA` | Secondary text and metadata |
| `success` | `#22C55E` | Availability and success states |

Supporting glass tokens:

- `glass-subtle`: `rgba(255,255,255,0.04)`
- `glass`: `rgba(255,255,255,0.06)`
- `glass-strong`: `rgba(255,255,255,0.10)`
- `glass-active`: `rgba(255,255,255,0.14)`
- `line`: `rgba(255,255,255,0.08)`
- `line-strong`: `rgba(255,255,255,0.14)`

Rules:

- The **R** in `RAWIN` always uses Pacific Cyan.
- Do not introduce random accent colors.
- Do not use Vercel's gradient identity.
- Do not use Apple's Action Blue as RAWIN branding.
- Avoid large cyan or apricot blocks.
- Avoid rainbow gradients.

## 3. Typography

Preferred fonts:

- Sans: **Geist Sans**
- Technical: **Geist Mono**
- Sans fallback: `Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- Mono fallback: `JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace`

### RAWIN type scale

| Token | Desktop | Mobile | Weight | Line height | Tracking | Use |
|---|---:|---:|---:|---:|---:|---|
| `display-xl` | 72px | 42px | 600 | 0.98 | -0.045em | Hero headline |
| `display-lg` | 52px | 36px | 600 | 1.02 | -0.035em | Major title |
| `display-md` | 40px | 30px | 600 | 1.08 | -0.025em | Secondary display |
| `heading-lg` | 32px | 26px | 600 | 1.15 | -0.02em | Major section |
| `heading-md` | 22px | 19px | 600 | 1.3 | -0.01em | Card/subsection |
| `body-lg` | 18px | 17px | 400 | 1.55 | 0 | Lead copy |
| `body-md` | 15px | 15px | 400 | 1.55 | 0 | Default body |
| `body-sm` | 13px | 13px | 400 | 1.45 | 0 | Metadata |
| `label` | 14px | 13px | 500 | 1.4 | 0 | UI labels |
| `mono-eyebrow` | 12px | 11px | 500 | 1.3 | 0.06em | Technical labels |
| `button-lg` | 15px | 15px | 500 | 1 | 0 | Primary CTA |
| `button-md` | 14px | 14px | 500 | 1 | 0 | UI buttons |
| `code` | 14px | 13px | 400 | 1.5 | 0 | Code |

Large headings use restrained negative tracking.

Body copy remains comfortable to read.

Avoid excessive font weights and all-caps body text.

## 4. Spacing

Base unit: **4px**

Scale:

`4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96 / 128`

Guidance:

- Card padding: `20-32px`
- Component gaps: `12-24px`
- Large gaps: `32-64px`
- Section padding: `80-128px` desktop
- Section padding: `56-80px` mobile

Whitespace should establish hierarchy before decorative effects are added.

## 5. Layout

Use a centered responsive container, approximately `1200-1280px` maximum width, with comfortable gutters.

Do not make every section a centered stack.

Use:

- two-column editorial layouts
- asymmetric compositions
- full-width visual bands
- contained cards
- floating elements
- controlled negative space

Home rhythm:

1. Hero
2. Featured Projects
3. Tech Arsenal
4. Experience / Why Work With Me
5. CTA
6. Footer

## 6. Surfaces and Liquid Glass

Glass is a supporting language.

Typical glass:

- background: `rgba(255,255,255,0.04-0.08)`
- border: `1px solid rgba(255,255,255,0.08-0.14)`
- backdrop blur: approximately `12-24px` only when needed
- subtle inner highlight when useful
- no heavy shadow by default

Use glass for:

- navigation
- floating controls
- selected interactive cards
- overlays
- AI assistant

Avoid nested glass, huge blur radii, animated backdrop filters, and glass on every card.

## 7. Depth

### Level 0: Flat

Surface contrast and subtle border, no shadow.

### Level 1: Soft

Subtle border and very low-alpha shadow for selected elevated cards.

### Level 2: Floating

Glass, backdrop blur and subtle shadow for navigation, menus and overlays.

The torch may create localized light interaction, but permanent neon glow is not part of the system.

## 8. Shapes

| Token | Value | Use |
|---|---:|---|
| `sm` | 8px | Compact controls |
| `md` | 12px | Cards and inputs |
| `lg` | 16px | Larger cards |
| `xl` | 20px | Feature surfaces |
| `2xl` | 24px | Large glass surfaces |
| `pill` | 9999px | CTAs and status chips |
| `full` | 9999px | Circular controls |

Do not make every element a pill.

## 9. Buttons

### Primary

Pacific Cyan background, foreground text, approximately 44px minimum touch height.

### Secondary

Glass or transparent surface with subtle border.

### Ghost

Transparent with restrained text and border behavior.

Interactions should use small transform, opacity, background or border transitions.

Avoid exaggerated bounce.

## 10. Navigation

The primary navigation is a floating glass navigation system.

Desktop:

- centered/max-width
- glass surface
- subtle border
- RAWIN wordmark
- page links
- primary action such as Resume or Contact

Mobile:

- compact floating navigation
- accessible menu
- minimum 44px touch targets
- smooth open/close motion

## 11. Hero

The Hero is the primary brand statement.

Requirements:

- Ink Black background
- large confident headline
- concise developer positioning
- medium-sized profile portrait
- professional status indicator
- primary and secondary CTA
- subtle torch/spotlight atmosphere
- generous negative space
- responsive composition

Use a professional status such as **Open to opportunities**.

Brand assets:

- Primary wordmark logo: `/images/logo.png`
- Favicon / app icon: `/images/favicon.png`
- Profile image: `/images/profile.png`

### Logo usage

- Use `/images/logo.png` as the primary RAWIN wordmark wherever a brand logo is required.
- Do not recreate the wordmark as plain text when the logo asset is appropriate.
- Preserve the logo proportions.
- Do not stretch, distort, recolor, crop, or add effects that alter its identity.
- The logo uses the RAWIN brand treatment: cyan R with white AWIN on Ink Black.
- Use `/images/favicon.png` for the browser favicon and compact brand contexts where the standalone mark is appropriate.
- Keep sufficient clear space around the logo.

### Profile image

`/images/profile.png`

The portrait may use circular or softly rounded framing with subtle glass/light interaction, but must not dominate the composition.

## 12. Featured Projects

Projects should feel like case studies, not generic cards.

Support:

- title
- summary
- role
- problem
- solution
- technology
- key features
- outcome
- image/media
- live link
- source link where appropriate

Use strong imagery and editorial composition.

Avoid repetitive identical-card grids.

## 13. Tech Arsenal

The previous website had performance problems in this area.

Rules:

- Prefer static layout plus lightweight interaction.
- Animate transform and opacity where possible.
- Avoid many continuously animated DOM elements.
- Avoid unnecessary 3D.
- Avoid continuous canvas/WebGL effects unless strongly justified.
- Respect `prefers-reduced-motion`.

The cursor-reactive particle field is an intentional exception because it is a core RAWIN visual feature. It must remain performance-conscious and must never compromise usability or responsiveness.

## 14. Experience / Why Work With Me

Communicate credibility and working style using concise statements, capability highlights, experience timelines, and measurable outcomes where available.

Use typography and spacing for hierarchy instead of excessive decoration.

## 15. CTA

The closing CTA should feel confident and premium.

Use strong display typography, generous whitespace, Pacific Cyan primary action, and Apricot Cream only for meaningful emphasis.

Do not create a giant glowing gradient block.

## 16. Footer

Keep the footer information-rich but calm.

Possible content:

- RAWIN wordmark
- navigation
- social links
- contact
- resume
- copyright

Use muted typography and clear grouping.

## 17. Blog

Prioritize reading comfort.

Preferred architecture:

- content-driven posts
- MDX where appropriate
- comfortable line length
- generous vertical rhythm
- accessible heading hierarchy
- Geist Mono for code

Avoid making the blog a card-heavy marketing page.

## 18. Contact and Forms

Forms must support:

- accessible labels
- validation
- loading state
- success state
- error state
- mobile usability
- clear feedback

Existing RAWIN 2.0 EmailJS and Formspree functionality may be reimplemented after reviewing the old implementation.

Never expose secret credentials in client-side code.

## 19. AI Assistant

The AI assistant should feel native to RAWIN.

Use:

- compact floating trigger
- glass panel
- Pacific Cyan active state
- clean conversation typography
- clear loading state
- accessible controls
- smooth open/close transition

Planned provider: Cloudflare AI.

Keep the integration isolated so the provider can be changed later.

## 20. Torch / Spotlight

The Torch is a signature RAWIN visual.

It should:

- follow the pointer smoothly
- use efficient pointer tracking
- avoid unnecessary React state updates per frame
- prefer CSS variables or efficient animation-frame scheduling
- interact subtly with selected surfaces
- be disabled or simplified on touch devices
- respect reduced-motion preferences

Never allow it to become visually dominant.

## 21. Motion

Motion should communicate hierarchy, continuity, and feedback.

Preferred:

- entrance reveal
- small stagger
- transform/opacity transitions
- blur + slight scale page transitions
- shared-element transitions where appropriate
- smooth menus
- tactile button feedback

Page transitions must not be fade-only.

Avoid:

- animation on every element
- constant infinite motion
- heavy parallax
- excessive spring/bounce
- expensive blur animation
- unnecessary animation libraries
- motion that delays interaction

Target smooth approximately 60 FPS animation on capable devices.

## 22. Responsive Strategy

Design mobile-first.

Primary structural breakpoints:

- `640px` phone
- `768px` tablet
- `1024px` laptop
- `1280px` desktop
- `1440px+` wide desktop

These are structural guides, not mandatory values for every component.

Mobile should be intentionally composed rather than simply shrinking desktop.

Use responsive image sizing, eager loading only for important above-the-fold imagery, and lazy loading below the fold.

## 23. Accessibility

Required:

- semantic HTML
- keyboard navigation
- visible focus states
- sufficient contrast
- accessible labels
- descriptive alt text
- approximately 44px touch targets for primary controls
- reduced-motion support
- usable forms
- no information conveyed only by color

## 24. Performance

Performance is a first-class design requirement.

Prefer:

- Next.js App Router
- Server Components by default
- Client Components only where interactivity requires them
- CSS transforms
- opacity animation
- CSS variables
- optimized images
- minimal client JavaScript
- lazy loading
- code splitting where useful
- static rendering where appropriate
- efficient server rendering where appropriate

Avoid:

- unnecessary client hydration
- giant client components
- excessive backdrop filters
- continuous expensive animation loops
- unnecessary WebGL
- large libraries for tiny interactions
- duplicate animation systems
- oversized images
- excessive DOM depth

A visually impressive effect that causes noticeable lag must be simplified or removed.

## 25. Technology Guidance

Preferred implementation stack:

- Next.js 15
- App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui only where useful
- MDX/content-driven architecture for blog content where appropriate

Use Server Components by default.

Use Client Components only when interaction, browser APIs, animation, or other client-side behavior requires them.

Use server-side capabilities where they provide real value.

Do not add technology merely for complexity.

## 26. Reference Rules

Reference analyses are inspiration only.

Extract principles such as:

- Vercel: technical precision, typography discipline, spacing, restraint.
- Apple: visual storytelling, whitespace, premium composition, quiet chrome.

Never copy:

- brand colors
- logos
- exact layouts
- exact component designs
- exact typography specifications
- brand-specific gradients
- brand-specific navigation
- proprietary visual identity

If a reference conflicts with this document, **RAWIN 3.0 wins**.

## 27. Do

- Keep Ink Black dominant.
- Make Pacific Cyan unmistakably RAWIN.
- Use Apricot Cream sparingly.
- Use glass strategically.
- Keep typography confident and readable.
- Give sections generous breathing room.
- Use visual storytelling for projects.
- Make the Hero memorable but professional.
- Keep interactions tactile and subtle.
- Optimize every animated effect.
- Design mobile intentionally.
- Keep all pages visually connected.
- Prefer original compositions.
- Test performance after major visual changes.
- Preserve existing working functionality.

## 28. Don't

- Don't make RAWIN a Vercel clone.
- Don't make RAWIN an Apple clone.
- Don't use white as the primary canvas.
- Don't introduce random brand colors.
- Don't use rainbow gradients.
- Don't put glass on every element.
- Don't overuse blur.
- Don't use neon everywhere.
- Don't animate everything.
- Don't recreate the old Tech Arsenal implementation blindly.
- Don't use heavy 3D without a strong reason.
- Don't use fade-only page transitions.
- Don't create giant monolithic components.
- Don't sacrifice performance for visual effects.
- Don't expose API secrets in client-side code.
- Don't create duplicate project folders.

## 29. Source-of-Truth Rule

This file is the **single source of truth for RAWIN 3.0 visual design**.

All agents working on the project, including Antigravity, OpenCode, Kilo Code, MiniMax, Claude-based agents, or other coding agents, should read this file before implementing UI.

Before introducing a new visual pattern, ask:

1. Does it fit RAWIN's identity?
2. Does it improve hierarchy or usability?
3. Is it consistent with the design tokens?
4. Is it accessible?
5. Is it performant?
6. Is it original rather than copied from a reference?

If the answer is no, do not introduce it.

## 30. Cursor-Reactive Particle / Dust Field + Scroll-Driven Laptop Showcase + Hero Role Animation

RAWIN 3.0 includes three specialized visual and interaction features:

1. Cursor-reactive particle / dust field with Hero name entrance burst
2. Scroll-driven laptop showcase
3. Fast typing animation for the Hero role text

These requirements extend the existing RAWIN 3.0 design system.

Do not redesign or rewrite already completed sections unnecessarily.

---

### 1. Cursor-Reactive Particle / Dust Field

RAWIN 3.0 features an atmospheric cursor-reactive particle and dust field across the background of the website.

Reference for the role of texture and movement:

https://jamiemckaye.com/

Use the reference only for inspiration.

Do not copy its code, assets, layout, typography, branding, or exact visual implementation.

#### Visual Direction

- Fine, organic particle/dust field
- Microscopic particles distributed across the dark atmosphere
- Cursor-driven localized disturbance
- Physical displacement: moving cursor displaces particles naturally
- Cursor velocity directly influences disturbance intensity and fluid trail
- Slightly increased local density and soft luminescence around cursor interaction
- Particles stretch and flow along the movement vector
- Smooth particle settling back to resting anchors when movement ceases
- Sits naturally behind the Ink Black `#101019` background and glass UI
- No camera grain or noise effect
- No static film-grain overlay
- No simple cursor spotlight

#### Hero Particle Burst

- The particle field initially originates from the Hero name typography: "Rushan Siddiqui"
- On initial page load, particles emerge directly from the text area and contours of "Rushan Siddiqui"
- Dense concentration of fine particles bursts outward from the name
- The burst expands organically and seamlessly transitions into the normal surrounding particle field
- Elastic restoring forces and viscous damping settle the particles into their field anchors
- Cursor interaction smoothly takes over after the initial burst finishes
- Creates the visual impression that the typography itself generates the atmospheric particle field

#### Technical Requirements

- Use a native GPU/canvas-based implementation where appropriate, with WebGL and a lightweight fallback when necessary
- Avoid thousands of DOM elements or React state per particle
- Use efficient typed arrays or GPU-friendly particle data structures where appropriate
- Use a single efficient animation loop where possible
- Avoid React state updates for individual particles
- Automatic idle sleep state when particles are settled to conserve CPU and battery
- Field must remain behind all content with appropriate stacking order and `pointer-events: none`
- Must never interfere with buttons, links, or text selection
- Respect `prefers-reduced-motion`
- When reduced motion is enabled, show a stable static particle field with no entrance burst or interactive movement
- Do not rewrite a working particle implementation solely to match a specific internal architecture if the existing implementation already satisfies the visual and performance requirements

---

### 2. Scroll-Driven Laptop Showcase

Add a premium scroll-driven laptop showcase to the Home page.

Reference:

https://www.vilendesign.com/

Use Vilen Design only as inspiration for the concept of premium product/portfolio presentation and scroll-driven visual storytelling.

Do NOT copy:

- exact layout
- exact animation
- exact laptop design
- assets
- styling
- typography
- implementation

RAWIN 3.0 must have its own original implementation and visual identity.

#### Recommended Placement

Featured Projects

↓

Laptop Showcase

↓

Tech Arsenal / Experience

The laptop section should act as a visual bridge between the project showcase and the technical/experience content.

#### Interaction

The laptop should:

- begin partially closed
- open progressively as the user scrolls through the section
- have the opening motion directly tied to scroll progress
- reveal the laptop screen as the lid opens
- show meaningful RAWIN content or project UI inside the screen
- reach a fully-open state
- remain stable once fully open
- reverse naturally when scrolling upward where appropriate

The animation should feel physical and premium rather than like a simple rotating image.

Use:

- perspective
- depth
- hinge-like movement
- controlled shadows
- subtle reflections
- appropriate screen perspective

#### Visual Direction

The laptop should feel:

- premium
- minimal
- technical
- sophisticated
- dark
- product-oriented

Use RAWIN colors inside the screen:

- Ink Black `#101019`
- Pacific Cyan `#189BAD`
- Apricot Cream `#FCD49E`
- Foreground `#F5F7FA`

Avoid excessive glow, neon, particles, gaming aesthetics, or cyberpunk styling.

#### Performance

Performance is critical.

Prefer:

- CSS transforms
- GPU-accelerated properties
- efficient scroll progress tracking
- IntersectionObserver where appropriate
- requestAnimationFrame only when necessary

Avoid heavy 3D libraries unless absolutely necessary.

Do not introduce a large dependency simply to rotate the laptop.

Target smooth approximately 60 FPS animation on capable devices.

Lazy-load heavy screen assets where appropriate.

#### Responsive Behavior

Desktop:

- full scroll-driven laptop interaction

Tablet:

- simplify the interaction if required

Mobile:

- do not force the full desktop animation if it causes performance or usability problems
- use a lightweight reveal or static/open laptop presentation instead
- important project information must remain accessible without the animation

#### Accessibility

Respect:

`prefers-reduced-motion`

When reduced motion is enabled:

- show the laptop in a stable/static state
- do not continuously animate it
- ensure all important content remains accessible

---

### 3. Hero Role Typing Animation

In the first section of the Home page, immediately below:

`Hi, I'm Rushan Siddiqui`

there is currently a professional role/title such as:

`UI/UX Designer`

This role text must use an animated typing/cycling text effect.

#### Roles

Cycle through these three roles:

1. `UI/UX Designer`
2. `Full Stack Developer`
3. `Creative Technologist`

Sequence:

`UI/UX Designer`

→

`Full Stack Developer`

→

`Creative Technologist`

→

repeat

#### Animation Behavior

Each role should:

1. Type in quickly.
2. Briefly remain visible.
3. Delete smoothly.
4. Immediately begin typing the next role.

The typing animation should feel:

- fast
- smooth
- premium
- modern
- responsive

Do NOT make it a slow beginner-style typing effect.

The visitor should not have to wait several seconds just to understand what Rushan does.

A subtle blinking cursor may be included.

The cursor should be small and understated.

#### Motion

The animation should have:

- fast typing
- short pause after completion
- smooth deletion
- short transition before the next role

Avoid excessive delays.

The entire cycle should feel energetic but professional.

#### Technical Requirements

Use a lightweight implementation.

Prefer:

- CSS
- lightweight TypeScript/JavaScript
- existing project animation utilities if already present

Do not introduce a heavy animation library only for this effect.

Avoid unnecessary React re-renders.

Respect:

`prefers-reduced-motion`

When reduced motion is enabled:

- show one role statically, preferably `UI/UX Designer`
- or use a very subtle non-typing transition

The role text must remain accessible to screen readers and must not depend entirely on visual animation for meaning.

---

### Combined Visual Principle

These three effects should work together rather than compete:

- Particle/Dust Field = subtle atmospheric texture
- Laptop = major interactive visual moment
- Hero typing = energetic personal introduction

Keep all three restrained and premium.

Do not add additional effects simply because these effects exist.

The overall RAWIN 3.0 experience must remain:

- minimal
- premium
- technical
- human
- fast
- accessible
- original

Existing completed sections should not be unnecessarily rebuilt to accommodate these additions.

## 31. Writing Rule

Do not use the em dash character anywhere in RAWIN 3.0 UI copy, documentation, comments, generated content, or agent-created text.

Use commas, periods, parentheses, colons, semicolons, or separate sentences instead.

This rule applies to:

- website copy
- UI text
- headings
- buttons
- documentation
- comments
- blog content
- generated content
- agent responses when writing project content

Never introduce the em dash character into the project.

## 32. Project Architecture Rule

RAWIN 3.0 is currently implemented using:

- Next.js 15
- App Router
- React
- TypeScript
- Tailwind CSS v4

The project root is:

`D:\Rawin2.0 OG\Rawin3.0`

The parent directory:

`D:\Rawin2.0 OG`

contains the old RAWIN 2.0 website and is reference-only.

Agents may inspect RAWIN 2.0 when explicitly needed to preserve or reimplement existing functionality, but must not modify its files.

Do not create another project directory such as:

- `rawin3`
- `Rawin3`
- `Rawin3.0`
- `rawin3.0`
- or any other duplicate project folder

All RAWIN 3.0 development must remain inside the existing project root.

## 33. Existing Implementation Preservation Rule

RAWIN 3.0 contains completed visual and interactive systems.

Before modifying an existing feature:

1. Inspect the current implementation.
2. Understand how it works.
3. Preserve working behavior.
4. Make the smallest appropriate change.
5. Test the result.
6. Do not replace a working system with a new library or architecture without a clear reason.

Important existing systems include:

- Hero particle/dust field
- Hero name particle burst
- Cursor interaction
- Torch/spotlight
- Smooth scrolling
- Page transitions
- Hero role typing
- Laptop showcase
- Responsive navigation
- Featured projects
- Tech Arsenal
- Experience section
- CTA
- Contact forms
- EmailJS/Formspree integration
- AI assistant
- Branding assets
- Accessibility behavior
- Reduced-motion behavior

The goal is to evolve RAWIN 3.0, not repeatedly rebuild completed work.

## 34. Agent Collaboration Rule

Multiple coding agents may work on RAWIN 3.0.

Agents include, but are not limited to:

- Antigravity
- OpenCode
- Kilo Code
- MiniMax
- Claude-based agents
- other compatible coding agents

All agents must:

1. Treat the current project directory as the only RAWIN 3.0 workspace.
2. Read `DESIGN.md` before significant UI work.
3. Read the relevant project instructions before coding.
4. Inspect existing implementation before changing it.
5. Preserve existing working functionality.
6. Avoid duplicate components and duplicate systems.
7. Avoid creating additional project folders.
8. Avoid unnecessary dependencies.
9. Follow the same design tokens and interaction principles.
10. Never modify RAWIN 2.0 unless explicitly asked to inspect it, and never modify it as part of normal RAWIN 3.0 development.

Consistency across agents is required.

## 35. Final Design Principle

RAWIN 3.0 should feel like a carefully crafted personal digital product rather than a collection of effects.

Every visual decision should serve one or more of:

- identity
- hierarchy
- storytelling
- usability
- interaction
- credibility
- performance

If an effect looks impressive but does not improve the experience, it should not be added.

RAWIN should remain:

**Minimal. Premium. Technical. Human. Fast. Accessible. Original.**

## 36. Human-First Copy Standard

ALL visible text across RAWIN 3.0 must feel human-written. The website must sound and feel like a real human built it, not like an AI-generated product demo or generic SaaS template.

This standard is permanent and applies to:
- public website pages
- navigation
- hero sections
- section headings
- subtitles
- descriptions
- buttons
- labels
- badges
- cards
- project descriptions
- blog copy
- resume copy
- contact page
- AI page
- footer
- admin dashboard
- admin forms
- CMS labels
- helper text
- status messages
- empty states
- confirmation messages
- error messages

### 1. Fundamental Principle: Say the Thing Itself
Prefer direct language over explanatory language. Prefer saying the thing itself instead of explaining what the thing does.
- GOOD: "Projects"
- BAD: "Manage your portfolio projects and showcase your latest work."
- GOOD: "Project Identity"
- BAD: "Update the project's core identity, metadata, and public-facing information."
- GOOD: "Experience"
- BAD: "Explore my professional journey and the experience that shaped my engineering career."
- GOOD: "Get in Touch"
- BAD: "A centralized space to connect and discuss potential opportunities."
- GOOD: "Technical Skills"
- BAD: "A carefully curated collection of technologies and tools I use to build modern digital experiences."

The writing should feel like a person chose every word.

### 2. No AI-Slop Subheadings
Do NOT automatically add a descriptive sentence underneath every heading. A heading does not need an explanation.
Avoid patterns like:
- HEADING + "Manage..."
- HEADING + "Control..."
- HEADING + "Explore..."
- HEADING + "Discover..."
- HEADING + "Designed to..."
- HEADING + "Built to..."
- HEADING + "This section..."
- HEADING + "This space..."

If the heading is already clear, stop there. Empty space is better than filler copy.

### 3. No "AI Demo Website" Language
Avoid generic filler phrases and buzzwords such as:
- "Designed to showcase..."
- "Built to provide..."
- "A comprehensive overview..."
- "An immersive experience..."
- "A centralized hub..."
- "This section highlights..."
- "This space allows visitors to..."
- "Engineered to demonstrate..."
- "Explore my journey..."
- "A glimpse into..."
- "Where creativity meets technology..."
- "Seamless", "powerful", "modern digital experiences", "next-generation", "cutting-edge", "transformative", "unlock", "elevate", "comprehensive", "streamlined", "robust", "scalable solutions", "end-to-end", "purpose-built".

If a sentence sounds like it could have been generated for a random developer portfolio, rewrite it or delete it.

### 4. Do Not Explain Obvious UI
The user already knows what their own interface does. Do not explain obvious functionality.
- PROJECTS: Remove "Manage portfolio projects, ordering, featured status, descriptions..."
- BLOG: Remove "Create and manage articles, drafts, tags..."
- SETTINGS: Remove "Manage administrator security, session configuration..."
The card title and actual controls are enough. Keep only information that is operationally useful.

### 5. Helper Text Allowed Only When Useful
Helper text should exist only when it communicates something the user genuinely needs to know.
- GOOD: "Maximum 10 MB. PDF only."
- GOOD: "Lower numbers appear first."
- GOOD: "Leave empty to hide this channel."
- GOOD: "Asia/Kolkata timezone."
- BAD: "Use this field to control your..."
- BAD: "This section allows you to..."
- BAD: "Here you can manage..."
- BAD: "These values are used throughout..."
Do not remove useful validation messages, upload limits, or technical constraints.

### 6. Admin Panel Writing Style
The admin panel must feel like a private developer control panel built by an engineer for himself.
- It should be concise, technical, quiet, functional, purposeful, and human.
- It should NOT feel like a SaaS product, a marketing dashboard, a tutorial, or a sales demo.
- Do not explain the interface to its owner.

### 7. Public Website Writing Style
Public copy can be more expressive than Admin copy, but it must still sound natural and personal.
- Headings should be confident and simple.
- Descriptions should say something meaningful instead of filling visual space.
- Do not add paragraphs simply because a design template normally has a paragraph underneath a heading.
- If a section works better with Heading + one strong sentence, use that.
- If a section works better with Heading + nothing, use nothing.

### 8. Humanity Over "Perfect" Marketing Copy
Do not optimize every sentence to sound like polished marketing copy. Real human writing can be short, direct, slightly conversational, specific, and personal. RAWIN is a personal engineering portfolio, not a software startup landing page.

### 9. No Invented Claims
Never invent:
- metrics (e.g. "99+ Lighthouse", "sub-200ms latency", "60 FPS UI transitions")
- client numbers or user counts
- years of experience
- job titles or companies
- achievements, awards, or revenue numbers
Specific and truthful is better than impressive and fake.

### 10. Rules for Future Agents
Before adding any visible text across RAWIN 3.0, every future agent must ask:
1. Does the user actually need this sentence?
2. Is it communicating useful information?
3. Does the heading already make the meaning obvious?
4. Would a real developer actually write this?
5. Does this sound like AI-generated SaaS/demo copy?
6. Am I adding this sentence only because the layout feels empty?
If the answer to #6 is yes: DO NOT ADD THE SENTENCE. Use spacing and layout instead.

### 11. Zero Em Dash Constraint
NEVER use the em dash character anywhere in UI copy, comments, documentation, DESIGN.md, or generated content. Use commas, periods, colons, parentheses, or a normal hyphen where appropriate. Avoid the en dash character where practical.

## 37. Resume CMS & PDF Lifecycle Specification

1. **Singleton Storage**: All Resume CMS data resides inside the singleton `site_content` collection under `key: "main"`, property `resume`. No secondary databases or collections.
2. **Working Status Semantic Indicator**: The status indicator must be one of:
   - `green` (Available for hire)
   - `orange` (Currently working on a project)
   - `cyan` (Open to select opportunities)
   - `gray` (Not currently available)
   Arbitrary CSS colors are prohibited. Pulsing and blinking animations are prohibited. The dot must be subtle and clean.
3. **Downloadable PDF via GridFS**:
   - PDFs are stored in the GridFS `site_assets` bucket with metadata `{ assetType: "resumePdf", purpose: "downloadable-resume" }`.
   - Never store PDFs as Base64 strings in MongoDB or static files on the server.
   - Max file size: 10MB.
   - Magic byte verification: Server-side validation inspects the initial 5 bytes `%PDF-` to prevent arbitrary file spoofing.
   - Public access: Served exclusively via `/api/resume/download` which streams the active file with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="Rushan-Siddiqui-Resume.pdf"`.
   - Safe replacement: When replacing, the new PDF is uploaded and reference committed before deleting the prior GridFS file.
   - Removal: Requires confirmation, removes the GridFS file, clears `site_content.resume.pdf`, and immediately hides the public download button.

## 38. Timezone & Date Standard (Asia/Kolkata)

1. **Standard Timezone**: All administrative and editorial blog dates default to `Asia/Kolkata` (IST, UTC+05:30).
2. **New Article Creation**: When opening the authoring interface for a new article, the `publishedAt` field automatically defaults to the current instant in Asia/Kolkata format (`YYYY-MM-DDTHH:mm`).
3. **Editing Existing Articles**: Never overwrite an existing article's stored date/time with the current timestamp. Preserve the stored date/time, format in `Asia/Kolkata` for editing, and only update upon user intent.
4. **Input Parsing**: Because browsers submit `datetime-local` values as naive strings without offset, server actions parse via `parseKolkataDateTimeInput` which appends `+05:30` before converting to UTC ISO strings. This eliminates unexpected server locale shifts.
5. **Display**: All public feeds and article pages format published dates with `{ timeZone: "Asia/Kolkata" }`.

## 39. RAWIN ORBIT Architecture & Identity Standard

1. **Official Product Identity**:
   - Official product name: **RAWIN ORBIT**
   - Short name: **ORBIT**
   - Prohibited terminology: Never use "AURA", "Aura", "AURA Cognitive Assistant", "Cognitive Assistant", "RAWIN AI Assistant", or "AI Cognitive Assistant" in user-facing UI or generated copy.
   - Do not add "Cognitive Assistant" as a descriptor anywhere.
2. **Founder Semantics & Entity Hierarchy**:
   - **Rushan Siddiqui**: Founder and software developer behind RAWIN and Rawin Orbit.
   - **RAWIN 3.0**: Personal portfolio, digital platform, and engineering showcase.
   - **RAWIN ORBIT**: AI assistant created by Rushan Siddiqui for RAWIN.
   - Rushan Siddiqui is Orbit's founder. "Is Rushan your founder?" must clearly answer affirmative ("Yes. Rushan Siddiqui is my founder and the person behind RAWIN.").
   - Orbit is an AI system within RAWIN, not human and not Rushan. Orbit never claims Rushan's personal life experiences as its own.
3. **Dedicated Application Experience**:
   - The `/ai` route is a dedicated, full-screen application interface.
   - The standard RAWIN Navbar and Footer must NOT appear on `/ai`.
   - Top-left navigation features a minimal, elegant, accessible `← Back to Home` link that routes back to `/`.
4. **Signature Orbital Generation Animation**:
   - The signature visual language of Orbit uses orbital motion rather than a generic spinner or typing indicator.
   - A central geometric Orbit mark is surrounded by orbiting particles (3 to 4 particles) during generating and streaming states.
   - Settles smoothly upon completion and halts cleanly on error.
   - Full accessibility support for `prefers-reduced-motion`: continuous orbital animation is disabled and replaced by static orbital points with subtle state transitions.
5. **Atmospheric Orbital Aesthetics**:
   - Subtle concentric orbital rings, low-opacity technical geometry, and faint radial glow in the background.
   - Dark, atmospheric, futuristic but restrained, minimal, and premium.
6. **Contextual Continuity & Follow-ups**:
   - Orbit maintains conversational context across turns.
   - Pronouns ("it", "he", "they") and contextual requests ("tell me more", "which project uses it?") resolve accurately from prior messages.
7. **Brevity & Tone**:
   - Simple or general technical questions receive direct 1 to 2 sentence answers.
   - Tone is calm, technical, human, direct, and helpful with zero fake enthusiasm, corporate filler, or repetitive summaries.
8. **Message Bounds & Security**:
   - Single message limit is 4,000 characters across client and server.
   - Total conversation history capped at 10 turns and 16,000 characters.
   - Maximum output tokens bounded at 1,024.
   - Sliding-window rate limiting (20 requests per minute per IP).
   - All Cloudflare credentials remain strictly server-side.
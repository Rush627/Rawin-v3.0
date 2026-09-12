# RAWIN 3.0 Project Instructions

## Project

RAWIN 3.0 is the new production website.

Technology stack:
- Next.js 15
- App Router
- React
- TypeScript
- Tailwind CSS v4

The current directory is the RAWIN 3.0 project root.

## Required Skills

Always use these project skills when relevant:

- `tailwind-4-docs`
- `web-design-guidelines`

Do NOT use the `astro` skill for this project.

## Design System

Always read and follow:

- `DESIGN.md`

`DESIGN.md` is the single source of truth for the RAWIN 3.0 visual design system.

Do not introduce UI, colors, typography, spacing, animations, components, or design patterns that conflict with `DESIGN.md`.

Do not override the design system unless explicitly instructed by the user.

## Content Writing & Tone

All written content across RAWIN 3.0 must strictly follow Section 36 ("Content Writing Principles") in `DESIGN.md`:

- Read like it was written directly by the developer, not generated as explanatory marketing copy.
- Never explain obvious section purposes in headings or subtitles (e.g. avoid subtitles under "Currently Exploring" or "Development Stack").
- Never invent metrics, years of experience, achievements, clients, or performance results.
- Avoid generic adjectives and corporate buzzwords ("innovative", "cutting-edge", "leveraging", "robust", "ultra-fast").
- Keep copy direct, concise, and authentic with natural developer personality.
- Strict constraint: Never use em dashes (neither unicode em dash nor en dash) anywhere in copy or code.

## Project Rules

Before making significant UI or architecture changes:

1. Inspect the existing implementation first.
2. Follow the established project patterns.
3. Preserve existing working functionality.
4. Do not rewrite working components unnecessarily.
5. Prefer performance, accessibility, responsive behavior, clean code, and minimal dependencies.
6. Keep client-side JavaScript to what is actually necessary.
7. Prefer GPU-friendly animation techniques and avoid unnecessary expensive effects.
8. Test important changes before considering them complete.

## RAWIN 2.0 Reference

The parent directory contains the old RAWIN 2.0 website:

`D:\Rawin2.0 OG`

RAWIN 2.0 is reference-only.

You may inspect RAWIN 2.0 when the user asks to preserve, study, or reimplement existing functionality or design behavior from it.

Do NOT modify RAWIN 2.0 files.

## RAWIN 3.0 Root

The actual RAWIN 3.0 project is:

`D:\Rawin2.0 OG\Rawin3.0`

All coding, editing, installation, and project changes must happen inside this project.

Do NOT create another `rawin3`, `Rawin3.0`, or similar project folder.

## Existing Functionality

When modifying the site, preserve existing working functionality unless the user explicitly asks for a change.

Important existing areas include:

- Hero particle/dust interaction
- Cursor interactions
- Torch/spotlight effect
- Smooth scrolling
- Page transitions
- Responsive behavior
- Project case studies
- Tech Arsenal
- Contact form integrations
- AI assistant
- Existing branding assets
- Accessibility and reduced-motion behavior

Before changing any of these, inspect their current implementation.

## Branding

Use the existing RAWIN 3.0 assets from:

`public/images/`

Do not recreate the logo as text when the actual asset should be used.

Do not distort, recolor, crop, or add effects to the official branding assets unless explicitly instructed.

## Design Priority

When making implementation decisions, prioritize:

1. User requirements
2. `DESIGN.md`
3. Existing working RAWIN 3.0 implementation
4. Performance and accessibility
5. Clean maintainable code

Do not introduce unnecessary libraries or architectural changes.

## Completion Standard

Do not claim a task is complete until:

- The implementation is actually present.
- Existing functionality still works.
- Responsive behavior has been considered.
- Accessibility has been considered.
- The project builds successfully when applicable.
- No unnecessary files or duplicate project folders were created.
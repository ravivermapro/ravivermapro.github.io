# Ravi Verma · Portfolio Website

Modern, high-performance portfolio built to replicate the **Nuria Framer Template** design system, typography, physics-based animations, and 3D illustrations, populated with Ravi Verma's personal case studies and content from `courteous-collection-451942.framer.app`.

## Features
- **Design System & Typography**: Replicates Nuria's luxury dark aesthetic with `Instrument Serif` (italic accents), `Fragment Mono` (tags, metrics & counters), and `Inter` (geometric sans-serif).
- **Physics-based Floating 3D Stickers (`HoverBumpImage`)**: 4 floating 3D stickers surrounding the hero title with ambient harmonic floating, velocity-aware cursor bump reactivity, spring-mass damping (`stiffness: 120, damping: 22`), and tactile click-pop animations.
- **Behind the Canvas 3D Polaroid Gallery**: Interactive perspective tilt and hover dynamics showcasing aesthetic moments and design workspace photography.
- **Interactive Project Portfolio**: Filterable case studies with category tags (`Enterprise SaaS`, `Mobile Apps`, `EdTech`), image zoom transitions, and diagonal arrow indicator shifts.
- **Dedicated Case Study Pages**:
  - `myMschool` (EdTech • ERP Platform)
  - `Simply Admission` (SaaS • CRM Dashboard)
  - `Cangurhu` (Food Delivery • Mobile App)
  - `Cafe 19` (Food & Beverage • Mobile App)
- **One-Click Email Copy Pill**: Direct clipboard copy for `hello@raviverma.pro` with tooltip notification and checkmark transformation.
- **Interactive Forms & Accordions**: Clean Shoot-a-Request form with validation feedback and expandable FAQs accordion.

## Local Preview
To preview locally, you can start a lightweight local server:

```bash
# Using Ruby (built-in on macOS):
ruby -run -e httpd . -p 8000

# Open in browser:
http://localhost:8000
```

## GitHub Pages Deployment
This repository is configured as a static site ready for direct deployment to GitHub Pages (`ravivermapro.github.io`). Push the repository to the `main` or `gh-pages` branch, and enable GitHub Pages in your repository settings.

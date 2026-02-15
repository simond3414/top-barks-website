# Top Barks Dog Training Website

[![Deploy Status](https://img.shields.io/badge/Cloudflare%20Pages-Deployed-success)](https://topbarks.snapshothistory.xyz)
[![Astro](https://img.shields.io/badge/Astro-5.0-blueviolet)](https://astro.build)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)

A modern, fast, and accessible website for Top Barks Dog Training - migrated from Wix to Astro.js.

**Live Site:** [https://topbarks.snapshothistory.xyz](https://topbarks.snapshothistory.xyz)

---

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **pnpm** (pnpm recommended)

### Local Development

```bash
# Navigate to the website directory
cd website

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

The dev server runs at `http://localhost:4321`

---

## Deployment

### Automatic Deployment (Git-Based)

This site is deployed on **Cloudflare Pages** with automatic deployments:

1. **Every push to `main` branch** → Auto-deploys to production
2. **Pull requests** → Get preview URLs for testing
3. **Merge PR to `main`** → Auto-deploys to production

### How to Update the Website

**From the website directory:**

```bash
# Make your changes to files
# Edit pages in src/pages/
# Edit components in src/components/
# Edit styles in src/assets/styles/

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Description of changes"

# Push to trigger deployment
git push origin main
```

**Wait 1-2 minutes** for Cloudflare to build and deploy.

**Note:** Always work from `/home/simond3414/projects/top_barks/website/` directory where the `.git` repository is located.

### Skip a Build

Add `[Skip CI]` to your commit message:

```bash
git commit -m "[Skip CI] Update README only"
```

---

## Project Structure

```
website/
├── src/
│   ├── components/          # Reusable Astro components
│   │   ├── sections/        # Page sections (Hero, Features, etc.)
│   │   │   └── navbar&footer/   # Navbar & Footer components
│   │   └── ui/              # UI primitives (buttons, cards)
│   ├── layouts/             # Layout templates
│   │   └── MainLayout.astro # Main page wrapper
│   ├── pages/               # File-based routing
│   │   ├── index.astro      # Homepage
│   │   ├── about.astro      # About page
│   │   ├── contact.astro    # Contact form
│   │   ├── reviews.astro    # Reviews/testimonials
│   │   ├── services.astro   # Services overview
│   │   ├── services/        # Individual service pages
│   │   │   ├── dog-training.astro
│   │   │   ├── puppy-training.astro
│   │   │   ├── gundog-training.astro
│   │   │   ├── training-walks.astro
│   │   │   ├── behaviour-problems.astro
│   │   │   └── show-training.astro
│   │   └── api/             # API routes (contact form)
│   │       └── contact.ts
│   ├── content/             # Content collections
│   ├── content.config.ts    # Collection schemas (Zod)
│   ├── data_files/          # Site data & constants
│   │   ├── constants.ts     # Site metadata, SEO, OG tags
│   │   ├── navigation.ts    # Navigation links
│   │   ├── faqs.json        # FAQ content
│   │   └── features.json    # Homepage features
│   ├── utils/               # Helper functions
│   ├── images/              # Processable images (optimized by Astro)
│   └── assets/
│       ├── scripts/         # JavaScript utilities
│       └── styles/          # Global CSS, Tailwind theme
├── public/                  # Static files (copied as-is)
│   └── images/              # Static images & logos
├── dist/                    # Build output (auto-generated)
├── astro.config.mjs         # Astro configuration
├── tsconfig.json            # TypeScript config (path aliases)
├── .prettierrc              # Prettier formatting config
└── package.json             # Dependencies
```

---

## Tech Stack

- **[Astro 5](https://astro.build)** - Static site generator
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS
- **[Preline UI](https://preline.co)** - Interactive components (to be migrated)
- **[TypeScript](https://typescriptlang.org)** - Type safety
- **[Zod](https://zod.dev)** - Schema validation for content
- **[Cloudflare Pages](https://pages.cloudflare.com)** - Hosting & CDN

---

## Code Style & Conventions

### Path Aliases (REQUIRED)

**Always use path aliases** - never relative paths like `../`:

| Alias | Maps to | Usage |
|-------|---------|-------|
| `@/*` | `src/*` | General imports |
| `@components/*` | `src/components/*` | Components |
| `@data/*` | `src/data_files/*` | Constants |
| `@images/*` | `src/images/*` | Images |
| `@styles/*` | `src/assets/styles/*` | CSS |
| `@utils/*` | `src/utils/*` | Helpers |
| `@content/*` | `src/content/*` | Content |

**Good:**
```typescript
import { SITE } from "@data/constants";
import HeroSection from "@components/sections/landing/HeroSection.astro";
```

**Bad:**
```typescript
import { SITE } from "../../data_files/constants";  // NEVER DO THIS
```

### Component Structure

```astro
---
// 1. Imports
import MainLayout from "@/layouts/MainLayout.astro";
import { SITE } from "@data/constants";

// 2. Props interface
interface Props {
  title: string;
  subTitle?: string;
}

// 3. Destructure with defaults
const { title, subTitle = "" } = Astro.props;
---

<!-- 4. Template -->
<section>
  <h1>{title}</h1>
  {subTitle && <p>{subTitle}</p>}
</section>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HeroSection.astro`, `CardBlog.astro` |
| Utilities | camelCase | `navigation.ts`, `utils.ts` |
| Constants | SCREAMING_SNAKE_CASE | `SITE`, `SEO`, `OG` |
| CSS classes | kebab-case | `scrollbar-hide`, `lenis-smooth` |

### Formatting

Use Prettier with the project's config:

```bash
npx prettier --write "src/**/*.{ts,astro,css}"
```

---

## Content Management

### Adding/Editing Pages

1. Create `.astro` file in `src/pages/`
2. Use `MainLayout` wrapper
3. Import sections from `@components/sections/`

Example:
```astro
---
import MainLayout from "@/layouts/MainLayout.astro";
import HeroSection from "@components/sections/landing/HeroSection.astro";
---

<MainLayout title="Page Title">
  <HeroSection />
  <!-- Your content here -->
</MainLayout>
```

### Content Collections

Content uses Zod schemas in `src/content.config.ts`:

```typescript
const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    pubDate: z.date(),
  }),
});
```

### Images

- **Processable images** (optimized): Put in `src/images/`
- **Static images** (as-is): Put in `public/images/`

Always use path aliases:
```astro
---
import heroImage from "@images/front_pic.png";
---
<img src={heroImage.src} alt="Hero" />
```

---

## shadcn/ui Migration Roadmap

### Overview

Currently using **Preline UI** for interactive components (modals, dropdowns, accordions). Plan is to gradually migrate to **shadcn/ui** components for better customization and modern design patterns.

### Migration Strategy

**Phase 1: Setup (Preparation)**
- [ ] Initialize shadcn/ui in the project
- [ ] Install required dependencies (Radix UI primitives)
- [ ] Configure Tailwind theme integration
- [ ] Set up components directory structure

**Phase 2: Component-by-Component Migration**

Priority order (migrate one at a time):

1. **Button Component** (Foundation)
   - Replace Preline buttons with shadcn Button
   - Update all CTA sections
   - Affects: Homepage, Services pages

2. **Card Components** (High Impact)
   - Service cards, feature cards
   - Testimonial cards
   - Affects: Homepage, Services, Reviews

3. **Form Components** (Critical)
   - Input, Textarea, Label
   - Contact form migration
   - Affects: Contact page

4. **Navigation Components**
   - NavigationMenu for mega menu
   - DropdownMenu for mobile nav
   - Affects: Navbar, Footer

5. **Accordion Components**
   - FAQ sections
   - Affects: Homepage FAQ, Services pages

6. **Dialog/Modal Components**
   - Any modal interactions
   - Affects: Future enhancements

### How to Add shadcn/ui Components

**Step 1: Install shadcn/ui CLI**

```bash
# Initialize shadcn/ui (run once)
npx shadcn@latest init
```

**Step 2: Add Components**

```bash
# Add a specific component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add card input label

# Add all components (not recommended - bloated)
npx shadcn@latest add --all
```

**Step 3: Replace Preline Components**

Find and replace Preline classes/patterns with shadcn components:

```astro
<!-- Before (Preline) -->
<button class="hs-button-primary px-4 py-2">
  Click me
</button>

<!-- After (shadcn) -->
<Button variant="default">
  Click me
</Button>
```

### Migration Checklist

When migrating a component:
- [ ] Install shadcn component: `npx shadcn@latest add [component]`
- [ ] Update imports in affected files
- [ ] Replace Preline HTML/classes with shadcn component
- [ ] Ensure dark mode compatibility
- [ ] Test responsive behavior
- [ ] Update AGENTS.md if needed
- [ ] Commit changes: `git add . && git commit -m "Migrated [component] to shadcn/ui"`

### Current Preline Components to Replace

List of files using Preline that need migration:

- `src/components/sections/navbar&footer/Navbar.astro` - Uses `hs-collapse`, `hs-dark-mode`
- `src/components/sections/navbar&footer/NavbarMegaMenu.astro` - Uses `hs-dropdown`
- `src/pages/index.astro` - Uses `hs-accordion` for FAQ
- `src/components/BrandLogo.astro` - May need updates

### Notes

- **shadcn/ui components are copy-paste**: They're installed into your `src/components/ui/` folder
- **Customize freely**: Unlike Preline, you own the code
- **Install only what you need**: Keeps bundle size small
- **Works with Tailwind v4**: Compatible with current setup
- **TypeScript ready**: Full TypeScript support

---

## Environment Variables

Create `.env` file in `website/` root if needed:

```env
# Email service (for contact form - currently inactive)
# RESEND_API_KEY=your_key_here
# SMTP_HOST=smtp.example.com
# SMTP_USER=user@example.com
# SMTP_PASS=password
```

**Note:** Contact form is currently inactive. Add API keys when ready to enable email sending.

---

## Troubleshooting

### Build fails

```bash
# Clear cache and rebuild
rm -rf dist node_modules .astro
npm install
npm run build
```

### Images not showing

- Check file is in `src/images/` (for optimization) or `public/images/` (static)
- Verify image extensions are lowercase (`.jpg` not `.JPG`)
- Check `src/env.d.ts` has proper type declarations

### Git issues

```bash
# Check you're in the right directory
pwd  # Should end in /website

# Check git status
git status

# Check remote URL
git remote -v  # Should be github.com/simond3414/top-barks-website
```

### Deployment not triggering

1. Check commit was pushed to `main`: `git log origin/main`
2. Check Cloudflare dashboard build logs
3. Ensure no `[Skip CI]` in commit message

---

## Future Enhancements

- [ ] Enable contact form email functionality
- [ ] Add Google Reviews widget integration
- [ ] Complete shadcn/ui migration
- [ ] Add blog functionality with content collections
- [ ] Implement search functionality
- [ ] Add analytics (Cloudflare Web Analytics or similar)

---

## Resources

- **Astro Docs**: https://docs.astro.build
- **Tailwind CSS v4**: https://tailwindcss.com/docs/v4-beta
- **shadcn/ui**: https://ui.shadcn.com
- **Preline UI**: https://preline.co (current components)
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/

---

## Support

For issues or questions:
1. Check this README
2. Review AGENTS.md for coding guidelines
3. Consult Astro/shadcn documentation
4. Check Cloudflare Pages build logs in dashboard

---

**Last Updated:** February 2026  
**Maintained by:** simond3414  
**License:** MIT (based on ScrewFast template)

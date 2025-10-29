# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
pnpm dev           # Start development server on port 3000
pnpm build         # Build for production
pnpm serve         # Preview production build
pnpm test          # Run tests with Vitest
pnpm format        # Format code with Biome
pnpm lint          # Lint code with Biome
pnpm check         # Run Biome check (format + lint + imports)
```

## Project Architecture

This is a **TanStack Start** application (v1.132.0) - a full-stack React framework that combines TanStack Router, TanStack Query, and SSR capabilities.

### Tech Stack
- **TanStack Router** (v1.132.0) - File-based routing with SSR support
- **TanStack React Query** (v5.66.5) - Server state management and caching
- **TanStack React Router SSR Query** (v1.131.7) - Integration between router and query
- **React** (v19.2.0) - UI library
- **Vite** (v7.1.7) - Build tool and dev server
- **Tailwind CSS** (v4.0.6) - Styling
- **Biome** (v2.2.4) - Linting and formatting
- **Vitest** (v3.0.5) - Testing framework
- **JSDOM** (v27.0.0) - HTML parsing for server-side data fetching

### Directory Structure

```
src/
├── routes/                    # File-based routes (auto-generated router)
│   ├── __root.tsx            # Root layout with devtools and query provider
│   ├── index.tsx             # Home page
│   ├── douban/               # Douban scraping feature
│   │   ├── list.tsx          # List page with router loader
│   │   ├── detail.$id.tsx    # Dynamic detail route with React Query
│   │   └── api.list.ts       # Server endpoint for scraping Douban
├── components/
│   └── Header.tsx            # App header with navigation drawer
├── integrations/
│   └── tanstack-query/       # Query client configuration
│       ├── root-provider.tsx # QueryClient setup
│       └── devtools.tsx      # Devtools integration
├── router.tsx                # Router factory with SSR integration
└── routeTree.gen.ts          # Auto-generated route tree
```

### Data Fetching Patterns

**Two data fetching approaches are used:**

1. **Router Loaders** (`/douban/list.tsx:5-7`) - Fetch data before route renders
   ```tsx
   loader: () => fetch("/douban/api/list").then(res => res.json())
   const data = Route.useLoaderData()
   ```

2. **React Query** (`/douban/detail.$id.tsx:24-29`) - Client-side fetching with caching
   ```tsx
   useQuery({ queryKey: [...], queryFn: () => fetch(...).then(res => res.json()) })
   ```

### Server-Side Features

The `/douban/api/list.ts` endpoint provides server-side HTML scraping:
- Fetches and parses Douban posts from `new.xianbao.fun`
- Uses JSDOM to parse HTML and extract post data
- Supports query parameter `?url` for custom sources (must match allowed hosts)
- Returns structured data with metadata

### DevTools Integration

The app includes comprehensive debugging tools:
- `TanStackDevtools` in `src/routes/__root.tsx:55-66` - Combined devtools panel
- `TanStackRouterDevtoolsPanel` - Router debugging
- `TanStackQueryDevtools` - Query caching and mutations inspection

### Styling Approach

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Custom gradients and dark themes in detail page
- Responsive design with mobile-first approach
- Utility classes for all styling (no custom CSS files)

### Code Quality

- **Biome configuration** (biome.json): Tab indentation, double quotes, recommended lint rules
- TypeScript strict mode enabled
- Route tree auto-generation via `@tanstack/router-plugin`
- No test files currently exist in the repository

## Important Notes

- Route files in `src/routes/` use `$` for dynamic params (e.g., `detail.$id.tsx`)
- Server handlers in route files (`.server.ts` extension) enable SSR data fetching
- The `routeTree.gen.ts` file is auto-generated - do not edit manually
- ALLOWED_HOSTS in `api.list.ts` controls which URLs can be scraped

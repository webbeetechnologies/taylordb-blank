# OpenCode Agent Instructions for TaylorDB Blank Template

This document provides instructions for AI agents on how to use this blank template to build custom UIs for TaylorDB.

## Understanding the TaylorDB Blank Template

This is a blank template designed for building custom user interfaces on top of a TaylorDB database. TaylorDB is a no-code application that allows users to build applications using a table-based data visualization.

The purpose of this template is to overcome the limitations of table-only views by enabling the creation of custom components, forms, and other UI elements. The goal is to have an AI agent (like you) build and integrate a custom UI with a user's TaylorDB database automatically.

## AI Development Workflow

Your primary task is to build a custom UI that interacts with the user's TaylorDB data. Follow these steps carefully:

### 1. Understand the Database Schema

Upon initialization, this template includes a `/src/lib` directory containing two critical files:

-   `taylordb.client.ts`: This file contains the pre-configured TaylorDB client query builder instance. You will use this client to interact with the database.
-   `taylordb.types.ts`: This file contains the TypeScript types generated from the user's TaylorDB database schema.

**Your first action must be to read both of these files.** This will give you a complete understanding of the database structure, tables, and data types you will be working with.

> Note: If `src/lib/taylordb.client.ts` or `src/lib/taylordb.types.ts` are missing in the repo, pause and ask the user to provide/regenerate them. Do not proceed with mock data.

### 2. Integrate Directly with TaylorDB

You must use the provided TaylorDB client for all data operations. **Do not use mock data under any circumstances.** The UI you build should be fully functional and connected to the live database from the start.

### 3. Type Checking and Validation

The TaylorDB query builder is strongly typed. While writing code, you may encounter TypeScript errors related to your queries. To ensure your queries and data manipulations are type-safe and correct, you must run the build command:

```bash
pnpm build
```

This command will compile the TypeScript code and report any type errors. You should use this to validate your work.

### 4. Development Server

The development server is already running. You do not need to start it. Focus on building the UI components and integrating them with the database.

---

## Build, Lint, and Test Commands
- **Start development**: `pnpm dev` or `npm run dev`
- **Build for production**: `pnpm build`
- **Lint all files**: `pnpm lint`
- **Tests**: _No test framework/config found; add [Vitest](https://vitest.dev) or [Jest](https://jestjs.io) before writing tests._
- **Run a single test**: _Not configured until you add a test runner._

## Code Style Guidelines
- Strictly type everything in TypeScript. **Never use `any`.**
- Use [ESLint](https://eslint.org/) with recommended JS, TypeScript, and React Hooks rules. Fix all lint errors.
- Use ES modules for imports (`import ... from ...`). Group external first, then internal.
- Naming: camelCase for variables/functions, PascalCase for components/types, UPPER_CASE for constants.
- Components: use function components, arrow function style preferred.
- Handle errors explicitly. **Never ignore TypeScript or lint errors.**
- Formatting: 2-space indent, single quotes, semicolons required.
- Remove unused code/comments. Comments must be concise and relevant.
- Use TaylorDB query builder with generated types from `../src/lib/taylordb.types.ts`; **never modify generated schema files.**
- shadcn/ui is initialized with common components (button, card, input, label, textarea, select, tabs, alert). Add more via `pnpm dlx shadcn@latest add <component>`; files go in `../src/components/ui/`.
- Prefer shadcn/ui components and Tailwind tokens for UI. Only hand-roll a component if shadcn does not offer an equivalent; follow shadcn structure (component in `../src/components/ui/`, styling via Tailwind classes, `cn` helper, and theme tokens defined in `../src/index.css`).

_No Cursor or Copilot rules found. If added, include their guidelines here._

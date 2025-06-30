# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要提示

**所有对话必须使用中文进行**。这是一个中文项目，所有交流、说明、注释都应该使用中文。

## Project Overview

This is a Reserve Project Management System (储备项目管理系统) built with Next.js 15.2.4 using the App Router pattern. The application is designed for the Electric Testing Institute (电试院) to manage project workflows, approvals, and monthly reviews.

## Essential Commands

```bash
# Development
npm run dev              # Start development server with NEXT_DISABLE_SWC_WASM=1 prefix if SWC issues occur

# Production Building
npm run build            # Standard Next.js build
npm run build:linux     # Linux build (optimized for 2GB RAM servers)
npm run build:win       # Windows build with PowerShell script
npm run start            # Start production server

# Code Quality
npm run lint             # Run Next.js linting
```

## High-Level Architecture

### Application Structure
The system follows a role-based access model with four user roles:
- 中心专职 (Center Specialist)
- 中心领导 (Center Leadership)
- 部门专职 (Department Specialist)  
- 部门领导 (Department Leadership)

### Project Status Flow
Projects move through these statuses:
1. 编制 (Compilation)
2. 评审 (Review)
3. 批复 (Approval)
4. 下达 (Establishment)

### Key Architectural Components

1. **Server Actions** (`app/actions.ts`): All data operations are handled through Next.js Server Actions, providing a clean separation between client and server logic.

2. **User Context** (`contexts/UserContext.tsx`): Manages authentication state and user role information across the application. Required for role-based feature access.

3. **Component Organization**:
   - `components/ui/`: shadcn/ui components (50+ pre-built components)
   - `components/reserve-project-management.tsx`: Main project management interface
   - `components/approval-list.tsx`: Handles approval workflows
   - `app/monthly-reviews/page.tsx`: Monthly review process management

4. **Data Models** (`lib/data.ts`): Contains TypeScript interfaces for Project, Approval, MonthlyReview, and mock data generation.

### Critical Integration Points

1. **Role-Based Access**: Components check `currentUser.role` and `currentUser.department` from UserContext to determine feature visibility.

2. **Status Transitions**: Project status changes trigger specific workflows (e.g., moving to "评审" status enables monthly review creation; moving to "批复" status allows contract binding).

3. **Approval Chain**: Projects require approval from department leadership before center leadership, enforced in the approval logic.

## Development Considerations

### Known Issues
- SWC binary loading issues in shared folders - use `NEXT_DISABLE_SWC_WASM=1` environment variable
- Build ignores ESLint and TypeScript errors (configured in next.config.mjs)

### Deployment Configuration
- **Multi-Platform Support**: Automatic Windows/Linux environment detection in next.config.mjs
- **Memory Optimization**: Special configurations for 2-core 2GB servers with swap management
- **Docker Support**: Multi-stage builds with standalone output for minimal container size
- **Comprehensive Documentation**: Extensive deployment guides in `update2025/README.md` and specialized guides for various deployment scenarios

### UI Framework
- Uses shadcn/ui components with Tailwind CSS
- Components are in `components/ui/` and use CSS variables for theming
- Form handling uses react-hook-form with Zod validation

### Chinese Language Support
The application is designed for Chinese users with all UI text in Simplified Chinese. Maintain this when adding features or modifying existing ones.
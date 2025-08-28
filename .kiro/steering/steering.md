# Development Rules & Guidelines

## Context
I am a solo developer working on personal or small projects.  
This is **not** an enterprise-level project.  
I prefer **simple, direct solutions** over formal "best practices."  
I'm a vibe coder who values **shipping** over perfect architecture.

## Implementation Focus
- Prioritize **working, production-ready code**
- Implement **performance optimizations** by default
- Follow **accessibility best practices**
- Use the established **design system** and component patterns

## Code Quality Standards
- Use naming conventions:
  - `PascalCase` for components
  - `camelCase` for utilities
- Use path aliases:
  - `@/components`, `@/styles`, `@/data`, `@/utils`
- Import design tokens from `@/styles/tokens`
- Implement **responsive design** using established breakpoints
- Include **error handling** and **loading states**
- Add **performance optimizations** (e.g., lazy loading, animation efficiency)

## Avoid Test Generation Unless Requested

### Rule
Do **not** generate or scaffold test files, or test cases unless the user **explicitly requests** tests.

### Rationale
- Focus on building core functionality first
- Avoid cluttering the codebase with unused test scaffolding
- Allow the developer to choose **when and how** to test
- Maintain a clean, production-focused codebase

### When to Generate Tests
- User explicitly mentions:
  - "test", "unit test", "integration test", or similar
- User requests test coverage for a component or feature
- User asks for a testing setup or configuration

### When NOT to Generate Tests
- When creating new components or features
- When refactoring existing code
- When adding new functionality
- During general development tasks **without test context**

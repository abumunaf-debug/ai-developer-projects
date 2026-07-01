# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-06-30

### Added

- Task management: create, complete, delete, filter by status
- Priority levels: low / medium / high with visual badges
- Book search via Open Library API with loading/error/empty states
- Simulated authentication with student and instructor roles
- Role-based navigation and protected routes
- Hash-based client-side router
- Responsive design with accessibility (ARIA, keyboard navigation)
- LocalStorage persistence across page reloads

### Technical

- ES module architecture: services, components, utils, main
- Vite production build with minification and asset fingerprinting
- GitHub Actions CI/CD deploying to GitHub Pages
- Full smoke test checklist
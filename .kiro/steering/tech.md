# Technology Stack

## Architecture

### System Design
- **Architecture Pattern**: Single Page Application (SPA)
- **Deployment Model**: Static site with client-side routing
- **State Management**: React hooks and local component state
- **Data Flow**: Unidirectional data flow with props and callbacks
- **API Integration**: Ready for backend API integration (currently using mock data)

## Frontend

### Core Framework
- **React 18.3.1**: Component-based UI library for building interactive interfaces
- **TypeScript 5.5.3**: Static typing for enhanced code quality and developer experience
- **React Router DOM 7.7.1**: Client-side routing for navigation between pages

### UI & Styling
- **TailwindCSS 3.4.1**: Utility-first CSS framework for rapid UI development
- **Lucide React 0.344.0**: Modern icon library for consistent UI elements
- **PostCSS 8.4.35**: CSS processing tool for Tailwind compilation
- **Autoprefixer 10.4.18**: Automatic vendor prefixing for CSS compatibility

### Build Tools
- **Vite 5.4.2**: Fast build tool and development server with HMR
- **@vitejs/plugin-react 4.3.1**: React support for Vite with Fast Refresh

## Development Environment

### Required Tools
- **Node.js**: Version 18.x or higher recommended
- **npm/yarn/pnpm**: Package manager for dependency management
- **Git**: Version control system

### Code Quality
- **ESLint 9.9.1**: JavaScript/TypeScript linting
- **typescript-eslint 8.3.0**: TypeScript-specific ESLint rules
- **eslint-plugin-react-hooks 5.1.0-rc.0**: React hooks linting rules
- **eslint-plugin-react-refresh 0.4.11**: React refresh linting support

### Development Dependencies
- **@types/react 18.3.5**: TypeScript definitions for React
- **@types/react-dom 18.3.0**: TypeScript definitions for React DOM
- **globals 15.9.0**: Global variable definitions for ESLint

## Common Commands

### Development
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality checks
```

### Package Management
```bash
npm install          # Install all dependencies
npm install [package]  # Add new dependency
npm install -D [package]  # Add new dev dependency
npm update           # Update dependencies to latest compatible versions
```

### Git Operations
```bash
git status           # Check current branch and changes
git add .           # Stage all changes
git commit -m "message"  # Commit staged changes
git push            # Push to remote repository
```

## Environment Variables

### Current Configuration
No environment variables are currently configured in the project. For future API integration, consider:

```env
# Example environment variables (create .env file)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WEBSOCKET_URL=ws://localhost:3000
VITE_AUDIO_SERVICE_URL=http://localhost:3001
```

### Usage in Code
```typescript
// Access environment variables in Vite
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Port Configuration

### Development Server
- **Default Port**: 5173 (Vite development server)
- **Preview Port**: 4173 (Production build preview)

### Future Services (Planned)
- **API Server**: 3000 (Backend REST API)
- **WebSocket Server**: 3000 (Real-time communication)
- **Audio Processing**: 3001 (Voice synthesis/recognition service)

## Browser Support

### Target Browsers
- Modern browsers with ES2020 support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No Internet Explorer support

## Performance Optimization

### Current Optimizations
- **Code Splitting**: Automatic route-based code splitting via React Router
- **Tree Shaking**: Unused code elimination via Vite
- **CSS Purging**: TailwindCSS removes unused styles in production
- **Fast Refresh**: Instant component updates during development

### Build Output
- **Format**: ES modules for modern browsers
- **Minification**: Automatic JavaScript and CSS minification
- **Source Maps**: Generated for debugging in development
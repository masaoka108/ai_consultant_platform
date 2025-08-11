# Project Structure

## Root Directory Organization

```
ai_consultant_platform/
├── .claude/                 # Claude Code configuration and commands
├── .kiro/                   # Kiro spec-driven development
│   ├── steering/            # Project steering documents
│   └── specs/              # Feature specifications
├── docs/                    # Project documentation
│   └── requirements.md      # Business requirements
├── node_modules/            # Dependencies (auto-generated)
├── public/                  # Static assets
│   └── *.png, *.wav        # Consultant avatars and audio files
├── src/                     # Source code
└── Configuration files      # Project configuration
```

## Subdirectory Structures

### Source Directory (`src/`)
```
src/
├── components/              # Reusable React components
│   ├── ConsultantCard.tsx  # Consultant profile card
│   ├── Layout.tsx          # Page layout wrapper
│   ├── TalentCard.tsx      # Talent recommendation card
│   └── VoiceInput.tsx      # Voice input component
├── data/                    # Mock data and constants
│   ├── consultants.ts      # Consultant profiles
│   └── mockData.ts         # Mock responses and data
├── pages/                   # Page components (routes)
│   ├── ConsultantDetailPage.tsx  # Individual consultant view
│   ├── ConsultantsPage.tsx      # Consultant listing
│   ├── HistoryPage.tsx          # Consultation history
│   └── LoginPage.tsx            # Authentication page
├── types/                   # TypeScript type definitions
│   └── index.ts            # Shared interfaces and types
├── App.tsx                  # Main application component
├── main.tsx                # Application entry point
└── vite-env.d.ts           # Vite environment types
```

### Configuration Files (Root)
```
Configuration:
├── eslint.config.js         # ESLint configuration
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # App-specific TypeScript config
├── tsconfig.node.json      # Node-specific TypeScript config
└── vite.config.ts          # Vite build configuration
```

## Code Organization Patterns

### Component Structure
```typescript
// Functional component with TypeScript
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Effects after hooks
  useEffect(() => {}, []);
  
  // Event handlers
  const handleEvent = () => {};
  
  // Render
  return <div>...</div>;
};
```

### Data Organization
- **Mock Data**: Centralized in `src/data/` for easy replacement with API calls
- **Type Definitions**: Shared interfaces in `src/types/index.ts`
- **Constants**: Exported from data files for reusability

### Page Components
- Each page represents a route in the application
- Pages compose smaller components from `src/components/`
- Business logic contained within page components

## File Naming Conventions

### TypeScript/React Files
- **Components**: PascalCase (e.g., `ConsultantCard.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `LoginPage.tsx`)
- **Data files**: camelCase (e.g., `consultants.ts`, `mockData.ts`)
- **Type files**: camelCase (e.g., `index.ts` in types folder)

### Configuration Files
- **JavaScript configs**: camelCase with `.config.js` (e.g., `eslint.config.js`)
- **TypeScript configs**: `tsconfig` prefix (e.g., `tsconfig.app.json`)
- **JSON files**: lowercase with hyphens (e.g., `package.json`)

### Asset Files
- **Images**: snake_case or kebab-case (e.g., `gomita_san_thumbnail.png`)
- **Audio files**: Numbered format (e.g., `001.wav`, `002.wav`)

## Import Organization

### Standard Import Order
```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// 2. Components
import { Layout } from '../components/Layout';
import { TalentCard } from '../components/TalentCard';

// 3. Data and utilities
import { consultants } from '../data/consultants';
import { mockTalents } from '../data/mockData';

// 4. Types
import { Message, Consultant } from '../types';

// 5. Icons and assets
import { Send, User, Bot } from 'lucide-react';

// 6. Styles (if any)
import './styles.css';
```

### Path Aliases
Currently using relative imports. Consider adding path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

## Key Architectural Principles

### Component Design
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use component composition for flexibility
- **Props Interface**: All components have TypeScript interfaces for props
- **Functional Components**: Prefer functional components with hooks

### State Management
- **Local State First**: Use component state for isolated concerns
- **Lift State When Needed**: Move state up when sharing between components
- **Avoid Prop Drilling**: Consider context for deeply nested state

### Data Flow
- **Unidirectional**: Data flows down through props
- **Events Bubble Up**: Child components emit events to parents
- **Immutable Updates**: Always create new objects/arrays for state updates

### Type Safety
- **Strict Mode**: TypeScript strict mode enabled
- **No Any Types**: Avoid `any` type, use `unknown` or specific types
- **Interface First**: Define interfaces before implementation
- **Exhaustive Checks**: Use discriminated unions for state machines

### Code Quality
- **ESLint Compliance**: All code passes linting rules
- **Consistent Formatting**: Follow established code style
- **Meaningful Names**: Use descriptive variable and function names
- **Comment Complex Logic**: Add comments for non-obvious code

### Performance
- **Lazy Loading**: Route-based code splitting for pages
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Key Props**: Always provide stable keys for lists
- **Avoid Inline Functions**: Define handlers outside render when possible
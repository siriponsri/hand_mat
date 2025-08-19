# Frontend Structure

This frontend follows a feature-based architecture with shared components and utilities.

## Directory Structure

```
src/
├── features/               # Feature-specific code
│   ├── capture/           # Image capture functionality
│   ├── feed/              # Recognition feed
│   ├── dataset/           # Dataset management
│   └── settings/          # Application settings
├── shared/                # Shared across features
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── store/            # State management
│   ├── config/           # Configuration
│   └── types/            # TypeScript definitions
├── pages/                 # Route components
└── styles/               # Global styles
```

## Path Aliases

- `@/*` → `src/*` (general)
- `@/components/*` → `src/shared/components/*`
- `@/hooks/*` → `src/shared/hooks/*`
- `@/lib/*` → `src/shared/lib/*`
- `@/store/*` → `src/shared/store/*`
- `@/config/*` → `src/shared/config/*`
- `@/types/*` → `src/shared/types/*`
- `@/features/*` → `src/features/*`
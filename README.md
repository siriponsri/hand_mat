# HandMat - Sign Language Recognition System

## 🎯 Overview
HandMat is an integrated sign language recognition system that combines:
- **Hand Gesture Recognition** using Teachable Machine
- **Face Emotion Analysis** using face-api.js  
- **Natural Language Generation** using LLM integration

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- TensorFlow 2.12+ (for Teachable Machine models)

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

2. **Frontend Setup**  
```bash
cd frontend
npm install
npm run dev
```

3. **Access Application**
- Frontend: http://localhost:8081/
- Backend API: http://localhost:5000/

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run end-to-end tests with Playwright
- `npm run test:ui` - Run tests with UI mode
- `npm run test:headed` - Run tests in headed mode

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── capture/        # Webcam capture & image processing
│   ├── feed/           # Recognition feed components
│   └── classes/        # Dataset management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions & core logic
│   ├── dataset/        # Dataset import/export
│   ├── quality/        # Image quality analysis
│   └── utils.ts        # General utilities
├── pages/              # Route components
├── services/           # API calls & external services
├── store/              # State management (Zustand)
├── types/              # TypeScript type definitions
└── config.ts           # Application configuration
```

## ⚙️ Configuration

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
# Required for development
VITE_APP_NAME=HandMat
VITE_DEBUG_MODE=true

# Optional features
VITE_ENABLE_ANALYTICS=false
```

### Application Config
Main configuration in `src/config.ts`:

- **Detection Settings**: Face/hand detection thresholds
- **Capture Settings**: Auto-capture, burst mode, quality filters
- **Feed Settings**: Thumbnail size, memory limits, virtualization
- **Export Settings**: Dataset splits, seeded shuffling

## 🎯 Key Features

### 📸 Intelligent Capture
- Real-time face and hand detection
- Auto-capture with stability requirements
- Manual capture with burst mode
- Quality filtering (blur, brightness, motion)
- Progress tracking with visual feedback

### 🔍 Recognition Feed
- Live recognition results with thumbnails
- Inline label corrections
- Top-3 alternatives selection
- Memory-efficient virtualized scrolling
- Keyboard shortcuts (1-3 for alternatives, Backspace to delete)

### 📊 Dataset Management
- Class-based organization
- Deterministic train/val/test splits
- ZIP export with metadata
- Quality metrics and statistics
- Import/export compatibility

### 🎨 Modern UI/UX
- Dark/light theme support
- Responsive design
- Accessible components
- Real-time updates
- Professional styling with Tailwind CSS

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests (via Playwright for simplicity)
npm run test tests/unit/
```

### Integration Tests
```bash
# Test full workflows
npm run test tests/
```

### E2E Tests
```bash
# Test complete user journeys
npm run test:headed
```

## 🔧 Development with VS Code

This project includes comprehensive VS Code configuration:

### Recommended Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript
- Playwright Test

### Tasks Available
- `Ctrl+Shift+P` → "Tasks: Run Task"
  - Dev: Frontend
  - Lint: Check
  - Format: All Files
  - Build: Production

### Debug Configuration
- Launch Chrome/Edge debugging
- Set breakpoints in TypeScript/React code
- Inspect network requests and console logs

## 🚀 Deployment

### Lovable Platform
1. Open [Lovable Project](https://lovable.dev/projects/a36007a2-d9b2-490d-93a7-697cfe9db984)
2. Click Share → Publish
3. Configure custom domain if needed

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting platform
```

## 🔒 Security & Privacy

- No API keys exposed to client
- CORS protection on backend
- No persistent image storage by default
- Client-side processing for sensitive data
- Secure dataset export with deterministic splitting

## 📚 Architecture

### Frontend Stack
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library
- **Zustand** - State management
- **React Query** - Server state management

### Core Libraries
- **MediaPipe** - Face and hand detection
- **OpenCV.js** - Image processing
- **JSZip** - Dataset export
- **React Webcam** - Camera integration

## 🐛 Troubleshooting

### Common Issues

**Webcam not detected**
- Check browser permissions
- Ensure HTTPS in production
- Verify camera drivers

**Performance issues**
- Reduce detection resolution in config
- Enable frame skipping
- Check memory usage in feed

**Build failures**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify TypeScript configuration

**TensorFlow/MediaPipe errors**
- Ensure proper WASM support
- Check network connectivity for model downloads
- Fallback to DeepFace if MediaPipe fails

### Getting Help
1. Check console for error messages
2. Review browser network tab for failed requests
3. Test with different browsers/devices
4. Check GitHub issues for known problems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure code quality (`npm run lint && npm run format`)
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎯 Project Goals

HandMat aims to make sign language recognition accessible and user-friendly by providing:

1. **Intuitive Data Collection** - Easy webcam-based gesture capture
2. **Quality Assurance** - Automated filtering and validation
3. **Flexible Training** - Export datasets for various ML frameworks
4. **Real-time Recognition** - Immediate feedback and corrections
5. **Professional Tools** - Enterprise-ready development environment

Built with modern web technologies for performance, accessibility, and maintainability.
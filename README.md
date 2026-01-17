# Verba - Voice-Powered Transcription

A voice-to-text dictation application with intelligent command recognition built using React, TypeScript, and the Web Speech API.

## Features

- **Real-time Voice Transcription** - Convert speech to text instantly
- **Voice Commands** - Control the app hands-free with commands like:
  - "start listening" / "stop listening"
  - "pause dictation" / "resume dictation"
  - "activate spelling mode" - Spell words letter by letter
  - "delete last word"
  - "dark mode" / "light mode" / "toggle theme"
- **Spelling Mode** - Precise letter-by-letter dictation
- **Dark/Light Theme** - Customizable UI theme
- **Status Indicators** - Visual feedback for app state

## Technologies

This project is built with:

- **Vite** - Fast build tool and dev server
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first styling
- **Web Speech API** - Browser-based speech recognition
- **Bun** - Fast JavaScript runtime and package manager

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed (or Node.js & npm)
- Modern browser with Web Speech API support (Chrome or Edge recommended)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd project_verba

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at `http://localhost:8080`

### Build for Production

```sh
# Production build
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
├── components/          # UI components
│   ├── ui/             # shadcn/ui components
│   ├── MicButton.tsx   # Microphone control
│   ├── DictationDisplay.tsx
│   ├── StatusIndicators.tsx
│   └── CommandHelp.tsx
├── features/           # Business logic
│   ├── commandParser.ts  # Voice command parsing
│   ├── types.ts         # TypeScript definitions
│   └── hooks/          # Custom React hooks
├── pages/              # Route pages
│   ├── Index.tsx       # Main app page
│   └── NotFound.tsx
├── lib/                # Utilities
└── App.tsx             # Root component
```

## Usage

1. Click the microphone button to start listening
2. Speak naturally - your words will appear in real-time
3. Use voice commands to control the app (see Command Help panel)
4. Toggle spelling mode for precise letter dictation
5. Switch themes with voice commands or the theme button

## Browser Support

Works best in:
- Google Chrome (recommended)
- Microsoft Edge
- Other Chromium-based browsers

**Note:** Web Speech API support varies by browser. Safari and Firefox have limited support.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

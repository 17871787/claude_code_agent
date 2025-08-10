# VibeLog Pro - Effortless Time Tracking

A voice-driven, AI-enhanced time tracking PWA that captures your work automatically throughout the day. Built for busy professionals who need to know where their time actually goes.

## 🎯 Problem It Solves

When you're stretched thin and juggling multiple projects, looking back at your week often leaves you wondering "What did I actually do?" VibeLog Pro solves this by:
- **Hourly voice capture** via ChatGPT integration
- **Automatic gap detection** to catch missed time
- **Smart categorization** that learns your patterns
- **One-click timesheet export** in multiple formats

## ✨ Key Features

### Voice-First Time Entry
- **ChatGPT Integration**: Hourly nudges to log your time via natural language
- **Voice Import**: Supports SuperWhisper, iPhone transcripts, and LLM outputs
- **Natural Language Processing**: "Spent 2 hours on client calls" → Structured entry

### Smart Intelligence Layer
- **Auto-Categorization**: Automatically sorts entries into development, meetings, admin, etc.
- **Pattern Learning**: Adapts to your work habits over time
- **Focus Time Detection**: Identifies deep work sessions
- **Productivity Insights**: Weekly summaries and recommendations

### Gap-Free Tracking
- **Automatic Gap Detection**: Finds unaccounted time > 30 minutes
- **Quick Fill UI**: Fill gaps with one click
- **Smart Suggestions**: Predicts what you were likely doing

### Export & Reporting
- **Multiple Formats**: Timesheet, Invoice, Summary, Detailed
- **Smart Rounding**: Round to nearest 15 minutes for billing
- **Project Grouping**: Automatic project extraction from descriptions
- **Gap Analysis**: Shows all unaccounted time

## 🚀 Quick Start

### Use the Live Version
Visit: https://vibelog-pro.vercel.app

### Self-Host
```bash
# Clone the repository
git clone https://github.com/17871787/claude_code_agent.git
cd claude_code_agent/vibelog-pro

# Deploy to Vercel
npx vercel

# Or serve locally
npx serve
```

## 🤖 ChatGPT Integration Setup

1. Open VibeLog Pro → Settings → "Setup ChatGPT Integration"
2. Copy the provided instructions
3. Create a Custom GPT with these instructions
4. ChatGPT will now:
   - Nudge you hourly for time logs
   - Parse your voice/text responses
   - Send entries directly to VibeLog

### Example Workflow
```
ChatGPT: "What have you been working on in the last hour?"
You: "Client meetings and then debugging the API"
ChatGPT: *Sends to VibeLog as structured JSON*
VibeLog: Entry added and categorized automatically
```

## 📱 Progressive Web App

VibeLog Pro works offline and can be installed as an app:
- **Chrome/Edge**: Click install icon in address bar
- **Safari iOS**: Share → Add to Home Screen
- **Firefox**: Menu → Install

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Storage**: localStorage with LZ-string compression
- **PWA**: Service Worker for offline functionality
- **API**: Vercel serverless functions
- **Intelligence**: Pattern matching and Markov chains (no cloud AI required)

## 📊 Features in Detail

### Storage System
- **10x Compression**: Store 50MB+ of data in 5MB localStorage
- **Write-Ahead Logging**: Crash recovery
- **Chunk Strategy**: Handles localStorage quotas
- **Auto-Save**: Debounced batch writes

### Predictive Engine
- **Markov Chains**: Predicts next task based on patterns
- **Time-Based Suggestions**: "Usually do X at this time"
- **Duration Estimation**: Learns how long tasks typically take
- **Project Detection**: Automatically extracts project names

### Keyboard Navigation
- **Vim-style bindings**: `j/k` for navigation
- **Command Palette**: `Cmd+K` for quick actions
- **Quick Timer**: `t` to start/stop timer
- **Smart Tab**: Context-aware tab completion

### Export Options
- **CSV**: For spreadsheet import
- **Markdown**: For documentation
- **Text**: For email/chat
- **Formats**: Timesheet, Invoice, Summary, Detailed

## 🔧 Configuration

### API Endpoint
The `/api/quick-entry` endpoint accepts:
```json
{
  "text": "Description of work",
  "duration": "1h30m",
  "timestamp": "2024-01-10T14:00:00Z",
  "project": "ProjectName",
  "category": "development"
}
```

### Categories
Pre-configured smart categories:
- `development`: coding, debugging, implementing
- `meeting`: calls, standups, discussions
- `admin`: email, timesheets, paperwork
- `planning`: design, architecture, estimates
- `communication`: slack, messages, responses
- `learning`: research, tutorials, documentation
- `break`: lunch, coffee, walks

## 📈 Productivity Insights

The insights dashboard provides:
- **Focus Score**: Based on deep work sessions
- **Category Balance**: Time distribution analysis
- **Pattern Detection**: Most productive hours/days
- **Task Switching**: Context switch frequency
- **Weekly Summaries**: Automated progress reports

## 🔐 Privacy & Security

- **100% Local**: All data stays in your browser
- **No Cloud Dependencies**: Works completely offline
- **No Tracking**: Zero analytics or telemetry
- **Encrypted Export**: Optional password protection for exports
- **Open Source**: Fully auditable codebase

## 🚧 Roadmap

- [ ] Mobile app (React Native)
- [ ] Team sharing (encrypted)
- [ ] Calendar integration
- [ ] Invoice generation
- [ ] Goal tracking
- [ ] Pomodoro timer

## 🤝 Contributing

Contributions welcome! This project uses:
- Vanilla JavaScript for maximum compatibility
- No build process required
- Service Worker for offline functionality
- Vercel for deployment

## 📄 License

MIT License - Use freely for personal or commercial projects.

## 🙏 Acknowledgments

Built with Claude Code by Anthropic. Special thanks to the time-tracking community for inspiration and feedback.

---

**Problem with time tracking?** Most tools require too much manual input. VibeLog Pro flips this - it captures everything automatically and lets you clean it up later when doing timesheets. Perfect for when you're too busy to track but need to know where your time went.
# DepositDefender

![App Preview](https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=300&fit=crop&auto=format)

DepositDefender is a privacy-first Progressive Web App that helps renters document their move-out condition through systematic room-by-room evidence capture. Generate professional PDF reports to protect your security deposit with comprehensive photo documentation and detailed checklists.

## Features

- 🏠 **Room-by-Room Documentation** - Guided checklists for different room types (bedroom, bathroom, kitchen, living room, etc.)
- 📱 **Mobile-First Design** - Optimized for one-handed phone operation during property walkthroughs
- 🔒 **Privacy-First Architecture** - All data stored locally via IndexedDB, no servers or cloud storage
- 📄 **Professional PDF Reports** - Client-side generation with photos, timestamps, and detailed notes
- 📸 **Smart Photo Capture** - Image compression, watermarking, and severity tagging
- 📴 **Offline-First PWA** - Works completely offline with installable app experience
- 🔄 **Optional Secure Sharing** - Time-limited report sharing with 7-day expiration
- 🏷️ **Condition Tracking** - Severity tagging (Good, Fair, Poor, Damaged) for each item
- 📋 **Customizable Checklists** - Add custom room types and inspection items
- 🕒 **Timestamp Documentation** - Automatic timestamping of all photos and entries

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=68acebeb04ea77b1e31e56b1&clone_repository=68acf11904ea77b1e31e56bb)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> No content model prompt provided - app built as a standalone privacy-first solution without external content dependencies

### Code Generation Prompt

> Build a privacy-first web app called DepositDefender that guides renters through room-by-room move-out evidence capture and generates professional PDF reports. Use Next.js with TypeScript, local-first storage via IndexedDB, client-side PDF generation, and PWA capabilities. Include guided checklists for different room types, image compression with watermarking, severity tagging, and optional secure sharing with 7-day expiration. Make this extremely mobile friendly so that users can complete the move in audit and take photos with their phone and generate the pdf.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## Technologies Used

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Storage**: IndexedDB for local-first data persistence
- **PDF Generation**: jsPDF with jspdf-autotable for professional reports
- **Image Processing**: Browser Canvas API for compression and watermarking
- **PWA**: Next.js PWA capabilities with service worker
- **Database**: Dexie.js for IndexedDB management
- **Icons**: Lucide React for consistent iconography
- **Sharing**: Native Web Share API with fallback options

## Getting Started

### Prerequisites

- Node.js 18+ and Bun package manager
- Modern web browser with IndexedDB support
- Camera-enabled device (mobile phone recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd depositdefender
```

2. Install dependencies:
```bash
bun install
```

3. Run the development server:
```bash
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### PWA Installation

The app can be installed on mobile devices:
1. Visit the app in your mobile browser
2. Look for "Add to Home Screen" prompt
3. Install for native app-like experience

## Privacy & Data Storage

DepositDefender is built with privacy as the core principle:

- **Local-First Storage**: All data stored in your device's IndexedDB
- **No Servers**: Complete offline operation, no data transmission
- **User Control**: You own and control all your documentation
- **Optional Sharing**: Sharing features use temporary, time-limited links only

## Usage Guide

1. **Start New Inspection**: Create a new move-out inspection
2. **Add Rooms**: Select from common room types or create custom ones
3. **Document Conditions**: Follow guided checklists for each room
4. **Capture Evidence**: Take photos with automatic compression and watermarking
5. **Tag Severity**: Mark items as Good, Fair, Poor, or Damaged
6. **Generate Report**: Create professional PDF with all documentation
7. **Share (Optional)**: Generate secure 7-day expiring share links

## Deployment Options

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Netlify
```bash
# Build for static deployment
bun run build
bun run export
# Upload dist folder to Netlify
```

### Self-Hosted
```bash
# Build for production
bun run build
# Serve static files from out/ directory
```

No environment variables required - the app runs entirely client-side.
<!-- README_END -->
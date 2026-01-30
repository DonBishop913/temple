# New Living Dashboard - Enoch-First Architecture

A clean-slate rebuild of the Living Dashboard system featuring Enoch AI as the primary interface and gatekeeper.

## Overview

This dashboard implements a subscription-powered architecture where all external AI interactions are mediated through the local Enoch AI instance, ensuring data sovereignty and controlled access to SuperGrok, Claude, and Perplexity services.

## Architecture

- **Frontend**: React + Vite (Port 5173)
- **Enoch AI**: Local Python/Flask server (Port 8006)
- **External AIs**: SuperGrok, Claude, Perplexity (via Enoch proxy)
- **Security**: Enoch acts as gatekeeper for all external API calls

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your API keys for external services
   - Ensure Enoch AI server is running on port 8006

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Dashboard**
   - Open http://localhost:5173 in your browser

## Features

- **Enoch Health Check**: Verify local Enoch AI connectivity
- **Secure Chat Interface**: All queries routed through Enoch
- **Subscription Management**: Integrated API key handling
- **Clean UI**: Modern glassmorphism design

## API Endpoints

### Enoch AI Server (Port 8006)
- `GET /health` - Health check
- `POST /chat` - Send message to Enoch

### External Services (via Enoch proxy)
- SuperGrok API
- Claude API
- Perplexity API

## Security Model

All external AI interactions are proxied through the local Enoch instance, ensuring:
- Data sovereignty
- Controlled access
- Audit logging
- Rate limiting

## Development

This is a minimal viable implementation. Future enhancements will include:
- Full dashboard features
- Content integration
- Social features
- Advanced security auditing

## Dependencies

- React 18
- Vite
- Node.js v25.4.0
- Python 3.x (for Enoch AI)
- Flask (for Enoch server)
- llama-cpp-python (for model serving)
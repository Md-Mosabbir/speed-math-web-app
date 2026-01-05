# Speed math web app

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mdmosabbirs-projects/v0-speed-math-web-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/uLMTXzqZ7fJ)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/mdmosabbirs-projects/v0-speed-math-web-app](https://vercel.com/mdmosabbirs-projects/v0-speed-math-web-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/uLMTXzqZ7fJ](https://v0.app/chat/uLMTXzqZ7fJ)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Firebase Setup

This app uses Firebase for authentication and leaderboard functionality. To set up:

1. Create a `.env.local` file in the root directory
2. Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Get these values from your Firebase project settings: https://console.firebase.google.com/
4. Make sure Google OAuth is enabled in Firebase Authentication
5. Firestore security rules should allow:
   - Anyone can read leaderboard
   - Only authenticated users can create documents
   - Users can only create documents with their own uid

**Note:** You may need to create Firestore composite indexes for queries. Firebase will provide a link in the error message if indexes are needed.

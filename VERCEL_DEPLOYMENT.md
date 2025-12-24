# Vercel Deployment Guide

## Common Deployment Issues & Solutions

### 1. Build Script Issue
**Problem:** `--turbopack` flag in build script may not work on Vercel
**Solution:** Removed `--turbopack` from production build script (kept for dev only)

### 2. Environment Variables Required

Make sure to set ALL these environment variables in Vercel Dashboard:

#### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

#### Firebase Client Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

#### Firebase Admin SDK
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** For `FIREBASE_PRIVATE_KEY` in Vercel:
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters as they are (Vercel will handle them)
- Or replace `\n` with actual newlines if pasting directly

#### AI Models Configuration
```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash  # Optional, defaults to gemini-1.5-flash
```

#### Groq Configuration (Optional)
```
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant  # Optional
```

### 3. Node.js Version
Vercel will automatically detect Node.js version from your `package.json` or use the latest LTS version.

### 4. Build Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (automatically detected)
- **Output Directory:** `.next` (automatically detected)
- **Install Command:** `npm install` (automatically detected)

### 5. Common Errors & Fixes

#### Error: "Missing Firebase Admin env vars"
- **Cause:** Firebase Admin environment variables not set
- **Fix:** Add all three Firebase Admin variables in Vercel dashboard

#### Error: "Missing GEMINI_API_KEY"
- **Cause:** Gemini API key not set
- **Fix:** Add `GEMINI_API_KEY` in Vercel environment variables

#### Error: "models/gemini-pro is not found"
- **Cause:** Using deprecated model name
- **Fix:** Set `GEMINI_MODEL=gemini-1.5-flash` or use default (already fixed in code)

#### Error: Build timeout
- **Cause:** Build taking too long
- **Fix:** Check for large dependencies or optimize build process

### 6. Deployment Steps

1. **Push to GitHub** (if using GitHub integration)
2. **Import Project in Vercel**
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import from GitHub repository
3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
4. **Deploy**
   - Click "Deploy"
   - Monitor build logs for any errors

### 7. Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Build completes successfully
- [ ] Application loads without errors
- [ ] Authentication (Clerk) works
- [ ] Firebase connection works
- [ ] AI features (Gemini/Groq) work
- [ ] Admin panel is accessible

### 8. Troubleshooting

If deployment fails:
1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase private key is properly formatted
4. Check that all API keys are valid and not expired
5. Review function execution logs in Vercel dashboard


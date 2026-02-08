## Railway Deployment Instructions

### Frontend Service Settings

**Start Command:**
```
npx serve -s dist -l $PORT
```

**Note:** The `-s` flag enables SPA mode for React Router while still serving static files like `landing.html`. The serve package uses "clean URLs" - accessing `/landing.html` will redirect to `/landing` but still serve the correct content.

### Environment Variables
- `VITE_API_URL` - Backend URL (e.g., `https://your-backend.up.railway.app`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

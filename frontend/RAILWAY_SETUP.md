## Railway Deployment Instructions

### Frontend Service Settings

**Start Command:**
```
npx serve dist -l $PORT
```

**Note:** Remove the `-s` flag to disable SPA mode. This allows `landing.html` to be served directly.

### Environment Variables
- `VITE_API_URL` - Backend URL (e.g., `https://your-backend.up.railway.app`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

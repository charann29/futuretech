## Railway Deployment Instructions

### Frontend Service Settings

**Start Command:**
```
node server.js
```

**Note:** We use a custom Express server instead of `serve` to avoid the "clean URLs" feature that redirects `/landing.html` to `/landing`. This allows both static files and React routes to work correctly.

### Environment Variables
- `VITE_API_URL` - Backend URL (e.g., `https://your-backend.up.railway.app`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

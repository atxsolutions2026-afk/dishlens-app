# CORS Fix - API Connection Issues

## Changes Made

### Frontend (`dishlens-app`)

1. **Enhanced `lib/env.ts`**:
   - Added protocol validation (ensures `http://` or `https://`)
   - Added URL validation with fallback
   - Better error messages

2. **Enhanced `lib/apiFetch.ts`**:
   - Added URL validation before fetch
   - Improved CORS error messages
   - Better debugging information

### Backend (`dishlens-api`)

1. **Fixed CORS configuration order** (`src/main.ts`):
   - Moved `enableCors()` BEFORE Helmet middleware
   - Configured Helmet to allow cross-origin requests
   - Added explicit CORS methods and headers

## Verification Steps

### 1. Check Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Backend** (`.env`):
```bash
PORT=3000
```

### 2. Verify Backend is Running

```bash
cd dishlens-api/dishlens-api
npm run start:dev
# Should see: "DishLens API running on http://localhost:3000"
```

### 3. Test API Endpoint

Open browser console and run:
```javascript
fetch('http://localhost:3000/public/restaurants/demo-restaurant/menu')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### 4. Check Frontend API Calls

Open browser DevTools → Network tab:
- Look for failed requests
- Check the Request URL (should be `http://localhost:3000/...`)
- Check Response Headers for `Access-Control-Allow-Origin`

## Common Issues

### Issue: "URL scheme must be 'http' or 'https'"
**Solution**: Check `.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` (with `http://`)

### Issue: "Failed to fetch"
**Possible causes**:
1. Backend not running → Start backend: `npm run start:dev`
2. Wrong port → Check backend is on port 3000
3. CORS not configured → Restart backend after CORS changes

### Issue: CORS error in browser console
**Solution**: 
1. Restart backend (CORS changes require restart)
2. Clear browser cache
3. Check Network tab → Response Headers → Should see `Access-Control-Allow-Origin: *`

## Testing

1. **Start Backend**:
   ```bash
   cd dishlens-api/dishlens-api
   npm run start:dev
   ```

2. **Start Frontend**:
   ```bash
   cd dishlens-app
   npm run dev
   ```

3. **Open Browser**:
   - Go to `http://localhost:3001/m/demo-restaurant`
   - Open DevTools → Console
   - Should see no CORS errors
   - Menu should load

## Debug Commands

**Check API base URL** (in browser console):
```javascript
// Should return: "http://localhost:3000"
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
```

**Test API directly**:
```bash
curl http://localhost:3000/public/restaurants/demo-restaurant/menu
```

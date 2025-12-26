# Quick Start Guide

## Prerequisites Checklist

- [x] Backend running on `http://localhost:9000`
- [ ] Publishable API Key added to `.env.local`
- [ ] Backend CORS configured (`STORE_CORS=http://localhost:8000`)

## Step-by-Step Setup

### 1. Add Publishable API Key

1. Open Medusa Admin: `http://localhost:9000/app`
2. Go to **Settings** → **Publishable API Keys**
3. Create or copy an existing key
4. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
   ```

### 2. Verify Backend CORS

Check your backend `.env` file has:
```
STORE_CORS=http://localhost:8000
```

If missing, add it and restart the backend.

### 3. Start Frontend

```bash
cd frontend
yarn dev
```

Frontend will start on `http://localhost:8000`

## Verification

Once both servers are running:

- ✅ Backend: `http://localhost:9000`
- ✅ Frontend: `http://localhost:8000`
- ✅ Admin: `http://localhost:9000/app`

Test the storefront:
1. Visit `http://localhost:8000`
2. Browse products
3. Add items to cart
4. Test checkout flow

## Troubleshooting

**Frontend won't start:**
- Ensure `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is set in `.env.local`

**CORS errors:**
- Verify `STORE_CORS=http://localhost:8000` in backend `.env`
- Restart backend after changing CORS settings

**Products not loading:**
- Check backend is running
- Verify publishable key is correct
- Check browser console for errors

## Project Structure

```
toycker/
├── backend/          # Medusa backend (port 9000)
│   └── .env         # Backend environment variables
└── frontend/         # Next.js storefront (port 8000)
    └── .env.local   # Frontend environment variables
```

## Next Steps

- Customize storefront design
- Configure payment providers
- Add custom features
- Deploy to production

For detailed information, see `IMPLEMENTATION.md`


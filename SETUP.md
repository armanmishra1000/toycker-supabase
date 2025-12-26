# Frontend Setup Guide

## Prerequisites

1. **Backend Running**: Ensure your Medusa backend is running on `http://localhost:9000`
2. **Backend CORS Configuration**: Make sure your backend `.env` file includes the frontend URL in `STORE_CORS`:
   ```
   STORE_CORS=http://localhost:8000
   ```
   If not set, add it and restart your backend.

## Environment Variables

The `.env.local` file has been created with the following configuration:

- `MEDUSA_BACKEND_URL=http://localhost:9000` - Points to your Medusa backend
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=` - **REQUIRED** - You need to add this

### Getting the Publishable API Key

1. Open your Medusa Admin Dashboard: `http://localhost:9000/app`
2. Navigate to **Settings** → **Publishable API Keys**
3. Either create a new key or copy an existing one
4. Add it to `.env.local`:
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_key_here
   ```

## Running the Frontend

1. **Install dependencies** (already done):
   ```bash
   cd frontend
   yarn install
   ```

2. **Start the development server**:
   ```bash
   yarn dev
   ```

3. **Access the storefront**: `http://localhost:8000`

## Verification Steps

After starting both servers:

1. **Backend**: Should be running on `http://localhost:9000`
2. **Frontend**: Should be running on `http://localhost:8000`
3. **Test the connection**:
   - Visit `http://localhost:8000`
   - You should see the storefront homepage
   - Navigate to products to verify data is loading from the backend
   - Try adding items to cart

## Troubleshooting

- **CORS Errors**: Ensure `STORE_CORS=http://localhost:8000` is set in backend `.env`
- **Missing Publishable Key**: The app will fail to start if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is not set
- **Connection Issues**: Verify backend is running and accessible at `http://localhost:9000`

## Next Steps

Once the basic setup is working:
- Customize the storefront design
- Add additional features as needed
- Configure payment providers (Stripe) if required


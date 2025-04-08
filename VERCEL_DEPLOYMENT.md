# Vercel Deployment Instructions

This document outlines how to deploy this application to Vercel for production use.

## Prerequisites

1. A Vercel account
2. VaultRE API credentials (API key and token)
3. Node.js and pnpm installed locally

## Environment Variables

You'll need to set up the following environment variables in the Vercel dashboard:

- `VAULTRE_API_URL`: The base URL for the VaultRE API (default: https://ap-southeast-2.api.vaultre.com.au/api/v1.3)
- `VAULTRE_API_KEY`: Your VaultRE API key
- `VAULTRE_API_TOKEN`: Your VaultRE API token 

To obtain these credentials:
1. The API key should be provided by VaultRE
2. For the token, login to Vault and go to Office Integrations > Third party access > "Add token"
3. Select all required scopes and click "Create token"

## Deployment Steps

1. **Connect your repository to Vercel**:
   - Go to https://vercel.com/new
   - Import your Git repository
   - Select the "shadcn-admin" project

2. **Configure build settings**:
   - Build Command: `pnpm build`
   - Output Directory: `dist` (or as configured in your project)
   - Install Command: `pnpm install`

3. **Add environment variables**:
   - Add all the required environment variables listed above
   - Ensure they are set correctly for both Production and Preview environments

4. **Deploy**:
   - Click "Deploy" to start the deployment process
   - Vercel will build and deploy your application

## Vercel Configuration

The `vercel.json` file includes:

- API route configuration
- Memory and duration limits for serverless functions
- CORS headers
- Security headers

## Production Optimizations

The following optimizations have been implemented:

1. **Caching**:
   - GET requests to property endpoints are cached for 5 minutes
   - Stale-while-revalidate is enabled for improved performance

2. **Error Handling**:
   - Comprehensive error logging
   - Proper HTTP status codes
   - Detailed error messages (in a secure manner)

3. **Security**:
   - Security headers to prevent common attacks
   - No exposure of sensitive credentials in client-side code

## Token Management

Note that VaultRE tokens may have an expiration period. If your token expires, you'll need to:

1. Generate a new token in the VaultRE dashboard
2. Update the environment variable in Vercel

## Monitoring

After deployment, monitor your application using:

1. Vercel Analytics dashboard
2. Function logs in the Vercel dashboard
3. Set up alerts for function errors

## Troubleshooting

If you encounter issues:

1. Check the function logs in Vercel
2. Verify environment variables are set correctly
3. Test API endpoints using the Vercel deployment URL
4. Ensure VaultRE API credentials are valid and not expired 
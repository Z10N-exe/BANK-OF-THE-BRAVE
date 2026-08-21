# Vercel Deployment Guide - Bank of the Brave

## Overview

This guide shows how to deploy your Bank of the Brave application on Vercel with MongoDB Atlas for the database.

---

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Account** - Already have your repo on GitHub
3. **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas (Free tier available)

---

## Step 1: Set Up MongoDB Atlas

### Create a MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new project (e.g., "Bank of the Brave")
4. Create a new cluster:
   - Choose **Free Tier (M0)**
   - Select your region (closest to your users)
   - Name it "bank-cluster"
   - Click "Create Cluster"

### Create Database User

1. In Atlas, go to **Security > Database Access**
2. Click "Add New Database User"
3. Create credentials:
   - Username: `bank_admin`
   - Password: Generate a secure password (save it!)
   - Role: `readWriteAnyDatabase`
   - Click "Add User"

### Get Connection String

1. Go to **Databases** tab
2. Click "Connect" on your cluster
3. Choose "Drivers" (Node.js)
4. Copy the connection string:
   ```
   mongodb+srv://bank_admin:<password>@bank-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Change database name to `bank_of_the_brave`:
   ```
   mongodb+srv://bank_admin:YOUR_PASSWORD@bank-cluster.xxxxx.mongodb.net/bank_of_the_brave?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy on Vercel

### Option A: Connect GitHub Repository (Recommended)

1. Go to https://vercel.com/new
2. Click "Continue with GitHub"
3. Authorize Vercel
4. Select your `BANK-OF-THE-BRAVE` repository
5. Click "Import"

### Configure Project

1. **Framework Preset**: Select "Other"
2. **Build Command**: Leave empty (Vercel detects Node.js)
3. **Output Directory**: Leave empty
4. **Install Command**: `npm install`

### Set Environment Variables

1. Under "Environment Variables", add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://bank_admin:YOUR_PASSWORD@...` |
| `JWT_SECRET` | `@bankofthebrave2024!secure#key` |
| `JWT_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |

2. Click "Add" for each variable
3. Click "Deploy"

**Wait for deployment to complete** (~2-3 minutes)

---

## Step 3: Verify Deployment

### Check Health Endpoint

```
https://your-project.vercel.app/api/health
```

You should see:
```json
{
  "status": "Server is running",
  "timestamp": "2024-08-21T...",
  "mongodb": "Connected"
}
```

### Test Login

1. Go to `https://your-project.vercel.app`
2. Try logging in with admin credentials:
   - Email: `bob`
   - Password: `1234`

### Create Test Account

1. Click "Create Account"
2. Fill in test details
3. Complete KYC verification
4. Deposit funds

---

## Deployment File Structure

```
BANK-OF-THE-BRAVE/
├── api/
│   └── index.js           (Vercel serverless function)
├── public/                (Frontend files)
├── routes/                (API endpoints)
├── models/                (Database models)
├── middleware/            (Auth middleware)
├── server.js              (Express app)
├── vercel.json            (Vercel config)
├── package.json           (Dependencies)
└── .env                   (Local dev only)
```

---

## Troubleshooting

### Issue: "Cannot find module"

**Solution**: Make sure all dependencies are in package.json
```bash
npm install
```

### Issue: "MongoDB connection failed"

**Solution**: Check your connection string
1. Verify username and password
2. Check IP whitelist in Atlas (allow all IPs: 0.0.0.0/0)
3. Ensure database name is correct

### Issue: "File upload not working"

**Solution**: File uploads use `/tmp` on Vercel (temporary storage)
- Uploads work but are deleted after request
- For persistent storage, use AWS S3 or similar
- Current setup: uploads work for requests, don't persist

### Issue: "Build failed"

**Solution**: Check build logs
1. Go to Deployment > Logs
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Invalid MongoDB URI
   - Port issues

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Connection string tested
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health check working
- [ ] Login tested
- [ ] KYC flow tested
- [ ] Admin access verified

---

## Custom Domain (Optional)

1. In Vercel, go to **Settings > Domains**
2. Add your domain (e.g., bank.yourdomain.com)
3. Update DNS records as Vercel instructs
4. Wait for DNS propagation (up to 48 hours)

---

## Monitoring & Logs

### View Logs

1. In Vercel dashboard, select your project
2. Go to **Deployments**
3. Click latest deployment
4. View **Logs** for errors

### Performance

1. Go to **Analytics** in Vercel
2. Monitor:
   - Request count
   - Response times
   - Error rates

---

## Important Notes

### File Uploads

Vercel's serverless functions have limitations:
- Upload temporary files work within a request
- Files don't persist between requests
- For production with persistent storage:
  - Use AWS S3
  - Use Azure Blob Storage
  - Use Cloudinary

### Database

- MongoDB Atlas Free Tier:
  - 512 MB storage
  - Shared cluster
  - Good for testing/development
- For production:
  - Consider paid tier
  - Dedicated cluster
  - Better performance

### Cold Starts

- First request may be slow (~5 seconds)
- Subsequent requests are fast
- Consider upgrading for consistent performance

---

## Cost Analysis

### Vercel Pricing
- **Free Tier**: 
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Recommended for testing
  
- **Pro Tier**: $20/month
  - Unlimited bandwidth
  - Priority support
  - Recommended for production

### MongoDB Atlas Pricing
- **Free Tier**: 
  - 512 MB storage
  - Free forever
  - Good for testing

- **Shared Cluster**: Starting at $57/month
  - 2.5 GB+ storage
  - Dedicated cluster
  - Recommended for production

---

## Next Steps

1. **Deploy to Vercel** using this guide
2. **Test all features** on live URL
3. **Monitor performance** in Vercel Analytics
4. **Scale to paid tier** when needed
5. **Add custom domain** for professional appearance
6. **Enable SSL** (automatic on Vercel)

---

## Support

### Vercel Documentation
- https://vercel.com/docs
- https://vercel.com/docs/concepts/functions/serverless-functions

### MongoDB Documentation
- https://docs.mongodb.com/atlas
- https://docs.mongodb.com/drivers/node

### Common Issues
- Check build logs in Vercel dashboard
- Verify MongoDB connection string
- Ensure all environment variables are set
- Check DNS records for custom domains

---

## Deployment Success Example

```
✅ Repository: github.com/Z10N-exe/BANK-OF-THE-BRAVE
✅ Deployed on: Vercel
✅ Live URL: https://bank-of-the-brave.vercel.app
✅ Database: MongoDB Atlas
✅ Environment: Production
✅ Status: Running
```

---

**Ready to deploy!** Follow the steps above to get your banking platform live on Vercel.

For questions, check Vercel and MongoDB Atlas documentation.

# Quick Deploy to Vercel - 5 Minutes

## TL;DR Quick Steps

### 1. MongoDB Atlas Setup (2 mins)
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create Free Cluster
3. Create User: bank_admin / (strong password)
4. Get Connection String
5. Copy: mongodb+srv://bank_admin:PASSWORD@.../?retryWrites=true&w=majority
```

### 2. Vercel Deployment (3 mins)
```
1. Go to https://vercel.com/new
2. Select your BANK-OF-THE-BRAVE repo from GitHub
3. Click "Import"
4. Add Environment Variables:
   - MONGODB_URI: (paste connection string)
   - JWT_SECRET: @bankofthebrave2024!secure#key
   - JWT_EXPIRE: 7d
   - NODE_ENV: production
5. Click "Deploy"
6. Wait for green checkmark
```

### 3. Test It
```
1. Go to https://your-project.vercel.app
2. Login with: bob / 1234
3. Test features
```

---

## Environment Variables

Copy-paste these into Vercel:

```
MONGODB_URI=mongodb+srv://bank_admin:YOUR_PASSWORD@bank-cluster.xxxxx.mongodb.net/bank_of_the_brave?retryWrites=true&w=majority
JWT_SECRET=@bankofthebrave2024!secure#key
JWT_EXPIRE=7d
NODE_ENV=production
```

---

## If Deployment Fails

### Check These

1. **MongoDB Connection**
   - Test connection string locally first
   - Replace PASSWORD with actual password
   - Ensure database name is `bank_of_the_brave`

2. **GitHub Connection**
   - Authorize Vercel to access your repo
   - Make sure repo is public or private is allowed

3. **Environment Variables**
   - All three variables must be set
   - No typos in variable names
   - Values are exact as shown

4. **Logs**
   - Click "Deployments" in Vercel
   - View logs for error messages
   - Search for "MongoDB" or "Error" keywords

---

## Verify Deployment

```
Health Check:
https://your-project.vercel.app/api/health

Should return:
{
  "status": "Server is running",
  "mongodb": "Connected"
}
```

---

## Get Your Live URL

After deployment succeeds, you'll see:
```
https://bank-of-the-brave-xxx.vercel.app
```

Share this with users!

---

## That's It!

Your bank is live on the internet. 🚀

Admin: bob / 1234
Users: Create account from login page

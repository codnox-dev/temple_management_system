# 🚀 Render + Netlify Deployment Guide

Complete deployment guide for your secure temple management system.

## 📋 **Pre-Deployment Checklist**

### **Generate Production Keys**
```bash
# Generate a secure 64-character secret key
openssl rand -hex 64

# Example output (use your own!):
# 8f3e4d5c6b7a9e8d7f6c5b4a3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c
```

## 🖥️ **Backend Deployment (Render)**

### **1. Repository Setup**
```bash
# Ensure your backend code is in the repository
# File structure should be:
# backend/
#   ├── app/
#   ├── requirements.txt
#   └── Dockerfile (optional)
```

### **2. Render Configuration**

**Create New Web Service in Render:**
- **Repository**: Connect your GitHub/GitLab repo
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### **3. Environment Variables in Render**

Navigate to **Environment** tab and add:

```bash
# JWT Security (REQUIRED - Replace with your generated key)
SECRET_KEY=8f3e4d5c6b7a9e8d7f6c5b4a3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=7
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS & Security (REQUIRED - Your Netlify URL)
ALLOWED_ORIGINS=https://heroic-elf-ec8175.netlify.app
JWT_AUDIENCE=https://heroic-elf-ec8175.netlify.app

# Database (REQUIRED - Your MongoDB connection)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=temple_db_production

# Admin Account (REQUIRED - Change the password!)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change_this_secure_password_immediately_2024
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_NAME=System Administrator

# MinIO/Storage (if using file uploads)
MINIO_ENDPOINT=your_minio_endpoint
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=temple-files
```

### **4. Deploy Backend**
- Click **"Deploy Latest Commit"**
- Wait for build to complete
- Your API will be available at: `https://your-service-name.onrender.com`

## 🌐 **Frontend Deployment (Netlify)**

### **1. Build Configuration**

Update your `frontend/.env`:
```bash
# Production API endpoint (Replace with your Render URL)
VITE_API_BASE_URL=https://temple-management-system-3p4x.onrender.com

# No secret keys needed in frontend! 🎉
```

### **2. Netlify Configuration**

**Option A: Git Integration (Recommended)**
1. Connect your repository to Netlify
2. Set **Build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - **Node version**: `18` (in netlify.toml)

**Option B: Manual Upload**
```bash
# Build locally
cd frontend
npm install
npm run build

# Upload dist/ folder to Netlify
```

### **3. Environment Variables in Netlify**

Go to **Site Settings > Environment Variables** and add:

```bash
VITE_API_BASE_URL=https://temple-management-system-3p4x.onrender.com
```

### **4. Netlify Configuration File**

Create `netlify.toml` in your project root:
```toml
[build]
  base = "frontend/"
  command = "npm run build"
  publish = "dist/"

[build.environment]
  NODE_VERSION = "18"

# Redirect all routes to index.html for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; connect-src 'self' https://temple-management-system-3p4x.onrender.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
```

## 🔍 **Post-Deployment Verification**

### **1. Backend Health Check**
```bash
# Test backend is running
curl https://temple-management-system-3p4x.onrender.com/api

# Expected response:
# {"message": "Welcome to the Temple Management System API"}
```

### **2. JWT Token Test**
```bash
# Get initial token
curl -X POST https://temple-management-system-3p4x.onrender.com/api/auth/get-token \
  -H "Content-Type: application/json"

# Expected response:
# {"access_token": "eyJ...", "token_type": "bearer", "expires_in": 420}
```

### **3. CORS Test**
- Open browser dev tools
- Visit your Netlify site
- Check Network tab for API calls
- Should see successful requests with no CORS errors

### **4. Security Test**
- Try accessing API from another domain (should fail with CORS error)
- Use expired token (should return 401)
- Check that refresh tokens are HTTP-only cookies

## 🔧 **Custom Domain Setup (Optional)**

### **Backend Custom Domain (Render)**
1. Go to Settings > Custom Domains
2. Add your domain: `api.yourdomain.com`
3. Update DNS CNAME record
4. Update CORS settings to include new domain

### **Frontend Custom Domain (Netlify)**
1. Go to Domain Management > Custom Domains
2. Add your domain: `yourdomain.com`
3. Update DNS records as instructed
4. Update backend CORS to include new domain

## 📊 **Monitoring Setup**

### **Render Monitoring**
- **Metrics**: CPU, Memory, Response Times
- **Logs**: Access via Render dashboard
- **Alerts**: Set up for high error rates

### **Netlify Monitoring**
- **Analytics**: Page views, performance
- **Functions**: Monitor serverless functions (if used)
- **Forms**: Track form submissions (if used)

## 🚨 **Production Troubleshooting**

### **Common Issues**

**"CORS Error"**
```bash
# Check ALLOWED_ORIGINS in Render environment variables
# Ensure it matches your Netlify URL exactly
ALLOWED_ORIGINS=https://heroic-elf-ec8175.netlify.app
```

**"Token Validation Failed"**
```bash
# Check SECRET_KEY is set in Render
# Ensure JWT_AUDIENCE matches frontend URL
JWT_AUDIENCE=https://heroic-elf-ec8175.netlify.app
```

**"Database Connection Error"**
```bash
# Verify MONGODB_URL is correct
# Check MongoDB Atlas network access (allow 0.0.0.0/0 or Render IPs)
```

**"Build Failed on Netlify"**
```bash
# Check Node version in netlify.toml
# Verify package.json has all dependencies
# Check build logs for specific errors
```

### **Debug Commands**

**Check Backend Logs (Render)**
```bash
# View logs in Render dashboard
# Look for startup errors, JWT errors, database connection issues
```

**Test API Endpoints**
```bash
# Test all auth endpoints
curl -X POST https://temple-management-system-3p4x.onrender.com/api/auth/get-token
curl -X POST https://temple-management-system-3p4x.onrender.com/api/auth/login -d "username=admin&password=your_password"
```

**Frontend Debug**
```javascript
// Check in browser console
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

// Check JWT service
console.log('Is authenticated:', jwtAuth.isAuthenticated());
```

## 🔄 **Update Deployment**

### **Backend Updates**
```bash
# Push to GitHub
git add .
git commit -m "Update backend"
git push origin main

# Render auto-deploys from main branch
```

### **Frontend Updates**
```bash
# Push to GitHub
git add .
git commit -m "Update frontend"  
git push origin main

# Netlify auto-deploys from main branch
```

### **Environment Variable Changes**
- **Render**: Update in dashboard, then redeploy
- **Netlify**: Update in dashboard, then redeploy

## ✅ **Deployment Success Checklist**

- [ ] Backend deployed successfully on Render
- [ ] Frontend deployed successfully on Netlify
- [ ] Environment variables set correctly
- [ ] CORS allows only Netlify domain
- [ ] JWT tokens working (7-minute expiry)
- [ ] Refresh tokens working (HTTP-only cookies)
- [ ] Admin login works
- [ ] All API endpoints accessible
- [ ] No secret keys exposed in frontend
- [ ] HTTPS working on both domains
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring and logging active

Your secure temple management system is now live! 🏛️✨

**URLs:**
- **Frontend**: https://heroic-elf-ec8175.netlify.app
- **Backend**: https://temple-management-system-3p4x.onrender.com
- **API Docs**: https://temple-management-system-3p4x.onrender.com/docs
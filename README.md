# Temple Management System

A comprehensive web application for managing temple operations, rituals, events, bookings, and administrative tasks.

## 🔐 **Enterprise-Grade Security**

- **JWT Authentication**: Short-lived tokens (7 minutes) with automatic refresh
- **No Secret Exposure**: Backend secrets never reach frontend
- **Client Binding**: Tokens bound to specific IP + User-Agent
- **HTTP-Only Cookies**: Refresh tokens protected from XSS
- **CORS Protection**: Only Netlify domain allowed
- **HTTPS Enforced**: All communication encrypted

## ✨ **Features**

- **Ritual Management**: Book and manage temple rituals
- **Event Management**: Create and organize temple events  
- **Admin Dashboard**: Administrative interface with role-based access
- **Gallery**: Photo and media management
- **Calendar Integration**: Temple calendar and scheduling
- **Stock Management**: Inventory tracking

## Quick Start

1. **Setup Environment Variables**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories
   - Configure database URLs and API secret keys

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8080
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/docs

## 📚 **Documentation**

- `JWT_SECURITY_IMPLEMENTATION.md` - Complete security guide
- `RENDER_NETLIFY_DEPLOYMENT.md` - Deployment instructions
- `PRODUCTION_SECURITY.md` - Production security configuration
- `API_Security_Documentation.md` - Legacy security docs

## 🚀 **Production Ready**

✅ **Deployed URLs:**
- **Frontend**: https://heroic-elf-ec8175.netlify.app
- **Backend**: https://temple-management-system-3p4x.onrender.com

✅ **Security Features:**
- JWT tokens with 7-minute expiry
- Client binding (IP + User-Agent)
- HTTP-only refresh token cookies
- CORS restricted to Netlify domain
- No secret keys in frontend code
- HTTPS enforced everywhere

✅ **All Vulnerabilities Mitigated:**
- Secret key exposure ❌
- Session hijacking ❌  
- XSS attacks ❌
- CSRF attacks ❌
- Token replay ❌
- CORS abuse ❌
- Network interception ❌

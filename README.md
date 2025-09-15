# Mobile Shop UI with Admin Panel

A modern e-commerce mobile shop interface with a secure admin panel, featuring NeonDB integration and image storage.

## ✨ Features

### **Customer Shop (index.html)**
- 🛍️ **Mobile-First Design**: Optimized for mobile shopping experience
- 🔍 **Product Search**: Real-time search with Lottie animations
- ⚡ **Skeleton Loading**: Smooth loading experience with shimmer effects
- 📱 **Responsive**: Works perfectly on all screen sizes
- 🎨 **Modern UI**: Glassmorphism design with Inter font

### **Admin Panel (admin.html)**
- 🔐 **Password Protection**: Secure admin access (Password: `Prem4422`)
- 🗃️ **Real Database**: NeonDB PostgreSQL for persistent storage
- 📸 **Image Management**: Upload/store images directly in database (BYTEA)
- ⚡ **Image Optimization**: Auto-compression and resizing with Sharp
- 📊 **CRUD Operations**: Add, edit, delete, and toggle product status
- 🔄 **Real-time Updates**: Instant UI updates with toast notifications
- 📱 **Mobile Admin**: FAB (Floating Action Button) for mobile product creation
- 🎯 **Smart Caching**: ETag and cache headers for fast image loading

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
node server.js
```

### 3. Access the Applications
- **Main Shop**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html (Password: `Prem4422`)

## 📦 One-Click Deployment

### **🌟 Deploy to Cloudflare Pages**

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/your-repo-name)

**Step-by-step:**

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```

2. **Deploy to Cloudflare**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Connect to Git"
   - Select your repository
   - **Build settings**:
     - Framework preset: `None`
     - Build command: `npm install`
     - Output directory: `/` (root)
   - **Environment Variables** (in Pages settings):
     ```
     NODE_ENV=production
     DATABASE_URL=your_neon_db_connection_string
     ```

3. **Database Setup**:
   - Your NeonDB is already configured in the code
   - Database will auto-initialize on first run
   - No additional setup needed!

### **Alternative Deployment Options**

#### **🚀 Vercel (1-click)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo-name)

#### **🌊 Netlify (1-click)**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/your-repo-name)

#### **🔥 Railway (1-click)**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-username/your-repo-name)

## 🗄️ Database Schema

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price VARCHAR(50),
  image_data BYTEA,              -- Compressed image stored in DB
  image_mimetype VARCHAR(100),   -- Image content type
  image_filename VARCHAR(255),   -- Original filename
  image_url VARCHAR(500),        -- Legacy support
  sold_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/products` | Add new product (with image upload) |
| `PUT` | `/api/products/:id` | Update product or toggle sold_out |
| `DELETE` | `/api/products/:id` | Delete product and its image |
| `GET` | `/api/products/:id/image` | Serve product image from database |

## 💻 Technology Stack

### **Frontend**
- **HTML5/CSS3**: Modern semantic markup
- **Vanilla JavaScript**: No framework dependencies
- **Lottie Animations**: Smooth loading states
- **Intersection Observer**: Lazy loading
- **Progressive Enhancement**: Works without JS

### **Backend**
- **Node.js + Express**: Fast and lightweight
- **Sharp**: Image compression and optimization
- **Multer**: File upload handling
- **CORS**: Cross-origin support

### **Database & Storage**
- **NeonDB**: Serverless PostgreSQL
- **BYTEA Storage**: Images stored directly in database
- **ETag Caching**: Optimized image delivery

### **Security**
- **Session Authentication**: Password protection
- **File Validation**: Image type and size limits
- **SQL Injection Protection**: Parameterized queries

## 🎨 Design Features

- **Glassmorphism UI**: Modern frosted glass effects
- **Inter Font**: Professional typography
- **Custom Scrollbars**: Styled for all browsers
- **Skeleton Loading**: Shimmer effects during load
- **Toast Notifications**: User feedback system
- **Mobile-First**: Responsive breakpoints

## 🔒 Security & Performance

- **Image Compression**: Auto-resize to 800px max, 80% quality
- **Cache Headers**: 24-hour browser caching
- **Lazy Loading**: Images load on scroll
- **File Size Limits**: 5MB upload maximum
- **Password Protection**: Admin panel security
- **Database Validation**: Server-side input validation

## 📝 Usage Guide

### **Customer Experience**
1. Browse products with smooth loading
2. Search products in real-time
3. View product details and pricing
4. Mobile-optimized interface

### **Admin Management**
1. **Login**: Enter password `Prem4422`
2. **Add Products**: Use desktop form or mobile FAB
3. **Upload Images**: Drag & drop or click to select
4. **Manage Inventory**: Toggle sold-out status
5. **Delete Products**: Remove with confirmation

## 🌐 Environment Variables

Create a `.env` file (optional):
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_G2QtcmBkZ0Ra@ep-shy-sea-a1pxx7rd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for modern e-commerce experiences**
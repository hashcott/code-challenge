# 🚀 Deployment Guide - Render.com

Hướng dẫn deploy Express TypeScript CRUD API lên Render.com

## 📋 Yêu cầu

- Tài khoản Render.com
- Repository GitHub/GitLab
- Node.js 18+ (được cấu hình trong Dockerfile)

## 🔧 Các file deployment đã tạo

### 1. Dockerfile
- Sử dụng Node.js 18 Alpine
- Multi-stage build để tối ưu kích thước
- Security: non-root user
- Health check endpoint

### 2. render.yaml
- Cấu hình service cho Render
- Environment variables
- Build và start commands
- Health check path

### 3. Scripts
- `scripts/deploy.sh`: Build script tự động
- `env.example`: Template environment variables

## 🚀 Cách deploy

### Phương pháp 1: Sử dụng Render Dashboard

1. **Đăng nhập Render Dashboard**
   - Truy cập https://dashboard.render.com
   - Đăng nhập với GitHub/GitLab

2. **Tạo Web Service mới**
   - Click "New +" → "Web Service"
   - Connect repository
   - Chọn branch (thường là `main`)

3. **Cấu hình Service**
   ```
   Name: express-typescript-crud-api
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render sẽ tự động build và deploy

### Phương pháp 2: Sử dụng render.yaml

1. **Push code lên repository**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Tạo service từ render.yaml**
   - Render sẽ tự động detect file `render.yaml`
   - Sử dụng cấu hình có sẵn

### Phương pháp 3: Sử dụng Docker

1. **Build Docker image**
   ```bash
   docker build -t express-crud-api .
   ```

2. **Test locally**
   ```bash
   docker run -p 3000:3000 express-crud-api
   ```

3. **Deploy to Render**
   - Sử dụng Dockerfile có sẵn
   - Render sẽ build và run container

## 🔍 Kiểm tra deployment

### Health Check
```bash
curl https://your-app-name.onrender.com/health
```

### API Endpoints
- **Base URL**: `https://your-app-name.onrender.com`
- **Health**: `/health`
- **Users API**: `/api/users`
- **Admin API**: `/api/admin`
- **Documentation**: `/api-docs`

### Test API
```bash
# Create user
curl -X POST https://your-app-name.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'

# Get users
curl https://your-app-name.onrender.com/api/users

# Health check
curl https://your-app-name.onrender.com/health
```

## ⚙️ Cấu hình nâng cao

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
DB_PATH=./database.sqlite
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Custom Domain
1. Vào service settings
2. Add custom domain
3. Cấu hình DNS records

### SSL Certificate
- Render tự động cung cấp SSL
- HTTPS được enable mặc định

## 🐛 Troubleshooting

### Build Errors
```bash
# Check build logs
# Common issues:
# - Node version mismatch
# - Missing dependencies
# - TypeScript compilation errors
```

### Runtime Errors
```bash
# Check application logs
# Common issues:
# - Port binding errors
# - Database connection issues
# - Environment variables missing
```

### Performance Issues
- Monitor CPU/Memory usage
- Check database performance
- Optimize queries
- Use caching if needed

## 📊 Monitoring

### Render Dashboard
- Real-time logs
- Performance metrics
- Error tracking
- Uptime monitoring

### Application Health
- Health check endpoint: `/health`
- Database stats: `/api/admin/database/stats`
- Performance monitoring: `/api/admin/database/analyze`

## 🔄 CI/CD Pipeline

### Automatic Deployments
- Push to main branch → Auto deploy
- Pull request → Preview deployment
- Rollback capabilities

### Manual Deployments
- Deploy specific commits
- Deploy from different branches
- Blue-green deployments

## 💰 Cost Optimization

### Free Tier Limits
- 750 hours/month
- Sleep after 15 minutes idle
- Limited resources

### Paid Plans
- Always-on instances
- More resources
- Custom domains
- Priority support

## 📚 Tài liệu tham khảo

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node)
- [Docker on Render](https://render.com/docs/docker)
- [Environment Variables](https://render.com/docs/environment-variables)

## 🆘 Support

Nếu gặp vấn đề:
1. Check Render dashboard logs
2. Verify environment variables
3. Test locally với Docker
4. Contact Render support

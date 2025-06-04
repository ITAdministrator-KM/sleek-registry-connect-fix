# Deployment Checklist for dskalmunai.lk

## Backend Setup
1. Ensure database connection is working:
   - Database host: 162.214.204.205
   - Database name: dskalmun_appDSK
   - Database user: dskalmun_Admin
   - Check connection in cPanel's phpMyAdmin

2. Upload backend files:
   ```
   /backend/
   ├── api/
   ├── config/
   ├── utils/
   └── vendor/
   ```

3. Verify file permissions:
   - Set directories to 755
   - Set files to 644
   - Keep config files secure

4. Check .htaccess configuration:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php [QSA,L]

   # Add CORS headers
   Header set Access-Control-Allow-Origin "*"
   Header set Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS"
   Header set Access-Control-Allow-Headers "Content-Type, Authorization"
   ```

## Frontend Setup
1. Build the frontend:
   ```bash
   npm run build
   ```

2. Upload dist files to public_html:
   - Upload all files from dist/ to the root
   - Keep index.html in the root
   - Assets should be in /assets/

3. Configure cPanel:
   - Set document root to public_html
   - Enable HTTPS/SSL
   - Configure error pages

## Testing Checklist
1. Test login functionality:
   - Admin login
   - Staff login
   - Public user login

2. Verify API endpoints:
   - Check all API endpoints are accessible
   - Verify CORS is working
   - Test file uploads

3. Database operations:
   - Test CRUD operations
   - Verify data persistence
   - Check error handling

## Troubleshooting
1. Check server error logs in cPanel
2. Verify PHP version and extensions
3. Test database connection
4. Clear browser cache and cookies
5. Check network requests in browser dev tools

## Security Checklist
1. Remove development files
2. Secure config files
3. Update passwords
4. Enable SSL/HTTPS
5. Set proper file permissions

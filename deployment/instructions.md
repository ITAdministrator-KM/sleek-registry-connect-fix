
# DSK Web Application Deployment Instructions

## Prerequisites
- cPanel hosting account with PHP 7.4+ and MySQL support
- File Manager or FTP access
- Domain: rapp.dskalmunai.lk

## Backend Deployment

### 1. Database Setup
1. Log into cPanel
2. Go to MySQL Databases
3. Create database: `dskalmun_appDSK`
4. Create user: `dskalmun_Admin` with password: `Itadmin@1993`
5. Assign user to database with ALL PRIVILEGES
6. Import the SQL file: `database/dsk_database.sql`

### 2. PHP Files Upload
1. Upload entire `backend` folder to your web root (public_html)
2. Ensure folder structure:
```
public_html/
└── backend/
    ├── config/
    │   ├── database.php
    │   └── cors.php
    ├── api/
    │   ├── auth/
    │   │   └── login.php
    │   ├── departments/
    │   │   └── index.php
    │   ├── divisions/
    │   │   └── index.php
    │   └── users/
    │       └── index.php
    └── uploads/ (create this folder for file uploads)
```

### 3. File Permissions
Set proper permissions:
- Folders: 755
- PHP files: 644
- uploads folder: 777

### 4. Test Backend API
Visit: https://rapp.dskalmunai.lk/backend/api/departments/index.php
Should return JSON response.

## Frontend Deployment

### 1. Build the React Application
```bash
npm run build
```

### 2. Upload Frontend Files
1. Upload all files from `dist` folder to public_html
2. Ensure index.html is in the root

### 3. Configure Routing (if needed)
Create `.htaccess` file in public_html:
```apache
RewriteEngine On
RewriteBase /

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# CORS Headers for API
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

## Configuration

### Update API URL
In `src/services/api.ts`, update the API_BASE_URL:
```typescript
const API_BASE_URL = 'https://rapp.dskalmunai.lk/backend/api';
```

### SSL Certificate
Ensure SSL is enabled for your domain in cPanel.

## Default Login Credentials

After deployment, you can log in with:
- **Username:** admin
- **Password:** password (default - change immediately)
- **Role:** Administrator

## Security Recommendations

1. **Change Default Password:**
   - Log in as admin
   - Go to Account Settings
   - Change the password immediately

2. **Database Security:**
   - Use strong passwords
   - Limit database user privileges if possible
   - Enable SSL for database connections

3. **File Security:**
   - Set proper file permissions
   - Regularly update PHP version
   - Monitor server logs

## Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check database credentials in `backend/config/database.php`
   - Verify database and user exist in cPanel

2. **CORS Errors:**
   - Ensure `.htaccess` is properly configured
   - Check server logs for specific errors

3. **API Not Working:**
   - Verify PHP version (7.4+ required)
   - Check file permissions
   - Enable error reporting temporarily

4. **Login Issues:**
   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible
   - Check database for user records

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server error logs in cPanel
3. Verify all file paths and permissions
4. Test API endpoints directly

## Backup

Regular backups recommended:
- Database: Use cPanel backup tools
- Files: Download via File Manager or FTP
- Store backups securely off-site

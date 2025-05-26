
# DSK Web Application - cPanel Deployment Guide

## Prerequisites
- cPanel hosting account with PHP and MySQL support
- PHP 7.4 or higher
- MySQL database access
- File Manager or FTP access

## Step 1: Database Setup

1. **Create MySQL Database**
   - Login to cPanel
   - Go to "MySQL Databases"
   - Create database: `dskalmun_appDSK`
   - Create user: `dskalmun_Admin` with password: `Itadmin@1993`
   - Add user to database with ALL PRIVILEGES

2. **Import Database Structure**
   - Go to phpMyAdmin
   - Select your database
   - Import both SQL files:
     - `database/dsk_database.sql`
     - `database/dsk_database_updated.sql`

## Step 2: Upload Files

1. **Upload Backend Files**
   - Upload entire `backend` folder to your domain root
   - Ensure the structure is: `yourdomain.com/backend/`

2. **Upload Frontend Build**
   - Build the React application: `npm run build`
   - Upload all files from `dist` folder to your domain root
   - Ensure `index.html` is in the root directory

3. **File Permissions**
   - Set 755 permissions for all directories
   - Set 644 permissions for all files
   - Set 755 permissions for PHP files

## Step 3: Configuration

1. **Update Database Connection**
   - Edit `backend/config/database.php`
   - Update host, database name, username, and password

2. **Update API URLs**
   - In the frontend, update API_BASE_URL in `src/services/api.ts`
   - Change to: `https://rapp.dskalmunai.lk/backend/api`

3. **Configure .htaccess**
   - Upload the provided `.htaccess` file to your domain root
   - This ensures proper routing for the React app

## Step 4: Testing

1. **Test Database Connection**
   - Visit: `yourdomain.com/backend/api/auth/login.php`
   - Should return a proper JSON response

2. **Test Frontend**
   - Visit your domain
   - The DSK landing page should load
   - Test login with: admin/password

## Step 5: SSL Certificate

1. **Enable SSL**
   - In cPanel, go to "SSL/TLS"
   - Enable "Force HTTPS Redirect"
   - Install SSL certificate (Let's Encrypt recommended)

## Default Login Credentials

- **Admin**: username: `admin`, password: `password`
- **Role**: Administrator

## API Endpoints

- Auth: `/backend/api/auth/login.php`
- Users: `/backend/api/users/index.php`
- Departments: `/backend/api/departments/index.php`
- Divisions: `/backend/api/divisions/index.php`
- Public Users: `/backend/api/public-users/index.php`
- Tokens: `/backend/api/tokens/index.php`

## Required PHP Extensions

- PDO
- PDO_MySQL
- JSON
- GD (for image processing)
- cURL

## Troubleshooting

1. **Database Connection Issues**
   - Check database credentials in `backend/config/database.php`
   - Ensure database user has proper privileges

2. **CORS Issues**
   - Check `backend/config/cors.php`
   - Ensure proper headers are set

3. **File Upload Issues**
   - Check PHP upload limits
   - Ensure proper file permissions

4. **Routing Issues**
   - Verify `.htaccess` file is uploaded
   - Check if mod_rewrite is enabled

## Maintenance

1. **Database Backups**
   - Regular backups via cPanel or phpMyAdmin
   - Store backups securely

2. **File Backups**
   - Regular file system backups
   - Include uploaded documents and images

3. **Security Updates**
   - Keep PHP updated
   - Regular security patches
   - Monitor for unauthorized access

## Support

For technical support or issues:
- Check error logs in cPanel
- Review PHP error logs
- Contact hosting provider for server-related issues

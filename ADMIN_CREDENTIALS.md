# Admin Portal Access

## Overview
The admin portal provides comprehensive management tools for:
- **User Management**: Full CRUD operations for all users
- **Subscriptions & Orders**: View all transactions, credit purchases, and usage
- **Analytics Dashboard**: Business insights, revenue tracking, and filing statistics

## Admin Routes
- `/admin/dashboard` - Main admin overview with filing validation
- `/admin/users` - User management (create, edit, delete, role changes)
- `/admin/subscriptions` - Subscription and order management
- `/admin/analytics` - Comprehensive analytics with charts

## Admin Login Credentials

### Primary Admin Account
**Email**: `admin@promptsubmissions.com`  
**Password**: `Admin123!` *(temporary - please change after first login)*  
**Role**: admin  
**Credits**: 1000  

### Alternative Admin Accounts
The following admin accounts also exist in the system:
- `admin2@promptsubmissions.com`
- `testadmin@test.com`
- `superadmin@promptsubmissions.com`

## How to Create New Admin Users

### Method 1: Via Admin UI (Recommended)
1. Log in with an existing admin account
2. Navigate to `/admin/users`
3. Click "Add User"
4. Fill in user details and select role = "admin"
5. Click "Create User"

### Method 2: Via SQL (Direct)
```sql
INSERT INTO users (email, password, full_name, role, credits) 
VALUES (
  'newadmin@example.com',
  -- Use hashed password (run hashPassword function)
  'HASHED_PASSWORD_HERE',
  'New Admin User',
  'admin',
  1000
);
```

### Method 3: Via API (Programmatic)
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123!",
    "fullName": "New Admin",
    "role": "admin"
  }'
```

## Admin Features

### User Management
- View all users with role filtering (director, accountant, admin)
- Create new users with custom roles and initial credits
- Edit user details (name, role, credits)
- Delete users (with confirmation)
- Bulk operations support

### Subscription Management
- View all credit transactions (purchases and deductions)
- Monitor total revenue and order statistics
- Track credit issuance and usage
- View all credit packages and their pricing
- Filter transactions by type

### Analytics Dashboard
- **Key Metrics**: Total users, filings, revenue, companies
- **Revenue Analytics**: Daily revenue trends, average order value
- **User Activity**: New user signups over time
- **Filing Analytics**: Submission rates, filing types distribution
- **Visual Charts**: Line charts, bar charts, pie charts
- **Time Range Filtering**: 7/30/90 days

## Security Notes

1. **Admin-Only Access**: All `/api/admin/*` routes are protected with `isAdmin` middleware
2. **Session Management**: Uses PostgreSQL-backed sessions with 7-day TTL
3. **Password Security**: Passwords are hashed using scrypt before storage
4. **Role Verification**: Double-checks user role on every admin request
5. **Audit Trail**: All admin actions should be logged (implement as needed)

## First Login Steps

1. Navigate to the login page
2. Enter admin credentials:
   - Email: `admin@promptsubmissions.com`
   - Password: `Admin123!`
3. After successful login, you'll see the admin menu in the sidebar
4. Change your password via User Profile settings
5. Review user list and analytics

## Troubleshooting

### Cannot Access Admin Routes
- Verify user role is set to 'admin' in database
- Check if session is active (try refreshing)
- Call `/api/refresh-session` if role was recently changed

### Admin Menu Not Showing
- Clear browser cache and cookies
- Verify `user.role === 'admin'` in browser console
- Re-login to refresh session data

### API Errors
- Check server logs for detailed error messages
- Verify admin middleware is properly configured
- Ensure database connection is active

## Support

For additional admin access or issues:
1. Check server logs in `/tmp/logs/`
2. Review session data in PostgreSQL `sessions` table
3. Verify admin routes are registered in `server/routes.ts`

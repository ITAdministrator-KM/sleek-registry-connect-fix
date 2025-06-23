# Token Display System - Complete Implementation Guide

## 1. File Structure for Token Display Integration

```
src/
├── components/
│   ├── display/
│   │   ├── PublicTokenDisplay.tsx          # Main display component
│   │   ├── TokenDisplayLauncher.tsx        # Staff launcher for display
│   │   ├── DepartmentTokenCard.tsx         # Individual department display
│   │   ├── DivisionTokenRow.tsx            # Division token row
│   │   └── TokenStatusIndicator.tsx        # Visual status indicators
│   ├── staff/
│   │   └── TokenManagement.tsx             # Staff token management
│   └── tokens/
│       ├── TokenGenerator.tsx              # Generate tokens
│       ├── TokenList.tsx                   # List active tokens
│       └── TokenControls.tsx               # Call/Complete tokens
├── pages/
│   ├── StaffDashboard.tsx                  # Staff interface
│   └── PublicDisplay.tsx                   # Public TV display
├── services/
│   ├── displayService.ts                   # Display API service
│   └── tokenService.ts                     # Token management service
└── hooks/
    └── useTokenDisplay.ts                  # Custom hook for display

backend/
├── api/
│   ├── display/
│   │   ├── current-tokens.php              # Get current tokens
│   │   ├── department-status.php           # Department overview
│   │   └── token-updates.php               # Real-time updates
│   ├── tokens/
│   │   ├── index.php                       # CRUD operations
│   │   ├── update-status.php               # Update token status
│   │   └── generate.php                    # Generate new tokens
│   └── departments/
│       └── divisions.php                   # Get dept/division data
```

## 2. Frontend Interface Design

### Main Display Layout (TV Screen)
- **Header**: Department name + current time
- **Department Cards**: Grid layout showing each department
- **Division Rows**: Each division shows:
  - Division name
  - Currently serving token (large, highlighted)
  - Next 3-5 waiting tokens (smaller)
  - Queue count

### Visual Hierarchy
- **Currently Serving**: Large green card with animation
- **Waiting Tokens**: Yellow/orange cards in sequence
- **Department Headers**: Blue background with white text
- **Status Indicators**: Color-coded dots (🟢 serving, 🟡 waiting, 🔴 delayed)

## 3. Backend API Endpoints

### GET /api/display/current-tokens.php
```php
// Returns all active tokens for display
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": 1,
        "name": "Administrative Division",
        "divisions": [
          {
            "id": 1,
            "name": "Permits & Licenses",
            "current_token": {
              "id": 123,
              "token_number": "A001",
              "status": "serving",
              "called_at": "2024-01-15 10:30:00"
            },
            "waiting_tokens": [
              {"token_number": "A002", "status": "waiting"},
              {"token_number": "A003", "status": "waiting"}
            ],
            "queue_count": 5
          }
        ]
      }
    ],
    "last_updated": "2024-01-15 10:35:00"
  }
}
```

### PUT /api/tokens/update-status.php
```php
// Update token status (called, serving, completed)
{
  "token_id": 123,
  "status": "called|serving|completed",
  "staff_id": 456
}
```

## 4. Data Flow & Communication

### Polling Strategy (Recommended)
- Display page polls every 5-10 seconds
- Staff interface updates immediately on actions
- Backend caches frequent queries

### WebSocket Alternative (Advanced)
- Real-time updates using WebSocket
- Requires additional server setup
- Better for high-traffic scenarios

### Implementation:
```javascript
// useTokenDisplay.ts
const useTokenDisplay = () => {
  const [tokens, setTokens] = useState([]);
  
  useEffect(() => {
    const fetchTokens = async () => {
      const response = await displayService.getCurrentTokens();
      setTokens(response.data);
    };
    
    fetchTokens();
    const interval = setInterval(fetchTokens, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return { tokens };
};
```

## 5. Deployment & Configuration (cPanel)

### Domain Setup
1. Create subdomain: `display.yourdomain.com`
2. Point to same document root as main app
3. Configure .htaccess for routing

### File Upload
1. Upload React build files to public_html/
2. Upload PHP API files to backend/api/
3. Configure database connections

### Database Updates
```sql
-- Add display-specific columns to tokens table
ALTER TABLE tokens 
ADD COLUMN display_priority INT DEFAULT 0,
ADD COLUMN estimated_time INT DEFAULT NULL,
ADD COLUMN called_by_staff_id INT NULL;

-- Create display_settings table
CREATE TABLE display_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 6. Running Both Interfaces Simultaneously

### Single PC Setup
1. **Main Browser Window**: Staff Dashboard
   - Full token management interface
   - Normal browser window with all controls

2. **Second Browser Window**: Public Display
   - Full-screen mode (F11)
   - URL: `https://yourdomain.com/display`
   - Auto-refresh enabled

### Browser Configuration
```javascript
// Launch display from staff dashboard
const openDisplayWindow = () => {
  const displayWindow = window.open(
    '/display',
    'TokenDisplay',
    'width=1920,height=1080,fullscreen=yes'
  );
  
  // Keep display always on top (if supported)
  displayWindow.focus();
};
```

### Hardware Recommendations
- **Monitor Setup**: Extended display or dual monitor
- **Browser**: Chrome/Firefox with hardware acceleration
- **Network**: Stable internet for API calls
- **Backup**: Offline mode with cached data

## 7. Example Component Structures

### DepartmentTokenCard.tsx
```typescript
interface DepartmentTokenCardProps {
  department: Department;
  divisions: Division[];
  currentTokens: Token[];
}

const DepartmentTokenCard: React.FC<DepartmentTokenCardProps> = ({
  department,
  divisions,
  currentTokens
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        {department.name}
      </h2>
      {divisions.map(division => (
        <DivisionTokenRow
          key={division.id}
          division={division}
          tokens={currentTokens.filter(t => t.division_id === division.id)}
        />
      ))}
    </div>
  );
};
```

### TokenStatusIndicator.tsx
```typescript
const TokenStatusIndicator: React.FC<{status: TokenStatus}> = ({ status }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'serving': return 'bg-green-500 animate-pulse';
      case 'called': return 'bg-yellow-500 animate-bounce';
      case 'waiting': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return <div className={`w-4 h-4 rounded-full ${getStatusColor()}`} />;
};
```

## 8. Maintenance & Monitoring

### Error Handling
- Graceful degradation when API fails
- Cache last known state
- Display connection status

### Performance Optimization
- Minimize API calls
- Use efficient database queries
- Implement caching strategy

### Monitoring
- Log API response times
- Track display uptime
- Monitor token processing rates

This structure ensures your token display system integrates seamlessly with your existing application while maintaining clear separation of concerns and easy maintenance.

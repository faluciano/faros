# System Architecture

## Overview

Faros is a full-stack web application for tracking lighthouse visits and connecting with other lighthouse enthusiasts. The system follows a clean architecture pattern with clear separation between frontend, backend, and data layers.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Go API)      │◄──►│   (Turso/SQLite)│
│                 │    │                 │    │                 │
│ - User Interface│    │ - REST API      │    │ - User Data     │
│ - State Mgmt    │    │ - Authentication│    │ - Lighthouse DB │
│ - API Client    │    │ - Business Logic│    │ - Relationships │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   Clerk Auth    │
         └──────────────►│   (External)    │
                        └─────────────────┘
```

## Backend Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────┐
│                 HTTP Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Lighthouse  │ │    User     │ │   Friends   ││
│  │  Handler    │ │   Handler   │ │   Handler   ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│                Business Logic                    │
│  ┌─────────────────────────────────────────────┐│
│  │            Interfaces Layer                 ││
│  │          (DBInterface)                      ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│                Data Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Lighthouse  │ │    User     │ │   Friends   ││
│  │     DB      │ │     DB      │ │     DB      ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘
```

### Key Components

#### Handlers
- **LighthouseHandler**: Manages lighthouse-related operations
- **UserHandler**: Handles user profiles and lighthouse visits
- **FriendsHandler**: Manages social features and friend relationships

#### Interfaces
- **DBInterface**: Defines database operations contract
- Enables dependency injection and testability
- Abstracts database implementation details

#### Database Layer
- **Turso** (production): SQLite in the cloud
- **SQLite** (local): File-based database for development
- Connection pooling and transaction management

#### Middleware
- **CORS**: Cross-origin resource sharing
- **Authentication**: Clerk JWT validation
- **Error Handling**: Consistent error responses

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── lighthouses/   # Lighthouse management
│   │   ├── friends/       # Social features
│   │   └── map/          # Map visualizations
│   └── layout/           # Layout components
├── context/              # React contexts
│   ├── UserContext       # User state management
│   └── LighthouseContext # Lighthouse data
├── hooks/                # Custom React hooks
│   ├── useApi           # API communication
│   ├── useUser          # User operations
│   └── useLighthouse    # Lighthouse operations
└── utils/                # Utility functions
    ├── api.ts           # API client
    └── map.ts           # Map utilities
```

### State Management
- **React Context**: Global state for user and lighthouse data
- **Custom Hooks**: Encapsulate business logic and API calls
- **Local State**: Component-specific state management

## Data Flow

### Public Lighthouse Access Flow
```
1. User visits application (no authentication required)
2. Frontend requests lighthouse data from public API
3. Backend serves lighthouse data without authentication
4. Map displays all lighthouses to any visitor
5. Interactive features require authentication
```

### User Authentication Flow
```
1. User logs in via Clerk for personalized features
2. Frontend receives JWT token
3. Token included in authenticated API requests
4. Backend validates token with Clerk for protected routes
5. User context extracted from claims for personalized data
```

### API Request Flow
```
1. Frontend component triggers action
2. Custom hook handles API call
3. Public routes: Direct API call (no auth headers)
4. Protected routes: API client adds authentication headers
5. Backend handler receives request
6. Public routes: Process immediately
7. Protected routes: Middleware validates authentication
8. Handler processes business logic
9. Database layer executes queries
10. Response sent back to frontend
11. Context/state updated
12. UI re-renders with new data
```

## Security Architecture

### Public Access
- **Lighthouse Data**: Publicly accessible without authentication
- **Map Visualization**: Available to all visitors
- **Basic Browse Functionality**: No login required

### Authentication
- **Clerk Integration**: External authentication service for personalized features
- **JWT Tokens**: Stateless authentication for protected routes
- **Header-based Auth**: Bearer token in Authorization header

### Authorization
- **Public Routes**: Lighthouse data accessible to everyone
- **Protected Routes**: Authentication middleware on user-specific endpoints
- **User Context**: Access control based on authenticated user
- **Data Isolation**: Users can only access their own personal data (visits, wishlist, friends)

### Data Protection
- **Input Validation**: Query parameter validation and sanitization
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin access

## Deployment Architecture

### Development
```
Developer Machine
├── Frontend (localhost:5173)
│   ├── Public: Lighthouse map and data
│   └── Protected: User features (login required)
├── Backend (localhost:8080)
│   ├── Public API: /api/lighthouses
│   └── Protected API: /user/* endpoints
└── Database (SQLite file)
    ├── Public: Lighthouse data
    └── Private: User data, visits, friendships
```

### Production
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Azure Static  │    │   Cloud Host    │    │     Turso       │
│   Web Apps      │◄──►│   (Backend)     │◄──►│   Database      │
│   (Frontend)    │    │                 │    │                 │
│                 │    │ Public Routes:  │    │ Public Data:    │
│ - Public Map    │    │ /api/lighthouses│    │ - Lighthouses   │
│ - Auth Features │    │                 │    │                 │
│                 │    │ Protected:      │    │ Private Data:   │
│                 │    │ /user/*         │    │ - User profiles │
│                 │    │ /users/search   │    │ - Visits        │
│                 │    │                 │    │ - Friendships   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Schema

### Public Tables
- **lighthouses**: Lighthouse information and locations (publicly accessible)

### Private Tables  
- **users**: User profiles and metadata (authentication required)
- **user_visited_lighthouses**: User visit tracking (user-specific)
- **user_wishlist**: User wishlist management (user-specific)
- **friends**: Friend relationships (user-specific)
- **friend_requests**: Pending friend requests (user-specific)

### Relationships
- Public: No user relationships required for lighthouse data
- Private: One-to-many: User → Visits, User → Wishlist
- Private: Many-to-many: Users ↔ Friends (via friend relationships)

## Performance Considerations

### Backend
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed database queries
- **Caching Strategy**: Potential for Redis caching layer

### Frontend
- **Code Splitting**: Lazy loading of components
- **API Optimization**: Efficient data fetching patterns
- **State Management**: Minimal re-renders

## Scalability

### Horizontal Scaling
- **Stateless Backend**: Easy to scale across multiple instances
- **Database**: Turso provides global distribution
- **Frontend**: CDN distribution via Azure Static Web Apps

### Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage
- **Database Indexing**: Optimized query performance
- **Caching**: Reduce database load

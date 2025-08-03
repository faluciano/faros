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

### User Authentication Flow
```
1. User logs in via Clerk
2. Frontend receives JWT token
3. Token included in API requests
4. Backend validates token with Clerk
5. User context extracted from claims
```

### API Request Flow
```
1. Frontend component triggers action
2. Custom hook handles API call
3. API client adds authentication headers
4. Backend handler receives request
5. Middleware validates authentication
6. Handler processes business logic
7. Database layer executes queries
8. Response sent back to frontend
9. Context/state updated
10. UI re-renders with new data
```

## Security Architecture

### Authentication
- **Clerk Integration**: External authentication service
- **JWT Tokens**: Stateless authentication
- **Header-based Auth**: Bearer token in Authorization header

### Authorization
- **Route Protection**: Authentication middleware on protected endpoints
- **User Context**: Access control based on authenticated user
- **Data Isolation**: Users can only access their own data

### Data Protection
- **Input Validation**: Query parameter validation and sanitization
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin access

## Deployment Architecture

### Development
```
Developer Machine
├── Frontend (localhost:5173)
├── Backend (localhost:8080)
└── Database (SQLite file)
```

### Production
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Azure Static  │    │   Cloud Host    │    │     Turso       │
│   Web Apps      │◄──►│   (Backend)     │◄──►│   Database      │
│   (Frontend)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Schema

### Core Tables
- **users**: User profiles and metadata
- **lighthouses**: Lighthouse information and locations
- **user_visited_lighthouses**: User visit tracking
- **user_wishlist**: User wishlist management
- **friends**: Friend relationships
- **friend_requests**: Pending friend requests

### Relationships
- One-to-many: User → Visits, User → Wishlist
- Many-to-many: Users ↔ Friends (via friend relationships)

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

# AluTech ERP Frontend

React TypeScript frontend for the ERP Aluminium system.

## Features

- Modern React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication
- Lucide React for icons
- Responsive design

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── Header.tsx        # Page header with search
│   │   └── Layout.tsx        # Page layout wrapper
│   ├── dashboard/
│   │   └── KPICard.tsx       # KPI metric cards
│   ├── profiles/             # Profile management components
│   ├── orders/               # Order management components
│   └── stock/                # Stock management components
├── pages/
│   └── Dashboard.tsx         # Main dashboard page
├── services/
│   └── api.ts                # API service functions
├── types/
│   └── index.ts              # TypeScript type definitions
├── App.tsx                   # Main app component
└── index.tsx                 # Entry point
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:3001/api/v1
```

## Backend Integration

The frontend connects to the Node.js/Express backend:
- API Base URL: `http://localhost:3001/api/v1`
- Authentication: JWT tokens stored in localStorage
- CORS enabled for development

## Design System

### Colors
- Primary: `#1e3a5f` (Deep Blue)
- Secondary: `#0d9488` (Teal)
- Success: Green for positive indicators
- Warning: Orange for alerts
- Danger: Red for critical alerts

### Typography
- Font: System default / Tailwind defaults
- Size scale: xs, sm, base, lg, xl, 2xl

## Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests

## Modules Implemented

- ✅ Dashboard (Module F)
- 📝 Profiles (Module A) - Ready for implementation
- 📝 Orders (Module A) - Ready for implementation
- 📝 Stock (Module B) - Ready for implementation

## Notes

This frontend is based on the Stitch MCP designs exported from project `14269760717500464917`.
All UI components follow the specifications in the `stitch-project/` documentation.

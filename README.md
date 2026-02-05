# Job Search Dashboard

A professional, interactive dashboard for tracking job applications, managing pipeline status, and analyzing job search metrics.

## Features

- **Job tracking**: Status, priority, progression stages, and close reasons
- **Company management**: Categories, fit level, bulk actions, hide/unhide, and quick filters
- **Analytics dashboard**: Key metrics, trends, and funnel visualization
- **Import/export**: JSON backup import/export and CSV export for jobs
- **Search & filters**: Multi-select filters, date ranges, and sortable tables
- **Light/Dark theme**: Toggle between themes for comfortable viewing
- **Responsive design**: Works on desktop and tablet devices

## Technology Stack

- **React 18** - UI framework with functional components and hooks
- **Vite 5** - Fast build tool and dev server
- **Chart.js 4.4.1** - Data visualization
- **ES Modules** - Modern JavaScript module system
- **Responsive CSS** - Custom styling with CSS variables

## Project Structure

```
src/
├── main.jsx                 # Vite entry point
├── App.jsx                  # Main application component
├── components/
│   ├── charts/              # Chart components (Chart.js wrappers)
│   │   ├── ChartCard.jsx
│   │   ├── LineChartComponent.jsx
│   │   ├── DualLineChartComponent.jsx
│   │   ├── TripleLineChartComponent.jsx
│   │   ├── BarChartComponent.jsx
│   │   ├── PieChartComponent.jsx
│   │   ├── FunnelChartComponent.jsx
│   │   ├── GroupedBarChartComponent.jsx
│   │   └── index.js
│   ├── common/              # Shared UI components
│   │   ├── StatusBadge.jsx
│   │   ├── PriorityBadge.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── PerformanceMonitor.jsx
│   │   └── index.js
│   ├── dashboard/           # Analytics dashboard components
│   │   ├── AnalyticsDashboard.jsx
│   │   ├── KeyMetricsGrid.jsx
│   │   ├── InsightsPanel.jsx
│   │   ├── generateInsights.js
│   │   └── index.js
│   ├── layout/              # Layout components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── index.js
│   ├── modals/              # Modal dialogs
│   │   ├── JobModal.jsx
│   │   ├── ImportModal.jsx
│   │   ├── CompanyModal.jsx
│   │   └── index.js
│   ├── pages/               # Primary screens
│   │   ├── Companies.jsx
│   │   ├── JobsTable.jsx
│   │   ├── Stats.jsx
│   │   └── index.js
│   └── index.js             # Barrel export
├── constants/               # Application constants
│   ├── appConfig.js
│   ├── jobStatuses.js
│   ├── closeReasons.js
│   ├── progressionStages.js
│   ├── priorities.js
│   ├── fitLevels.js
│   └── index.js
├── utils/                   # Utility modules
│   ├── logger.js            # Structured logging
│   ├── performance.js       # Caching, debouncing, metrics
│   ├── security.js          # Validation, sanitization
│   ├── storage.js           # localStorage operations
│   ├── ui.js                # UI helpers
│   ├── fitLevel.js          # Fit level utilities
│   ├── analytics/           # Analytics calculations
│   │   ├── dateUtils.js
│   │   ├── coreMetrics.js
│   │   ├── timeBasedAnalytics.js
│   │   ├── companyAnalytics.js
│   │   └── index.js
│   └── index.js
└── styles/
    └── main.css             # Application styles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jburgh/job-search-dashboard.git
cd job-search-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## Data Storage

All data (jobs, companies, categories, hidden companies, and settings) is stored in your browser's localStorage. Data persists across sessions but is only stored locally on this device. Use JSON backups for migration or recovery.

## Color Scheme

- **Primary Blue**: #2563eb
- **Secondary Blue**: #3b82f6
- **Accent Hover**: #1d4ed8
- **Success**: #10b981
- **Warning**: #f59e0b

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

Personal use only.

## Author

Jill Shaheen

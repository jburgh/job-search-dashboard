# Job Search Dashboard

A professional, interactive dashboard for tracking job applications, managing pipeline status, and analyzing job search metrics.

## Features

- **Real-time metrics**: Total applications, callback rate, interview rate, and active pipeline
- **Visual analytics**: Multi-line charts for applications and response activity
- **Pipeline funnel**: Track jobs through recruitment stages
- **Company tracking**: Monitor applications by company with response rates
- **Closure analysis**: Understand why applications are closed
- **Light/Dark theme**: Toggle between themes for comfortable viewing
- **Responsive design**: Works on desktop and tablet devices

## Technology Stack

- **React 18** - UI framework
- **Chart.js 4.4.1** - Data visualization
- **Babel** - JSX compilation
- **Responsive CSS** - Custom styling with CSS variables

## Getting Started

### Prerequisites

- Node.js (optional - runs entirely in the browser)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jburgh/job-search-dashboard.git
cd job-search-dashboard
```

2. Open in your browser:
```bash
open index.html
# or simply double-click index.html in Finder
```

### Using with a local server (recommended)

For the best experience, serve the app locally:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

Then visit `http://localhost:8000` in your browser.

## Data Storage

Job data is stored in your browser's localStorage. Your data persists across sessions but is only stored locally on this device.

## Color Scheme

- **Primary Blue**: #6b8aff
- **Purple**: #8b5cf6
- **Amber**: #f59e0b
- **Green**: #10b981

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

Personal use only.

## Author

Jill Shaheen

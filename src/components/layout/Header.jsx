import React, { useState } from 'react';
import { PerformanceMonitor } from '../common';

/**
 * Header component with navigation and controls
 */
function Header({ view, setView, onBackup, onImport, lastBackupTime, theme, setTheme }) {
  const [showPerf, setShowPerf] = useState(false);
  const themeOptions = [
    { id: 'lite', label: 'Lite' },
    { id: 'dark', label: 'Dark' },
    { id: 'neon80s', label: '80s' },
    { id: 'suede', label: 'Suede' },
    { id: 'meow', label: 'Meow 🐱' },
    { id: 'space', label: 'Space 🚀' }
  ];

  const daysSinceBackup = lastBackupTime
    ? Math.floor((Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const backupWarning = daysSinceBackup === null || daysSinceBackup >= 1;

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="theme-toggle">{theme === 'meow' ? '🐱' : theme === 'space' ? '🚀' : '🎯'}</div>
            <span>{theme === 'meow' ? 'Job Search Dashpurr 🐾' : theme === 'space' ? 'Job Search Launchpad' : 'Job Search Dashboard'}</span>
          </div>
          <div className="header-controls">
            <nav className="nav">
              <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Dashboard</button>
              <button className={`nav-btn ${view === "companies" ? "active" : ""}`} onClick={() => setView("companies")}>Companies</button>
              <button className={`nav-btn ${view === "jobs" ? "active" : ""}`} onClick={() => setView("jobs")}>Applications</button>
              <button
                className="nav-btn"
                onClick={onBackup}
                style={{
                  borderColor: backupWarning ? "var(--warning)" : undefined,
                  background: backupWarning ? "var(--warning-bg)" : undefined,
                  color: backupWarning ? "var(--warning-text)" : undefined
                }}
                title={lastBackupTime ? `Last backup: ${lastBackupTime.toLocaleDateString()}` : "No backup yet"}
              >
                💾 Back up {backupWarning && "⚠️"}
              </button>
              <button className="nav-btn" onClick={onImport}>📥 Import</button>
            </nav>

            <select
              className="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Theme"
            >
              {themeOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>

            <button
              className="theme-toggle"
              onClick={() => window.open('https://github.com/jburgh/job-search-dashboard', '_blank')}
              title="View on GitHub"
              style={{ fontSize: '1.2rem' }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </button>

            <button
              className="theme-toggle"
              onClick={() => setShowPerf(!showPerf)}
              title="Toggle performance metrics"
              style={{ fontSize: '1.2rem' }}
            >
              ⚡
            </button>
          </div>
        </div>
      </header>
      {showPerf && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          padding: '1rem',
          margin: '1rem auto 1rem auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '1336px',
          width: '100%',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          maxHeight: '300px',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <PerformanceMonitor />
        </div>
      )}
    </>
  );
}

export default Header;

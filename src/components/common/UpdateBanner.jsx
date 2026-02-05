import React from 'react';

/**
 * Update notification banner
 * Displayed when a new version of the app is available
 */
const UpdateBanner = ({ onDismiss, onRefresh, commitsUrl }) => {
  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <span className="update-banner-icon">&#10024;</span>
        <span>New updates available! Refresh to get the latest features.</span>
        <a
          href={commitsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="update-banner-link"
        >
          What's new?
        </a>
      </div>
      <div className="update-banner-actions">
        <button
          className="update-banner-btn update-banner-btn-dismiss"
          onClick={onDismiss}
        >
          Dismiss
        </button>
        <button
          className="update-banner-btn update-banner-btn-refresh"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;

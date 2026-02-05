import { useState, useEffect } from 'react';

/**
 * Custom hook to check for application updates using Last-Modified header
 * Compares the current page's Last-Modified time against a stored value
 */
export const useUpdateChecker = (checkIntervalMs = 5 * 60 * 1000) => {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [currentLastModified, setCurrentLastModified] = useState(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch(window.location.href, { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');

        if (lastModified) {
          setCurrentLastModified(lastModified);
          const saved = localStorage.getItem('lastModifiedTime');

          if (saved && saved !== lastModified) {
            // File has been updated
            setShowUpdateBanner(true);
          } else if (!saved) {
            // First check, just save it
            localStorage.setItem('lastModifiedTime', lastModified);
          }
        }
      } catch (error) {
        console.debug('Update check failed:', error);
      }
    };

    // Initial check on load
    checkForUpdates();

    // Check periodically
    const interval = setInterval(checkForUpdates, checkIntervalMs);

    return () => clearInterval(interval);
  }, [checkIntervalMs]);

  const dismissBanner = () => {
    setShowUpdateBanner(false);
    // Save the current version so we don't show the banner again until next update
    if (currentLastModified) {
      localStorage.setItem('lastModifiedTime', currentLastModified);
    }
  };

  const refreshPage = () => {
    if (currentLastModified) {
      localStorage.setItem('lastModifiedTime', currentLastModified);
    }
    window.location.reload();
  };

  return {
    showUpdateBanner,
    dismissBanner,
    refreshPage
  };
};

export default useUpdateChecker;

import React, { useState, useEffect } from 'react';
import './App.css';
import { VideoTimeline } from './components/VideoTimeline';
import { LicenseStatus } from './components/LicenseStatus';
import { MainMenu } from './components/MainMenu';
import { VideoPreview } from './components/VideoPreview';

function App() {
  const [currentPage, setCurrentPage] = useState<'editor' | 'import' | 'export' | 'settings'>('editor');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [licenseExpiring, setLicenseExpiring] = useState(false);

  useEffect(() => {
    checkLicenseStatus();
    const interval = setInterval(checkLicenseStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const status = await (window as any).electronAPI.getLicenseStatus();
      if (status.hoursRemaining < 24 && !status.isTrialActive) {
        setLicenseExpiring(true);
      }
    } catch (error) {
      console.error('License check error:', error);
    }
  };

  return (
    <div className="neuro-app">
      {/* Cyberpunk Background */}
      <div className="cyberpunk-bg">
        <div className="grid-overlay"></div>
        <div className="scan-lines"></div>
      </div>

      {/* License Expiry Warning */}
      {licenseExpiring && (
        <div className="license-warning">
          <div className="warning-content">
            <h2>⚠️ License Expiring Soon</h2>
            <p>Your NEURO CLIP license will expire in less than 24 hours.</p>
            <button className="btn-renew" onClick={() => {/* Open renewal dialog */}}>
              RENEW LICENSE
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h1>NEURO CLIP</h1>
        </div>
        <LicenseStatus />
      </header>

      {/* Main Content */}
      <div className="main-container">
        <aside className="sidebar">
          <MainMenu currentPage={currentPage} onPageChange={setCurrentPage} />
        </aside>

        <main className="content-area">
          {currentPage === 'editor' && videoLoaded && (
            <>
              <VideoPreview />
              <VideoTimeline />
            </>
          )}
          
          {currentPage === 'editor' && !videoLoaded && (
            <div className="import-prompt">
              <h2>Welcome to NEURO CLIP</h2>
              <p>Import a video to get started</p>
              <button className="btn-primary">+ Import Video</button>
            </div>
          )}

          {currentPage === 'import' && (
            <div>Import Panel</div>
          )}

          {currentPage === 'export' && (
            <div>Export Panel</div>
          )}

          {currentPage === 'settings' && (
            <div>Settings Panel</div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="status-bar">
          <span>Ready</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

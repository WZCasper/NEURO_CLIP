import React, { useState, useEffect } from 'react';
import './LicenseStatus.css';

interface LicenseStatusData {
  isValid: boolean;
  isTrialActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
}

export const LicenseStatus: React.FC = () => {
  const [status, setStatus] = useState<LicenseStatusData | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async () => {
    try {
      const licenseStatus = await (window as any).electronAPI.getLicenseStatus();
      setStatus(licenseStatus);
      
      const countdown = `${licenseStatus.daysRemaining}d ${licenseStatus.hoursRemaining}h ${licenseStatus.minutesRemaining}m ${licenseStatus.secondsRemaining}s`;
      setCountdown(countdown);
    } catch (error) {
      console.error('Failed to get license status:', error);
    }
  };

  if (!status) return null;

  const statusColor = status.isTrialActive ? 'trial' : status.isValid ? 'valid' : 'expired';

  return (
    <div className={`license-status ${statusColor}`}>
      <div className="status-indicator"></div>
      <div className="status-info">
        <span className="status-label">
          {status.isTrialActive ? '🎁 TRIAL' : status.isValid ? '✓ ACTIVE' : '❌ EXPIRED'}
        </span>
        <span className="countdown">{countdown}</span>
      </div>
    </div>
  );
};

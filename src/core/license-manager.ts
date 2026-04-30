import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

interface LicenseStatus {
  isValid: boolean;
  isTrialActive: boolean;
  isExpired: boolean;
  expiryDate: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
}

export class LicenseManager {
  private licenseFile = path.join(process.env.APPDATA || process.env.HOME || '', '.neuro-clip', 'license.json');
  private trialStartFile = path.join(process.env.APPDATA || process.env.HOME || '', '.neuro-clip', 'trial.json');
  private readonly TRIAL_DAYS = 7;

  constructor() {
    this.ensureLicenseDir();
  }

  private ensureLicenseDir() {
    const dir = path.dirname(this.licenseFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Validate activation code and save license
   */
  async validateActivationCode(code: string): Promise<{ success: boolean; message: string; license?: any }> {
    try {
      // TODO: Call your backend API to verify activation code
      // const response = await fetch('https://api.neuroclip.com/validate-license', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code })
      // });

      // For now, mock validation
      const licenseData = {
        code,
        activatedAt: new Date().toISOString(),
        expiryDate: this.calculateExpiryDate('1month'), // Example: 1 month
        planType: 'monthly',
        macAddress: this.getMacAddress(),
      };

      fs.writeFileSync(this.licenseFile, JSON.stringify(licenseData, null, 2));
      return { success: true, message: 'License activated successfully', license: licenseData };
    } catch (error) {
      return { success: false, message: `Activation failed: ${error}` };
    }
  }

  /**
   * Get current license status
   */
  async validateLicense(): Promise<LicenseStatus> {
    const trialStatus = this.checkTrialStatus();
    
    if (trialStatus.isActive) {
      return {
        isValid: true,
        isTrialActive: true,
        isExpired: false,
        expiryDate: trialStatus.expiryDate,
        daysRemaining: trialStatus.daysRemaining,
        hoursRemaining: trialStatus.hoursRemaining,
        minutesRemaining: trialStatus.minutesRemaining,
        secondsRemaining: trialStatus.secondsRemaining,
      };
    }

    if (!fs.existsSync(this.licenseFile)) {
      return {
        isValid: false,
        isTrialActive: false,
        isExpired: true,
        expiryDate: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        minutesRemaining: 0,
        secondsRemaining: 0,
      };
    }

    const license = JSON.parse(fs.readFileSync(this.licenseFile, 'utf-8'));
    const expiryDate = new Date(license.expiryDate);
    const now = new Date();
    const isExpired = expiryDate < now;

    const remaining = this.calculateTimeRemaining(expiryDate);

    return {
      isValid: !isExpired,
      isTrialActive: false,
      isExpired,
      expiryDate,
      ...remaining,
    };
  }

  /**
   * Get formatted countdown timer
   */
  getLicenseStatus() {
    return this.validateLicense();
  }

  /**
   * Format countdown for UI display
   */
  getCountdownTimer() {
    const status = this.validateLicense();
    return `${status.daysRemaining}d ${status.hoursRemaining}h ${status.minutesRemaining}m ${status.secondsRemaining}s`;
  }

  /**
   * Check trial status
   */
  private checkTrialStatus(): { isActive: boolean; expiryDate: Date | null; daysRemaining: number; hoursRemaining: number; minutesRemaining: number; secondsRemaining: number } {
    if (!fs.existsSync(this.trialStartFile)) {
      // First launch - start trial
      const trialData = {
        startDate: new Date().toISOString(),
      };
      fs.writeFileSync(this.trialStartFile, JSON.stringify(trialData));
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.TRIAL_DAYS);
      const remaining = this.calculateTimeRemaining(expiryDate);
      return { isActive: true, expiryDate, ...remaining };
    }

    const trialData = JSON.parse(fs.readFileSync(this.trialStartFile, 'utf-8'));
    const startDate = new Date(trialData.startDate);
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + this.TRIAL_DAYS);
    const now = new Date();
    const isActive = now < expiryDate;

    const remaining = this.calculateTimeRemaining(expiryDate);
    return { isActive, expiryDate, ...remaining };
  }

  /**
   * Calculate time remaining
   */
  private calculateTimeRemaining(expiryDate: Date) {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { daysRemaining: 0, hoursRemaining: 0, minutesRemaining: 0, secondsRemaining: 0 };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      daysRemaining: days,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      secondsRemaining: seconds,
    };
  }

  /**
   * Calculate expiry date based on plan
   */
  private calculateExpiryDate(plan: string): string {
    const date = new Date();
    
    switch (plan) {
      case '1month':
        date.setMonth(date.getMonth() + 1);
        break;
      case '3months':
        date.setMonth(date.getMonth() + 3);
        break;
      case '6months':
        date.setMonth(date.getMonth() + 6);
        break;
      case '12months':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString();
  }

  /**
   * Get machine MAC address for license binding
   */
  private getMacAddress(): string {
    // Simplified - in production, use proper MAC address detection
    return crypto.randomBytes(6).toString('hex');
  }
}

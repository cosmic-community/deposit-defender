import { ShareLink, PDFReport } from '@/types';
import { DatabaseService, db } from './database';

export class ShareService {
  private static readonly SHARE_EXPIRY_DAYS = 7;
  
  // Generate secure share token
  static generateShareToken(): string {
    return crypto.randomUUID();
  }

  // Create share link for inspection
  static async createShareLink(inspectionId: string, reportId: string): Promise<string> {
    const token = this.generateShareToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SHARE_EXPIRY_DAYS);

    const shareLink: ShareLink = {
      token,
      inspectionId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      accessed: false,
      accessCount: 0
    };

    await DatabaseService.createShareLink(shareLink);
    
    // Update report with share token
    await db.reports.update(reportId, {
      shareToken: token,
      shareExpiresAt: expiresAt.toISOString()
    });

    return this.buildShareUrl(token);
  }

  // Build shareable URL
  static buildShareUrl(token: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    return `${baseUrl}/share/${token}`;
  }

  // Validate and access share link
  static async accessShareLink(token: string): Promise<ShareLink | null> {
    try {
      const shareLink = await DatabaseService.getShareLink(token);
      
      if (!shareLink) {
        return null;
      }

      // Check if expired
      if (new Date() > new Date(shareLink.expiresAt)) {
        return null;
      }

      // Update access count
      await DatabaseService.updateShareLink(token, {
        accessed: true,
        accessCount: shareLink.accessCount + 1
      });

      return shareLink;
    } catch (error) {
      console.error('Error accessing share link:', error);
      return null;
    }
  }

  // Get report for share token
  static async getSharedReport(token: string): Promise<PDFReport | null> {
    try {
      const shareLink = await this.accessShareLink(token);
      if (!shareLink) {
        return null;
      }

      const reports = await DatabaseService.getReportsByInspection(shareLink.inspectionId);
      const report = reports && reports.length > 0 ? reports.find(r => r.shareToken === token) : null;
      
      return report || null;
    } catch (error) {
      console.error('Error getting shared report:', error);
      return null;
    }
  }

  // Share via Web Share API or fallback
  static async shareReport(shareUrl: string, title: string = 'Move-Out Inspection Report'): Promise<boolean> {
    if (navigator.share && this.isMobile()) {
      try {
        await navigator.share({
          title,
          text: 'Here is my move-out inspection report from DepositDefender',
          url: shareUrl,
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }

    // Fallback to clipboard
    return this.copyToClipboard(shareUrl);
  }

  // Copy to clipboard fallback
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  // Detect mobile device
  private static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Clean up expired share links
  static async cleanupExpiredShares(): Promise<void> {
    await DatabaseService.cleanupExpiredShareLinks();
  }

  // Revoke share link
  static async revokeShareLink(token: string): Promise<boolean> {
    try {
      await db.shareLinks.delete(token);
      
      // Remove share token from report
      const reports = await db.reports.where('shareToken').equals(token).toArray();
      for (const report of reports) {
        await db.reports.update(report.id, {
          shareToken: undefined,
          shareExpiresAt: undefined
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error revoking share link:', error);
      return false;
    }
  }

  // Get share link info
  static async getShareLinkInfo(token: string): Promise<{
    exists: boolean;
    expired: boolean;
    accessCount: number;
    expiresAt?: string;
  }> {
    try {
      const shareLink = await DatabaseService.getShareLink(token);
      
      if (!shareLink) {
        return { exists: false, expired: false, accessCount: 0 };
      }

      const expired = new Date() > new Date(shareLink.expiresAt);
      
      return {
        exists: true,
        expired,
        accessCount: shareLink.accessCount,
        expiresAt: shareLink.expiresAt
      };
    } catch (error) {
      console.error('Error getting share link info:', error);
      return { exists: false, expired: false, accessCount: 0 };
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { watch } from 'fs';

export class OBSSyncManager {
  private obsOutputPath = '';
  private watchers: Map<string, any> = new Map();

  constructor() {
    this.detectOBSPath();
  }

  /**
   * Detect OBS recording directory
   */
  private detectOBSPath() {
    const possiblePaths = [
      path.join(process.env.APPDATA || '', 'obs-studio', 'profiles'),
      path.join(process.env.HOME || '', 'Library', 'Application Support', 'obs-studio'),
      path.join(process.env.HOME || '', '.config', 'obs-studio'),
    ];

    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        this.obsOutputPath = dir;
        break;
      }
    }
  }

  /**
   * Scan and sync OBS recordings
   */
  async syncRecordings(): Promise<any[]> {
    try {
      if (!this.obsOutputPath) {
        return [];
      }

      const recordings: any[] = [];
      const configPath = path.join(this.obsOutputPath, 'global.ini');

      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf-8');
        const match = config.match(/FilePath="([^"]+)"/);
        
        if (match && fs.existsSync(match[1])) {
          const files = fs.readdirSync(match[1]);
          
          for (const file of files) {
            if (file.endsWith('.mp4') || file.endsWith('.mkv') || file.endsWith('.flv')) {
              const filePath = path.join(match[1], file);
              const stats = fs.statSync(filePath);
              
              recordings.push({
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime,
              });
            }
          }
        }
      }

      return recordings.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      console.error('OBS sync error:', error);
      return [];
    }
  }

  /**
   * Watch OBS output folder for new recordings
   */
  watchNewRecordings(callback: (files: any[]) => void) {
    if (!this.obsOutputPath) return;

    const configPath = path.join(this.obsOutputPath, 'global.ini');
    if (!fs.existsSync(configPath)) return;

    const config = fs.readFileSync(configPath, 'utf-8');
    const match = config.match(/FilePath="([^"]+)"/);
    
    if (match && fs.existsSync(match[1])) {
      const recordingDir = match[1];
      
      watch(recordingDir, async (eventType, filename) => {
        if (eventType === 'rename' || eventType === 'change') {
          const files = await this.syncRecordings();
          callback(files);
        }
      });
    }
  }
}

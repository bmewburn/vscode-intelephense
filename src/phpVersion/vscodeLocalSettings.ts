import * as fs from 'fs';
import { syncPhpVersion } from './syncPhpVersion';

export async function vscodeLocalSettings(workspaceRoot: string) {
  try {
    const vscodeDir = workspaceRoot + '/.vscode';
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }

    const settingsPath = vscodeDir + '/settings.json';
    const phpVersion = await syncPhpVersion(workspaceRoot);

    if (fs.existsSync(settingsPath)) {
      const existingSettings = fs.readFileSync(settingsPath, 'utf-8')
        .replace(
          /"intelephense\.environment\.phpVersion":\s*"[^\\"]+"/,
          `"intelephense.environment.phpVersion": "${phpVersion}"`
        );
  
      fs.writeFileSync(settingsPath, existingSettings);

      return;
    }

    const settings = {"intelephense.environment.phpVersion": phpVersion};

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

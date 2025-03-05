import { promises as fs } from 'fs';
import { exec } from 'child_process';

const REGEX_PHP = /"php"\s*:\s*"[^"]+"/g;

export async function syncPhpVersion(workspaceRoot: string) {
  const COMPOSER_PATH = workspaceRoot + '/composer.json';

  let phpVersion = '';
  if (await isFileExists(COMPOSER_PATH)) {
    const composerFile = await fs.readFile(COMPOSER_PATH, 'utf-8');
    const matches = composerFile.match(REGEX_PHP);

    if (matches) {
      phpVersion = matches
        .map((match) => match.split(':')[1].trim().replace(/"/g, ''))
        .find(value => value !== undefined)
        ?.trim() || '';
    } else {
      console.log('composer.json found but PHP version is not specified');
    }
  }

  if (phpVersion.length > 1) {
    return phpVersion;
  }

  phpVersion = await execCommand('php -r "echo PHP_MAJOR_VERSION . \'.\' . PHP_MINOR_VERSION . \'.*\';"');

  if (phpVersion.length < 1) {
    console.log('unable to get installed PHP version');
  }

  return phpVersion;
}

async function isFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    };
    throw error;
  }
};

async function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {reject(error);}
      else {resolve(stdout.trim());}
    });
  });
}

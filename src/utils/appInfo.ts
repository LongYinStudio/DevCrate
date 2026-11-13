import packageJson from '../../package.json';

export const APP_NAME = 'DevCrate';
export const APP_VERSION: string = packageJson.version.trim().replace(/^[vV]+/, '');
export const APP_DISPLAY_VERSION = `v${APP_VERSION}`;

export const GITHUB_OWNER = 'LongYinStudio';
export const GITHUB_REPO = 'DevCrate';
export const GITHUB_REPO_SLUG = `${GITHUB_OWNER}/${GITHUB_REPO}`;
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_SLUG}`;
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;
export const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO_SLUG}/releases/latest`;

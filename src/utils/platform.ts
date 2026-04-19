const deployTarget = (process.env.NEXT_PUBLIC_DEPLOY_TARGET ?? 'default').toLowerCase();
const storePlatform = (process.env.NEXT_PUBLIC_STORE_PLATFORM ?? 'steam').toLowerCase();

function normalizeBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const compact = trimmed.replace(/^\/+|\/+$/g, '');
  return compact ? `/${compact}` : '';
}

export const IS_ITCH_BUILD = deployTarget === 'itch';
export const APP_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_APP_BASE_PATH ?? '');

export function toAppHref(path: string): string {
  // Next.js router/Link already applies next.config basePath automatically.
  // Returning a normalized app route avoids accidental double-prefixing.
  return path.startsWith('/') ? path : `/${path}`;
}

export function withBaseAsset(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return `${APP_BASE_PATH}${withLeadingSlash}`;
}

export function getStoreLabel(): 'Steam' | 'itch.io' {
  return storePlatform === 'itch' ? 'itch.io' : 'Steam';
}

export function getStoreOperatorLabel(): string {
  return storePlatform === 'itch' ? 'itch.io terms and privacy policy' : "Valve under Steam's terms and privacy policy";
}

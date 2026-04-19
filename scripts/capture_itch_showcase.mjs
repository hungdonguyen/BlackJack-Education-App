import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.SHOWCASE_BASE_URL || 'http://127.0.0.1:3000';
const OUTPUT_DIR = path.resolve('marketing/itch-showcase');

const pages = [
  { name: '01-home', url: '/' },
  { name: '02-lobby', url: '/lobby' },
  { name: '03-game-classic', url: '/game/classic' },
  { name: '04-game-vegas-strip', url: '/game/vegas_strip' },
  { name: '05-simulator', url: '/simulator' },
  { name: '06-tutorial-lobby', url: '/tutorial-lobby' },
  { name: '07-history', url: '/history' },
  { name: '08-terms', url: '/terms' },
  { name: '09-privacy', url: '/privacy' },
];

async function waitForAppReady(page) {
  // SplashScreen gate: sessionStorage + a fallback click in case splash is already mounted.
  await page.evaluate(() => {
    try {
      window.sessionStorage.setItem('hasSeenSplash', '1');
      window.localStorage.setItem('legal-agreed-v1', 'true');
    } catch {
      // ignore storage errors in restricted contexts
    }
  });

  // Fallback: if splash still appears, click through after the progress phase.
  const continueHint = page.getByText('Click anywhere to countinue');
  if (await continueHint.isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.mouse.click(30, 30);
  }

  // Wait for splash overlay to be gone if present.
  await page
    .waitForFunction(() => {
      const overlays = Array.from(document.querySelectorAll('div'));
      return !overlays.some((el) => {
        const cls = typeof el.className === 'string' ? el.className : '';
        const txt = el.textContent || '';
        return cls.includes('fixed') && cls.includes('inset-0') && cls.includes('z-[99999]') && txt.includes('LOADING');
      });
    }, { timeout: 20000 })
    .catch(() => {});

  // Let animations and async hydration settle before capture.
  await page.waitForTimeout(900);
}

async function captureDesktop(context, pageSpec) {
  const page = await context.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${BASE_URL}${pageSpec.url}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForAppReady(page);

  const fullPath = path.join(OUTPUT_DIR, `${pageSpec.name}-desktop-full.png`);
  const heroPath = path.join(OUTPUT_DIR, `${pageSpec.name}-desktop-hero.png`);

  await page.screenshot({ path: fullPath, fullPage: true });
  await page.screenshot({ path: heroPath });
  await page.close();
}

async function captureMobile(context, pageSpec) {
  const page = await context.newPage({
    ...devices['iPhone 13'],
  });

  await page.goto(`${BASE_URL}${pageSpec.url}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForAppReady(page);

  const heroPath = path.join(OUTPUT_DIR, `${pageSpec.name}-mobile.png`);
  await page.screenshot({ path: heroPath });
  await page.close();
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.sessionStorage.setItem('hasSeenSplash', '1');
    window.localStorage.setItem('legal-agreed-v1', 'true');
  });

  for (const pageSpec of pages) {
    console.log(`Capturing ${pageSpec.url}`);
    let ok = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await captureDesktop(context, pageSpec);
        await captureMobile(context, pageSpec);
        ok = true;
        break;
      } catch (err) {
        console.warn(`Attempt ${attempt} failed for ${pageSpec.url}:`, err?.message ?? err);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    if (!ok) {
      throw new Error(`Failed to capture route after retries: ${pageSpec.url}`);
    }
  }

  await browser.close();

  console.log('Done. Screenshots saved to marketing/itch-showcase');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { test, expect, type Page } from '@playwright/test';

async function interactAt(page: Page, id: string) {
  await expect(page.locator('#interaction')).toHaveAttribute('data-nearby', id, { timeout: 60000 });
  await expect(page.locator('#interact')).toBeEnabled();
  await page.locator('#interact').click();
}

test('third-person exploration, nearby actions, reset and audio', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => { errors.push(error.message); console.log(error.message); });
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('#start')).toBeEnabled({ timeout: 30000 });
  await page.locator('#start').click();
  await expect(page.locator('body')).toHaveClass('in-game');
  await expect(page.locator('#interaction')).not.toBeVisible();
  await page.keyboard.press('1');
  await expect(page.locator('#mini-count')).toHaveText('0 / 3');
  await interactAt(page, 'cleanup');
  await expect(page.locator('#mini-count')).toHaveText('1 / 3', { timeout: 15000 });
  await expect(page.locator('[data-action="cleanup"]')).toBeDisabled();
  await page.locator('[data-action="reeds"]').click();
  await interactAt(page, 'reeds');
  await expect(page.locator('#mini-count')).toHaveText('2 / 3', { timeout: 15000 });
  await page.locator('[data-action="drain"]').click();
  await interactAt(page, 'drain');
  await expect(page.locator('#mini-count')).toHaveText('3 / 3', { timeout: 15000 });
  await page.locator('#health-toggle').click();
  await expect(page.locator('#clarity-value')).toHaveText('80/100');
  await expect(page.locator('#habitat-value')).toHaveText('74/100');
  await expect(page.locator('#wildlife-value')).toHaveText('8 /10');
  await page.locator('#how').click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#health-toggle').click();
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#reset').click();
  await expect(page.locator('#mini-count')).toHaveText('0 / 3');
  await page.locator('#motion').click();
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('canvas').focus();
  const before = await page.locator('canvas').getAttribute('data-player-position');
  await page.bringToFront();
  await page.keyboard.down('d');
  await expect(page.locator('canvas')).not.toHaveAttribute('data-player-position', before!, { timeout: 15000 });
  await page.keyboard.up('d');
  expect(errors).toEqual([]);
});

test('mobile guided walks, touch movement and immersive viewport', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#start')).toBeEnabled({ timeout: 30000 });
  await page.locator('#intro-tour').click();
  await expect(page.locator('#actions')).not.toBeVisible();
  await expect(page.locator('#motion')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#tour-next').click();
  for (const [index, id] of ['cleanup', 'reeds', 'drain'].entries()) {
    await interactAt(page, id);
    await expect(page.locator('#mini-count')).toHaveText(`${index + 1} / 3`, { timeout: 15000 });
    await page.locator('#tour-next').click();
  }
  await expect(page.locator('#tour-title')).toHaveText('Stay a little longer.');
  await page.locator('#tour-next').click();
  await expect(page.locator('#tour')).not.toBeVisible();
  await expect(page.locator('#touch-pad')).toBeVisible();
  const before = await page.locator('canvas').getAttribute('data-player-position');
  const pad = await page.locator('[data-key="arrowright"]').boundingBox();
  await page.mouse.move(pad!.x + 24, pad!.y + 24); await page.mouse.down();
  await expect(page.locator('canvas')).not.toHaveAttribute('data-player-position', before!, { timeout: 15000 });
  await page.mouse.up();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.screenshot({ path: 'test-results/third-person-mobile.png' });
  expect(errors).toEqual([]);
});

test('WebGL failure provides a recoverable error state', async ({ page }) => {
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext; });
  await page.goto('/');
  await expect(page.locator('#world-error')).toBeVisible();
  await expect(page.locator('#reload')).toBeVisible();
  await expect(page.locator('#start')).toBeDisabled();
});

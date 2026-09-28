import { test, expect, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto('/');
  await expect(page.locator('#start')).toBeEnabled({ timeout: 60000 });
  await page.locator('#start').click();
}
async function visit(page: Page, kind: string, id: string) {
  await page.locator('#map-toggle').click();
  await page.locator(`[data-map-kind="${kind}"][data-map-id="${id}"]`).click();
  await expect(page.locator('#interaction')).toHaveAttribute('data-nearby', kind === 'npc' ? `npc-${id}` : id, { timeout: 90000 });
}

test('sitting, swimming and rowing have working entry, movement and exit states', async ({ page }) => {
  test.setTimeout(300000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await enter(page);
  await expect.poll(async () => Number(await page.locator('canvas').getAttribute('data-camera-boom'))).toBeGreaterThan(2);
  await page.screenshot({ path: 'test-results/park-entry.png' });
  await visit(page, 'activity', 'boat');
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'boating');
  await page.screenshot({ path: 'test-results/park-boating.png' });
  await page.keyboard.down('w');
  await expect(page.locator('canvas')).toHaveAttribute('data-dockable', 'false', { timeout: 20000 });
  await page.keyboard.up('w');
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'boating');
  await expect(page.locator('canvas')).toHaveAttribute('data-dockable', 'true', { timeout: 30000 });
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'walking');
  await visit(page, 'activity', 'swim');
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'swimming');
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'walking', { timeout: 30000 });
  await visit(page, 'activity', 'bench');
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'sitting');
  await page.screenshot({ path: 'test-results/park-sitting.png' });
  await page.locator('#interact').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'walking');
  await page.locator('#reset').click();
  await expect(page.locator('#explore-count')).toHaveText('0/6');
  expect(errors).toEqual([]);
});

test('NPC conversations, quiet birdwatching and nursery activities', async ({ page }) => {
  test.setTimeout(300000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await enter(page);
  await visit(page, 'npc', 'arun');
  await page.locator('#interact').click();
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('#dialog-content h2')).toHaveText('Arun');
  await page.locator('[data-npc-next]').click();
  await expect(page.locator('.npc-speech')).toContainText('W and S row');
  await page.locator('[data-goodbye]').click();
  await visit(page, 'activity', 'nursery');
  await page.locator('#interact').click();
  await expect(page.locator('#explore-count')).toHaveText('1/6', { timeout: 20000 });
  await visit(page, 'activity', 'sapling');
  await page.locator('#interact').click();
  await expect(page.locator('#explore-count')).toHaveText('2/6', { timeout: 20000 });
  await visit(page, 'activity', 'watch');
  await page.locator('#interact').click();
  await expect(page.locator('#toast')).toContainText('sneak');
  await page.locator('#sneak-toggle').click();
  await expect(page.locator('canvas')).toHaveAttribute('data-mode', 'sneaking');
  await expect(page.locator('#interaction-detail')).toContainText('settled', { timeout: 20000 });
  await page.locator('#interact').click();
  await expect(page.locator('#explore-count')).toHaveText('3/6', { timeout: 20000 });
  // Exploration never silently invents additional restoration score effects.
  await expect(page.locator('#mini-count')).toHaveText('0 / 3');
  expect(errors).toEqual([]);
});

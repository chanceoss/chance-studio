import { test, expect } from '@playwright/test';
const image = {
  name: 'reference.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5X8AAAAASUVORK5CYII=',
    'base64',
  ),
};
async function navigate(page: import('@playwright/test').Page, name: string) {
  const menu = page.getByRole('button', { name: 'Toggle navigation' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .click();
}
test('character identity, references, templates, backups, and reload persistence', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page
    .getByRole('button', { name: 'New character', exact: true })
    .click();
  await page.getByLabel('Name', { exact: true }).fill('Alex Morgan');
  await page
    .getByLabel('Physical identity')
    .fill('Brown eyes, dark curls, freckles.');
  await page.getByLabel('Personality & voice').fill('Warm and curious.');
  await page.getByRole('button', { name: 'Save character' }).click();
  await page
    .getByRole('button', { name: /Alex Morgan.*Character profile/ })
    .click();
  await page.locator('.detail input[type=file]').first().setInputFiles(image);
  await expect(page.getByAltText('reference.png')).toBeVisible();
  await page
    .getByRole('button', { name: 'Build a prompt', exact: true })
    .click();
  await expect(page.getByLabel('Generated photography prompt')).toContainText(
    'Brown eyes, dark curls, freckles.',
  );
  await page.getByRole('button', { name: 'Edit prompt template' }).click();
  await page
    .getByLabel('Template (editable)')
    .fill('{{name}}: {{identity}}. Editorial portrait.');
  await page
    .getByRole('button', { name: 'Save template', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Template saved');
  await page.getByRole('button', { name: 'Save to history' }).click();
  await expect(page.locator('.history-item')).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole('button', { name: /Alex Morgan.*Character profile/ }),
  ).toBeVisible();
  await navigate(page, 'Prompt builder');
  await expect(page.getByLabel('Generated photography prompt')).toHaveValue(
    'Alex Morgan: Brown eyes, dark curls, freckles.. Editorial portrait.',
  );
  await navigate(page, 'Image gallery');
  await page
    .getByLabel('Prompt used (optional)')
    .fill('A golden hour portrait.');
  await page
    .locator('.gallery-import input[type=file]')
    .setInputFiles({ ...image, name: 'portrait.png' });
  await page.getByAltText('portrait.png').click();
  await expect(
    page.getByText('A golden hour portrait.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close image' }).click();
  const menu = page.getByRole('button', { name: 'Toggle navigation' });
  if (await menu.isVisible()) await menu.click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page
    .locator('input[accept="application/json,.json"]')
    .setInputFiles(path!);
  await expect(
    page.getByRole('heading', { name: 'Restore your studio?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Replace & restore' }).click();
  await expect(page.getByRole('status')).toContainText('Backup restored');
  await page.reload();
  await navigate(page, 'Image gallery');
  await expect(page.getByAltText('reference.png')).toBeVisible();
  await expect(page.getByAltText('portrait.png')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test('calendar, presets, storyboard, and invalid backup recovery', async ({
  page,
}) => {
  await page.goto('./');
  await page
    .getByRole('button', { name: 'New character', exact: true })
    .click();
  await page.getByLabel('Name', { exact: true }).fill('Jordan');
  await page.getByRole('button', { name: 'Save character' }).click();
  await expect(page.getByRole('status')).toContainText('Character saved');
  await navigate(page, 'Content calendar');
  await page.getByLabel('Content idea').fill('Morning editorial');
  await expect(page.getByLabel('Date', { exact: true })).not.toHaveValue('');
  await page.getByRole('button', { name: 'Add idea' }).click();
  await expect(
    page.getByRole('heading', { name: 'Morning editorial' }),
  ).toBeVisible();
  await navigate(page, 'Preset library');
  await page.getByLabel('Your preset').fill('Forest green coat');
  await page.getByRole('button', { name: 'Add preset' }).click();
  await expect(
    page.getByText('Forest green coat', { exact: true }),
  ).toBeVisible();
  await navigate(page, 'Storyboards');
  await page.getByLabel('Number of shots').selectOption('6');
  await expect(page.locator('.shot-list .panel')).toHaveCount(6);
  await page.locator('input[accept="application/json,.json"]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1}'),
  });
  await expect(page.getByRole('status')).toContainText('not a supported');
  await page.reload();
  await navigate(page, 'Content calendar');
  await expect(
    page.getByRole('heading', { name: 'Morning editorial' }),
  ).toBeVisible();
  await navigate(page, 'Preset library');
  await expect(
    page.getByText('Forest green coat', { exact: true }),
  ).toBeVisible();
});

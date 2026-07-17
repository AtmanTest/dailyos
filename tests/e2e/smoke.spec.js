// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Daily ADHD — Playwright E2E Smoke Tests
 * Couvre les fonctionnalités critiques TDAH v2.0
 * Tests: FAB, Quick Moods, Streak, i18n toggle, Win du jour,
 *        Reminder nudge, Capture éclair, Navigation
 */

test.beforeEach(async ({ page }) => {
  // Seed localStorage avec des données de démo propres avant chaque test
  await page.goto('/');
  await page.evaluate(() => {
    // Nettoyer localStorage sauf la langue
    Object.keys(localStorage)
      .filter(k => k.startsWith('dailyos_') && k !== 'dailyos_lang')
      .forEach(k => localStorage.removeItem(k));
    // Mode démo activé
    localStorage.setItem('dailyos_demo_mode', 'true');
    localStorage.setItem('dailyos_lang', 'fr');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
});

// =============================================================================
// SECTION 1 — STRUCTURE DE BASE
// =============================================================================

test('titre de la page est Daily TDAH ou Daily ADHD', async ({ page }) => {
  const title = await page.title();
  expect(title).toMatch(/Daily (TDAH|ADHD)/i);
});

test('favicon est présent', async ({ page }) => {
  const favicon = page.locator('link[rel="icon"]');
  await expect(favicon).toHaveCount(1);
});

test('pas d\'erreur JS au chargement', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('page today charge sans écran blanc', async ({ page }) => {
  await page.goto('/#/today');
  await page.waitForLoadState('networkidle');
  // Le main doit avoir du contenu (pas vide)
  const main = page.locator('#app');
  await expect(main).not.toBeEmpty();
});

// =============================================================================
// SECTION 2 — NAVIGATION
// =============================================================================

test('navigation : toutes les routes chargent', async ({ page }) => {
  const routes = ['#/today', '#/journal', '#/ideas', '#/reminders', '#/insights', '#/settings'];
  for (const route of routes) {
    await page.goto(`/${route}`);
    await page.waitForLoadState('networkidle');
    const main = page.locator('#app');
    await expect(main).not.toBeEmpty();
  }
});

// =============================================================================
// SECTION 3 — FAB QUICK ENTRY
// =============================================================================

test('FAB visible sur la page today', async ({ page }) => {
  await page.goto('/#/today');
  const fab = page.locator('#fab-quick-entry');
  await expect(fab).toBeVisible();
});

test('FAB masqué sur la page settings', async ({ page }) => {
  await page.goto('/#/settings');
  const fab = page.locator('#fab-quick-entry');
  await expect(fab).toBeHidden();
});

test('FAB ouvre une modal avec autofocus', async ({ page }) => {
  await page.goto('/#/today');
  await page.click('#fab-quick-entry');
  // Le champ texte doit être focusé
  const input = page.locator('.flash-capture-modal input[type="text"], .flash-capture-modal textarea').first();
  await expect(input).toBeFocused();
});

test('FAB : fermeture avec Escape', async ({ page }) => {
  await page.goto('/#/today');
  await page.click('#fab-quick-entry');
  await expect(page.locator('.flash-capture-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.flash-capture-modal')).toBeHidden();
});

test('FAB : créer une entrée avec Ctrl+Enter', async ({ page }) => {
  await page.goto('/#/today');
  await page.click('#fab-quick-entry');
  const input = page.locator('.flash-capture-modal input[type="text"], .flash-capture-modal textarea').first();
  await input.fill('Test entrée Playwright');
  await input.press('Control+Enter');
  // Toast de succès doit apparaître
  const toast = page.locator('#toast-container');
  await expect(toast).toContainText(/.+/, { timeout: 3000 });
  // Modal doit être fermée
  await expect(page.locator('.flash-capture-modal')).toBeHidden();
});

test('FAB : créer une entrée avec le bouton confirmer', async ({ page }) => {
  await page.goto('/#/today');
  await page.click('#fab-quick-entry');
  const input = page.locator('.flash-capture-modal input[type="text"], .flash-capture-modal textarea').first();
  await input.fill('Entrée via bouton');
  // Clic sur le bouton de validation
  const confirmBtn = page.locator('.flash-capture-modal button').filter({ hasText: /ajouter|add|valider|confirm/i });
  await confirmBtn.click();
  await expect(page.locator('#toast-container')).toContainText(/.+/, { timeout: 3000 });
});

// =============================================================================
// SECTION 4 — QUICK MOODS
// =============================================================================

test('5 boutons mood visibles sur today', async ({ page }) => {
  await page.goto('/#/today');
  const moodsBar = page.locator('.quick-moods-bar');
  await expect(moodsBar).toBeVisible();
  const buttons = moodsBar.locator('button');
  await expect(buttons).toHaveCount(5);
});

test('tap mood crée une entrée et affiche un toast', async ({ page }) => {
  await page.goto('/#/today');
  const firstMood = page.locator('.quick-moods-bar button').first();
  await firstMood.click();
  const toast = page.locator('#toast-container');
  await expect(toast).toContainText(/.+/, { timeout: 3000 });
});

// =============================================================================
// SECTION 5 — STREAK
// =============================================================================

test('streak badge visible sur today', async ({ page }) => {
  await page.goto('/#/today');
  const streak = page.locator('.streak-badge');
  await expect(streak).toBeVisible();
});

test('streak 0 affiche le bon label', async ({ page }) => {
  await page.goto('/#/today');
  // Sans entrée, streak = 0
  const streak = page.locator('.streak-badge');
  // Doit contenir un texte de démarrage
  await expect(streak).toContainText(/commence|start/i);
});

// =============================================================================
// SECTION 6 — WIN DU JOUR
// =============================================================================

test('section win du jour visible', async ({ page }) => {
  await page.goto('/#/today');
  const winSection = page.locator('.win-section');
  await expect(winSection).toBeVisible();
});

test('empty state win affiché sans données', async ({ page }) => {
  await page.goto('/#/today');
  const winSection = page.locator('.win-section');
  await expect(winSection).toContainText(/rien encore|nothing yet/i);
});

test('ajouter un win : toast + entrée créée', async ({ page }) => {
  await page.goto('/#/today');
  const winInput = page.locator('.win-section input[type="text"], .win-section textarea').first();
  await winInput.fill('J\'ai terminé mon test Playwright 🎉');
  const addBtn = page.locator('.win-section button').filter({ hasText: /ajouter|add/i });
  await addBtn.click();
  await expect(page.locator('#toast-container')).toContainText(/.+/, { timeout: 3000 });
});

// =============================================================================
// SECTION 7 — BILINGUISME
// =============================================================================

test('toggle FR/EN dans le header sans rechargement', async ({ page }) => {
  await page.goto('/#/today');
  // Chercher le bouton EN dans le header
  const enBtn = page.locator('#app-header').getByText('EN', { exact: true });
  if (await enBtn.isVisible()) {
    const urlBefore = page.url();
    await enBtn.click();
    // Pas de rechargement de page
    expect(page.url()).toBe(urlBefore);
    // Un élément i18n doit avoir changé de langue
    const langStored = await page.evaluate(() => localStorage.getItem('dailyos_lang'));
    expect(langStored).toBe('en');
  } else {
    test.skip();
  }
});

test('langue persistée après reload', async ({ page }) => {
  await page.goto('/#/today');
  await page.evaluate(() => localStorage.setItem('dailyos_lang', 'en'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  const lang = await page.evaluate(() => localStorage.getItem('dailyos_lang'));
  expect(lang).toBe('en');
});

// =============================================================================
// SECTION 8 — CAPTURE ÉCLAIR IDÉES
// =============================================================================

test('bouton capture éclair présent sur ideas', async ({ page }) => {
  await page.goto('/#/ideas');
  const btn = page.getByText(/capture éclair|flash capture/i);
  await expect(btn).toBeVisible();
});

test('capture éclair ouvre modal pré-sélectionnée sur idea', async ({ page }) => {
  await page.goto('/#/ideas');
  const btn = page.getByText(/capture éclair|flash capture/i);
  await btn.click();
  const modal = page.locator('.flash-capture-modal');
  await expect(modal).toBeVisible();
});

// =============================================================================
// SECTION 9 — MOBILE (iPhone 14)
// =============================================================================

test('bottom nav visible sur mobile', async ({ page }) => {
  // Ce test tourne dans le projet mobile-safari
  const bottomNav = page.locator('#app-bottom-nav');
  await page.goto('/');
  await expect(bottomNav).toBeVisible();
});

test('FAB visible sur mobile', async ({ page }) => {
  await page.goto('/#/today');
  const fab = page.locator('#fab-quick-entry');
  await expect(fab).toBeVisible();
});

// =============================================================================
// SECTION 10 — ACCESSIBILITÉ
// =============================================================================

test('FAB a un aria-label', async ({ page }) => {
  await page.goto('/#/today');
  const fab = page.locator('#fab-quick-entry');
  await expect(fab).toHaveAttribute('aria-label');
});

test('toast container a aria-live', async ({ page }) => {
  const toast = page.locator('#toast-container');
  await expect(toast).toHaveAttribute('aria-live', 'polite');
});

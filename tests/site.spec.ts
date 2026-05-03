import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type SiteSpec = {
  site: {
    title: string;
    tagline: string;
    sections: Array<{ id: string; heading: string; content?: any }>
  }
}

type UiSpec = {
  ui: {
    behavior: {
      timeline: { default_active_step_id: string };
      quiz: any;
    }
  }
}

function loadYaml<T>(p: string): T {
  const raw = fs.readFileSync(p, 'utf8');
  return yaml.load(raw) as T;
}

function fileUrl(p: string) {
  // Windows-safe, but we're in linux here.
  return 'file://' + p;
}

test.describe('SDD microsite - spec compliance', () => {
  const root = path.resolve(__dirname, '..');
  const siteSpecPath = path.join(root, 'spec', 'site.yml');
  const uiSpecPath = path.join(root, 'spec', 'ui.yml');

  const siteSpec = loadYaml<SiteSpec>(siteSpecPath);
  const uiSpec = loadYaml<UiSpec>(uiSpecPath);

  test('renders title and tagline from spec', async ({ page }) => {
    await page.goto(fileUrl(path.join(root, 'src', 'index.html')));
    await expect(page.getByRole('heading', { name: siteSpec.site.title })).toBeVisible();
    await expect(page.getByText(siteSpec.site.tagline)).toBeVisible();
  });

  test('renders all top-level sections from spec (by id)', async ({ page }) => {
    await page.goto(fileUrl(path.join(root, 'src', 'index.html')));

    for (const section of siteSpec.site.sections) {
      await expect(page.locator(`#${section.id}`)).toHaveCount(1);
    }
  });

  test('timeline default active step matches ui spec', async ({ page }) => {
    await page.goto(fileUrl(path.join(root, 'src', 'index.html')));

    const defaultId = uiSpec.ui.behavior.timeline.default_active_step_id;
    const activeBtn = page.locator(`[data-testid="timeline-step-btn"][aria-selected="true"]`);
    await expect(activeBtn).toHaveCount(1);
    await expect(activeBtn).toHaveAttribute('data-step-id', defaultId);

    const activePanel = page.locator(`[data-testid="timeline-step-panel"][data-step-id="${defaultId}"]`);
    await expect(activePanel).toBeVisible();
  });

  test('timeline clicking a step activates its panel', async ({ page }) => {
    await page.goto(fileUrl(path.join(root, 'src', 'index.html')));

    const buttons = page.locator('[data-testid="timeline-step-btn"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const last = buttons.nth(count - 1);
    const stepId = await last.getAttribute('data-step-id');
    expect(stepId).toBeTruthy();

    await last.click();

    await expect(last).toHaveAttribute('aria-selected', 'true');
    const panel = page.locator(`[data-testid="timeline-step-panel"][data-step-id="${stepId}"]`);
    await expect(panel).toBeVisible();
  });

  test('quiz: selecting correct answer shows correct feedback + explanation', async ({ page }) => {
    await page.goto(fileUrl(path.join(root, 'src', 'index.html')));

    // We only assert for Q1 to keep tests stable.
    const q1 = siteSpec.site.sections.find(s => s.id === 'quiz')?.content?.questions?.[0];
    expect(q1).toBeTruthy();

    const correctIndex = q1.answer_index as number;
    const option = page.locator(`[data-testid="quiz-q1-option"][data-option-index="${correctIndex}"]`);
    await option.click();

    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.locator('[data-testid="quiz-feedback"]')).toContainText(/correct/i);
    await expect(page.locator('[data-testid="quiz-explanation"]')).toContainText(q1.explanation);
  });
});

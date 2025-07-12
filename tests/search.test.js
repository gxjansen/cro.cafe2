import puppeteer from 'puppeteer';
import { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

describe('Search Page Functionality', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:4321/search/', { waitUntil: 'networkidle2' });
  });

  afterEach(async () => {
    await page.close();
  });

  test('search input should be functional and accept text', async () => {
    // Check that search input exists and is visible
    const searchInput = await page.$('#search-input');
    expect(searchInput).toBeTruthy();

    // Type in the search input
    await page.type('#search-input', 'conversion optimization');
    
    // Verify the input value
    const inputValue = await page.$eval('#search-input', el => el.value);
    expect(inputValue).toBe('conversion optimization');
  });

  test('search results should appear when typing', async () => {
    // Initially, empty state should be visible
    const emptyStateVisible = await page.$eval('#empty-state', el => !el.classList.contains('hidden'));
    const searchResultsHidden = await page.$eval('#search-results', el => el.classList.contains('hidden'));
    
    expect(emptyStateVisible).toBe(true);
    expect(searchResultsHidden).toBe(true);
    
    // Type a search query
    await page.type('#search-input', 'analytics');
    
    // Wait for search to execute (debounced)
    await page.waitForTimeout(500);
    
    // Results should be visible now
    const searchResultsVisible = await page.$eval('#search-results', el => !el.classList.contains('hidden'));
    const emptyStateHidden = await page.$eval('#empty-state', el => el.classList.contains('hidden'));
    
    expect(searchResultsVisible).toBe(true);
    expect(emptyStateHidden).toBe(true);
  });

  test('filter buttons should be clickable and change state', async () => {
    // Click episodes filter
    await page.click('#filter-episodes');
    
    const episodesActive = await page.$eval('#filter-episodes', el => 
      el.classList.contains('active') && el.classList.contains('bg-primary-600')
    );
    expect(episodesActive).toBe(true);
    
    // Click guests filter
    await page.click('#filter-guests');
    
    const guestsActive = await page.$eval('#filter-guests', el => 
      el.classList.contains('active') && el.classList.contains('bg-primary-600')
    );
    const episodesInactive = await page.$eval('#filter-episodes', el => 
      !el.classList.contains('active')
    );
    
    expect(guestsActive).toBe(true);
    expect(episodesInactive).toBe(true);
    
    // Click all filter
    await page.click('#filter-all');
    
    const allActive = await page.$eval('#filter-all', el => 
      el.classList.contains('active') && el.classList.contains('bg-primary-600')
    );
    expect(allActive).toBe(true);
  });

  test('language filters should be functional', async () => {
    // Initially, "All Shows" should be active
    const langAllInitial = await page.$eval('#lang-all', el => el.classList.contains('active'));
    expect(langAllInitial).toBe(true);
    
    // Click English filter
    await page.click('#lang-en');
    
    const langEnActive = await page.$eval('#lang-en', el => 
      el.classList.contains('active') && el.classList.contains('bg-primary-600')
    );
    const langAllInactive = await page.$eval('#lang-all', el => !el.classList.contains('active'));
    
    expect(langEnActive).toBe(true);
    expect(langAllInactive).toBe(true);
    
    // Click Dutch filter
    await page.click('#lang-nl');
    
    const langNlActive = await page.$eval('#lang-nl', el => 
      el.classList.contains('active') && el.classList.contains('bg-primary-600')
    );
    const langEnInactive = await page.$eval('#lang-en', el => !el.classList.contains('active'));
    
    expect(langNlActive).toBe(true);
    expect(langEnInactive).toBe(true);
  });

  test('quick search tags should fill search input', async () => {
    // Get the first quick search tag's query
    const tagQuery = await page.$eval('.search-tag', el => el.dataset.query);
    
    // Click the first quick search tag
    await page.click('.search-tag');
    
    // Search input should be filled with the tag's query
    const inputValue = await page.$eval('#search-input', el => el.value);
    expect(inputValue).toBe(tagQuery);
  });

  test('clear filters button should reset all filters', async () => {
    // Set some filters
    await page.click('#filter-episodes');
    await page.click('#lang-en');
    
    // Clear filters
    await page.click('#clear-filters');
    
    // All filters should be reset to default
    const allFilterActive = await page.$eval('#filter-all', el => el.classList.contains('active'));
    const langAllActive = await page.$eval('#lang-all', el => el.classList.contains('active'));
    const episodesInactive = await page.$eval('#filter-episodes', el => !el.classList.contains('active'));
    const langEnInactive = await page.$eval('#lang-en', el => !el.classList.contains('active'));
    
    expect(allFilterActive).toBe(true);
    expect(langAllActive).toBe(true);
    expect(episodesInactive).toBe(true);
    expect(langEnInactive).toBe(true);
  });

  test('search with URL parameter should work', async () => {
    // Navigate with search parameter
    await page.goto('http://localhost:4321/search/?q=experimentation', { waitUntil: 'networkidle2' });
    
    // Input should be pre-filled
    const inputValue = await page.$eval('#search-input', el => el.value);
    expect(inputValue).toBe('experimentation');
    
    // Results should be visible
    const searchResultsVisible = await page.$eval('#search-results', el => !el.classList.contains('hidden'));
    expect(searchResultsVisible).toBe(true);
  });

  test('no results state should show when no matches found', async () => {
    // Search for something that won't match
    await page.type('#search-input', 'xyzabc123notfound');
    await page.waitForTimeout(500);
    
    // No results state should be visible
    const noResultsVisible = await page.$eval('#no-results', el => !el.classList.contains('hidden'));
    const searchResultsHidden = await page.$eval('#search-results', el => el.classList.contains('hidden'));
    
    expect(noResultsVisible).toBe(true);
    expect(searchResultsHidden).toBe(true);
  });

  test('search should work after filter changes', async () => {
    // First perform a search
    await page.type('#search-input', 'optimization');
    await page.waitForTimeout(500);
    
    // Then change filter
    await page.click('#filter-episodes');
    
    // Results should still be visible (filtered)
    const searchResultsVisible = await page.$eval('#search-results', el => !el.classList.contains('hidden'));
    expect(searchResultsVisible).toBe(true);
  });

  test('accessibility: search elements should have proper ARIA labels', async () => {
    // Check ARIA attributes
    const inputAriaDescribedBy = await page.$eval('#search-input', el => el.getAttribute('aria-describedby'));
    const statusAriaLive = await page.$eval('#search-status', el => el.getAttribute('aria-live'));
    const statusAriaAtomic = await page.$eval('#search-status', el => el.getAttribute('aria-atomic'));
    
    expect(inputAriaDescribedBy).toBe('search-description');
    expect(statusAriaLive).toBe('polite');
    expect(statusAriaAtomic).toBe('true');
  });
});
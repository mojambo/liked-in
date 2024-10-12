import puppeteer, {Browser, Page} from 'puppeteer';
import logger from './logger';

/**
 * Configuration object for Puppeteer
 */
const PUPPETEER_CONFIG = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  executablePath: '/usr/src/app/.cache/puppeteer/chrome/linux-129.0.6668.100/chrome-linux64/chrome',
  headless: true // Add this for explicit headless mode
};

/**
 * User agent string for mimicking a real browser
 */
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

/**
 * Clicks the "Like" button on a LinkedIn post
 * @param {string} url - The URL of the LinkedIn post
 * @param {string} cookie - The LinkedIn authentication cookie
 * @throws {Error} If the "Like" button is not found or if any other error occurs
 */
export async function clickLikeButton(url: string, cookie: string): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await puppeteer.launch(PUPPETEER_CONFIG);
    page = await browser.newPage();

    await setupPage(page, cookie);
    await navigateToPost(page, url);
    await clickLike(page);

    logger.info('Successfully liked the LinkedIn post');
  } catch (error) {
    logger.error('Error occurred while liking the post:', error);
    throw error;
  } finally {
    await cleanup(browser, page);
  }
}

/**
 * Sets up the page with necessary configurations
 * @param {Page} page - Puppeteer Page object
 * @param {string} cookie - LinkedIn authentication cookie
 */
async function setupPage(page: Page, cookie: string): Promise<void> {
  await page.setCookie({name: "li_at", value: cookie, domain: "www.linkedin.com"});
  await page.setUserAgent(USER_AGENT);
}

/**
 * Navigates to the LinkedIn post
 * @param {Page} page - Puppeteer Page object
 * @param {string} url - URL of the LinkedIn post
 */
async function navigateToPost(page: Page, url: string): Promise<void> {
  await page.goto(url, {waitUntil: 'networkidle2'});
}

/**
 * Clicks the "Like" button on the page
 * @param {Page} page - Puppeteer Page object
 * @throws {Error} If the "Like" button is not found
 */
async function clickLike(page: Page): Promise<void> {
  const button = await page.$('button[aria-label="React Like"]');
  if (button) {
    await button.click();
    logger.info('"React Like" Button clicked successfully!');
  } else {
    throw new Error('"React Like" Button not found');
  }
}

/**
 * Cleans up by closing the browser and page
 * @param {Browser | null} browser - Puppeteer Browser object
 * @param {Page | null} page - Puppeteer Page object
 */
async function cleanup(browser: Browser | null, page: Page | null): Promise<void> {
  if (page) await page.close();
  if (browser) await browser.close();
}

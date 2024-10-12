import puppeteer from 'puppeteer';

export async function clickLikeButton(url: string, cookie: string): Promise<void> {
  let browser;
  try {
    // Launch the browser
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/src/app/.cache/puppeteer/chrome/linux-129.0.6668.100/chrome-linux64/chrome'
    });
    const page = await browser.newPage();
    await page.setCookie({name: "li_at", value: cookie, domain: "www.linkedin.com"})

    // Set a user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the URL
    await page.goto(url);
    // const documentContent = await page.evaluate(() => {
    //   return {
    //     doctype: new XMLSerializer().serializeToString(document.doctype!),
    //     html: document.documentElement.outerHTML
    //   };
    // });

    const button = await page.$('button[aria-label="React Like"]');
    if (button) {
      await button.click();
      console.log('"React Like" Button clicked successfully!');
    } else {
      throw new Error('"React Like" Button not found');
    }
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

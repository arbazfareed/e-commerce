const test = require('node:test');
const assert = require('node:assert/strict');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const shouldRun = process.env.RUN_SELENIUM === 'true';

test('browser smoke test loads the storefront', { skip: !shouldRun }, async () => {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1440,1200');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('http://localhost:3000');
    await driver.wait(until.elementLocated(By.tagName('body')), 20000);
    const text = await driver.findElement(By.tagName('body')).getText();
    assert.match(text, /IndusCart|Shop|Support|Login/i);
  } finally {
    await driver.quit();
  }
});

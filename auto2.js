const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const googleUsername = "mdsujait2004";
const googlePassword = "@#2024@#s";
const gmailURL = "https://mail.google.com/mail/u/0/#all";
const avoidLink = "https://example.com/avoid";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-gpu', '--window-size=1200,800']
    });
    const page = await browser.newPage();
    await page.goto("https://mail.google.com/");

    // Login process
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', googleUsername);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', googlePassword);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log("✅ Logged in to Gmail.");
    
    // Wait 20 seconds before proceeding
    console.log("⏳ Waiting 20 seconds before proceeding...");
    await page.waitForTimeout(20000);

    console.log("🔄 Checking inbox...");
    await page.goto(gmailURL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);

    const unreadEmailSelector = 'tr.zA.zE';
    let unreadEmails = await page.$$(unreadEmailSelector);

    if (unreadEmails.length === 0) {
        console.log("❌ No unread emails found. Exiting...");
        await browser.close();
        return;
    }

    console.log("📩 Opening first unread email...");
    await unreadEmails[0].click();
    await page.waitForTimeout(5000);

    let links = await page.$$('div[role="main"] a[href]');
    let validLinks = [];

    for (let link of links) {
        let href = await link.evaluate(node => node.href);
        if (href.includes("http") && href !== avoidLink) {
            validLinks.push(href);
        }
    }

    if (validLinks.length > 0) {
        let firstValidLink = validLinks[0];
        console.log(`🔗 Opening: ${firstValidLink}`);
        let newTab = await browser.newPage();
        await newTab.goto(firstValidLink, { waitUntil: 'networkidle2' });
        console.log("✅ Successfully opened link.");
    } else {
        console.log("❌ No valid links found in the email.");
    }

    console.log("🚪 Closing browser...");
    await browser.close();
})();

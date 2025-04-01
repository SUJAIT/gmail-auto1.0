const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const googleUsername = "mrtuha94";
const googlePassword = "@#2024@#";
const gmailURL = "https://mail.google.com/mail/u/0/#all";
const avoidLink = "https://example.com/avoid";
const maxTabs = 15;

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-gpu', '--window-size=1200,800']
    });
    const page = await browser.newPage();
    await page.goto("https://mail.google.com/");

    // Close any initial about:blank pages
    const pages = await browser.pages();
    for (let p of pages) {
        let url = await p.url();
        if (url === "about:blank") {
            await p.close();
        }
    }

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

    while (true) {
        try {
            console.log("🔄 Refreshing inbox...");
            await page.goto(gmailURL, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);

            const unreadEmailSelector = 'tr.zA.zE';
            let unreadEmails = await page.$$(unreadEmailSelector);
            
            if (unreadEmails.length === 0) {
                console.log("❌ No unread emails. Retrying in 10 seconds...");
                await page.waitForTimeout(10000);
                continue;
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

            if (validLinks.length === 0) {
                console.log("❌ No valid links found in the email.");
                continue;
            }

            console.log(`🔗 Opening up to ${maxTabs} links...`);
            let openedTabs = [];
            for (let i = 0; i < Math.min(validLinks.length, maxTabs); i++) {
                let newTab = await browser.newPage();
                await newTab.goto(validLinks[i], { waitUntil: 'load' });
                openedTabs.push(newTab);
            }

            console.log("⏳ Waiting 10 seconds before closing tabs...");
            await page.waitForTimeout(10000);

            // Close all opened tabs properly
            await Promise.all(openedTabs.map(async (tab) => {
                try {
                    let url = await tab.url();
                    if (!tab.isClosed() && url !== "about:blank") {
                        await tab.close();
                    } else {
                        console.log(`⚠️ Skipping empty tab: ${url}`);
                    }
                } catch (err) {
                    console.log(`⚠️ Error closing tab: ${err.message}`);
                }
            }));

            console.log("✅ Closed all opened tabs. Returning to inbox...");
            await page.goto(gmailURL, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);
        } catch (error) {
            console.log(`⚠️ Error occurred: ${error.message}`);
            await page.waitForTimeout(10000);
        }
    }
})();

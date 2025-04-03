const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const googleUsername = "mdsujait2021";//username for gmaill ok....
const googlePassword = "20929666"; //password for gmaill ok....
// url all sets ++++++++++
const gmailURL = "https://mail.google.com/mail/u/0/#all";
const targetLink = "https://example.com/target";
const avoidLink = "https://example.com/avoid";
// url all sets ends -----------------
// tab koits open hoba seta ++++++++++
const maxTabs = 15;
// -------------

// puppeter ar all kaj akna aei async funtion ar bitor working hossa ++++++++++++++++
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
    // 15 ta tab kula 3 sec wait korbe
    await page.waitForTimeout(3000);

    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', googlePassword);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log("Logged in to Gmail.");
      //gmail login kora 1 minit wait korba... jodi tow factor asa ta verfication time diar jonno....++++++
      await page.waitForTimeout(60000);
//------------------

// jodi uporar funtion work kora tahola while loop a jaba condition true hobe ++++++++++++++
    while (true) {
        try {
            console.log("Refreshing inbox");
            await page.goto(gmailURL, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);

            const unreadEmailSelector = 'tr.zA.zE';
            let unreadEmails = await page.$$(unreadEmailSelector);
            
            if (unreadEmails.length === 0) {
                console.log("waiting 3 sec");
                await page.waitForTimeout(3000);
                continue;
            }

            console.log("Open Only first unread my email");
            await unreadEmails[0].click();
            await page.waitForTimeout(5000);
            //aei kaj ta 5 secc a compleate korba 
            let links = await page.$$('div[role="main"] a[href]');
            let validLinks = [];

            for (let link of links) {
                let href = await link.evaluate(node => node.href);
                if (href.includes("http") && href !== avoidLink) {
                    validLinks.push(href);
                }
            }

            if (validLinks.length === 0) {
                console.log("no email unread");
                continue;
            }

            console.log(`Opening up to ${maxTabs} links`);
            let openedTabs = [];
            for (let i = 0; i < Math.min(validLinks.length, maxTabs); i++) {
                let newTab = await browser.newPage();
                await newTab.goto(validLinks[i], { waitUntil: 'networkidle2' });
                openedTabs.push(newTab);
            }

            console.log("tabs open after 4 seconds waiting");
            await page.waitForTimeout(4000);

            for (let tab of openedTabs) {
                await tab.close();
            }

            console.log("all operation done ,back to inbox");
            await page.goto(gmailURL, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);
        } catch (error) {
            console.log(`Error occurred: ${error.message}`);
            await page.waitForTimeout(10000);
        }
    }
    // condition --------------
})();

// end --------------------
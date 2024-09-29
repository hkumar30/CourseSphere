import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';

import { Launcher } from 'chrome-launcher';

async function launchBrowser() {
    const chromePath = Launcher.getFirstInstallation();
    const browser = await puppeteer.launch({
        executablePath: chromePath,
    });
    return browser;
}

// Use the function
const browser = await launchBrowser();

const page1 = await browser.newPage();

async function asuClassSearch(subject, courseNumber) {

    await page1.goto(`https://www.reddit.com/r/ASU/search/?q=${subject}+${courseNumber}`);
    await page1.screenshot({ path: '/Users/amalshifwathshaik/Desktop/Sunhacks2024/CourseSphere/server/screenshotReddit.png'});
    return ;
}

asuClassSearch('CSE', '101');


// Take a screenshot.  

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

// Navigate the page to a URL.
// await page1.goto('https://catalog.apps.asu.edu/catalog/classes');
// await page2.goto('https://catalog.apps.asu.edu/catalog/courses');


async function asuClassSearch(subject, courseNumber) {
    await page1.goto(`https://catalog.apps.asu.edu/catalog/classes/classlist?campusOrOnlineSelection=A&catalogNbr=${courseNumber}&honors=F&promod=F&searchType=all&subject=${subject}&term=2251`);
    
    await page1.waitForSelector('#class-results');
    
    // const elementInfo = await page1.evaluate(() => {
    //     function getElementInfo(element) {
    //         // const getStyles = (elem) => {
    //         //     const computedStyles = window.getComputedStyle(elem);
    //         //     let styles = {};
    //         //     for (let i = 0; i < computedStyles.length; i++) {
    //         //         const prop = computedStyles[i];
    //         //         styles[prop] = computedStyles.getPropertyValue(prop);
    //         //     }
    //         //     return styles;
    //         // };
        
    //         const getElementData = (elem) => {
    //             return {
    //                 tagName: elem.tagName.toLowerCase(),
    //                 id: elem.id,
    //                 classes: Array.from(elem.classList),
    //                 // styles: getStyles(elem),
    //                 innerHTML: elem.innerHTML,
    //                 children: Array.from(elem.children).map(getElementData)
    //             };
    //         };
        
    //         return getElementData(element);
    //     }

    //     const targetElement = document.querySelector('#class-results');
    //     return getElementInfo(targetElement);
    // });

    // console.log(JSON.parse(elementInfo, null, 2));

    // await page1.screenshot({ path: '/Users/amalshifwathshaik/Desktop/Sunhacks2024/CourseSphere/server/screenshot.png', fullPage: true });
    
    
    // return elementInfo;
    const element = await page1.evaluate(() => {
        const element = document.querySelector('#class-results');  // Select the element by id
        return element ? element.outerHTML : null;  // Get the entire HTML of the element with its children
      });
    // const element = document.querySelector('div#class-results');  // For example, a div with class container
    await browser.close();
    return element ? element.outerHTML : null;  // Get the entire HTML of the element
}

module.exports = asuClassSearch;
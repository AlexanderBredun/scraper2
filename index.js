// import bodyParser from 'body-parser';
// import xlsx from 'xlsx';
// import fs from 'fs';
const express = require("express");
// const xlsx = require("xlsx");
// const fs = require("fs");
const puppeteer = require("puppeteer");
// const bodyParser = require("body-parser");
// const serverless = require("serverless-http");
const { setTimeout } = require("node:timers/promises");

const app = express();
const PORT = 3000;
let browser;

// app.use(bodyParser.urlencoded({ extended: true }));

app.get('/scrape', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
        res.status(500).send('no keyword');
    }
    const results = await scrapeGoogleMaps(keyword);
    console.log(results)
    // saveToExcel(results, keyword);
    // res.download(`./${keyword}.xlsx`);
    res.status(200).send(results.toString())
});

const scrapeGoogleMaps = async (keyword) => {
    browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@50.4018377,30.2208891,11z`);
    await page.waitForSelector('.Nv2PK');
    // const items = await scrapeItems(page, 2)
    const linksCount =  await page.evaluate(`document.querySelectorAll('.Nv2PK > a').length`);
    console.log(linksCount)
    await browser.close();
    return linksCount;
};

const saveToExcel = (data, name) => {
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Results');
    xlsx.writeFile(wb, `${name}.xlsx`);
};

function extractItemsLinks() {
    const extractedElements = document.querySelectorAll('.Nv2PK > a');
    const items = [];
    for (let element of extractedElements) {
        items.push(element.href);
    }
    return items;
}
function extractItemsData() {
    const extractedElementPhone = document.querySelector('[data-item-id^="phone:"] .Io6YTe');
    const extractedElementAddress = document.querySelector('[data-item-id="address"] .Io6YTe');
    return {
        phone: extractedElementPhone?.innerText || '',
        address: extractedElementAddress?.innerText || '',
    };
}



async function scrapeItems(
    page,
    itemCount,
    scrollDelay = 200,
) {
    let itemsLinks = [];
    let itemsData = [];

    //qjESne  loader
    try {
        let scrollHeight;
        let topScroll;
        let sumScroll = 0;
        while (itemsLinks.length < itemCount) {
            const linksCount =  await page.evaluate(`document.querySelectorAll('.Nv2PK > a').length`);
            if(linksCount >= itemCount) {
                const extractedLinks = await page.evaluate(extractItemsLinks);
                itemsLinks = Array.from(new Set(extractedLinks));
                break;
            }
            // scrollHeight = await page.evaluate(`document.querySelector('div[role="feed"]').scrollHeight`);
            // topScroll = await page.evaluate(`document.querySelector('div[role="feed"]').scrollTop`);
            // console.log(scrollHeight, topScroll);
            // sumScroll += scrollHeight - topScroll;
            const isMoreToLoad =  await page.evaluate(`!!document.querySelector('.qjESne')`);
            if(!isMoreToLoad) {
                console.log(itemsLinks)
                break;
            }
            
            await page.evaluate(`document.querySelector('.qjESne').scrollIntoView({ block: "end"})`);
            
            await page.waitForFunction(() => {
                const el = document.querySelector('.qjESne');
                var rect = el.getBoundingClientRect();
                var html = document.documentElement;
                return !(
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || html.clientHeight) &&
                    rect.right <= (window.innerWidth || html.clientWidth)
                );
            });

            // await page.waitForSelector('.qjESne', { hidden: true });
            // const signal = await page.evaluate(`Math.abs(document.querySelector('div[role="feed"]').scrollHeight - document.querySelector('div[role="feed"]').scrollTop - document.querySelector('div[role="feed"]').clientHeight) > 1`);

            // await page.waitForFunction(`Math.abs(document.querySelector('div[role="feed"]').scrollHeight - document.querySelector('div[role="feed"]').scrollTop - document.querySelector('div[role="feed"]').clientHeight) > 1`);

            // if (!signal) {
            //     console.log('we brake')
            //     break;
            // }
            console.log(itemsLinks.length < itemCount, itemsLinks.length)
            await setTimeout(scrollDelay);
        }
        console.log(itemsLinks.length, 'after')
        for (var i = 0; i < itemsLinks.length; i++) {
            const elem = itemsLinks[i];
            const newPage = await browser.newPage();
            await newPage.goto(elem);
            await newPage.waitForSelector('.Io6YTe');
            const extractedData = await newPage.evaluate(extractItemsData);
            itemsData.push(extractedData);
            await newPage.close();
            console.log(`clicked link`, i, itemsLinks.length);
            await setTimeout(100);
        }
    } catch (e) {
        console.log(e)
    }
    return itemsData;
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

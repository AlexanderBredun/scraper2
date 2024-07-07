const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();

    await page.goto(`https://www.google.com/maps/search/hello/@50.4018377,30.2208891,11z`);
    // await page.waitForSelector('.Nv2PK');

    // Set screen size
    // await page.setViewport({ width: 1080, height: 1024 });

    // Type into search box
    // await page.type(".search-box__input", "automate beyond recorder");

    // Wait and click on first result
    // const searchResultSelector = ".search-box__link";
    // await page.waitForSelector(searchResultSelector);
    // await page.click(searchResultSelector);
    const a = await page.evaluate('document.querySelector(".Nv2PK").innerText');
    const b = await page.evaluate('document.querySelector("h2")');
    console.log('my ', a, b?.classList)
    // Locate the full title with a unique string
    // const textSelector = await page.waitForSelector(
    //   "#span-stylecolor-var-chrome-primary-span", {timeout: 0}
    // );
    // const fullTitle = await textSelector.evaluate((el) => el.innerText);

    // Print the full title
    const logStatement = `The title of this blog post is ${a}`;
    console.log(logStatement);
    res.send(logStatement);
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };

const puppeteer = require('puppeteer');
const $ = require('cheerio').default;



async function scrapeAndScroll(
  page,
  search_regex,
  target_count,
  scrollDelay = 1000,
) {
  let items = [];
  let counter = 0
  try {
    let previousHeight;
    while (counter < target_count) {
      const html = await page.content()
      $('h3', html).each(function() {
        counter++;
        if(counter > target_count)
          return items;
        console.log("<h3>\n");
        console.log($(this).text());
        if($(this).text().search(search_regex) !== -1)
          items.push($(this).text());
        console.log("\n");
      });
      $('p', html).each(function() {
        console.log("<p>\n");
        console.log($(this).text());
        if($(this).text().search(search_regex) !== -1)
          items.push($(this).text());
        console.log("\n");
      });
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch(err) {
    console.log(err)
  }
  return items;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });
  await page.goto('https://www.reddit.com/r/wallstreetbets/');

  let search_regex = new RegExp('the')
  const items = await scrapeAndScroll(page, search_regex, 10);

  await browser.close();
  console.log("items: " + items);
})();
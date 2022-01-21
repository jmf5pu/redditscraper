const express = require('express');
const bodyParser = require("body-parser");
const server = express();
const puppeteer = require('puppeteer');
const $ = require('cheerio').default;
const {performance} = require('perf_hooks');

async function scrapeAndScroll(
	page,
	search_regex,
	target_count,
	pad_length = 50,
	scrollDelay = 1000,
) {
	let items = [];
	let counter = 0;
	try {
		let previousHeight;
    	while (counter < target_count) {
    		items = [];
      		const html = await page.content()
      		$('h3', html).each(function() {
      			console.log($(this).text());
        		counter++;
        		if(counter > target_count)
          			return items;
        		if($(this).text().search(search_regex) !== -1){
        			
        			if(($(this).text().search(search_regex) < pad_length) && ($(this).text().search(search_regex) + search_regex.length + pad_length > $(this).text().length)){//too short for padding, output as much as possible
        				items.push($(this).text());
        			}
        			else if($(this).text().search(search_regex) < pad_length){
        				items.push($(this).text().substring(0,$(this).text().search(search_regex)+pad_length));
        			}
        			else if($(this).text().search(search_regex) + search_regex.length + pad_length > $(this).text().length){
        				items.push($(this).text().substring($(this).text().search(search_regex)-pad_length,$(this).text().length));
        			}
        			else{
          				items.push($(this).text().substring($(this).text().search(search_regex)-pad_length, $(this).text().search(search_regex)+pad_length)); //output proper padding
          			}
          			
          			//items.push($(this).text());
        		}
      		});
			$('p', html).each(function() {
				console.log($(this).text());

        		if($(this).text().search(search_regex) !== -1){
          			if(($(this).text().search(search_regex) < pad_length) && ($(this).text().search(search_regex) + search_regex.length + pad_length > $(this).text().length)){//too short for padding, output as much as possible
        				items.push($(this).text());
        			}
        			else if($(this).text().search(search_regex) < pad_length){
        				items.push($(this).text().substring(0,$(this).text().search(search_regex)+pad_length));
        			}
        			else if($(this).text().search(search_regex) + search_regex.length + pad_length > $(this).text().length){
        				items.push($(this).text().substring($(this).text().search(search_regex)-pad_length,$(this).text().length));
        			}
        			else{
          				items.push($(this).text().substring($(this).text().search(search_regex)-pad_length, $(this).text().search(search_regex)+pad_length)); //output proper padding
          			}
          			
          			//items.push($(this).text());
        		}
			});
			previousHeight = await page.evaluate('document.body.scrollHeight');
			await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
			await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
			await page.waitFor(scrollDelay);
		}
	} catch(err) {
		console.log(err)
		return items;
	}
	return items;
}

server.use(bodyParser.urlencoded({
    extended:true
}));

// set the view engine to ejs
server.set('view engine', 'ejs');
  
server.get("/", function(req, res) {
	res.render('pages/index', {
		completed: false,
		items: "",
		search_str: "",
		target_count: "",
		sub: "",
    	item_count: 0,
    	runtime: 0
	});
});
  
server.post("/", async function(req, res) {
	var search_str = req.body.search_regex;
	var search_regex = new RegExp(req.body.search_regex);
	var target_count = parseInt(req.body.target_count);
	var sub = req.body.sub;

	var startTime = performance.now()

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	page.setViewport({ width: 1280, height: 926 });
	await page.goto('https://www.reddit.com/r/' + sub + '/new/', {waitUntil: 'load', timeout: 0});

	const items = await scrapeAndScroll(page, search_regex, target_count);

	const occurrences = [];
	for(let i = 0; i < items.length; i++){
		let matched = items[i].match(search_regex);
		occurrences.push(matched);
	}

	await browser.close()

	var endTime = performance.now()

	var item_count = items.length;
	var runtime = endTime-startTime;
	console.log(item_count);
	console.log(runtime);
	res.render('pages/index', {
		completed: true,
		items: items,
		search_str: search_str,
		target_count: target_count,
		sub: sub,
    	item_count: item_count,
    	runtime: runtime/1000 //convert ms to s
	});
});

server.listen(8080, function(){
	console.log("server is running on port 8080");
})
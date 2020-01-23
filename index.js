const pp = require('puppeteer');
const fs = require('fs');

const ppConfig = {
	headless: false,
	devtools: true,
	slowMo: 10 // slow down by 250ms
};

const credential = {
	user: '******',
	pass: '******'
};




(async () => {
	const browser = await pp.launch(ppConfig);
	const context = browser.defaultBrowserContext();
	context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);

	const page = await browser.newPage();

	const h = require('./helper')({ page });

	await h.openFacebook();
	await h.login(credential);
	await h.openMembers();
	const members = await h.getMemberList();

	fs.writeFile("members.json", JSON.stringify(members), (err) => {
		if(!err) {
			console.log('success')
		} else {
			console.log(err);
		}
	});

	console.log('total members', members.length);
})();

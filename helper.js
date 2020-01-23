class Helper {
	constructor({ page }) {
		this.page = page;
	}

	async openMembers() {
		await this.page.goto('https://www.facebook.com/groups/481251052025898/members/', {
			waitUntil: 'networkidle2'
		});

		Helper.printProgress('--> Member opened');
	};

	async openFacebook() {
		await this.page.setViewport({ width: 1366, height: 768});
		await this.page.goto('https://facebook.com', {
			waitUntil: 'networkidle2'
		});

		Helper.printProgress('--> Facebook opened');
		return this;
	};

	async login(credential) {
		const id = {
			login: '#email',
			pass: '#pass'
		};

		if(await this.isThere(id.login)) {
			await this.page.type(id.login, credential.user);
		} else {
			await this.page.type('input[name="email"]', credential.user);
		}

		if(await this.isThere(id.pass)) {
			await this.page.type(id.pass, credential.pass);
		} else {
			await this.page.type('input[name="pass"]', credential.pass);
		}
		await this.sleep(500);


		if(await this.isThere('#loginbutton')) {
			await this.page.click("#loginbutton");
		} else {
			await this.page.click('button[name="login"]');
		}

		await this.page.waitForNavigation();

		if(this.page.url().includes('login_attempt')) {
			Helper.printProgress('--> !! Login failed !!');

			process.exit();
		}

		Helper.printProgress('--> Logged in');
	};

	async getMemberList() {

		Helper.printProgress('--> Infinite scroll starts');
		await this.autoScroll();

		return await this.page.evaluate(
			() => {
				const members = [];

				Array.from(document.querySelector('#groupsMemberSection_all_members')
					.querySelectorAll('div[data-name="GroupProfileGridItem"]'), e => e)
					.map( item => {
						const extractContent = (html) => {

							return (new DOMParser).parseFromString(html, "text/html") .
								documentElement . textContent;

						};
						const getQueryVariable = (str, variable) => {
							if(!str) return null;
							let query = str.substring(1);
							let vars = query.split("&");
							for (let i=0;i<vars.length;i++) {
								let pair = vars[i].split("=");
								if(pair[0] === variable){return pair[1];}
							}
							return(false);
						};

					const user = {};
					user.image = item.children[0].querySelector('img').src;
					const name = item.querySelector('.uiProfileBlockContent').children[0].children[1].children[0].querySelector('a');
					user.name = name && name.innerText;
					user.id = name && getQueryVariable(name.getAttribute('ajaxify'), 'member_id');
					user.details = Array.from(item.querySelector('.uiProfileBlockContent').children[0].children[1].querySelectorAll('._60rj'), e => e).map((e => {
						if(!e) return;

						if(e.children.length) {
							const abbr = e.querySelector('abbr');
							if(!abbr) {
								return extractContent(e.querySelector('_gpi'));
							}
							return {
								when: abbr.getAttribute('title'),
								utime: abbr.getAttribute('data-utime')
							}
						} else {
							return e.innerText;
						}
					}));

					members.push(user);
				});

				return members;
			}

		);
	}

	async autoScroll() {
		await this.page.evaluate(async () => {
			await new Promise((resolve, reject) => {
				let scrollCount = 0;
				let totalHeight = 0;
				let distance = 100;
				let timer = setInterval(() => {
					let scrollHeight = document.body.scrollHeight;
					window.scrollBy(0, distance);
					totalHeight += distance;
					console.log(++scrollCount);
					if(totalHeight >= scrollHeight){
						clearInterval(timer);
						resolve();
					}
				}, 300);
			});
		});
	}

	async sleep(ms) {
		return new Promise((res, rej) => {
			setTimeout(() => {
				res();
			}, ms)
		});
	}

	async isThere(selector) {
		return await this.page.$(selector) !== null
	}

	static printProgress(text) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(text);
	}
}

module.exports = (options) => new Helper(options);

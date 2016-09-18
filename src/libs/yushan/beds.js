var moment = require('moment');
var request = require('request');
var cheerio = require('cheerio');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let rp = require('request-promise');
let lodash = require('lodash');

var parser = (nameZh, capacity, body, year, month) => {
	var selectorRemaining = nameZh.indexOf('營地') === -1 ? 'span.style11 font' : 'span.style12 font';
	var $ = cheerio.load(body);
	var calendarDivId = 'ctl00_ContentPlaceHolder1_CalendarReport';

	var gg = [];
	$(`#${calendarDivId} tr`).each( (i, ele) => {
		if (i >= 3 && i <= 8) {
			$(ele).find('td > a').each( (i, ele) => {
					var registered = $(ele).parent('td').find(selectorRemaining).text();
					var applying = $(ele).parent('td').find('span.style14 font').text();
					gg.push({
						date: moment().year(year).month(month).date(gg.length+1).format(),
						remaining: registered === '' ? capacity : capacity - parseInt(registered),
						applying: applying === '' ? 0 : parseInt(applying),
						isDrawn: true
					});
			});
		}
	});
	return gg;
};

var crawlThisMonth = (ddlLocation, nameZh, capacity) => {
	var url = `https://mountain.ysnp.gov.tw/chinese/Location_Detail.aspx?pg=01&w=1&n=1005&s=${ddlLocation}`;
	return new Promise( (resolve, reject) => {
		request(url, (err, res, body) => {
			if (err) {
				reject()
			}	else{
				resolve({
					body: body,
					data: parser(nameZh, capacity, body, moment().year(), moment().month())
				});
			}
		});
	})
}

var crawlNextMonth = (ddlLocation, nameZh, capacity, body) => {
	var $ = cheerio.load(body);
	var url = `https://mountain.ysnp.gov.tw/chinese/Location_Detail.aspx?pg=01&w=1&n=1005&s=${ddlLocation}`;
	return new Promise( (resolve, reject) => {
		request({
			'method': 'POST',
			'url': url,
			'form': {
				'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$CalendarReport',
				'__EVENTARGUMENT': $('table#ctl00_ContentPlaceHolder1_CalendarReport table tr td:nth-child(3) a').attr('href').substring(68, 68 + 5),
				'__VIEWSTATE': $('#__VIEWSTATE').val(),
				'__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
				'__EVENTVALIDATION': $('#__EVENTVALIDATION').val()
			}
		}, (err, res, body) => {
			if (err) {
				reject();
			}else {
				var nextMonth = moment().add(1, 'M');
				resolve({
					data: parser(nameZh, capacity, body, nextMonth.year(), nextMonth.month())
				});
			}
		});
	})
}

crawl = ({ddlLocation, nameZh, capacity}) => {
	// var beds = [];
	console.log(ddlLocation);
	// return new Promise( (resolve, reject) => {
	// 	crawlThisMonth(ddlLocation, nameZh, capacity)
	// 	.then( (value) => {
	// 		beds = value.data;
	// 		return crawlNextMonth(ddlLocation, nameZh, capacity, value.body);
	// 	})
	// 	.then( (value) => {
	// 		var begin = moment().date() - 1 + 7;
	// 		var end = begin + 24;
	// 		beds = beds.concat(value.data).slice(begin, end);
	// 		resolve(beds);
	// 	})
	// 	.catch(err => reject())
	// })
};

const parse = ($, nameZh) => {
	return new Promise( (resolve, reject) => {
		// const result = $('span.style11 font')
		// 	.map( (i, el) => $(el).text() )
		// 	.get()

		// const remaining = $('table#ctl00_ContentPlaceHolder1_CalendarReport span.style11')
		// 	.map((i, el) => {
		// 		return {
		// 			date: $(el).parent().find('a').attr('title'),
		// 			applying: $(el).find('font').text()
		// 		}
		// 	})
		// 	.get()

		let yearMonth = $(`
			table#ctl00_ContentPlaceHolder1_CalendarReport
			tr:nth-of-type(1)
			table
			td:nth-of-type(2)
		`).text();

		// const applying = $(`
		// 		table#ctl00_ContentPlaceHolder1_CalendarReport
		// 		span.style14
		// 	`)
		// 	.map((i, el) => {
		// 		// const date = $(el).parent().find('a').text();
		// 		const date =
		// 			moment(
		// 				`${yearMonth}${$(el).parent().find('a').text()} +0000`,
		// 				'YYYY年M月D Z'
		// 				// '2016-09-23'
		// 				// 'YYYY-'
		// 			)
		// 			// .utc()
		// 			.unix()
		// 			// .format();
		//
		// 		const count = $(el).find('font').text();
		// 		return {
		// 			[moment.unix(date).format()]: {applying: count}
		// 		}
		// 	})
		// 	.get()

		// const applying = {}
		const applying =
			$('td > a[title$="日"]')
			.map( (i, el) => {
				return {
					date: moment(`${yearMonth}${$(el).text()}日 +08:00`, 'YYYY年M月D日').format(),
					applying: $(el).parent().find('font[color=#0000C0]').text() || 0,
					// remaining: registered === '' ? capacity : capacity - parseInt(registered),
				}
			})
			.get();

		// console.log(applying);
		resolve(applying);
		// $(`ctl00_ContentPlaceHolder1_CalendarReport tr`).each( (i, ele) => {
		// 	if (i >= 3) {
		// 		$(ele).find('td > a').each( (i, ele) => {
		// 				var registered = $(ele).parent('td').find(selectorRemaining).text();
		// 				var applying = $(ele).parent('td').find('span.style14 font').text();
		// 				gg.push({
		// 					date: moment().year(year).month(month).date(gg.length+1).format(),
		// 					remaining: registered === '' ? capacity : capacity - parseInt(registered),
		// 					applying: applying === '' ? 0 : parseInt(applying),
		// 					isDrawn: true
		// 				});
		// 		});
		// 	}
		// });
	});
}

var parser = (nameZh, capacity, body, year, month) => {
	var selectorRemaining = nameZh.indexOf('營地') === -1 ? 'span.style11 font' : 'span.style12 font';
	var $ = cheerio.load(body);
	var calendarDivId = 'ctl00_ContentPlaceHolder1_CalendarReport';

	var gg = [];
	$(`#${calendarDivId} tr`).each( (i, ele) => {
		if (i >= 3 && i <= 8) {
			$(ele).find('td > a').each( (i, ele) => {
					var registered = $(ele).parent('td').find(selectorRemaining).text();
					var applying = $(ele).parent('td').find('span.style14 font').text();
					gg.push({
						date: moment().year(year).month(month).date(gg.length+1).format(),
						remaining: registered === '' ? capacity : capacity - parseInt(registered),
						applying: applying === '' ? 0 : parseInt(applying),
						isDrawn: true
					});
			});
		}
	});
	return gg;
};

const getBeds = async ( ({ddlLocation, nameZh, capacity}) => {
	const url = `https://mountain.ysnp.gov.tw/chinese/Location_Detail.aspx?pg=01&w=1&n=1005&s=${ddlLocation}`;

	let thisMonth = await (rp({
		url,
		transform: body => cheerio.load(body)
	}));

	thisMonthBeds = await (parse(thisMonth));
	return thisMonthBeds;


  // let thisMonth = await (gxetBedStatus({ASPState, url, room, monthOffset: 0}));
  // let nextMonth = await (getBedStatus({ASPState: thisMonth.ASPState, url, room, monthOffset: 1}))
  // thisMonthBeds = await (parser(thisMonth.$));
  // nextMonthBeds = await (parser(nextMonth.$));
  // return thisMonthBeds.concat(nextMonthBeds);
})

exports.get = getBeds;

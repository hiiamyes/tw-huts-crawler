let moment = require('moment');
let cheerio = require('cheerio');
let co = require('co');
let rp = require('request-promise');
let _ = require('lodash');

const huts = _.keyBy(require('./huts.json'), 'name');

const parse = ($, name) => {
	const year = /(\d*)年/g.exec($('table#ctl00_ContentPlaceHolder1_CalendarReport td[align="center"]').text())[1];
	const approvedColor = name.indexOf('營地') === -1 ? '#FF6600' : '#009933';
	const size = huts[name].size;

	return $('font[color="#FF6600"]').map( (i, el) => { // 找有入宿數字的欄位
		const td = $(el).closest('td'); // 往上找到代表欄位的 td
		const monthDate = td.find('a').attr('title'); // 往下找第一個 a 有日期
		return {
			date: moment(`${year}-${monthDate}`, 'YYYY-M月D日').format('YYYY-MM-DD'),
			remaining: size - Number.parseInt(td.find(`font[color="${approvedColor}"]`).text()), // 往下找 font color = #FF6600 的代表床位
			applying: td.find('font[color="#0000C0"]').text(), // 往下找 font color = #0000C0 的代表排隊
		}
		return $(el).text()
	}).get()
}

const getBeds = co.wrap(function* (name){
	let uri, body, $, beds, bedsThisMonth, bedsNextMonth, bedsNextNextMonth;
	uri = huts[name].url;

	// this month
	body = yield rp(uri);
	$ = cheerio.load(body);
	bedsThisMonth = parse($, name);

	// next month
	body = yield rp.post({
		uri,
		form: {
			'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$CalendarReport',
			'__EVENTARGUMENT': $('table#ctl00_ContentPlaceHolder1_CalendarReport table tr td:nth-child(3) a').attr('href').substring(68, 68 + 5),
			'__VIEWSTATE': $('#__VIEWSTATE').val(),
			'__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
			'__EVENTVALIDATION': $('#__EVENTVALIDATION').val()
		}
	})
	$ = cheerio.load(body);
	bedsNextMonth = parse($, name);

	// next next month
	body = yield rp.post({
		uri,
		form: {
			'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$CalendarReport',
			'__EVENTARGUMENT': $('table#ctl00_ContentPlaceHolder1_CalendarReport table tr td:nth-child(3) a').attr('href').substring(68, 68 + 5),
			'__VIEWSTATE': $('#__VIEWSTATE').val(),
			'__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
			'__EVENTVALIDATION': $('#__EVENTVALIDATION').val()
		}
	})
	$ = cheerio.load(body);
	bedsNextNextMonth = parse($, name);

	beds = bedsThisMonth.concat(bedsNextMonth, bedsNextNextMonth);
	return _.keyBy(beds, 'date');
})

exports.get = getBeds;

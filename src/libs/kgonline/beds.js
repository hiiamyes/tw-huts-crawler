let moment = require('moment');
let cheerio = require('cheerio');
let co = require('co');
let rp = require('request-promise');
let _ = require('lodash');

const huts = _.keyBy(require('./huts.json'), 'name');

const getBeds = co.wrap(function* (name) {

  let uri, body, $, year, month, csrf, bedsThisMonth, bedsNextMonth, bedsNextNextMonth, beds, reRemaining, reApplying;

  uri = huts[name].url;
  body = yield rp(uri);
  $ = cheerio.load(body);
  year = $('select[name="date_set[year]"] > option[selected]').text();
  month = $('select[name="date_set[month]"] > option[selected]').text();

  switch (name) {
  case '檜谷山莊':
    reRemaining = new RegExp(/檜谷山莊[^床]*床位\((\d*)/);
    reApplying = new RegExp(/檜谷山莊[^目]*目前報名 : (\d*)/);
    break;
  case '檜谷營地':
    reRemaining = new RegExp(/周圍營地[^營]*四人帳篷\((\d*)/);
    reApplying = new RegExp(/周圍營地[^目]*目前報名 : (\d*)/);
    break;
  }

  // 從有咖啡色顏色字的欄位開始找
  bedsThisMonth = $('font[color="#4B0F00"]').map( (i, el) => {
    // 往上找到代表欄位的 table
    const table = $(el).closest('table');
    return {
      // 往下找 font color = red 的代表日期
      date: moment(`${year}-${month}-${table.find('font[color="red"]').text()}`, 'YYYY-M-DD').format('YYYY-MM-DD'),
      // 往下找出 cendle_table 的 text，用 regex 爬出剩餘床位和申請人數
      remaining: reRemaining.exec(table.find('td.cendle_table').text())[1],
      applying: reApplying.exec(table.find('td.cendle_table').text())[1],
    }
  }).get();

  // 下個月
  // 只需要多加個 query string 就可啦
  csrf = $('form#form1 > input[name="csrf"]').attr('value');
  year = moment().year(year).month(Number.parseInt(month) - 1).add(1, 'M').year();
  month = moment().year(year).month(Number.parseInt(month) - 1).add(1, 'M').month() + 1;
  body = yield rp({
    uri,
    qs: {
      'date_set[year]': year,
      'date_set[month]': month,
      csrf
    },
  });
  $ = cheerio.load(body);

  bedsNextMonth = $('font[color="#4B0F00"]').map( (i, el) => {
    const table = $(el).closest('table');
    return {
      date: moment(`${year}-${month}-${table.find('font[color="red"]').text()}`, 'YYYY-M-DD').format('YYYY-MM-DD'),
      remaining: reRemaining.exec(table.find('td.cendle_table').text())[1],
      applying: reApplying.exec(table.find('td.cendle_table').text())[1],
    }
  }).get();

  // 下下個月
  csrf = $('form#form1 > input[name="csrf"]').attr('value');
  year = moment().year(year).month(Number.parseInt(month) - 1).add(1, 'M').year();
  month = moment().year(year).month(Number.parseInt(month) - 1).add(1, 'M').month() + 1;
  body = yield rp({
    uri,
    qs: {
      'date_set[year]': year,
      'date_set[month]': month,
      csrf
    },
  });
  $ = cheerio.load(body);
  bedsNextNextMonth = $('font[color="#4B0F00"]').map( (i, el) => {
    const table = $(el).closest('table');
    return {
      date: moment(`${year}-${month}-${table.find('font[color="red"]').text()}`, 'YYYY-M-DD').format('YYYY-MM-DD'),
      remaining: reRemaining.exec(table.find('td.cendle_table').text())[1],
      applying: reApplying.exec(table.find('td.cendle_table').text())[1],
    }
  }).get();

  beds = bedsThisMonth.concat(bedsNextMonth, bedsNextNextMonth)
  return _.keyBy(beds, 'date')
})

exports.get = getBeds;

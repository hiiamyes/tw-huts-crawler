let moment = require('moment');
let cheerio = require('cheerio');
let co = require('co');
let rp = require('request-promise');
let _ = require('lodash');

const huts = _.keyBy(require('./huts.json'), 'name');

const getBeds = co.wrap(function* (year, month) {

  let body, $, beds, reRemaining, reApplying;

  body = yield rp({
    uri: "http://tconline.forest.gov.tw/order/",
    qs: {
      year,
      month
    },
  });
  $ = cheerio.load(body);

  reRemaining = new RegExp(/剩餘床位:(\d*)/);
  reApplying = new RegExp(/目前報名:(\d*)/);

  beds = $('td.in_calendar_date').map( (i, el) => {
    const table = $(el).closest('table');
    const remaining = (reRemaining.exec(table.text()) || [])[1];
    const applying = (reApplying.exec(table.text()) || [])[1];
    if (remaining) {
      return {
        date: moment(`${year}-${month}-${table.find('font[color="red"]').text()}`, 'YYYY-M-DD').format('YYYY-MM-DD'),
        remaining,
        applying
      }
    }
  }).get();

  return beds
})

exports.get = co.wrap(function* () {
  const bedsThisMonth = yield getBeds(
    moment().year(),
    ('0' + (moment().month() + 1)).slice(-2)
  );
  const bedsNextMonth = yield getBeds(
    moment().add(1, 'M').year(),
    ('0' + (moment().add(1, 'M').month() + 1)).slice(-2)
  );
  const bedsNextNextMonth = yield getBeds(
    moment().add(2, 'M').year(),
    ('0' + (moment().add(2, 'M').month() + 1)).slice(-2)
  );

  const beds = bedsThisMonth.concat(bedsNextMonth, bedsNextNextMonth)
  return _.keyBy(beds, 'date');
})

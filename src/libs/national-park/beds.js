let moment = require('moment');
let cheerio = require('cheerio');
let co = require('co');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let rp = require('request-promise');
let _ = require('lodash');

const huts = _.keyBy(require('./huts.json'), 'name');

const getASPState = (name) => {
  const uri = huts[name].url;
  return new Promise( (resolve, reject) => {
    rp({
      uri,
      transform: body => cheerio.load(body)
    })
    .then( $ => {
      resolve({
        __EVENTVALIDATION: $('#__EVENTVALIDATION').val(),
        __VIEWSTATE: $('#__VIEWSTATE').val()
      })
    });
  })
}

const getBedStatus = ({ASPState, name, monthOffset}) => {
  const uri = huts[name].url;
  const rooms = huts[name].rooms;
  return new Promise( (resolve, reject) => {

    let date = monthOffset ? {
      ctl00$ContentPlaceHolder1$ddlMonth: moment().add(monthOffset, 'months').month() + 1,
      ctl00$ContentPlaceHolder1$ddlYear: moment().add(monthOffset, 'months').year(),
      ctl00$ContentPlaceHolder1$hidMonth: moment().add(monthOffset, 'months').month() + 1,
      ctl00$ContentPlaceHolder1$hidYear: moment().add(monthOffset, 'months').year(),
    } : {};

    rp.post({
      uri,
      form: Object.assign({}, ASPState, date, {
        ctl00$ContentPlaceHolder1$rooms: rooms,
        ctl00$ScriptManager1: 'ctl00$ScriptManager1|ctl00$ContentPlaceHolder1$btnsearch',
        ctl00$ContentPlaceHolder1$btnsearch: '查詢'
      }),
      transform: body => cheerio.load(body)
    })
    .then( $ => {
      resolve({
        $,
        ASPState: {
          __EVENTVALIDATION: $('#__EVENTVALIDATION').val(),
          __VIEWSTATE: $('#__VIEWSTATE').val()
        }
      })
    });
  })
}

const parser = ($) => {
  return new Promise( (resolve, reject) => {
    let beds = [];
    for (var i = 1; i <= 42; i++) {
      const indexString = `0${i}`.substr(-2);
      const date = $(`#ContentPlaceHolder1_cc_${indexString} a`)
      if (date.length) {
        const [year, month, day] = date.attr('href').split('sdate=')[1].split('-');
        const remaining = parseInt($(`#ContentPlaceHolder1_cc_${indexString} a span:nth-of-type(1)`).text());
        const waiting = parseInt($(`#ContentPlaceHolder1_cc_${indexString} a span:nth-of-type(2)`).text());
        const applying = parseInt($(`#ContentPlaceHolder1_cc_${indexString} a span:nth-of-type(3)`).text());
        beds.push({
          date: moment(`${parseInt(year) + 1911}-${month}-${day}`).format('YYYY-MM-DD'),
          remaining,
          applying: waiting + applying,
          isDrawn: true,
        });
      }
    }
    resolve(beds);
  })
}

const getBeds = async ((name) => {
  let ASPState = await (getASPState(name));
  let thisMonth = await (getBedStatus({ASPState, name, monthOffset: 0}));
  let nextMonth = await (getBedStatus({ASPState: thisMonth.ASPState, name, monthOffset: 1}))
  thisMonthBeds = await (parser(thisMonth.$));
  nextMonthBeds = await (parser(nextMonth.$));
  return thisMonthBeds.concat(nextMonthBeds);
})

exports.get = getBeds;

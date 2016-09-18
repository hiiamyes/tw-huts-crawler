let moment = require('moment');
let cheerio = require('cheerio');
let co = require('co');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let rp = require('request-promise');

const getASPState = (url) => {
  return new Promise( (resolve, reject) => {
    rp({
      url,
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

const getBedStatus = ({ASPState, url, room, monthOffset}) => {
  return new Promise( (resolve, reject) => {

    let date = monthOffset ? {
      ctl00$ContentPlaceHolder1$ddlMonth: moment().add(monthOffset, 'months').month() + 1,
      ctl00$ContentPlaceHolder1$ddlYear: moment().add(monthOffset, 'months').year(),
      ctl00$ContentPlaceHolder1$hidMonth: moment().add(monthOffset, 'months').month() + 1,
      ctl00$ContentPlaceHolder1$hidYear: moment().add(monthOffset, 'months').year(),
    } : {};

    rp.post({
      url,
      form: Object.assign({}, ASPState, date, {
        ctl00$ContentPlaceHolder1$rooms: room,
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
          date: moment.utc(`${parseInt(year) + 1911}-${month}-${day}`).format(),
          remaining,
          applying: waiting + applying,
          isDrawn: true,
        });
      }
    }
    resolve(beds);
  })
}

const getBeds = async ((url, room) => {
  let ASPState = await (getASPState(url));
  let thisMonth = await (getBedStatus({ASPState, url, room, monthOffset: 0}));
  let nextMonth = await (getBedStatus({ASPState: thisMonth.ASPState, url, room, monthOffset: 1}))
  thisMonthBeds = await (parser(thisMonth.$));
  nextMonthBeds = await (parser(nextMonth.$));
  return thisMonthBeds.concat(nextMonthBeds);
})

exports.get = getBeds;

let axios = require('axios');
let cheerio = require('cheerio');
let MongoClient = require('mongodb').MongoClient;
let co = require('co');
let async = require('asyncawait/async');
let await = require('asyncawait/await');

const URL_SHEI_PA_HUTS_LIST = 'https://npm.cpami.gov.tw/bed_1.aspx';
const URL_TAROKO_HUTS_LIST = 'https://npm.cpami.gov.tw/bed_4.aspx';

const parser = ({data, admin, url}) => {
  return new Promise( (resolve, reject) => {
    $ = cheerio.load(data);
    let index = 0;
    let huts = [];
    while (true) {
      let name = $(`#ContentPlaceHolder1_Repeater_List_name_${index}`);
      let room = $(`#ContentPlaceHolder1_Repeater_List_HiddenField1_${index}`);
      if (name.length === 0) break;
      huts.push({
        admin,
        url,
        name: name.text(),
        room: Number.parseInt(room.val()),
      })
      index++;
    }
    resolve(huts);
  })
}

exports.get = async ( () => {

  let SheiPa = await (axios.get(URL_SHEI_PA_HUTS_LIST));
  let hutsSheiPa = await (parser({data: SheiPa.data, admin: 'sheipa', url: URL_SHEI_PA_HUTS_LIST}));

  let Taroko = await (axios.get(URL_TAROKO_HUTS_LIST));
  let hutsTatoko = await (parser({data: Taroko.data, admin: 'taroko', url: URL_TAROKO_HUTS_LIST}));

  return hutsSheiPa.concat(hutsTatoko);
})

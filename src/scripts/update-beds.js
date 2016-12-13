var moment = require('moment');
var co = require('co');
var MongoClient = require('mongodb').MongoClient;

var nationalParkBeds = require('../libs/national-park/beds');
var jmlntBeds = require('../libs/jmlnt/beds');
var kgonlineBeds = require('../libs/kgonline/beds');
var tconlineBeds = require('../libs/tconline/beds');
var yuShanBeds = require('../libs/yushan/beds');

const crawlers = {
  sheipa: nationalParkBeds,
  taroko: nationalParkBeds,
  tconline: tconlineBeds,
  kgonline: kgonlineBeds,
  jmlnt: jmlntBeds,
  yushan: yuShanBeds
}

const updateDB = (db, hut, beds) => {
  return db
    .collection('huts')
    .update(
      {name: hut.name},
      {$set:
        {
          updateAt: moment.utc().format(),
          beds
        }
      }
    )
}

const crawler = co.wrap( function* (db, hut){
  try {
    const beds = yield crawlers[hut.admin].get(hut.name);
    if (beds) {
      yield updateDB(db, hut, beds);
      console.log(`${hut.name}: crawler success`);
    }else {
      throw 'get beds fail';
    }
  } catch (err) {
    console.log(`${hut.name}: crawler fail: ${err}`);
  }
})

co(function* (){
  console.log('save beds');
  let db = yield MongoClient.connect(
    process.env.NODE_ENV === 'production' ?
    require('../../keys/db-url.json').prod :
    require('../../keys/db-url.json').dev
  );

  var huts = yield db.collection('huts').find().toArray();
  yield huts.map( hut => hut.available ? crawler(db, hut) : null );

  db.close();
  console.log('save beds done');
})
.catch(err => {
  console.log('save beds err: ', err);
})

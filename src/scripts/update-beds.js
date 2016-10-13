var moment = require('moment');
var co = require('co');
var MongoClient = require('mongodb').MongoClient;

var nationalParkBeds = require('../libs/national-park/beds');
var jmlntBeds = require('../libs/jmlnt/beds');
var kgonlineBeds = require('../libs/kgonline/beds');
var tconlineBeds = require('../libs/tconline/beds');
var yuShanBeds = require('../libs/yushan/beds');

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
    let beds;
    switch (hut.admin) {
      case 'sheipa':
        beds = yield nationalParkBeds.get(hut.name);
        break
      case 'taroko':
        beds = yield nationalParkBeds.get(hut.name);
        break;
      case 'tconline':
        beds = yield tconlineBeds.get(hut.name);
        break
      case 'kgonline':
        beds = yield kgonlineBeds.get(hut.name);
        break
      case 'jmlnt':
        beds = yield jmlntBeds.get(hut.name);
        break;
      case 'yushan':
        beds = yield yuShanBeds.get(hut.name);
        break;
    }
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
  var db = yield MongoClient.connect(process.env.NODE_ENV === 'production' ? 'mongodb://localhost:27017/tw-huts' : 'mongodb://localhost:27017/tw-huts-dev');

  var huts = yield db.collection('huts').find().toArray();
  yield huts.map( hut => crawler(db, hut) );

  db.close();
  console.log('save beds done');
})
.catch(err => {
  console.log('save beds err: ', err);
})

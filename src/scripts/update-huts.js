
let co = require('co');
let MongoClient = require('mongodb').MongoClient;

let nationalParkHuts = require('../libs/national-park/huts');

const updateDB = (db, hut) => {
  return db
    .collection('huts')
    .updateOne(
      {name: hut.name},
      {$set: hut},
      {upsert: true}
    );
}

co(function* (){
  console.log('save huts');

  let db = yield MongoClient.connect(process.env.NODE_ENV === 'production' ? 'mongodb://localhost:27017/tw-huts' : 'mongodb://localhost:27017/tw-huts-dev');

  yield require('../libs/national-park/huts.json').map( hut => updateDB(db, hut) );
  yield require('../libs/yushan/huts.json').map( hut => updateDB(db, hut) );
  yield require('../libs/tianchi/huts.json').map( hut => updateDB(db, hut) );
  yield require('../libs/kgonline/huts.json').map( hut => updateDB(db, hut) );
  yield require('../libs/jmlnt/huts.json').map( hut => updateDB(db, hut) );

  db.close();
  console.log('save huts done');
})
.catch(err => {
  console.log('save huts err: ', err);
})

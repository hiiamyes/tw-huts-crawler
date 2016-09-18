
let moment = require('moment');
let co = require('co');
let MongoClient = require('mongodb').MongoClient;
let nationalParkBeds = require('../libs/national-park/beds');

co(function* (){
  console.log('save beds');
  let db = yield MongoClient.connect(process.env.NODE_ENV === 'production' ? 'mongodb://localhost:27017/tw-huts' : 'mongodb://localhost:27017/tw-huts-dev');

  let huts = yield db.collection('huts').find().toArray();
  let beds = yield huts.map( hut => nationalParkBeds.get(hut.url, hut.room) );

  yield huts.map( (hut, i) => {
    return db
      .collection('huts')
      .update(
        {name: hut.name},
        {$set:
          {
            updateAt: moment().unix(),
            beds: beds[i]
          }
        }
      )
  })
  db.close();
  console.log('save beds done');
})
.catch(err => {
  console.log('save beds err: ', err);
})

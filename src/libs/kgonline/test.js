// let huts = require('./huts.js')
let beds = require('./beds.js')


// beds.get('檜谷山莊')
// .then(res => console.log(res))
// .catch(err => console.log(err))

beds.get('檜谷營地')
.then(res => console.log(res))
.catch(err => console.log(err))

// let huts = require('./huts.js')
let beds = require('./beds.js')

// beds.get('嘉明湖營地')
// .then(res => console.log(res))
// .catch(err => console.log(err))

beds.get()
.then(res => console.log(res))
.catch(err => console.log(err))

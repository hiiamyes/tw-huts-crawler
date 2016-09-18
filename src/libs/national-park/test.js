// let huts = require('./huts.js')
let beds = require('./beds.js')

// 31 + 7
// huts.get().then(res => console.log(res))

beds.get('南湖山屋').then(res => console.log(res));


// console.log(require('./huts.json'))

let beds = require('./beds');
// 圓峰山屋
beds.get({ddlLocation: 136}).then(res => console.log(res))

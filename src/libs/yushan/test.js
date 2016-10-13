
let beds = require('./beds');

beds.get('庫哈諾辛山屋')
.then(res => console.log(res))
.catch(err => console.log(err));

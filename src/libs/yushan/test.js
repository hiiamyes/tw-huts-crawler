
let beds = require('./beds');

beds.get('圓峰山屋')
.then(res => console.log(res))
.catch(err => console.log(err));

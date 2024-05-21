let producterController = require('./producterController.js');

const numberOfWorkers = 5;
const httpStartPort = 3001;
let producters = [];
for(let i=0;i<=numberOfWorkers;i++){
    producters.push(new producterController(i,httpStartPort, numberOfWorkers))
}
producters.forEach((prod)=>{
    prod.init();
})
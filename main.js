let producterController = require('./producterController.js');
let ConsommateurController = require('./consommateurController.js');
const numberOfWorkers = 5;
const httpStartPort = 3001;
let sites = [];
for(let i=0;i<=numberOfWorkers;i++){
    sites.push(new producterController(i,httpStartPort, numberOfWorkers))
}
sites.push(new ConsommateurController(-1, httpStartPort-1, numberOfWorkers))
sites.forEach((s)=>{
    s.init();
})
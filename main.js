const { Worker, workerData } = require('worker_threads');
const os = require('os');
const hostname = os.hostname();


class myWorker{
  constructor({id,hostname,HTTPport,HTTPStartPort, table}){
    this.id = id;
    this.hostname = hostname;
    this.HTTPport = HTTPport;
    this.HTTPStartPort = HTTPStartPort;
    this.worker = undefined;
    this.table = table;
  }
  async init(){
    this.worker =  new Worker( `${__dirname}/worker-site.js`, {workerData: {id:this.id,hostname:this.hostname,HTTPport:this.HTTPport,HTTPStartPort:this.HTTPStartPort,table:this.table}});
    
    return new Promise((resolve,_)=>{
      this.worker.on('message', 
         (messageFromWorker) => { 
          if('workerOnline'== messageFromWorker.type){
            console.log(`main has just received an online message from worker ${messageFromWorker.id}`)
            resolve(`worker ${this.id} is online`);
          }
        })
    })
  }
}
class myWorkerCons{
  constructor({id,hostname,HTTPport, table}){
    this.id = id;
    this.hostname = hostname;
    this.HTTPport = HTTPport;
    this.worker = undefined;
    this.table = table;
  }
  async init(){
    let data = this;
    this.worker =  new Worker( `${__dirname}/worker-cons.js`,  {workerData: {id:this.id,hostname:this.hostname,HTTPport:this.HTTPport,table:this.table}});
    
    return new Promise((resolve,_)=>{
      this.worker.on('message', 
         (messageFromWorker) => { 
          if('workerOnline'== messageFromWorker.type){
            console.log(`main has just received an online message from worker ${messageFromWorker.id}`)
            resolve(`worker ${this.id} is online`);
          }
        })
    })
  }
}


class Producteurs extends Array {
    constructor({numberOfWorkers, hostname, startPort}) {
        super();
        this.numberOfWorkers = numberOfWorkers;
        let table = new Array(numberOfWorkers).fill(["rel",0]);
        this.hostname = hostname;
        this.startPort = startPort;
        let HTTPport = this.startPort;
        this.push(new myWorkerCons({id:0,hostname:this.hostname,HTTPport,table}))
        let HTTPStartPort = this.startPort + 1;
        for(let id=0;  id<this.numberOfWorkers ; id++){
            HTTPport = HTTPStartPort + id;
            const theWorker = new myWorker({id,hostname:this.hostname,HTTPport,HTTPStartPort,table})
            this.push(theWorker)
        }
    }

    async init(){
        const sitesPromises = new Array();
        this.forEach((site)=>{sitesPromises.push(site.init())})
        Promise.all(sitesPromises).then(()=>{
        setTimeout(()=>{
            this.launch()
        }, 1000)

     
    
        })
        setTimeout(()=>{this.harakiri()}, 100000);
    }

    harakiri(){
        this.forEach((site)=>{site.worker.terminate()});
    }

  
    async launch(){


    }
}


const myRingOfWorkers = new Producteurs({numberOfWorkers:5,hostname, startPort:3000});
myRingOfWorkers.init().then(()=>{console.log(`done`)})



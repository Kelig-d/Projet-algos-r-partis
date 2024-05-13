const { Worker, workerData } = require('worker_threads');
const os = require('os');
const hostname = os.hostname();


class myWorker{
  constructor({id,hostname,HTTPport,HTTPStartPort}){
    this.id = id;
    this.hostname = hostname;
    this.HTTPport = HTTPport;
    this.HTTPStartPort = HTTPStartPort;
    this.worker = undefined;
    this.hl = 0;
    this.he = 0;
    this.debprod = 0;
    this.finprod = 0;
    this.ifincons = 0;
  }
  async init(){
    data = this;
    this.worker =  new Worker( `${__dirname}/worker-site.js`, data);
    
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
        this.hostname = hostname;
        this.startPort = startPort;
        let HTTPport = this.startPort;
        let HTTPStartPort = this.startPort;
        for(let id=0;  id<this.numberOfWorkers ; id++){
            HTTPport = this.startPort + id;
            const theWorker = new myWorker({id,hostname:this.hostname,HTTPport,HTTPStartPort})
            this.push(["rel",0]);

        }
    }

    async init(){
        const sitesPromises = new Array();
        this.forEach((site)=>{sitesPromises.push(site.init())})
        Promise.all(sitesPromises).then(()=>{
        //setTimeout(()=>{
            this.launch()
        //}, 1000)

     
    
        })
        setTimeout(()=>{this.harakiri()}, 100000);
    }

    harakiri(){
        this.forEach((site)=>{site.worker.terminate()});
    }

  
    async launch(){
        const token = {
        type:'token',
        payload:{
            cpt:0
        }
        }

        fetch(
        `http://${this.hostname}:${this.startPort}/token`,
        {
            method: 'post',
            body: JSON.stringify(token),
            headers: {'Content-Type': 'application/json'}
        }
        )
        .then((data)=>{
        return data.json()
        })
        .then((respons)=>{
        console.log(`main has just send a token to ${this.startPort}`);
        })

    }
}


const myRingOfWorkers = new Producteurs({numberOfWorkers:5,hostname, startPort:3000});
myRingOfWorkers.init().then(()=>{console.log(`done`)})



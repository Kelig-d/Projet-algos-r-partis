const { Worker, workerData } = require('worker_threads');
const os = require('os');

const express = require('express');
const N = 2;

class ProducterController{
  constructor(id,HTTPStartPort, numberOfWorkers){
    this.id = id;
    this.hostname = os.hostname();
    this.HTTPport = HTTPStartPort + id;
    this.HTTPStartPort = HTTPStartPort;
    this.worker = undefined;
    this.table = new Array(numberOfWorkers).fill(["rel",0]);
    this.hl = 0;
    this.he = 0;
    this.debprod = 0;
    this.finprod = 0;
    this.ifincons = 0;
    this.reqEnCours = false;
    this.scEnCours = false;
  }

  section_critique(){
    if(!this.scEnCours && this.plus_vieille_date()==this.id && this.debprod - this.ifincons < N){
      console.log(`\t \t Producter ${this.id} work in critical zone`);
      this.debprod += 1;
      this.scEnCours = true;
      return true;
    }
    else return false;
  }

  maj_h(he) {
    if (he > this.hl) {
      this.hl = he;
    } else {
      this.hl += 1;
    }
  }
  
  diffuser(msg) {
    for (let targetId = 0; targetId < this.table.length; targetId++) {
      let HTTPportDest = this.HTTPStartPort + targetId;

      if (HTTPportDest != this.HTTPport) {
        fetch(
          `http://${this.hostname}:${HTTPportDest}/${msg}`,
          {
              method: 'post',
              body: JSON.stringify({"hl":this.hl,"id":this.id}),
              headers: {'Content-Type': 'application/json', 'Accept':'application/json'}
          }
          )
          .then(()=>{
          console.log(`worker has just send a ${msg} to ${targetId}`);
          })
      }
    }
  }
  
  plus_vieille_date() {
    let plusVieilleDate = this.hl;
    let plusVieilleDateProcessId = this.id;
    for (let newId = 0; newId < this.table.length; newId++) {
      if (this.table[newId][1] <= plusVieilleDate) {
        plusVieilleDate = this.table[newId][1];
        plusVieilleDateProcessId = newId;
      }
    }
    return plusVieilleDateProcessId;
  }

  async init(){
    this.worker =  new Worker( `${__dirname}/worker-prod.js`, {workerData: {id:this.id,hostname:this.hostname,HTTPport:this.HTTPport,HTTPStartPort:this.HTTPStartPort,table:this.table}});
    this.app = express();
    this.app.use(express.json());   
    this.app.use(express.urlencoded({ extended: true })); 

    
  this.app.post('/req',(req, res) =>{
    this.maj_h(req.body.hl);
    this.hl +=1;
    fetch(
      `http://${this.hostname}:${this.HTTPStartPort + req.body.id}/ack`,
      {
          method: 'post',
          body: JSON.stringify({hl:this.hl,id:this.id}),
          headers: {'Content-Type': 'application/json'}
      }
      )
      .then(()=>{
      console.log(`worker has just send a ack to ${targetId}`);
      })
      this.table[req.body.id] = ["req",this.he]
  })

  this.app.post('/ack', (req, res) =>{
    console.log("coucou");
    this.maj_h(req.body.hl);
    this.table[req.body.id] = this.table[req.body.id][0] != "req" ? ["ack",req.body.hl] : this.table[req.body.id]
  })

  this.app.post('/rel', (req, res)=>{
    this.maj_h(req.body.hl);
    this.table[this.id] = ["rel",req.body.hl];
    this.debprod += 1;
    this.finprod += 1;
  })

  this.app.get('/ifincons', (req, res)=>{
    ifincons +=1;
  })

    this.app.listen(this.HTTPport, () => {
      console.log(`Worker Site number ${this.id} is running on http://${this.hostname}:${this.HTTPport}`)
    })

    return new Promise((resolve,_)=>{
      this.worker.on('message', 
         (messageFromWorker) => { 
          if(messageFromWorker == "besoin_sc"){
            if(!this.reqEnCours){
              console.log(`\t \t ${this.id} asks for critical zone`);
              this.hl += 1; 
              this.reqEnCours = true;
              this.diffuser("req", this.hl, this.id);
              this.table[this.id] = ["req",this.hl];
              this.section_critique() ? this.worker.postMessage('access') : this.worker.postMessage('no access');
            }
          }
          if(messageFromWorker == "fin_sc"){
            if(reqEnCours && scEnCours){
              console.log(`\t \t ${this.id} release the critical zone`);
              this.finprod += 1;
              fetch(`http://${this.hostname}:${this.HTTPStartPort - 1}/ifinprod`);
              this.scEnCours = false;
              this.hl+=1;
              diffuser("rel",this.hl,this.id);
              this.table[this.id] = ["rel",this.hl];
              this.reqEnCours = false;
            }

          }
        })
    })
  }


}

module.exports = ProducterController;

// class Producteurs extends Array {
//     constructor({numberOfWorkers, hostname, startPort}) {
//         super();
//         this.numberOfWorkers = numberOfWorkers;
        
//         this.hostname = hostname;
//         this.startPort = startPort;
//         let HTTPport = this.startPort;
//         let HTTPStartPort = this.startPort + 1;
//         for(let id=0;  id<this.numberOfWorkers ; id++){
//             HTTPport = HTTPStartPort + id;
//             this.push(theWorker)
//         }
//     }

//     async init(){
//         const sitesPromises = new Array();
//         this.forEach((site)=>{sitesPromises.push(site.init())})
//         Promise.all(sitesPromises).then(()=>{
//         setTimeout(()=>{
//             this.launch()
//         }, 1000)

     
    
//         })
//         setTimeout(()=>{this.harakiri()}, 100000);
//     }

//     harakiri(){
//         this.forEach((site)=>{site.worker.terminate()});
//     }

  
//     async launch(){


//     }
// }


// const myRingOfWorkers = new Producteurs({numberOfWorkers:5,hostname, startPort:3000});
// myRingOfWorkers.init().then(()=>{console.log(`done`)})



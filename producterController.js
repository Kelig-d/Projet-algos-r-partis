const { Worker, workerData } = require('worker_threads');
const os = require('os');

const express = require('express');
const N = 1;

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
    this.time = new Date;
  }

  section_critique(){
    if(!this.scEnCours && this.reqEnCours && this.plus_vieille_date()==this.id && this.debprod - this.ifincons < N){
      console.log(`\t \t Producter ${this.id} work in critical zone ${(new Date - this.time) /1000} seconds`);
      this.debprod += 1;
      this.scEnCours = true;
      this.worker.postMessage('access') ;    
    }
    else this.worker.postMessage('no access');
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

  update_tab(id, type, value){
    this.table[id] = [type, value];
    this.section_critique();

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
      this.update_tab(req.body.id, "req", this.he)
  })

  this.app.post('/ack', (req, res) =>{
    this.maj_h(req.body.hl);
    if(this.table[req.body.id][0] != "req") this.update_tab(req.body.id,"ack",req.body.hl);
  })

  this.app.post('/rel', (req, res)=>{
    this.maj_h(req.body.hl);
    this.update_tab(this.id, "rel", req.body.hl)
    this.debprod += 1;
    this.finprod += 1;
  })

  this.app.get('/ifincons', (req, res)=>{
    this.ifincons +=1;
    this.section_critique();
  })

    this.app.listen(this.HTTPport, () => {
      console.log(`Worker Site number ${this.id} is running on http://${this.hostname}:${this.HTTPport}`)
    })

    return new Promise((resolve,_)=>{
      this.worker.on('message', 
         (messageFromWorker) => { 
          if(messageFromWorker == "besoin_sc"){
            if(!this.reqEnCours){
              console.log(`\t \t ${this.id} asks for critical zone ${(new Date - this.time) /1000} seconds`);
              this.hl += 1; 
              this.reqEnCours = true;
              this.diffuser("req", this.hl, this.id);
              this.update_tab(this.id,"req",this.hl)
              this.section_critique();
            }
          }
          if(messageFromWorker == "fin_sc"){
            if(this.reqEnCours && this.scEnCours){
              console.log(`\t \t ${this.id} release the critical zone ${(new Date - this.time) /1000} seconds`);
              this.finprod += 1;
              fetch(`http://${this.hostname}:${this.HTTPStartPort - 1}/ifinprod`);
              this.scEnCours = false;
              this.hl+=1;
              this.diffuser("rel",this.hl,this.id);
              this.update_tab(this.id, "rel", this.hl);
              this.reqEnCours = false;
            }

          }
        })
    })
  }


}

module.exports = ProducterController;

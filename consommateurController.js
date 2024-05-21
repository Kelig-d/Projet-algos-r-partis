const { Worker, workerData } = require('worker_threads');
const os = require('os');
const express = require('express');


class ConsommateurController{
  constructor(id,HTTPport, numberOfProducters){
    this.id = id;
    this.hostname = os.hostname();
    this.HTTPport = HTTPport;
    this.worker = undefined;
    this.debcons = 0;
    this.fincons = 0;
    this.ifinprod = 0;
    this.reqEnCours = false;
    this.scEnCours = false;
    this.numberOfProducters = numberOfProducters;
    this.time = new Date;
  }

  section_critique(){
    if(!this.scEnCours && this.reqEnCours && this.debcons - this.ifinprod < 0){
      console.log(`\t \t Consumer ${this.id} work in critical zone ${(new Date - this.time) /1000} seconds`);
      this.debcons += 1;
      this.scEnCours = true;
      this.worker.postMessage('access') ;    
    }
    else this.worker.postMessage('no access');
  }

  async init(){
    this.worker =  new Worker( `${__dirname}/worker-prod.js`,  {workerData: {id:this.id,hostname:this.hostname,HTTPport:this.HTTPport,table:this.table}});
    this.app = express();
    this.app.use(express.json());   
    this.app.use(express.urlencoded({ extended: true })); 

    this.app.get('/ifinprod', (req, res)=>{
      this.ifinprod +=1;
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
              this.reqEnCours = true;
              this.section_critique();
            }
          }
          if(messageFromWorker == "fin_sc"){
            if(this.reqEnCours && this.scEnCours){
              console.log(`\t \t ${this.id} release the critical zone ${(new Date - this.time) /1000} seconds`);
              this.fincons += 1;
              for(let i=0; i<=this.numberOfProducters;i++){
                fetch(`http://${this.hostname}:${this.HTTPport + 1}/ifincons`);
              }
              this.scEnCours = false;
              this.reqEnCours = false;
              this.section_critique();
            }

          }
        })
    })
  }
}

module.exports = ConsommateurController;
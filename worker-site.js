const { parentPort, workerData } = require('worker_threads')

const express = require('express')
const app = express()
app.use(express.json());   
app.use(express.urlencoded({ extended: true })); 
const id = workerData.id; 
const hostIP = workerData.hostIP;
const hostname = workerData.hostname;
const HTTPport = workerData.HTTPport; 
const HTTPStartPort = workerData.HTTPStartPort; 
let hl = 0;
let he = 0;
let debprod = 0;
let finprod = 0;
let ifincons = 0;
let table = workerData.table;
let reqEnCours = false;
let scEnCours = false;
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/req',(req, res) =>{
    maj_h(req.body.hl);
    hl +=1;
    sendAck(hl, id, req.body.id);
    table[req.body.id] = ["req",he]
})

app.post('/ack', (req, res) =>{
  maj_h(req.body.hl);
  table[req.body.id] = table[req.body.id][0] != "req" ? ["ack",req.body.hl] : table[req.body.id]
})

app.post('/rel', (req, res)=>{
  maj_h(req.body.hl);
  table[id] = ["rel",req.body.hl];
  debprod += 1;
  finprod += 1;
})

app.get('/besoinsc',(req,res)=>{
  if(!reqEnCours){
    console.log(`\t \t ${workerData.id} asks for critical zone`);
    hl += 1; 
    reqEnCours = true;
    diffuser("req", hl, id);
    table[id] = ["req",hl];
  }
})

app.get('/ifincons', (req, res)=>{
  ifincons +=1;
})

app.listen(HTTPport, () => {
    console.log(`Worker Site number ${id} is running on http://${hostname}:${HTTPport}`)
  })
  


async function start(){
        await cruise();
        await workOnSection();
        await releaseSection();
        await start()
}

function sendAck(hl, id, targetId){
    fetch(
        `http://${hostname}:${HTTPStartPort + targetId}/ack`,
        {
            method: 'post',
            body: JSON.stringify({hl:hl,id:id}),
            headers: {'Content-Type': 'application/json'}
        }
        )
        .then(()=>{
        console.log(`worker has just send a ack to ${targetId}`);
        })
}

function maj_h(he) {
  if (he > hl) {
    hl = he;
  } else {
    hl += 1;
  }
}

function diffuser(msg) {
  for (let targetId = 0; targetId < table.length; targetId++) {
    let HTTPportDest = HTTPStartPort + targetId;
    if (HTTPportDest != HTTPport) {
      fetch(
        `http://${hostname}:${HTTPportDest}/${msg}`,
        {
            method: 'post',
            body: JSON.stringify({"hl":hl,"id":id}),
            headers: {'Content-Type': 'application/json', 'Accept':'application/json'}
        }
        )
        .then(()=>{
        console.log(`worker has just send a ${msg} to ${targetId}`);
        })
    }
  }
}

function plus_vieille_date() {
  let plusVieilleDate = hl;
  let plusVieilleDateProcessId = id;
  for (let id = 0; id < table.length; id++) {
    if (table[id][1] < plusVieilleDate) {
      plusVieilleDate = table[id][1];
      plusVieilleDateProcessId = id;
    }
  }
  return plusVieilleDateProcessId;
}
  
  /* Acquisition */
  async function cruise(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          fetch(`http://${hostname}:${HTTPport}/besoinsc`);
        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }

  function workOnSection(){
          if(!scEnCours && plus_vieille_date()==id && debprod - ifincons < 2){
            console.log(`\t \t ${workerData.id} work in critical zone`);
            debprod += 1;
            scEnCours = true;
          }
  }
  
  async function releaseSection(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          if(reqEnCours && scEnCours){
            console.log(`\t \t ${workerData.id} release the critical zone`);
            finprod += 1;
            fetch(`http://${hostname}:${HTTPStartPort - 1}/ifinprod`);
            scEnCours = false;
            hl+=1;
            diffuser("rel",hl,id);
            table[id] = ["rel",hl];
            reqEnCours = false;
          }
        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }


start();

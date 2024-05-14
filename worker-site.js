const { parentPort, workerData } = require('worker_threads')

const express = require('express')
const app = express()
app.use(express.json());   
app.use(express.urlencoded({ extended: true })); 
console.log(workerData);
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

app.get('/req',(req, res) =>{
    maj_h(req.hl);
    hl +=1;
    sendAck(hl, id, req.id);
    table[req.id] = ["req",he]
})

app.get('/ack', (req, res) =>{
  maj_h(req.hl);
  table[req.id] = table[req.id][0] != "req" ? ["ack",req.hl] : table[req.id]
})

app.get('/rel', (req, res)=>{
  maj_h(req.hl);
  table[id] = ["rel",req.hl];
  debprod += 1;
  finprod += 1;
})

app.get('/ifincons', (req, res)=>{
  ifincons +=1;
})

app.listen(HTTPport, () => {
    console.log(`Worker Site number ${id} is running on http://${hostname}:${HTTPport}`)
    //send message to main : all is ok.
    console.log (`worker ${id} sends its message to parent`)
    parentPort.postMessage({type:'workerOnline', id});
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
            method: 'get',
            body: JSON.stringify({"hl":hl,"id":id}),
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
            method: 'get',
            body: JSON.stringify({"hl":hl,"id":id}),
            headers: {'Content-Type': 'application/json'}
        }
        )
        .then(()=>{
        console.log(`worker has just send a ${msg} to ${targetId}`);
        })
    }
  }
}

function plus_vieille_date() {
  let plusVieilleDate = 0;
  let plusVieilleDateProcessId = 0;
  for (let id = 0; id < table.length; id++) {
    if (table[id][1] > plusVieilleDate) {
      plusVieilleDate = table[id][1];
      plusVieilleDateProcessId = id;
    }
  }
  return plusVieilleDateProcessId;
}
  
  
  async function cruise(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          if(!reqEnCours){
            console.log(`\t \t ${workerData.id} has arrived to the crossing`);
            hl += 1; 
            reqEnCours = true;
            diffuser("req", hl, id);
            table[id] = ["req",hl];
          }
        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }

  function workOnSection(){
          if(!scEnCours && plus_vieille_date()==id && debprod - ifincons < 2*table.length){
            console.log(`\t \t ${workerData.id} cross the crossing`);
            debprod += 1;
            scEnCours = true;
          }
  }
  
  async function releaseSection(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          if(reqEnCours && scEnCours){
            console.log(`\t \t ${workerData.id} has crossed the crossing`);
            finprod += 1;
            fetch(`http://${hostname}:${HTTPStartPort}/ack`)
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

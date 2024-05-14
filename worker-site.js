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
let hl = workerData.hl;
let he = workerData.he;
let debprod = workerData.debprod;
let finprod = workerData.finprod;
let table = workerData.table;
let reqEnCours = false;

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

app.listen(HTTPport, () => {
    console.log(`Worker Site number ${id} is running on http://${hostname}:${HTTPport}`)
    //send message to main : all is ok.
    console.log (`worker ${id} sends its message to parent`)
    parentPort.postMessage({type:'workerOnline', id});
  })
  


async function start(){
        await cruise();
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
  
  
  async function cruise(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          console.log(`\t \t ${workerData.id} has arrived to the crossing`);
          hl += 1; 
          reqEnCours = true;
          diffuser("req", hl, id);
          table[id] = ["req",hl];

        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }
  


start();

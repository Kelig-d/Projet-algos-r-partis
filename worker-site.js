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

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

app.get('/req',(req, res) =>{
    maj_h(hl, req.hl);
    hl +=1;
    sendAck(hl, id, req.id);
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
          console.log(`\t \t ${workerData.id} has arrived to the crossing`)
          status = 'demandeur';
        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }
  


start();

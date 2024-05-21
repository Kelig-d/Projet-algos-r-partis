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
let reqEnCours = false;
let scEnCours = false;
let debcons = 0;
let fincons = 0;
let ifinprod = 0;
let table = workerData.table;

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.get('/ifinprod', (req, res)=>{
  ifinprod +=1;
})

app.listen(HTTPport, () => {
    console.log(`Worker Site number ${id} is running on http://${hostname}:${HTTPport}`)
    //send message to main : all is ok.
  })
  


async function start(){
        await cruise();
        await workOnSection();
        await releaseSection();
        await start()
}
  
  async function cruise(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          if(!reqEnCours){
            console.log(`\t \t cons has arrived to consume`);
            reqEnCours = true;
          }
        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }

  function workOnSection(){
          if(!scEnCours && reqEnCours && debcons - ifinprod < 0){
            console.log(`\t \t cons started consuming`);
            debcons += 1;
            scEnCours = true;
          }
  }
  
  async function releaseSection(){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
          resolve();
          if(reqEnCours && scEnCours){
            console.log(`\t \t cons has finished consumming`);
            fincons += 1;
            for(let i=0;i<table.length+1;i++){
                fetch(`http://${hostname}:${HTTPport + 1 + i}/ifincons`)
            }
            scEnCours = false;
            reqEnCours = false;
          }
        }, 
        Math.floor(Math.random()*5000)
      )
    })
  
  }


start();

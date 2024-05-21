const { parentPort } = require('worker_threads')

async function start(){
  await acquisition();
  await releaseSection();
  await start()
}

 /* Acquisition */
 async function acquisition(){
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
        parentPort.postMessage('besoin_sc');
        parentPort.on('message',(message)=>{
          if(message == 'access') resolve();
          else return;
        })
      }, 
      Math.floor(Math.random()*5000)
    )
  })

}

async function releaseSection(){
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
        parentPort.postMessage('fin_sc');
        resolve();
      }, 
      Math.floor(Math.random()*5000)
    )
  })

}


start();

const { parentPort } = require('worker_threads')

async function start(){
  await acquisition();
  await releaseSection();
  await start()
}

 /**
  * Check if the worker can access to critical section after a random time
  */ 
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
/**
 * Release the critical section after an random time
 *  
 */
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

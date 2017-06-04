# jobman
Controllable and resonable job queue manager

## Install

```
npm install --save jobman
```

## Usage

The example code:

```javascript
const jobman = require('jobman')

// dummy task function
function task(i, done){
  setTimeout(()=>{
    // done with error
    if(i==3) done('bad')
    else done()
  }, 1000)
}

let man = jobman({
  max: 3,
  allEnd: man=>{
    console.log('all end', man.allEnd)
  },
  jobStart: (job, man)=>{
    if(job.prop==5) return false
  },
  jobEnd: (job, man)=>{
    console.log('result: ', job.prop, man.lastError || 'ok')
    // man.stop()
  },
  jobTimeout: (job, man)=>{
    console.log('timeout: ', job.prop)
    // man.stop()
  },
  allEmpty: man=>{
    console.log('queue become empty', man.allEmpty)
  },
  autoStart: true
})

for(let i=0;i<10;i++){
  man.add(cb=>{
    task(i, cb)
  }, i)
}

man.add(0, cb=>{
  task(99, cb)
}, {id: 'insert to first!', timeout: 500})
```

The result:

```
timeout:  { id: 'insert to first!', timeout: 500 }
result:  0 ok
result:  1 ok
result:  2 ok
result:  3 bad
result:  4 ok
result:  6 ok
queue become empty true
result:  7 ok
result:  8 ok
result:  9 ok
all end true
```

## API

#### jobman(config) -> manObject

- *config*
  - config.max *int*
    > **max number of concurrence jobs.**
  - config.timeout *int*
    > **ms to wait for --A job--, trigger jobTimeout event after the time**
  - config.jobTimeout *fn(job, man)->boolean*
    > **callback function after --A job-- timeout, return false will book another timeout**
  - config.jobStart *fn(job, man)->boolean*
    > **callback function before --A job-- will start, return false will cancel this job**
  - config.jobEnd *fn(job, man)->void*
    > **callback function after --A job-- callback invoked, with man.lastError set to result error**
  - config.allEmpty *fn(man)->void*
    > **callback function when no more job in the queue, but some job may still running**
  - config.allEnd *fn(man)->void*
    > **callback function when --ALL job-- finished run**

- *manObject*
  - man.add([position:int], jobFn:cb=>{}, jobProp:any)
    > **jobFn is with callback for one job, cb(err) have to be called for each job. jobProp will become job.prop**
  - man.stop()
    > **function to stop current jobman**
  - man.start()
    > **function to start current jobman**
  - man.config *object*
    > **the config object passed into jobman**
  - man.jobs *array*
    > **the jobs array internally, query for it for state, length etc.**
  - man.allEnd *boolean*
    > **prop to get if all job ended**
  - man.allEmpty *boolean*
    > **prop to get if queue is empty**
  - man.slot *int*
    > **prop to get current available job runner slot**
  - man.lastError *any*
    > **will set to the job error object after each end of job callback**

- *jobObject*
  - job.prop *any*
    > **the prop to passed with man.add()**
  - job.prop.timeout *int*
    > **set timeout for individual job**


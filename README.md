# jobman
Controllable and resonable job queue manager

[![Build Status](https://travis-ci.org/futurist/jobman.svg?branch=master)](https://travis-ci.org/futurist/jobman)

## Install

```
npm install --save jobman
```

## Usage

The example code:

```javascript
const jobman = require('jobman')

function task(i, done){  // dummy task function
  setTimeout(()=>{
    if(i==3) done('bad')  // done with error
    else done()  // done with ok
  }, 1000)  // async happen at 1 second
}

let man = jobman({  // create new jobman object
  max: 3,  // max concurrent jobs
  jobStart: (job, man)=>{  // when A job will start
    if(job.prop==5) return false  // return FALSE will cancel the job
  },
  jobEnd: (job, man)=>{  // when A job did end
    console.log('result: ', job.prop, man.lastError || 'ok')
  },
  jobTimeout: (job, man)=>{  // when A job timeout
    console.log('timeout: ', job.prop)
  },
  allEmpty: man=>{  // when all jobs distributed, queue empty
    console.log('queue become empty', man.pending.length)
  },
  allEnd: man=>{  // all jobs done
    console.log('all end', man.end)
  },
  autoStart: true  // start monitor when create
})

for(let i=0;i<10;i++){
  man.add(cb=>{  // add A job
    task(i, cb)
  }, i)  // job.prop = i
}

man.add(0, cb=>{  // insert A job into 0 index
  task(99, cb)
}, {id: 'insert to first!', timeout: 500})  // the job timeout is 500ms
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
queue become empty 0
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
    > **function to stop current jobman, use man.start to start again**
  - man.start()
    > **function to start current jobman, use man.stop to stop it**
  - man.config *object*
    > **the config object passed into jobman**
  - man.jobs *array*
    > **the jobs array internally, query for it for state, length etc.**
  - man.running *boolean*
    > **prop to get if the job monitor is running (no man.stop())**
  - man.end *boolean*
    > **prop to get if all job ended**
  - man.pending *[fn, ...]*
    > **prop to get pending jobs in queue**
  - man.slot *int*
    > **prop to get current available job runner slot**
  - man.lastError *any*
    > **will set to the job error object after each end of job callback**

- *jobObject*
  - job.prop *any*
    > **the prop to passed with man.add()**
  - job.prop.timeout *int*
    > **set timeout for individual job**


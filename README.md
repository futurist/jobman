# jobman
Controllable and resonable job queue manager

[![Build Status](https://travis-ci.org/futurist/jobman.svg?branch=master)](https://travis-ci.org/futurist/jobman)
[![Coverage Status](https://coveralls.io/repos/github/futurist/jobman/badge.svg?branch=master)](https://coveralls.io/github/futurist/jobman?branch=master)
[![npm](https://img.shields.io/npm/v/jobman.svg "Version")](https://www.npmjs.com/package/jobman)

## Install

```
npm install --save jobman
```

## Usage

The example code:

```javascript
const jobman = require('jobman')

const man = jobman({  // create new jobman object
  max: 3,  // max concurrent jobs
  jobStart: (job, man)=>{  // when A job will start
    if(job.prop==5) return false  // return FALSE will cancel the job
  },
  jobEnd: (job, man)=>{  // when A job did end
    console.log('result: ', job.prop, job.error || 'ok')
  },
  jobTimeout: (job, man)=>{  // when A job timeout
    console.log('timeout: ', job.prop)
  },
  allStart: (info, man)=>{  // all jobs will start
    console.log('all jobs will start')
  },
  allEnd: (info, man)=>{  // all jobs done
    console.log('all end', man.isDone)
    // also clear all pending jobs, cancel running callbacks
    man.clear(true)
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

function task(i, cb){  // dummy task function
  setTimeout(()=>{
    if(i==3) cb('bad')  // cb with error
    else cb()  // cb with ok
  }, 1000)  // async happen at 1 second
}

```

The result:

```
all jobs will start
timeout:  { id: 'insert to first!', timeout: 500 }
result:  0 ok
result:  1 ok
result:  2 ok
result:  3 bad
result:  4 ok
result:  6 ok
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
  - config.interval *int*
    > **ms to pass into setInterval check internally**
  - config.jobTimeout *fn(job, man)->boolean*
    > **callback function after --A job-- timeout, return false will book another timeout**
  - config.jobStart *fn(job, man)->boolean*
    > **callback function before --A job-- will start, return false will cancel this job**
  - config.jobRun *fn(job, man)->void*
    > **callback function after --A job-- did start, job.state become run**
  - config.jobEnd *fn(job, man)->void*
    > **callback function after --A job-- callback invoked, with man.lastError set to result error**
  - config.allStart *fn(info, man)->void*
    > **callback function before --ALL job-- start run, useful for init, info is user passed with man.start(info)**
  - config.allEnd *fn(info, man)->void*
    > **callback function when --ALL job-- finished run, info is user passed with man.end(info)**

- *manObject*
  - man.add([position:int], jobFn:cb=>{}, jobProp:any)
    > **jobFn is with callback for one job, cb(err) have to be called for each job. jobProp will become job.prop**
  - man.start([info])
    > **function to start current jobman, use man.stop to stop it, trigger man.allStart with first arg set to info**
  - man.stop()
    > **function to stop current jobman, use man.start to start again**
  - man.end([info], [cancelPending])
    > **trigger man.allEnd with first arg set to info, cancelPending will cancel pending jobs**
  - man.clear(cancelRunningJobs)
    > **Remove all pending jobs, cancel running jobs if cancelRunningJobs is true**
  - man.config *object*
    > **the config object passed into jobman**
  - man.jobs *array*
    > **the jobs array internally, query for it for state, length etc.**
  - man.isRunning *boolean*
    > **prop to get if the job monitor is is running (not stopped)**
  - man.isDone *boolean*
    > **prop to get if all job ended**
  - man.pending *[jobObject, ...]*
    > **prop to get pending jobs in queue**
  - man.running *[jobObject, ...]*
    > **prop to get running jobs in process**
  - man.slot *int*
    > **prop to get current available job runner slot**

- *jobObject*
  - job.fn *function*
    > **the jobFn function passed into man.add()**
  - job.error *any*
    > **when job callback called with error, set to it with the error**
  - job.prop *any*
    > **the prop to passed into man.add()**
  - job.prop.timeout *int*
    > **set timeout for individual job**
  - job.state *any*
    > **internal state for each job, value is run/done/error/timeout/cancel**


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

function task(i, done){
  setTimeout(()=>{
    console.log('task '+i)

    // done with error
    if(i==3) done('bad')
    else done()

  }, 1000)
}

let man = jobman({
  max: 3,
  allEnd: man=>{
    console.log('all end', man.allEnd)
    man.stop()
  },
  jobStart: (job, man)=>{
    if(job.prop==5) return false
  },
  jobEnd: (job, man)=>{
    console.log('result: ', job.prop, man.lastError)
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
}, 'insert to first!')
```

The result:

```
task 99
result:  insert to first! null
task 0
result:  0 null
task 1
result:  1 null
task 2
result:  2 null
task 3
result:  3 bad
task 4
result:  4 null
task 6
result:  6 null
task 7
result:  7 null
queue become empty true
task 8
result:  8 null
task 9
result:  9 null
all end true
all state [ 'done',
  'done',
  'done',
  'done',
  'error',
  'done',
  'cancel',
  'done',
  'done',
  'done',
  'done' ]
```

## API

#### jobman(config) -> manObject

- *config*
  - config.max *int*
    > **max number of concurrence jobs.**
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
  - man.config
    > **the config object passed into jobman**
  - man.jobs
    > **the jobs array internally, query for it for state, length etc.**
  - man.allEnd
    > **prop to get if all job ended**
  - man.allEmpty
    > **prop to get if queue is empty**
  - man.slot
    > **prop to get current available job runner slot**
  - man.lastError
    > **will set to the job error object after each end of job callback**

- *jobObject*
  - job.prop
    > **the prop to passed with man.add()**



const ava = require('ava')
const jobman = require('./')

ava.cb('end test', t=>{
  var d = jobman({
    allEnd: (info, man)=>{
      // console.log('all end', man.jobs)
      t.deepEqual(man.jobs, [])
      t.deepEqual(man.isDone, true)
      t.end()
    }
  })
  t.is(d.isRunning, false)
  t.is(d.isDone, true)
  d.start()
  t.is(d.isRunning, true)
  t.is(d.isDone, true)

  d.add(cb=>setTimeout(cb, 1000))
  d.add(cb=>setTimeout(cb, 1000))
  d.add(cb=>setTimeout(cb, 1000))

  t.is(d.isRunning, true)
  t.is(d.isDone, false)

  d.jobs.splice(0,3)

})

ava.cb('example test', t=>{
  const testProps = [
    'insert to first!', 0,1,2,3,4,6,7,8,9
  ]
  function task(i, cb){
    setTimeout(()=>{
      console.log('task '+i)
      cb(i==3 ? 'bad' : null)
    }, 1000)
  }

  let man = jobman({
    max: 3,
    allEnd: (info, man)=>{
      // console.log('all end', man.isDone)
      // console.log('all state', man.jobs.map(fn=>fn.state))
      t.is(man.isDone, true)
      t.is(man.pending.length, 0)
      t.deepEqual(man.jobs.map(fn=>fn.state), 
        [ 'done',
        'done',
        'done',
        'done',
        'error',
        'done',
        'cancel',
        'done',
        'done',
        'done',
        'done' ])
      t.end()
    },
    jobStart: (job, man)=>{
      if(job.prop==5) return false
    },
    jobRun: (job, man)=>{
      t.is(job.state, 'run')
      t.is(man.isRunning, true)
      if(man.pending.length==0) console.log('queue empty')
    },
    jobEnd: (job, man)=>{
      // console.log(job.prop, man.isDone, man.pending, man.slot)
      t.is(job.prop, testProps.shift())
      t.is(man.isDone, false)
      if(job.error) t.is(job.error, 'bad')
    },
    autoStart: true
  })
  // man.start()

  t.is(man.slot, 3)

  for(let i=0;i<10;i++){
    man.add(cb=>{
      task(i, cb)
    }, i)
  }

  man.add(0, cb=>{
    task(99, cb)
  }, 'insert to first!')

})


ava.cb('promise test', t=>{
  var d=0
  var endTime=0
  var man = jobman({
    max: 1,
    jobStart: job=>{
      t.is(new Date()>=endTime, true)
    },
    jobEnd: job=>{
      endTime = new Date()
      console.log(job.prop, job.state, 'end')
      t.is(job.prop, d++)
    },
    allEnd: (info, man)=>t.end()
  })

  for(let i=0;i<5;i++){
    man.add(cb=>{
      new Promise((res,rej)=>{
        setTimeout(res, 1000)
      }).then(cb, cb)
    }, i)
  }
  man.start()
})

ava.cb('timeout', t=>{
  var endTime=0
  var timeoutID = [3,4]
  var endID = [0,1,2,5]
  let man = jobman({
    max: 1,
    timeout: 1000,
    jobTimeout: job=>{
      endTime = new Date()
      t.is(job.prop.id, timeoutID.shift())
      console.log(new Date(), job.prop, 'timeout')
    },
    jobStart: job=>{
      t.is(new Date()>=endTime, true)
      // console.log(new Date())
    },
    jobEnd: job=>{
      endTime = new Date()
      t.is(job.prop.id, endID.shift())
      console.log(new Date, job.prop, job.state, 'end')
    },
    allEnd: (info, man)=>t.end()
  })

  for(let i=0;i<5;i++){
    let timeout = i*400
    man.add(cb=>{
      setTimeout(cb, timeout)
    }, {id: i})
  }
  man.start()

  man.add(cb=>{
    setTimeout(cb, 2000)
  }, {timeout: 3000, id: 5})
  
})


ava.cb('timeout renew', t=>{
  var count=0
  let man = jobman({
    timeout: 100,
    jobEnd: job=>{
      // console.log(job, 'end')
      t.is(count, 9)
    },
    jobTimeout: job=>{
      // console.log(job, 'renew')
      ++count
      return false
    },
    allEnd: (info, man)=>t.end()
  })
  man.start()

  man.add(cb=>{
    setTimeout(cb, 950)
  })
  
})


ava('start again', t=>{
  var man = jobman()
  man.start()
  t.is(man.start(), false)
  man.stop()
})

ava.cb('get/set config', t=>{
  var man = jobman({
    max: 1,
    jobStart: job=>{
      t.is(man.config.jobRun, undefined)
      t.is(man.slot, 1)
      man.config = {
        max:2,
        jobRun: job=>{
          t.is(man.config.jobStart, undefined)
          t.is(man.slot, 1)
        },
        allEnd: (info, man)=>t.end()
      }
    }
  })

  man.add(cb=>setTimeout(cb, 100))
  man.start()
})

ava.cb('man.start & end', t=>{
  var count=0
  var startState = 0
  var man = jobman({
    max: 1,
    allStart: (info, man)=>{
      startState+=info
    },
    allEnd: (info, man)=>{
      count++
      if(count==1) t.is(info, 'my reason')
    }
  })
  
  man.end()  // when isDone, not call allEnd
  t.is(count, 0)
  t.is(man.running.length, 0)

  man.add(cb=>setTimeout(cb,100))
  man.add(cb=>setTimeout(cb,200))
  man.add(cb=>setTimeout(cb,300))
  man.start(10)
  t.is(startState, 10)

  setTimeout(()=>{
    t.is(man.running.length, 1)
    man.end('my reason')
    t.is(count, 1)
    t.is(man.running.length, 0)
    t.is(man.isDone, true)
    t.deepEqual(man.jobs, [])
    t.deepEqual(man.pending, [])
    t.end()
  }, 150)
})

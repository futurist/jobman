
const ava = require('ava')
const jobman = require('./')

ava.cb('end test', t=>{
  var d = jobman({
    allEnd: man=>{
      // console.log('all end', man.jobs)
      t.deepEqual(man.jobs, [])
      t.deepEqual(man.end, true)
      t.end()
    }
  })
  // console.log(d.running, d.end)
  t.is(d.running, false)
  t.is(d.end, true)
  d.start()
  // console.log(d.running, d.end)
  t.is(d.running, true)
  t.is(d.end, true)

  d.add(cb=>setTimeout(cb, 1000))
  d.add(cb=>setTimeout(cb, 1000))
  d.add(cb=>setTimeout(cb, 1000))

  t.is(d.running, true)
  t.is(d.end, false)

  d.jobs.splice(0,3)

})

ava.cb('example test', t=>{
  const testProps = [
    'insert to first!', 0,1,2,3,4,6,7,8,9
  ]
  function task(i, done){
    setTimeout(()=>{
      console.log('task '+i)
      done(i==3 ? 'bad' : null)
    }, 1000)
  }

  let man = jobman({
    max: 3,
    allEnd: man=>{
      // console.log('all end', man.end)
      // console.log('all state', man.jobs.map(fn=>fn.state))
      t.is(man.end, true)
      t.is(man.queue.length, 0)
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
      t.is(man.running, true)
      if(man.queue.length==0) console.log('queue empty')
    },
    jobEnd: (job, man)=>{
      // console.log(job.prop, man.end, man.queue, man.lastError, man.slot)
      t.is(job.prop, testProps.shift())
      t.is(man.end, false)
      if(job.prop==3) t.is(man.lastError, 'bad')
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
    allEnd: man=>t.end()
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
    allEnd: man=>t.end()
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
    allEnd: man=>t.end()
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

// ava('get/set config', t=>{
//   var man = jobman({max: 1})
//   man.start()

//   man.add(cb=>setTimeout(cb, 100))
//   t.is(man.slot, 0)
//   t.is(man.config.max, 1)

//   man.config = {max: 2}
//   t.is(man.config.max, 2)
//   t.is(man.slot, 1)
  
//   man.add(cb=>setTimeout(cb, 100))
//   t.is(man.slot, 0)

// })


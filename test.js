
const ava = require('ava')
const jobman = require('./')
const got = require('got')

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
      // console.log('all end', man.allEnd)
      // console.log('all state', man.jobs.map(fn=>fn.state))
      t.is(man.allEnd, true)
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
    jobEnd: (job, man)=>{
      // console.log(job.prop, man.allEnd, man.allEmpty, man.lastError, man.slot)
      t.is(job.prop, testProps.shift())
      t.is(man.allEnd, false)
      if(job.prop==3) t.is(man.lastError, 'bad')
    },
    allEmpty: man=>{
      // console.log('queue become empty', man.allEmpty, man.slot)
      t.is(man.allEmpty, true)
      t.is(man.slot, 0)
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


ava.only.cb('promise test', t=>{
  let d=0
  let man = jobman({
    max: 1,
    jobEnd: job=>{
      console.log(job.prop, 'end')
      t.is(job.prop, d++)
    },
    allEnd: man=>t.end()
  })

  for(let i=0;i<10;i++){
    man.add(cb=>{
      got('baidu.com')
        .then(response => {
          cb()
          // console.log(response.body)
          //=> '<!doctype html> ...'
        })
        .catch(error => {
          cb(error)
          // console.log(error.response.body)
          //=> 'Internal server error ...'
        })
    }, i)
  }
  man.start()
})



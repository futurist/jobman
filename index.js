

function task(i, done){
  setTimeout(()=>{
    console.log('task '+i)
    done(i==3 ? 'bad' : null)
  }, 1000)
}

let man = jobman({
  allEnd: man=>{
    console.log('all end', man.allEnd)
    console.log('all state', man.jobs.map(fn=>fn.state))
    man.stop()
  },
  jobStart: (job, man)=>{
    if(job.prop==5) return false
  },
  jobEnd: (job, man)=>{
    console.log(job.prop, man.allEnd, man.allEmpty, man.lastError, man.slot)
    // man.stop()
  },
  allEmpty: man=>{
    console.log('queue become empty', man.allEmpty, man.slot)
  },
  autoStart: true
})
// man.start()

console.log(man.slot)

for(let i=0;i<10;i++){
  man.add(cb=>{
    task(i, cb)
  }, i)
}

  man.add(1, cb=>{
    task(99, cb)
  }, 'insert to second')

function jobman(config) {
  config = config || {}
  config.max = config.max || 3

  let interJob
  let done = false
  let run = 0

  const jobs = []
  const man = {
    config: config,
    jobs: jobs,
    add: function (pos, fn, prop) {
      if(typeof pos=='function') {
        prop = fn, fn = pos
        jobs.push(fn)
      } else {
        jobs.splice(pos, 0, fn)
      }
      fn.prop = prop
    },
    get allEnd () {
      return done
    },
    get allEmpty (){
      return !jobs.some(pendingJob)
    },
    get slot(){
      return config.max - run
    },
    stop: stop,
    start: start,
  }

  function start(){
    if(interJob) {
      console.warn('already started')
      return
    }
    interJob = setInterval(check)
    check()
  }

  function stop(){
    clearInterval(interJob)
    interJob=null
  }
  
  function pendingJob (f) {
    return f.state===undefined
  }

  function check(){
    if(jobs.length===0 || run>=config.max) return
    const pending = jobs.filter(pendingJob)
    const fn = pending[0]

    if(!fn) {
      if(!run && !done) {
        // console.log('all done')
        done = true
        config.allEnd
          ? config.allEnd(man)
          : stop()
      }
      return
    }

    if(config.jobStart && config.jobStart(fn, man)===false) {
      fn.state = 'cancel'
      return
    }

    done = false
    fn.state='run'
    fn(function next(err){
      if(err!=null) fn.state = 'error'
      else fn.state = 'done'
      run--
      man.lastError = err
      config.jobEnd && config.jobEnd(fn, man)
    })
    run++

    if(pending.length===1) {
      // console.log('queue become empty')
      config.allEmpty && config.allEmpty(man)
    }

  }

  if(config.autoStart) start()

  return man

}

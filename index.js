

function task(i, done){
  setTimeout(()=>{
    console.log('task '+i)
    done()
  }, 1000)
}

let man = jobman({
  allDone: man=>{
    console.log(man.allDone)
    man.stop()
  },
  jobDone: man=>{
    console.log(man.allDone, man.jobEmpty, man.lastError, man.slot)
    // man.stop()
  },
  jobEmpty: man=>{
    console.log('queue become empty', man.jobEmpty, man.slot)
  }
})
man.start()

console.log(man.slot)

for(let i=0;i<10;i++)
man.jobs.push(cb=>{
  task(i, cb)
})


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
    get allDone () {
      return done
    },
    get jobEmpty (){
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
        console.log('all done')
        done = true
        config.allDone
          ? config.allDone(man)
          : stop()
      }
      return
    }

    done = false
    fn.state='run'
    fn(function next(err){
      if(err) fn.state = 'err'
      else fn.state = 'done'
      run--
      man.lastError = err
      config.jobDone && config.jobDone(man)
    })
    run++

    if(pending.length===1) {
      // console.log('queue become empty')
      config.jobEmpty && config.jobEmpty(man)
    }

  }

  if(config.autoStart) start()

  return man

}

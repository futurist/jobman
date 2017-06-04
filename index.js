
function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

function jobman(config) {
  config = config || {}
  config.max = config.max || 3

  var interJob
  var done = false
  var run = 0

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
      // console.warn('already started')
      return
    }
    interJob = setInterval(check)
    check()
  }

  function stop(){
    clearInterval(interJob)
    interJob=null
  }
  
  function pendingJob (fn) {
    return fn.state===undefined
  }

  function timeout(fn) {
    const ms = isObject(fn.prop) && fn.prop.timeout || config.timeout
    if(!ms) return
    fn._tID = setTimeout(function(){
      if(config.jobTimeout && config.jobTimeout(fn, man)===false){
        return timeout(fn)
      }
      run--
      fn.state = 'timeout'
    }, ms)
  }

  function check(){
    if(jobs.length===0 || run>=config.max) return
    const pending = jobs.filter(pendingJob)
    const fn = pending[0]

    if(!fn) {
      if(!run && !done) {
        // console.log('all done')
        done = true
        config.allEnd && config.allEnd(man)
        stop()
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
      if(fn.state==='timeout') return
      if(fn._tID) clearTimeout(fn._tID)
      if(err!=null) fn.state = 'error'
      else fn.state = 'done'
      run--
      man.lastError = err
      config.jobEnd && config.jobEnd(fn, man)
    })
    
    timeout(fn)

    run++

    if(pending.length===1) {
      // console.log('queue become empty')
      config.allEmpty && config.allEmpty(man)
    }

  }

  if(config.autoStart) start()

  return man

}


module.exports = jobman



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
    man.stop()
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
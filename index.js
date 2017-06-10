
function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

function jobman(config) {
  config = config || {}
  config.max = config.max || 3

  var interJob
  var done = true
  var run = 0

  const jobs = []
  const man = {
    add: function (pos, fn, prop) {
      if(typeof pos=='function') {
        prop = fn, fn = pos
        jobs.push({fn: fn, prop: prop})
      } else {
        jobs.splice(pos, 0, {fn: fn, prop: prop})
      }
      // if(interJob) check()
      done = false
    },
    end: function(reason) {
      end(man.reason = reason)
      man.running.forEach(function(job){
        job.state = 'cancel'
      })
      run = 0
      jobs.splice(0, jobs.length)
    },
    get config (){ return config },
    set config (val){ config = val },
    get jobs (){ return jobs },
    get done () {
      return done
    },
    get stopped () {
      return interJob == null
    },
    get pending (){
      return jobs.filter(pendingJob)
    },
    get running (){
      return jobs.filter(runningJob)
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
      return false
    }
    interJob = setInterval(check)
    check()
  }

  function stop(){
    clearInterval(interJob)
    interJob=null
  }

  function end(){
    done = true
    config.allEnd && config.allEnd(man)
    stop()
  }
  
  function pendingJob (jobObj) {
    return !jobObj.hasOwnProperty('state')
  }

  function runningJob (jobObj) {
    return jobObj.state === 'run'
  }

  function timeout(jobObj) {
    const ms = isObject(jobObj.prop) && jobObj.prop.timeout || config.timeout
    if(!ms) return
    jobObj._tID = setTimeout(function(){
      if(config.jobTimeout && config.jobTimeout(jobObj, man)===false){
        return timeout(jobObj)
      }
      run--
      jobObj.state = 'timeout'
    }, ms)
  }

  function check() {
    if(run>=config.max) return

    /* var jobObj = jobs.find(pendingJob) */
    for (let i = 0; i < jobs.length; i++) {
      if(pendingJob(jobs[i])) {
        var jobObj = jobs[i]
        break
      }
    }

    if(!jobObj) {
      if(!run && !done) {
        // console.log('all done')
        end()
      }
      return
    }

    if(config.jobStart && config.jobStart(jobObj, man)===false) {
      jobObj.state = 'cancel'
      return
    }

    done = false
    jobObj.state='run'
    jobObj.fn(function next(err){
      if(jobObj._tID) clearTimeout(jobObj._tID)
      if(/timeout|cancel/.test(jobObj.state)) return
      if(err!=null) jobObj.state = 'error'
      else jobObj.state = 'done'
      run--
      man.lastError = err
      config.jobEnd && config.jobEnd(jobObj, man)
    })
    
    timeout(jobObj)

    run++

    config.jobRun && config.jobRun(jobObj, man)

  }

  if(config.autoStart) start()

  return man

}


module.exports = jobman


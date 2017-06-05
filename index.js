
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
    get end () {
      return done
    },
    get running () {
      return interJob != null
    },
    get pending (){
      return jobs.filter(pendingJob)
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


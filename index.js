

function task(i, done){
  setTimeout(()=>{
    console.log('task '+i)
    done()
  }, 1000)
}

let arr = jjob()

for(let i=0;i<10;i++)
arr.push(cb=>{
  task(i, cb)
})

function jjob(config) {
  config = config || {}

  const arr = []

  let con = 3
  let jobDone = false
  let run = 0

  function stop (){
    clearInterval(inter1)    
  }

  function start(){
    if(run>=con) return
    const pending = arr.filter(f=>f.state===undefined)
    const fn = pending[0]

    if(!fn) {
      if(!run && !jobDone) {
        console.log('all done')
        jobDone = true
        config.onfinish
          ? config.onfinish()
          : stop()
      }
      return
    }

    jobDone = false
    fn.state='run'
    fn(function next(err){
      if(err) fn.state = 'err'
      else fn.state = 'done'
      run--
    })
    run++

    if(pending.length===1) {
      console.log('queue become empty')
    }
    
  }

  let inter1 = setInterval(start)

  return arr

}

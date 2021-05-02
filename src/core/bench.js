const wait = delay => new Promise(r => setTimeout(r, delay))
const thousands = (x, sep = '_') => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep)

export const newBench = (name = 'bench something') => {

  const map = new Map()
  
  const add = (msg, cb) => {
    if (typeof msg === 'function') {
      msg = msg.name
    }
    const index = map.size
    map.set(msg, { 
      index,
      msg,
      cb,
      totalDuration: 0,
      totalRunLoop: 0,
      runCount: 0,
      opByMs: 0
    })
  }
  
  const clear = () => map.clear()
  
  const test = () => {
    const result = {}
    for (const { msg, cb } of map.values()) {
      result[msg] = cb(0, 1)
    }
    return result
  }
  
  const run = async () => {
  
    const NOOP = '(noop)' // "no operation" special case
    add(NOOP, () => {})
  
    const runCount = map.size
    const runDuration = 100 // ms
    const runLoop = 1000
  
    await wait(100)
  
    const bundles = [...map.values()]
  
    for (const bundle of bundles) {
      bundle.totalDuration = 0
      bundle.totalRunLoop = 0
      bundle.runCount = 0
      bundle.opByMs = 0
    }
  
    for (let runIndex = 0; runIndex < runCount; runIndex++) {
  
      await wait(100)
      console.log(`bench run #${runIndex} (${bundles.map(b => b.index).join(',')})`)
  
      for (const bundle of bundles) {
  
        await wait(100)
  
        const { cb } = bundle
    
        const t = Date.now()
        let duration = 0
        while (true) {
          for (let i = 0; i < runLoop; i++) {
            cb(i, runLoop)
          }
          bundle.totalRunLoop += runLoop
          duration = Date.now() - t
          if (duration > runDuration) {
            break
          }
        }
  
        bundle.runCount++
        bundle.totalDuration += duration
      }
  
      // NOTE: important! 
      // order may have significant impact on performance
      // so between each run change the order
      bundles.unshift(bundles.pop())
    }
  
    for (const bundle of map.values()) {
      bundle.opByMs = bundle.totalRunLoop / bundle.totalDuration
    }
  
    // remove noop
    const noopBundle = map.get(NOOP)
    map.delete(NOOP)
  
    const faster = [...map.values()].sort((A, B) => B.opByMs - A.opByMs).shift()
  
    const lines = []
    lines.push(`bench "${name}" (${runCount}/${runCount}):`)
    for (const bundle of [...map.values(), noopBundle]) {
      const { msg, opByMs } = bundle
      const isFaster = bundle === faster
      lines.push(`  ${msg}:`)
      lines.push(`    ${isFaster ? 'FASTER!' : `x${(faster.opByMs / opByMs).toFixed(3)}`}`)
      lines.push(`    op/ms: ${thousands(opByMs.toFixed(2))}`)
      lines.push(`    ${thousands(bundle.totalRunLoop)} in ${bundle.totalDuration}ms`)
      lines.push('')
    }
    console.log(lines.join('\n'))
  }
  
  return {
    add,
    clear,
    test,
    run,
  }
}

// expose
Object.assign(window, { newBench })

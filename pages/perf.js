import { test } from '../src/test/perf.js'

document.querySelector('pre').innerHTML = 'running bench...'

document.querySelector('pre').innerHTML = await test()

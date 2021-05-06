const onError = error => {
  const createDiv = () => {
    const div = document.createElement('div')
    div.classList.add('browser-warning')
    div.innerHTML = `
      Currently using last ES features (private fields, top level await),<br>
      not supported by your browser.<br>
      <div class="errors"></div>
      Try with Chrome.
    `
    document.body.append(div)
    return div
  }

  const div = document.querySelector('.browser-warning') ?? createDiv()
  div.querySelector('.errors').innerHTML += `${error}<br>`
}

import('./test/easing.js').catch(onError)
import('./test/perf.js').catch(onError)


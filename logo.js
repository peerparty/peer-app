function playAudio() {
  const audio = new Audio('fg.mpeg')
  audio.play()
}

function wrapChars(logo) {
  const txt = logo.innerHTML
  let str = ''
  for(let i = 0, j = 0; i < txt.length; i++) {
    if(txt[i] != ' ') {
      str += `<span class='logo${j % 6}'>${txt[i]}</span>`
      ++j
    }
  }
  logo.innerHTML = str
}

function wrapAni(ani) {
  const win1 = document.createElement('span')
  const win2 = document.createElement('span')
  for(let i = 0; i < ani.children.length; i++) {
    if(i < (ani.children.length / 2)) win1.appendChild(ani.children[i].cloneNode(true))
    else win2.appendChild(ani.children[i].cloneNode(true))
  }
  ani.innerHTML = ''
  win1.classList.add('win1')
  win2.classList.add('win2')
  ani.appendChild(win1)
  ani.appendChild(win2)
}

function ubermate(node) {
  document.querySelector('body').classList.add('ubermate')
  setTimeout(() => document.querySelector('body').classList.remove('ubermate'), 5000)
}

window.addEventListener('DOMContentLoaded', e => {
  
  document.querySelector('*').addEventListener('click', e => {
    playAudio()
    ubermate(e.target)
  })


  document.querySelectorAll('.logo').forEach(logo => {
    wrapChars(logo)
    wrapAni(logo)
  })
})



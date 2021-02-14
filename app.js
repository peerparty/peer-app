let url = location.protocol + "//" + location.host + "/api";
//let url = "https://api.peerparty.org"

function playAudio(filename) {
  const audio = new Audio(filename)
  audio.play()
}

function cleanup() {
  document.querySelector('body').classList.remove('ubermate')
}

function ubermate() {
  playAudio('fg.mpeg')
  document.querySelector('body').classList.add('ubermate')
  setTimeout(cleanup, 1500)
}

function doRequest(opts) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest()
    xhr.open(!opts.method ? 'GET' : opts.method, url + opts.endpoint)
    xhr.onload = function () {
      if(this.status >= 200 && this.status < 300) {
        resolve(xhr.response)
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        })
      }
    }
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      })
    }
    xhr.withCredentials = true
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
    if(opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        xhr.setRequestHeader(key, opts.headers[key])
      })
    }
    let params = opts.params
    if(params && typeof params === 'object') {
      params = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
      }).join('&')
    }
    xhr.send(params)
  })
}

const postType = 0
const commentType = 1

let user = '_'
let postId = -1

/**
 * Helpers - JBG
 */

function dec(n) {
  return parseFloat(n / 100).toFixed(2)
}

function isNumber(n) {
  let reg = /^\d+$/
  return reg.test(n)
}

/**
 * APIish stuff - JBG
 */

function appGetPost(postId) {
  doRequest({ 'endpoint': '/posts/' + postId })
    .then(post => appShowThread(JSON.parse(post)))
    .catch(e => {
      if(e.status) appShowError(e.status, e.statusText)
      else appShowError("Application Error", e.message)
    })
}

function appGetPosts() {
  doRequest({ 'endpoint': '/posts' })
  .then((postsStr) => {
    const posts = JSON.parse(postsStr)
    appShowPosts(posts.sort((a, b) => parseInt(b.date) - parseInt(a.date)))
  }).catch(e => appShowError(e.status, e.statusText))
}

function appPostVote(postId, up) {
  appShowLoading()
  doRequest({
    'endpoint': '/posts/' + postId + '/votes',
    'method': 'POST',
    'params': {'up': up}
  }).then(() => {
    appGetPost(postId)
    appUpdateHeader()
    appGetPosts()
  }).catch(e => appShowError(e.status, e.statusText))
}

function appCommentVote(commentId, up) {
  appShowLoading()
  doRequest({
    'endpoint': '/comments/' + commentId + '/votes',
    'method': 'POST',
    'params': {'up': up}
  }).then(() => {
    appGetPost(postId)
    appUpdateHeader()
    appGetPosts()
  }).catch(e => appShowError(e.status, e.statusText))
}

function appPostComment(postId, val) {
  appShowLoading()
  doRequest({
    'endpoint': '/posts/' + postId + '/comments',
    'method': 'POST',
    'params': {'comment': val}
  }).then(() => {
    appGetPost(postId)
    appUpdateHeader()
    appGetPosts()
  }).catch(e => appShowError(e.status, e.statusText))
}

function appCommentComment(commentId, val) {
  appShowLoading()
  doRequest({
    'endpoint': '/comments/' + commentId + '/comments',
    'method': 'POST',
    'params': {'comment': val}
  }).then(() => {
    appGetPost(postId)
    appUpdateHeader()
    appGetPosts()
  }).catch(e => appShowError(e.status, e.statusText))
}

async function appLogin(params) {
  doRequest({
    'endpoint': '/login',
    'method': 'POST',
    'params': params })
  .then((data) => {
    const obj = JSON.parse(data)
    user = obj.user
    balance = obj.balance
    appShow()
  })
  .catch((err, res) => {
    console.log(err, res)
    document.querySelector('.error').innerHTML = "U FAILED."
  })
}

function appLogout() {
  doRequest({ 'endpoint': '/logout', 'method': 'POST' })
  .then(() => {
    appShowLogin()
  })
}

/**
 * UI stuff - JBG
 */

function appScrollDetail() {
  // Mobile Hack - JBG
  if(window.innerWidth <= 640) {
    document.querySelector('.detail').scrollIntoView({
      behavior: 'smooth'
    })
  }
}

function appScrollItems() {
  // Mobile Hack - JBG
  if(window.innerWidth <= 640) {
    document.querySelector('.items').scrollIntoView({
      behavior: 'smooth'
    })
  }
}


function appShowNotice(notice) {
  document.querySelector('.detail').innerHTML = ''
  appShowClose()
  let note = document.querySelector('.templates .notice').cloneNode(true)
  note.querySelector('h1').innerHTML = notice
  document.querySelector('.detail').appendChild(note)
}

function appShowClose() {
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .close').cloneNode(true)
  )
  document.querySelector('.detail .close')
    .addEventListener('click', appShowMenu, false)
}

function appCommentBox(objType, id, elm) {
  let commentboxElm = document.querySelector('.templates .commentbox').cloneNode(true)
  commentboxElm.querySelector('.arrow.right').addEventListener('click', e => {
    const val = commentboxElm.querySelector('textarea').value
    objType === postType ? appPostComment(id, val) : appCommentComment(id, val)
    ubermate()
  })
  elm.appendChild(commentboxElm) 
}

function appShowVotes(objType, id, votes, elm) {

  let voteElm = document.querySelector('.templates .vote').cloneNode(true)

  if(votes) {
    const up = votes.reduce((c, v) => (v.up ? c + 1 : c), 0)
    const down = votes.reduce((c, v) => (!v.up ? c + 1 : c), 0)
    voteElm.querySelector('.up .count').innerHTML = up
    voteElm.querySelector('.down .count').innerHTML = down
  }

  voteElm.querySelector('.up .arrow')
    .addEventListener('click', () => {
      ubermate()
      if(objType === postType) appPostVote(id, true)
      else appCommentVote(id, true)
  }, false);
  voteElm.querySelector('.down .arrow')
    .addEventListener('click', () => {
      ubermate()
      if(objType === postType) appPostVote(id, false)
      else appCommentVote(id, false) 
  }, false)

  elm.appendChild(voteElm)
}

function appShowComments(comment, elm) {
  let comElm = document.querySelector('.templates .comment').cloneNode(true)
  comElm.setAttribute('id', comment[1])
  comElm.querySelector('p').innerHTML = comment.comment 

  console.log(comment.comment, "CONSENSUS", comment.consensus)
  //if(!comment.consensus && comment.votes && comment.votes.length > 1)

  appShowVotes(commentType, comment.id, comment.votes, comElm)

  appCommentBox(commentType, comment.id, comElm)
  if(comment.consensus && comment.votes && comment.votes.length > 1)
    comElm.querySelector('p').classList.add('rainbow')

  if(comment.comments) {
    let commentsElm = document.querySelector('.templates > .comments').cloneNode(true)
    comment.comments.forEach(c => appShowComments(c, commentsElm))
    comElm.appendChild(commentsElm)
  }

  elm.appendChild(comElm)
}

function appShowMoment(moment, elm) {
  let momentElm = document.querySelector('.templates .moment').cloneNode(true)
  momentElm.querySelector('li a').innerHTML = moment[2]
  momentElm.querySelector('li a').setAttribute('href', `#${moment[1]}`)
  elm.appendChild(momentElm)
}

function appShowConsensus(consensus, elm) {
  let consensusElm = document.querySelector('.templates .consensus').cloneNode(true)
  consensus.forEach(m => appShowMoment(m, consensusElm.querySelector('ul')))
  elm.appendChild(consensusElm)
}

function appShowLoading() {
  document.querySelector('.detail').innerHTML = ''
  let loading = document.querySelector('.templates .loading').cloneNode(true)
  document.querySelector('.detail').appendChild(loading)
}

function appShowThread(post) {

  document.querySelector('.detail').innerHTML = ''
  appShowClose()

  let thread = document.querySelector('.templates .thread').cloneNode(true)
  thread.setAttribute('data-id', post.id)
  thread.querySelector('.title').innerHTML = post.title
  thread.querySelector('.description').innerHTML = post.description

  appShowVotes(postType, post.id, post.votes, thread)

  if(post.moments.length) appShowConsensus(post.moments, thread)

  //if(!post.consensus && post.votes && post.votes.length > 1)
  appCommentBox(postType, post.id, thread)

  let comments = document.querySelector('.templates > .comments').cloneNode(true)
  thread.appendChild(comments)

  if(post.comments) {
    let comments = thread.querySelector('.comments')
    post.comments.forEach(comment => appShowComments(comment, comments))
  }

  document.querySelector('.detail').appendChild(thread)

  appScrollDetail()
}

function appShowPosts(posts) {
  //acts.sort((a, b) => { return a[5] - b[5] })

  document.querySelector('.items').innerHTML = ''
  for(let i = 0; i < posts.length; i++) {
    let item = document.querySelector('.templates .item').cloneNode(true)
    let post = posts[i]
    item.setAttribute('data-id', post.id)
    item.querySelector('.title').innerHTML = post.title 
    item.querySelector('.description').innerHTML = post.description 
    item.querySelector('.counts .votes .value').innerHTML = post.votesCount
    item.querySelector('.counts .comments .value').innerHTML = post.commentsCount
    item.querySelector('.counts .moments .value').innerHTML = post.moments ? post.moments.length : 0
    document.querySelector('.items').appendChild(item)
  }

  let items = document.querySelectorAll('.items .item')
  for(let i = 0; i < items.length; i++) {
    items[i].addEventListener('click', (e) => {
      const t = e.target.className != 'item' ? e.target.parentNode : e.target
      postId = e.currentTarget.getAttribute('data-id')
      appGetPost(postId)
    }, true)
  }
}

function appShowMenu() {
  document.querySelector('.detail').innerHTML = ''
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .menu').cloneNode(true)
  )
  /*
  document.querySelector('.detail .menu .menu-activity')
    .addEventListener('click', appShowAddActivity, false)
  document.querySelector('.detail .menu .menu-member')
    .addEventListener('click', appShowAddMember, false)
  */
  document.querySelector('.detail .menu .menu-logout')
    .addEventListener('click', appLogout, false)

  appScrollItems()
}

function appShowLogin() {
  document.querySelector('.header').classList.add('hidden')
  document.querySelector('.items').innerHTML = ''
  document.querySelector('.detail').innerHTML = ''
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .login').cloneNode(true)
  )
  document.querySelector('.login.form')
    .addEventListener('submit', e => {
      e.preventDefault()
      e.stopPropagation()
      playAudio('bg.mpeg')
      ubermate()
      appLogin({
        "name": document.querySelector('.detail input[name=username]').value,
        "pwd": document.querySelector('.detail input[name=password]').value
      })
    }, false)

    appScrollDetail()
}

function appShow() {
  appShowHeader()
  appGetPosts()
  appShowMenu()
}

function appShowHeader() {
  document.querySelector('.header').classList.remove('hidden')
  document.querySelector('.header-user .header-val').innerHTML = user
  document.querySelector('.header-bal .header-val').innerHTML = balance 
}

function appUpdateHeader() {
  doRequest({ 'endpoint': '/me' }).then((data) => {
    const obj = JSON.parse(data)
    balance = obj.balance
    appShowHeader()
  }).catch(() => {
    appShowLogin()
  })
}

function appShowError(title, desc) {
  document.querySelector('.content .cols').classList.add('hidden')
  const err = document.querySelector('.error')
  err.classList.remove('hidden')
  err.querySelector('h2.title').innerHTML = title
  err.querySelector('p.desc').innerHTML = desc 

  appLogout()
}

document.addEventListener('DOMContentLoaded', event => { 
  doRequest({ 'endpoint': '/me' }).then((data) => {
    const obj = JSON.parse(data)
    user = obj.user
    balance = obj.balance
    appShow()
  }).catch(() => {
    appShowLogin()
  })
})


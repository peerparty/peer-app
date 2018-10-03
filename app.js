let url = location.protocol + "//" + location.host + "/api";

function doRequest(opts) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(!opts.method ? 'GET' : opts.method, url + opts.endpoint);
    xhr.onload = function () {
      if(this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    if(opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        xhr.setRequestHeader(key, opts.headers[key]);
      });
    }
    let params = opts.params;
    if(params && typeof params === 'object') {
      params = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }
    xhr.send(params);
  });
};

const postType = 0
const commentType = 1

let user = '_'
let postId = -1

/**
 * Helpers - JBG
 */

function dec(n) {
  return parseFloat(n / 100).toFixed(2);
}

function isNumber(n) {
  let reg = /^\d+$/;
  return reg.test(n);
}

/**
 * APIish stuff - JBG
 */

function appGetPost(postId) {
  doRequest({ 'endpoint': '/posts/' + postId })
    .then(post => appShowThread(JSON.parse(post)))
    .catch(console.error)
}

function appGetPosts() {
  doRequest({ 'endpoint': '/posts' })
  .then((posts) => {
    appShowPosts(JSON.parse(posts));
  });
}

function appPostVote(postId, up) {
  doRequest({
    'endpoint': '/posts/' + postId + '/votes',
    'method': 'POST',
    'params': {'up': up}
  })
  .then(() => {
    appGetPost(postId)
  }).catch(console.error)
}

function appCommentVote(commentId, up) {
  doRequest({
    'endpoint': '/comments/' + commentId + '/votes',
    'method': 'POST',
    'params': {'up': up}
  })
  .then(() => {
    appGetPost(postId)
  }).catch(console.error)
}

async function appLogin(params) {
  doRequest({
    'endpoint': '/login',
    'method': 'POST',
    'params': params })
  .then((data) => {
    user = JSON.parse(data).user;
    appShow();
  })
  .catch((err, res) => {
    console.log(err, res)
    document.querySelector('.error').innerHTML = "U FAILED.";
  });
}

function appLogout() {
  doRequest({ 'endpoint': '/logout' })
  .then(() => {
    appShowLogin();
  });
}

/**
 * UI stuff - JBG
 */

function appShowNotice(notice) {
  document.querySelector('.detail').innerHTML = '';
  appShowClose();
  let note = document.querySelector('.templates .notice').cloneNode(true);
  note.querySelector('h1').innerHTML = notice;
  document.querySelector('.detail').appendChild(note);
}

function appShowClose() {
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .close').cloneNode(true)
  );
  document.querySelector('.detail .close')
    .addEventListener('click', appShowMenu, false);
}

function appCommentBox(objType, id, elm) {
  let commentboxElm = document.querySelector('.templates .commentbox').cloneNode(true)
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
      if(objType === postType) appPostVote(id, true)
      else appCommentVote(id, true)
  }, false);
  voteElm.querySelector('.down .arrow')
    .addEventListener('click', () => {
      if(objType === postType) appPostVote(id, false)
      else appCommentVote(id, false) 
  }, false)

  elm.appendChild(voteElm)
}

function appShowComments(comment, elm) {
  let comElm = document.querySelector('.templates .comment').cloneNode(true)
  comElm.querySelector('p').innerHTML = comment.comment 

  appCommentBox(commentType, comment.id, comElm)
  appShowVotes(commentType, comment.id, comment.votes, comElm)

  if(comment.comments) {
    let commentsElm = document.querySelector('.templates .comments').cloneNode(true)
    comment.comments.forEach(c => appShowComments(c, commentsElm))
    comElm.appendChild(commentsElm)
  }


  elm.appendChild(comElm)
}

function appShowThread(post) {
  document.querySelector('.detail').innerHTML = ''
  appShowClose()

  let thread = document.querySelector('.templates .thread').cloneNode(true)
  thread.setAttribute('data-id', post.id)
  thread.querySelector('.title').innerHTML = post.title
  thread.querySelector('.description').innerHTML = post.description

  appCommentBox(postType, post.id, thread)
  appShowVotes(postType, post.id, post.votes, thread)

  let comments = document.querySelector('.templates .comments').cloneNode(true)
  thread.appendChild(comments)

  if(post.comments) {
    let comments = thread.querySelector('.comments')
    post.comments.forEach(comment => appShowComments(comment, comments))
  }


  document.querySelector('.detail').appendChild(thread)

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
    document.querySelector('.items').appendChild(item)
  }

  let items = document.querySelectorAll('.items .item')
  for(let i = 0; i < items.length; i++) {
    items[i].addEventListener('click', (e) => {
      const t = e.target.className != 'item' ? e.target.parentNode : e.target
      postId = t.getAttribute('data-id')
      appGetPost(postId)
    }, true)
  }
}

function appShowMenu() {
  document.querySelector('.detail').innerHTML = '';
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .menu').cloneNode(true)
  );
  /*
  document.querySelector('.detail .menu .menu-activity')
    .addEventListener('click', appShowAddActivity, false);
  document.querySelector('.detail .menu .menu-member')
    .addEventListener('click', appShowAddMember, false);
  */
  document.querySelector('.detail .menu .menu-logout')
    .addEventListener('click', appLogout, false);
}

function appShowLogin() {
  document.querySelector('.header').classList.add('hidden');
  document.querySelector('.items').innerHTML = '';
  document.querySelector('.detail').innerHTML = '';
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .login').cloneNode(true)
  );
  document.querySelector('.detail .login .button')
    .addEventListener('click', () => {
      appLogin({
        "name": document.querySelector('.detail input[name=name]').value,
        "pwd": document.querySelector('.detail input[name=password]').value
      });
    }, false);
}

function appShow() {
  appShowHeader();
  appGetPosts();
  appShowMenu();
}

function appShowHeader() {
  document.querySelector('.header').classList.remove('hidden');
  document.querySelector('.header-user .header-val').innerHTML = user;
}

document.addEventListener('DOMContentLoaded', event => { 
  doRequest({ 'endpoint': '/' })
  .then((data) => {
    user = JSON.parse(data).user;
    appShow();
  })
  .catch(() => {
    appShowLogin();
  });
});


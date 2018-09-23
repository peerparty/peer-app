var url = location.protocol + "//" + location.host + "/api";

function doRequest(opts) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
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
    var params = opts.params;
    if(params && typeof params === 'object') {
      params = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
    }
    xhr.send(params);
  });
};

var members = [];
var user = '_';

/**
 * Helpers - JBG
 */

function dec(n) {
  return parseFloat(n / 100).toFixed(2);
}

function isNumber(n) {
  var reg = /^\d+$/;
  return reg.test(n);
}

function memberName(memId) {
  for(var i = 0; i < members.length; i++) {
    if(members[i][0] == memId) return members[i][2];
  }
}

function memberId(memName) {
  for(var i = 0; i < members.length; i++) {
    if(members[i][2] == memName) return members[i][0];
  }
}

/**
 * APIish stuff - JBG
 */

function appGetActivity(e) {
  var t = e.target.className != 'item' ? e.target.parentNode : e.target;
  var actId = t.getAttribute('data-id');
  doRequest({ 'endpoint': '/activities?actId=' + actId })
  .then((act) => {
    appShowActivity(JSON.parse(act));
  });
}

function appGetPost(e) {
  var t = e.target.className != 'item' ? e.target.parentNode : e.target
  var postId = t.getAttribute('data-id')
  doRequest({ 'endpoint': '/posts/' + postId })
    .then(post => appShowThread(JSON.parse(post)))
}


function appGetActivities() {
  doRequest({ 'endpoint': '/activities' })
  .then((acts) => {
    appShowActivities(JSON.parse(acts));
  });
}

function appGetPosts() {
  doRequest({ 'endpoint': '/posts' })
  .then((posts) => {
    appShowPosts(JSON.parse(posts));
  });
}


function appGetParticipants(actId) {
  doRequest({ 'endpoint': '/participants?actId=' + actId })
  .then((parts) => {
    appShowParticipants(JSON.parse(parts));
  });
}

function appGetVoteIds(actId) {
  doRequest({ 'endpoint': '/votes?actId=' + actId })
  .then((voteIdsStr) => {
    var voteIds = JSON.parse(voteIdsStr);
    if(voteIds.length == 0) {
      appShowNoVotes();
    } else {
      for(var i = 0; i < voteIds.length; i++) {
        appGetVote(voteIds[i]);
      }
    }
  });
}

function appGetVote(voteId) {
  doRequest({ 'endpoint': '/votes?voteId=' + voteId })
  .then((vote) => {
    appShowVote(JSON.parse(vote));
  });
}

function appGetMembers() {
  doRequest({ 'endpoint': '/members' })
  .then((mems) => {
    members = JSON.parse(mems);
    for(var i = 0; i < members.length; i++) {
      if(members[i][2] == user) {
        document.querySelector('.header-bal .header-val').innerHTML = dec(members[i][4]);
        document.querySelector('.header-prom .header-val').innerHTML = dec(members[i][5]);
      }
    }
  });
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

async function appAddActivity(params) {
  doRequest({
    'endpoint': '/activities',
    'method': 'POST',
    'params': params })
  .then(() => {
    appShowNotice('Thank you! Please allow some time for your activity to be mined. 🔨');
  })
  .catch((err, res) => {
  });
}

async function appAddMember(params) {
  doRequest({
    'endpoint': '/members',
    'method': 'POST',
    'params': params })
  .then(() => {
    appShowNotice('Thank you! Please allow some time for your member to be mined. 🔨');
  })
  .catch((err, res) => {
  });
}

async function appAddPart(params) {
  doRequest({
    'endpoint': '/participants',
    'method': 'POST',
    'params': params })
  .then(() => {
    appShowNotice('Thank you! Please allow some time for your participant to be mined. 🔨');
  })
  .catch((err, res) => {
  });
}

async function appAddVote(params) {
  doRequest({
    'endpoint': '/votes',
    'method': 'POST',
    'params': params })
  .then(() => {
    appShowNotice('Thank you! Please allow some time for your vote to be mined. 🔨');
  })
  .catch((err, res) => {
  });
}

async function appFinalize(params) {
  doRequest({
    'endpoint': '/finalize',
    'method': 'POST',
    'params': params })
  .then(() => {
    appShowNotice('Thank you! Please allow some time for activity to be mined. 🔨');
  })
  .catch((err, res) => {
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
  var note = document.querySelector('.templates .notice').cloneNode(true);
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

function appShowComments(comment, elm) {
  console.log(comment, elm)
  var comElm = document.querySelector('.templates .comment').cloneNode(true)
  comElm.querySelector('p').innerHTML = comment.comment 

  if(comment.comments) {
    let nestElms = comElm.querySelector('.nest-comments')
    comment.comments.forEach(c => appShowComments(c, nestElms))
  }

  elm.appendChild(comElm)
}

function appShowThread(post) {
  console.log(post)
  document.querySelector('.detail').innerHTML = ''
  appShowClose()

  var thread = document.querySelector('.templates .thread').cloneNode(true)
  thread.setAttribute('data-id', post.id)
  thread.querySelector('.title').innerHTML = post.title
  thread.querySelector('.description').innerHTML = post.description

  var comments = thread.querySelector('.comments')
  post.comments.forEach(comment => appShowComments(comment, comments))

  document.querySelector('.detail').appendChild(thread)
}

function appShowPosts(posts) {
  //acts.sort((a, b) => { return a[5] - b[5] })

  document.querySelector('.items').innerHTML = ''
  for(var i = 0; i < posts.length; i++) {
    var item = document.querySelector('.templates .item').cloneNode(true)
    var post = posts[i]
    item.setAttribute('data-id', post.id)
    item.querySelector('.title').innerHTML = post.title 
    item.querySelector('.description').innerHTML = post.description 
    document.querySelector('.items').appendChild(item)
  }

  var items = document.querySelectorAll('.items .item')
  for(var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', appGetPost, true)
  }
}



function appShowParticipants(parts) {
  document.querySelector('.detail .participants').innerHTML = '';
  // Participant list - JBG
  for(var i = 0; i < parts.length; i++) {
    var part = document.querySelector('.templates .participant').cloneNode(true);
    part.innerHTML = memberName(parts[i]);
    document.querySelector('.detail .participants').appendChild(part);

        document.querySelector('.detail .add-part').addEventListener('click', () => {
      appAddPart({
        'actId': document.querySelector('.detail .activity').getAttribute('data-id'),
        'memId': memberId(document.querySelector('.detail .sel-part').value),
      });
    }, true);
  }

  // Dropdown - JBG
  for(var j = 0; j < members.length; j++) {
    var part = false;
    for(var i = 0; i < parts.length; i++) {
      if(members[j][0] == parts[i]) part = true;
    }
    if(!part) {
      var optPart = document.querySelector('.templates .opt-part').cloneNode(true)
      optPart.innerHTML = members[j][2];
      document.querySelector('.detail .sel-part').appendChild(optPart);
    }
  }
}

function appShowNoVotes() {
  document.querySelector('.detail .votes').appendChild(
    document.querySelector('.templates .no-votes').cloneNode(true)
  );
}

function appShowVote(vote) {
  if(vote[5]) return;
  var voteElm = document.querySelector('.templates .vote').cloneNode(true);
  voteElm.setAttribute('data-id', vote[0]);
  voteElm.querySelector('.voter').innerHTML = memberName(vote[2]);
  voteElm.querySelector('.promise').innerHTML = dec(vote[3]);
  voteElm.querySelector('.just').innerHTML = vote[4];
  document.querySelector('.detail .votes').appendChild(voteElm);
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

function appShowAddMember() {
  document.querySelector('.detail').innerHTML = '';
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .add-member').cloneNode(true)
  );
}

function appShowAddActivity() {
  document.querySelector('.detail').innerHTML = '';
  appShowClose();
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .add-activity').cloneNode(true)
  );
  document.querySelector('.detail .add-activity .button')
    .addEventListener('click', () => {
      var cost = document.querySelector('.detail input[name=cost]').value;
      if(isNumber(cost)) { 
	      appAddActivity({
		"cost": parseFloat(cost) * 100,
		"title": document.querySelector('.detail input[name=title]').value,
		"description": document.querySelector('.detail input[name=description]').value,
		"global": document.querySelector('.detail input[name=global]').checked
	      });
      } else {
       alert('Please use integer number for cost. No "." or ",".');
      }
    }, false);
}

function appShowAddMember() {
  document.querySelector('.detail').innerHTML = '';
  appShowClose();
  document.querySelector('.detail').appendChild(
    document.querySelector('.templates .add-member').cloneNode(true)
  );
  document.querySelector('.detail .add-member .button')
    .addEventListener('click', () => {
      appAddMember({
        "name": document.querySelector('.detail input[name=name]').value,
        "addr": document.querySelector('.detail input[name=addr]').value
      });
    }, false);
}

function appShow() {
  //appGetMembers();
  appShowHeader();
  //appGetActivities();
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


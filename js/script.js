const avatar = "https://assets-global.website-files.com/600af1353f91b9eff1de3e74/6422ab2c2bcdd3fb25324cfb_TinyAutomator-p-500.png";
const formConnect = $('#formConnect')
const loginError = $('.login-error')
const app = $('#app')
const loggedUser = $('#user-name')
const loadButton = $('#load-btn')
const $messages = $('.messages-content')
const connectButton = $('#btnFormConnect')
const logoutButton = $('#logout')

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent =
  window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();

var minutues, client, OPENAI_API_KEY

$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results == null) {
    return null;
  }
  return decodeURI(results[1]) || 0;
}

async function login(ops) {
  if (ops.domain) {
    client = new waylay({ domain: ops.domain })
    await client.login(ops.user, ops.password)
      .catch(error => {
        loginError.show()
      })
  } else {
    client = new waylay({ token: ops.token })
  }

  await client.withSettings()
  botSensor = await client.sensors.get(config.bot || "WoxOpenAI")
  OPENAI_API_KEY = await client.vault.get("OPENAI_API_KEY")

  formConnect.hide()
  app.show()

  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.lang = 'en-US'
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.custom_grammar = ['task', 'alarm']

  client.tasks.list({ status: "running" }).then(tasks => {
    tasks.forEach(function (task) {
      config.entityId = task.ID
      replyMessage(task.name + " : " + task.ID);
    });
  })
}

connectButton.click(() => {
  login({ domain: $('#domain').val(), user: $('#user').val(), password: $('#pwd').val() })
})

logoutButton.click((e) => {
  e.preventDefault();
  delete client
  window.location.reload()
  return false
})

async function init() {
  app.hide()
  loginError.hide()
  $('[data-toggle="tooltip"]').tooltip()
  $('#domain').val(config.domain)
  if ($.urlParam('token')) {
    formConnect.hide()
    login({ token: $.urlParam('token') })
  } else {
    formConnect.show()
  }
  $messages.mCustomScrollbar();
  replyMessage("This is Waylay Bot, how can I help you?\nHere are some running tasks");
}


function updateScrollbar() {
  $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
    scrollInertia: 10,
    timeout: 0
  });
}

function setMessageTimestamp() {
  var d = new Date()
  if (minutues != d.getMinutes()) {
    minutues = d.getMinutes();
    $('<div class="timestamp">' + d.getHours() + ':' + minutues + '</div>').appendTo($('.message:last'));
  }
}

function insertMessage(message) {
  msg = message || $('.message-input').val().trim()
  var type = "Task"

  if(msg != '') {
    $('<div class="message loading new"><figure class="avatar"><img src="' + avatar + '" /></figure><span></span></div>').appendTo($('.mCSB_container'));
    $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setMessageTimestamp();

    $('.message-input').val(null);
    updateScrollbar();
    const occurancy = msg.split(" ").filter(w => ['search','look for','find','task'].includes(w)).length

    if (occurancy > 1) {
      client.tasks.list({ status: "running" }).then(tasks => {
        tasks.forEach(function (task) {
          if (msg.toLowerCase().indexOf(task.name) != -1) {
            replyMessage(task.name + " : " + task.ID)
            config.entityId = task.ID
          }
        })
      })
    } else {
      const id = msg.split(" ").find(t => t.length === 36) || config.entityId

      // const indexOfFirstTask = msg.indexOf("task");
      // const indexOfFirstAlarm = msg.indexOf("alarm");
      // if (indexOfFirstTask != -1) {
      // } else if (indexOfFirstAlarm != -1) {
      //   type = "Alarm"
      // }
      client.sensors.execute(botSensor.name, botSensor.version, {
        properties: {
          query: msg,
          entityType: type,
          OPENAI_API_KEY,
          entityId: id
        }
      }).then(response => {
        replyMessage(response.rawData.response || response.rawData.error);
      }).catch(error => {
        replyMessage(JSON.stringify(error));
      })
    }
  }
}

$('.message-submit').click(function () {
  insertMessage();
});

$('#record').click(function () {
  recognition.start();
});

recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  insertMessage(text)
};

recognition.onspeechend = () => {
  recognition.stop();
};

function replyMessage(message) {
  if ($('.message-input').val() == '') {
    $('<div class="message loading new"><figure class="avatar"><img src="' + avatar + '" /></figure><span></span></div>').appendTo($('.mCSB_container'));
    updateScrollbar();
    $('.message.loading').remove();
    $('<div class="message new"><figure class="avatar"><img src="' + avatar + '"  /></figure>' + message + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setMessageTimestamp();
    updateScrollbar();
  }
}

$(window).on('keydown', function (e) {
  if (e.which == 13) {
    insertMessage();
    return false;
  }
})

$(document).ready(function () {
  init()
});

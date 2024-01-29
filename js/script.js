const avatar = "https://assets-global.website-files.com/600af1353f91b9eff1de3e74/6422ab2c2bcdd3fb25324cfb_TinyAutomator-p-500.png";
const formConnect = $('#formConnect')
const loginError = $('.login-error')
const app = $('#app')
const loggedUser = $('#user-name')
const loadButton = $('#load-btn')
const $messages = $('.messages-content')
const connectButton = $('#btnFormConnect')
const logoutButton = $('#logout')
const userInput = $('#user-input')
var chatMessages = [];
var currentIndex = -1;

class FIFOBuffer {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.buffer = [];
  }

  push(item) {
    this.buffer.push(item);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }
  getBuffer() {
    return this.buffer;
  }

  getLatestValue() {
    if (this.buffer.length === 0) {
      return null;
    }
    return this.buffer[this.buffer.length - 1];
  }
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent =
  window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();
const myBuffer = new FIFOBuffer(config.bufferSize || 100)


var minutues, client, OPENAI_API_KEY, WAYLAY_BOT

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
  WAYLAY_BOT = await client.vault.get("WAYLAY_BOT").catch(err=>{})
  OPENAI_API_KEY = await client.vault.get("OPENAI_API_KEY")
  botSensor = await client.sensors.get(WAYLAY_BOT || config.WAYLAY_BOT || "WoxOpenAI")
  explainSensor = await client.sensors.get(config.EXPLAIN_BOT || "ExplainOpenAI")

  slackBot = await client.sensors.get("slackPostMessage")

  formConnect.hide()
  app.fadeIn(1500)

  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.lang = 'en-US'
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.custom_grammar = ['task', 'alarm']
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
  replyMessage("Hi, this is Waylay Bot, how can I help you?");
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

async function insertMessage(message) {
  msg = message || $('.message-input').val().trim()
  var type = "Task"

  if(msg != '') {
    $('<div class="message loading new"><figure class="avatar"><img src="' + avatar + '" /></figure><span></span></div>').appendTo($('.mCSB_container'));
    $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setMessageTimestamp();

    $('.message-input').val(null);
    updateScrollbar();
    const slackMessage = msg.split(" ").filter(w => ['forward', 'slack', 'Slack', 'send'].includes(w)).length
    const explainTaskMessage = msg.split(" ").filter(w => ['explain', 'task'].includes(w)).length
    var entityId = msg.split(" ").find(w => w.length == 36)
    if(entityId)
      config.entityId = entityId

    if (slackMessage > 1) {
      var channel = config.channel || "bot"
      client.sensors.execute(slackBot.name, slackBot.version, {
        properties: {
          channel,
          text: myBuffer.lastMessage
        }
      }).then(response => {
        replyMessage("message forwarded to " + channel + " channel")
      }).catch(error => {
        replyMessage(JSON.stringify(error));
      })
    } else if(explainSensor && explainTaskMessage > 1 && config.entityId) {
      client.sensors.execute(explainSensor.name, explainSensor.version, {
        properties: {
          query: msg,
          entityType: "Task",
          entityId: config.entityId,
          OPENAI_API_KEY
        }
      }).then(response => {
        myBuffer.lastMessage = response.rawData.response || response.rawData.error
        replyMessage(response.rawData.response || response.rawData.error)
      }).catch(error => {
        replyMessage(config.DEBUG ? JSON.stringify(error) : "Error in the response, please try another question");
      })
    } else {
      client.sensors.execute(botSensor.name, botSensor.version, {
        properties: {
          question: msg,
          messages: myBuffer.getBuffer(),
          openAIModel : config.openAIModel || 'gpt-3.5-turbo-1106',
          openAIKey: OPENAI_API_KEY
        }
      }).then(response => {
        if(response.rawData.messages.length > 1) {
          myBuffer.push(response.rawData.messages[response.rawData.messages.length-1])
        }
        myBuffer.lastMessage = myBuffer.getLatestValue() ?  myBuffer.getLatestValue().content : "no answer, please try another question"
        var entityId = myBuffer.lastMessage.replace(/\n/g, "").split(" ").find(w => w.length == 36)
        if(entityId)
          config.entityId = entityId
        replyMessage(myBuffer.lastMessage)
      }).catch(error => {
        replyMessage(config.DEBUG ? JSON.stringify(error) : "Error in the response, please try another question")
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
  $('<div class="message loading new"><figure class="avatar"><img src="' + avatar + '" /></figure><span></span></div>').appendTo($('.mCSB_container'));
  updateScrollbar();
  $('.message.loading').remove();
  $('<div class="message new"><figure class="avatar"><img src="' + avatar + '"  /></figure>' + message + '</div>').appendTo($('.mCSB_container')).addClass('new');
  setMessageTimestamp();
  updateScrollbar();
}

userInput.on('keydown', function(e) {
  if (e.keyCode === 38) { 
      e.preventDefault();
      if (currentIndex < chatMessages.length - 1) {
          currentIndex++;
          userInput.val(chatMessages[currentIndex]);
      }
  } else if (e.keyCode === 40) { 
      e.preventDefault();
      if (currentIndex > 0) {
          currentIndex--;
          userInput.val(chatMessages[currentIndex]);
      }
  }
});

userInput.on('keypress', function(e) {
  if (e.which === 13) { 
      var message = $(this).val();
      if (message.trim() !== '') {
        insertMessage();
        chatMessages.unshift(message.replaceAll('\n',""));
        currentIndex = -1;
      }
  }
});

$(document).ready(function () {
  init()
});

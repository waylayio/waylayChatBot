const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const themeButton = document.querySelector("#theme-btn");
const notificationButtom = document.querySelector("#notifications-btn");
const deleteButton = document.querySelector("#delete-btn");
const cardsButton = document.querySelector("#cards-btn");
const logsButton = document.querySelector("#logs-btn");
const cardContainer = $(".card-container");
const cardsContainerEl = document.getElementById('card-container');
const logModal = document.getElementById("logModal");
const systemModal = document.getElementById("systemModal");
const openModalBtn = document.getElementById("openModalBtn");
const logList = document.getElementById("logList");
const closeModalBtn = document.getElementById("close-log");
const closeSysModalBtn = document.getElementById("close-sys");
const searchInput = document.getElementById("searchInput");
const systemButton = document.querySelector("#system-btn");
var systemTextArea = document.getElementById("systemTextArea");
var submitBtn = document.getElementById("submitBtn");
const menuIcon = document.getElementById('help');
const menu = document.getElementById('menu');
const menuItems = document.querySelectorAll('.menu li');


let userText = null;
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent =
  window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const speachEnabled = SpeechRecognition && SpeechRecognitionEvent
var recognition, ruleSet, client, linkParser;


var chatMessages = [];
var currentIndex = -1;
var eventSource;
var botApp;
var boostrapTemplate;
var logs = []

if (speachEnabled) {
  recognition = new SpeechRecognition();
  var speechRecognitionList = new SpeechGrammarList();
  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.custom_grammar = ['task', 'alarm'];
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    $("#chat-input").text(text);
    handleOutgoingChat(text);
  };

  recognition.onspeechend = () => {
    recognition.stop();
  };

} else {
  $("#record").css("pointer-events", "none");
  $("#record").css("color", "rgb(217, 217, 227)")
}

$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results == null) {
    return null;
  }
  return decodeURI(results[1]) || 0;
}

function createCards(cards) {
  cards.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    const cardHeader = document.createElement('h5');
    cardHeader.innerHTML = `
      <span class="material-symbols-rounded">${card.icon}</span>&nbsp;&nbsp; 
      ${card.title}
      <span class="material-symbols-rounded icons" style="position: absolute; right: 20px">expand_more</span>
    `;

    const ul = document.createElement('ul');
    ul.style.display = 'none';
    card.queries.forEach(query => {
      const li = document.createElement('li');
      li.textContent = query;
      li.addEventListener('click', (e) => {
        e.stopPropagation(); 
        console.log(query);
        $("#chat-input").text(query);
        handleOutgoingChat(query);
      });

      ul.appendChild(li);
    });

    cardContent.appendChild(cardHeader);
    cardContent.appendChild(ul);
    cardHeader.addEventListener('click', () => {
      const isExpanded = ul.style.display === 'block';
      ul.style.display = isExpanded ? 'none' : 'block';
      cardHeader.querySelector('.icons').textContent = isExpanded ? 'expand_more' : 'expand_less';
    });
    cardDiv.appendChild(cardContent);
    cardsContainerEl.appendChild(cardDiv);
  });
}

function createAgentCards(agents) {
  const count = agents.length
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card';
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';
  const cardHeader = document.createElement('h5');
  cardHeader.innerHTML = `
    <span class="material-symbols-rounded">support_agent</span>&nbsp;&nbsp; 
    Agents (${count})
    <span class="material-symbols-rounded icons" style="position: absolute; right: 20px">expand_more</span>`;
    const ul = document.createElement('ul');
    ul.style.display = 'none';
    agents.forEach(agent => {
      const li = document.createElement('li');
      li.textContent = agent;
      ul.appendChild(li);
    });
    cardContent.appendChild(cardHeader);
    cardContent.appendChild(ul);
    cardHeader.addEventListener('click', () => {
      const isExpanded = ul.style.display === 'block';
      ul.style.display = isExpanded ? 'none' : 'block';
      cardHeader.querySelector('.icons').textContent = isExpanded ? 'expand_more' : 'expand_less';
    });
    cardDiv.appendChild(cardContent);
    cardsContainerEl.appendChild(cardDiv);
}

function connectAlarms() {
  if(eventSource !== undefined){
    eventSource.close()
    console.log('disconnect from the alarm service')
    eventSource = undefined
  } else {
    eventSource = new EventSource(client.gateway + '/alarms/v1/events?token=' + client.token)
    console.log('connect to the alarm service')
    eventSource.onmessage = function(event) {
      const cloudEvent = JSON.parse(event.data)
      console.log('Received CloudEvent:', cloudEvent)
      handleOutgoingChat('explain the alarm ' + cloudEvent.alarm.id + ' in detail and the logic of the task that is assosiated with this alarm and the root cause and all values and variables', 0)
    };
    eventSource.onerror = function(error) {
      console.error('EventSource encountered an error:', error)
    }
  }
}

async function login(ops) {
  client = new waylay({ token: ops.token })
  // await client.withSettings()
  client.gateway = config.PROD_GATEWAY
  client.console = config.PROD_CONSOLE
  await client.tasks.list().catch(err =>
    {
      client.gateway = config.DEV_GATEWAY
      client.console = config.DEV_CONSOLE 
    })
  linkParser = new LinkParser(client)
  const settings = await client.settings();
  const template = await client.templates.get(boostrapTemplate || settings.WoxTemplate || config.template || "WoxChat");
  console.log("template loaded", template);
  const AIModel = settings.AIModel || config.AIModel || 'gpt-4o'
  try { 
    botApp =  new GenAIBot(AIModel, client, template.name)
    botApp.getAgents().then(agents => createAgentCards(agents))
  } catch (error) {
    throw new Error("error starting a bot", error);
  }
  tippy('#help', {
    content: "Bot template: " + botApp.getTemplate()
  });
}

const loadDataFromLocalstorage = () => {
  const themeColor = localStorage.getItem("themeColor");

  document.body.classList.toggle("light-mode", themeColor === "light_mode");
  themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";
  // const markdownBodies = document.querySelectorAll('.markdown-body');
  // markdownBodies.forEach(element => 
  //   element.setAttribute('data-theme', document.body.classList.contains("light-mode") ? "light" : "dark") )

  const defaultText = `<div class="squeeze-and-disappear default-text">
                            <h1>Waylay iBot</h1>
                            <p>Start a conversation and explore the power of AI.<br> Waylay research lab</p>
                        </div>`

  chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to bottom of the chat container
}

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("themeColor", themeButton.innerText);
  themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";

  // const markdownBodies = document.querySelectorAll('.markdown-body');
  // markdownBodies.forEach(element => 
  //   element.setAttribute('data-theme', document.body.classList.contains("light-mode") ? "light" : "dark") )
});

const createChatElement = (content, className) => {
  // Create new div and apply chat, specified class and set html content of div
  const chatDiv = document.createElement("div");
  chatDiv.classList.add("chat", className);
  chatDiv.innerHTML = content;
  return chatDiv;
}

function addIframe(parent, content) {
  var iframe = document.createElement("iframe");
  iframe.srcdoc = content;
  iframe.width = '100%';
  iframe.height = '500';
  parent.style.height = '520'
  parent.appendChild(iframe);
}

const getChatResponse = async (incomingChatDiv) => {
  const pElement = document.createElement("div");
  pElement.classList.add("markdown-body");
  pElement.style['background-color'] = 'inherit';
  const feedback = userText.indexOf('feedback') > -1; //not in use

  const langMessage = userText.toLowerCase().split(" ").filter(w => ['set', 'language'].includes(w)).length == 2;
  const templateMessage = userText.toLowerCase().split(" ").filter(w => ['set', 'bot'].includes(w)).length == 2;

  if (langMessage) {
    recognition.lang = findClosestMatch(userText)
    const className = "fi fi-"+ recognition.lang.slice(-2).toLowerCase();
    $("#flag").removeClass();
    $("#flag").addClass(className);
    pElement.innerHTML = "<p>set language to: " + recognition.lang + "</p>"
    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  } 
  else if (templateMessage) {
    var _template = userText.split(" ").length > 2 ? userText.split(" ")[2] : botApp.getTemplate()
    pElement.innerHTML = "<p>set bot to: " + _template+ "</p>"
    botApp.template = _template
    botApp.reset()
    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    tippy('#help', {
      content: "Bot template: " + botApp.getTemplate()
    });
  }
  else {
    try {
      const response = await botApp.runBot(userText)
      logs = response.logs.filter(log => {
        return !log.message.toLowerCase().includes("descriptor".toLowerCase())
      })
      const res = linkParser.parse(marked.parse(response.lastReplyMessage))
      if(res.iframe){
        addIframe(incomingChatDiv.querySelector(".chat-content"),res.text)
      }
      else 
        pElement.innerHTML = res.text
    } catch(error){
      pElement.classList.add("error");
      pElement.innerHTML = "<p>Oops! Something went wrong while retrieving the response. Please try again.</p>";
    }
    // Remove the typing animation, append the paragraph element and save the chats to local storage
    incomingChatDiv.querySelector(".typing-animation")?.remove();
    incomingChatDiv.querySelector(".chat-details")?.appendChild(pElement);
    localStorage.setItem("all-chats", chatContainer.innerHTML);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }
}

const copyResponse = (copyBtn) => {
  // Copy the text content of the response to the clipboard
  const reponseTextElement = copyBtn.parentNode.parentElement.querySelector("div");
  navigator.clipboard.writeText(reponseTextElement.textContent);
  copyBtn.textContent = "done";
  setTimeout(() => copyBtn.textContent = "content_copy", 1000);
}

const okResponse = (copyBtn) => {
//TODO, take the answer and add it to the feedback OK buffer
  copyBtn.textContent = "done";
  setTimeout(() => {
    copyBtn.textContent = "thumb_up";
    copyBtn.style.color = 'lightgreen';
  }, 1000);
}

const nokResponse = (copyBtn) => {
//TODO, take the answer and add it to the feedback NOK buffer
  copyBtn.textContent = "done";
  setTimeout(() => {
    copyBtn.textContent = "thumb_down";
    copyBtn.style.color = 'lightcoral';
  }, 1000);

}

const showTypingAnimation = () => {
  // Display the typing animation and call the getChatResponse function
  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/bot.png" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <div style="width: 10%; max-width: 100px;" >
                      <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                      <span onclick="okResponse(this)" class="material-symbols-rounded">thumb_up</span>
                      <span onclick="nokResponse(this)" class="material-symbols-rounded">thumb_down</span>
                    </div>
                </div>`;
  // Create an incoming chat div with typing animation and append it to chat container
  const incomingChatDiv = createChatElement(html, "incoming");
  chatContainer.appendChild(incomingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  getChatResponse(incomingChatDiv);
}

const handleOutgoingChat = (text, delay = 500) => {
  const initialInputHeight = chatInput.scrollHeight;

  userText = chatInput.value.trim() || text
  if (!userText) return; // If chatInput is empty return from here

  // Clear the input field and reset its height
  chatInput.value = "";
  chatInput.style.height = `${initialInputHeight}px`;

  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/user.png" alt="user-img">
                        <p>${userText}</p>
                    </div>
                </div>`;

  // Create an outgoing chat div with user's message and append it to chat container
  const outgoingChatDiv = createChatElement(html, "outgoing");
  chatContainer.querySelector(".default-text")?.remove();
  chatContainer.appendChild(outgoingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showTypingAnimation, delay);
}

showError = function (error) {
  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/bot.png" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                </div>`;
  const incomingChatDiv = createChatElement(html, "incoming");
  chatContainer.appendChild(incomingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  const pElement = document.createElement("p");
  pElement.classList.add("error");
  pElement.textContent = error;
  incomingChatDiv.querySelector(".typing-animation").remove();
  incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
}

deleteButton.addEventListener("click", () => {
  localStorage.removeItem("all-chats");
  loadDataFromLocalstorage();
  if(botApp){
    botApp.reset()
  }
});


notificationButtom.addEventListener("click", () => {
  connectAlarms()
  document.body.classList.toggle("notifications_active");
  notificationButtom.innerText = document.body.classList.contains("notifications_active") ? "notifications_off" : "notifications_active";
});

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {
  // Adjust the height of the input field dynamically based on its content
  chatInput.style.height = `${initialInputHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    if (chatInput.value.trim() != '') {
      chatMessages.unshift(chatInput.value.trim());
      currentIndex = -1;
    }
    handleOutgoingChat();
  }
  if (e.keyCode === 38) {
    e.preventDefault();
    if (currentIndex < chatMessages.length - 1) {
      currentIndex++;
      chatInput.value = chatMessages[currentIndex];
    }
  } else if (e.keyCode === 40) {
    e.preventDefault();
    if (currentIndex > 0) {
      currentIndex--;
      chatInput.value = chatMessages[currentIndex];
    }
  }
});

$('#record').click(function () {
  if (speachEnabled)
    recognition.start();
});

sendButton.addEventListener("click", handleOutgoingChat);

cardsButton.addEventListener("click", () => {
  var icon = $('#cards-btn');
  icon.toggleClass('up');
  if (icon.hasClass('up')) {
    cardContainer.fadeOut(350)
    icon.text('live_help');
  } else {
    icon.text('help_center');
    cardContainer.fadeIn(350)
  }
});

$('.icons').on('click', function () {
  var id = $(this).closest('.card-content').find('ul')
  if (id.is(':visible')) {
    $(this).text('expand_less')
  } else {
    $(this).text('expand_more')
  }
  id.toggle(350);
});

menuIcon.addEventListener('click', () => {
  if (menu.style.display === 'none' || menu.style.display === '') {
      menu.style.display = 'block';
  } else {
      menu.style.display = 'none';
  }
});


menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menu.style.display = 'none';
    });
});

closeModalBtn.onclick = function() {
  logModal.style.display = "none";
};

closeSysModalBtn.onclick = function() {
  systemModal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target == logModal) {
    logModal.style.display = "none";
  } else if (event.target == systemModal) {
    systemModal.style.display = "none";
  }
};

systemButton.addEventListener("click", () => {
  botApp.getSystemMessage().then(message =>{
    systemTextArea.value = message;
    systemModal.style.display = "block";
  })
});

submitBtn.onclick = function() {
  botApp.updateSystemMessage(systemTextArea.value).then(res=>{
    // systemModal.style.display = "none";
    popup("System message updated");
  }).catch(err=>{
    popup("Error updating the propmt: " + err)
  })
}

logsButton.addEventListener("click", () => {
  displayLogs(logs)
  logModal.style.display = "block";
});

searchInput.addEventListener('input', function() {
  const searchText = searchInput.value.trim();
  filterLogs(searchText);
});

function displayLogs(logsToDisplay) {
  logList.innerHTML = "";  // Clear previous logs
  logsToDisplay.forEach(log => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `
          <span class="time">Time:</span> ${log.time}<br>
          <span class="level">Level:</span> ${log.level}<br>
          <span class="message">Message:</span> <span class="logs">${log.message}</span>
      `;
      logList.appendChild(listItem);
  });
}

function filterLogs(text) {
  if (!text) {
      displayLogs(logs);
  } else {
      const filteredLogs = logs.filter(log => log.message.toLowerCase().includes(text.toLowerCase()));
      displayLogs(filteredLogs);
      highlightSearch(text);
  }
}

function highlightSearch(text) {
  const logsDisplayed = document.querySelectorAll('#logList li');

  logsDisplayed.forEach(item => {
      const messageElement = item.querySelector('.logs');
      const messageText = messageElement.innerHTML;
      const cleanedText = messageText.replace(/<span class="highlight">|<\/span>/g, '');
      if (text) {
          const regex = new RegExp(`(${text})`, 'gi');
          const highlightedText = cleanedText.replace(regex, '<span class="highlight">$1</span>');
          messageElement.innerHTML = highlightedText;
      } else {
          messageElement.innerHTML = cleanedText;
      }
  });
}


function popup(message) {
  $('#popup').html(message);  // Update the popup content with the message
  $('#popup').fadeIn(500).delay(2000).fadeOut(500);  // Show the popup, then hide it
}

if($.urlParam('introImage')){
  document.getElementById('introImage').src = $.urlParam('introImage')
} else {
  document.getElementById('introImage').src = "images/intro.jpeg"
}

//MAIN
$('#introFrame').fadeOut(4000, () => {
  loadDataFromLocalstorage();
  if ($.urlParam('token')) {
    boostrapTemplate = $.urlParam('template')
    login({ token: $.urlParam('token') }).then(response => {
      console.log("application loaded")
      if($.urlParam('cardData')) {
        client.resources.get($.urlParam('cardData')).then( cardData =>
          createCards(cardData.cards)
        )
      } else {
        const cardData = config.cardData || []
        createCards(cardData)
      }
      tippy('#theme-btn', {
        content: 'Toggle theme'
      })
      tippy('#delete-btn', {
        content: 'Delete all context'
      })
      tippy('#record', {
        content: 'Talk to bot'
      })
      tippy('#cards-btn', {
        content: 'Help'
      })
      tippy('#notifications-btn', {
        content: 'Stream alarms'
      })
    }).catch(error => {
      showError("Bot not loaded " + error)
    })
  } else {
    showError("You need a token to login.")
  }
})
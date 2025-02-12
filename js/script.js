const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const themeButton = document.querySelector("#theme-btn");
const notificationButtom = document.querySelector("#notifications-btn");
const deleteButton = document.querySelector("#delete-btn");
const pdfButton = document.querySelector("#pdf-btn");
const logsButton = document.querySelector("#logs-btn");
const cardsContainerEl = document.getElementById('card-container');
const openModalBtn = document.getElementById("openModalBtn");
const logList = document.getElementById("logList");
const closeModalBtn = document.getElementById("close-log");
const closeSysModalBtn = document.getElementById("close-sys");
const searchInput = document.getElementById("searchInput");
const systemButton = document.querySelector("#system-btn");
var systemTextArea = document.getElementById("systemTextArea");
const submitBtn = document.getElementById("submitBtn");
const menuIcon = document.getElementById('settings');
const menu = document.getElementById('menu');
const menuItems = document.querySelectorAll('.menu li');
const logModal = document.getElementById("logModal");
const systemModal = document.getElementById("systemModal");
const systemModalc = document.getElementById("systemModal-c");

let userText = null;
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent =
  window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const speachEnabled = SpeechRecognition && SpeechRecognitionEvent
var recognition, ruleSet, client, linkParser;

const FADE = 350
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
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.custom_grammar = ['task', 'alarm'];
  recognition.onresult = (event) => {
    const text = event.results[event.results.length-1][0].transcript;
    $("#chat-input").text(text);
    handleOutgoingChat(text);
  };

  recognition.onerror = function(event) {
    console.error("Error occurred in recognition: " + event.error);
    recognition.stop();
    setTimeout(() => recognition.start(), 500);
  };

  recognition.onspeechend = () => {
    recognition.stop();
    if(recognition.running){
      setTimeout(() => recognition.start(), 500);
    }
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

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  if(document.getElementById('sidebar').classList.contains('open')){
    $(".card-content").show()
  } else {
    $(".card-content").hide()
  }
}

function createCards(cards) {
  // $(".card-content").hide()
  cards.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    const cardHeader = document.createElement('h5');
    cardHeader.innerHTML = `
      ${card.title}`;

    const ul = document.createElement('ul');

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
    cardDiv.appendChild(cardContent);
    cardsContainerEl.appendChild(cardDiv);
  });
  $(".card-content").show()
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
    Agents (${count})`;
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
    });
    cardDiv.appendChild(cardContent);
    cardsContainerEl.appendChild(cardDiv);
    $(".card-content").hide()
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

  // does template expexts clients to keep message sessions?
  clientSession = template?.variables.filter(m => m.name === 'messages').length > 0
  const AIModel = settings.AIModel || config.AIModel || 'gpt-4o'
  try {
    botApp =  new GenAIBot(AIModel, client, template.name, clientSession)
    // botApp.getAgents().then(agents => createAgentCards(agents))
  } catch (error) {
    throw new Error("error starting a bot", error);
  }
  tippy('#settings', {
    content: "Bot template: " + botApp.getTemplate()
  });

  const dashboard = new Dashboard(client)
  let resources = await dashboard.getResources()
          await dashboard.drawOnCanvas()
  let posMarkers = resources.map(res => ({id:res.id, lat:res.latitude, lng: res.longitude}))

  console.log(resources)
}

const loadDataFromLocalstorage = () => {
  const themeColor = localStorage.getItem("themeColor");

  document.body.classList.toggle("light-mode", themeColor === "light_mode");
  themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";
  const defaultText = `<div class="squeeze-and-disappear default-text">
                            <h1>Waylay iBot</h1>
                            <p>Start a conversation and explore the power of AI.<br> Waylay research lab</p>
                        </div>`

  chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  // const reply = localStorage.getItem('fullReply')
  // if (reply) {
  //   botApp.fullReply = JSON.parse(reply)
  // }
}

pdfButton.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const A4_HEIGHT = 841.89;
  const A4_WIDTH = 595.28;

  const WIDTH_MARGIN = 10;
  const HEIGHT_MARGIN = 10;
  const PAGE_HEIGHT = A4_HEIGHT - 2 * HEIGHT_MARGIN;

  const pdf = new jsPDF('p', 'pt', 'a4');  // orientation, unit, format
  const el =  document.getElementById('content')
  html2canvas(el, {
    allowTaint: true,
    useCORS: true,
    height: el.scrollHeight,
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
  }).then(canvas =>{
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgWidth = A4_WIDTH - 2 * WIDTH_MARGIN;
    const imgHeight = (imgWidth / canvasWidth) * canvasHeight;

    const pageImg = canvas.toDataURL('image/png', 1.0);

    let position = HEIGHT_MARGIN;
    if (imgHeight > PAGE_HEIGHT) {  // need multi page pdf
      let heightUnprinted = imgHeight;
      while (heightUnprinted > 0) {
        pdf.addImage(
            pageImg,
            'PNG',
            WIDTH_MARGIN,
            position,
            imgWidth,
            imgHeight
        );

        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, A4_WIDTH, HEIGHT_MARGIN, 'F'); // margin top
        pdf.rect(0, A4_HEIGHT - HEIGHT_MARGIN, A4_WIDTH, HEIGHT_MARGIN, 'F'); // margin bottom

        heightUnprinted -= PAGE_HEIGHT;
        position -= PAGE_HEIGHT; // next vertical placement

        if (heightUnprinted > 0) pdf.addPage();
      }
    } else {
      const pageImg = canvas.toDataURL('image/png', 1.0);
      const usedHeight = HEIGHT_MARGIN;
      pdf.addImage(
        pageImg,      // img DataUrl
        'PNG',
        WIDTH_MARGIN, // x - position against the left edge of the page
        usedHeight,   // y - position against the upper edge of the page
        imgWidth,
        imgHeight,
      );
    }
    pdf.save('Waylay-Chat.pdf');
    });
})

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("themeColor", themeButton.innerText);
  themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";
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
    try {
      var _template = userText.split(" ").length > 2 ? userText.split(" ")[2] : botApp.getTemplate()
      //test if the template exist
      await client.templates.get(_template);
      pElement.innerHTML = "<p>set bot to: " + _template+ "</p>"
      botApp.template = _template
      botApp.reset()
      incomingChatDiv.querySelector(".typing-animation").remove();
      incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
      tippy('#settings', {
        content: "Bot template: " + botApp.getTemplate()
      });
    } catch(err){
      showError("Bot can't be loaded ")
      incomingChatDiv.querySelector(".typing-animation").remove();
      incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }
  }
  else {
    try {
      const response = await botApp.runBot(userText)
      //localStorage.setItem('fullReply', JSON.stringify(response.fullReply))
      logs = response.fullReply.map( log => {
        const { content, role, ...newObject } = log;
        return {content, role, rest: JSON.stringify(newObject)}
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
  if (speachEnabled && !recognition.running){
    recognition.start();
    recognition.running = true
    $("#record").css("color", "rgb(0, 170, 0)")
  } else if (speachEnabled && recognition.running){
    recognition.stop();
    recognition.running = false
    $("#record").css("color", "rgb(172, 172, 190)")
  }
});

sendButton.addEventListener("click", handleOutgoingChat);

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
  $('#logModal').fadeOut(FADE)
};

closeSysModalBtn.onclick = function() {
  $('#systemModal').fadeOut(FADE)
};

window.onclick = function(event) {
  if (event.target == logModal) {
    $('#logModal').fadeOut(FADE)
  } else if (event.target == systemModal) {
    $('#systemModal').fadeOut(FADE)
  }
};

systemButton.addEventListener("click", () => {
  botApp.getSystemMessage().then(message =>{
    systemTextArea.value = message;
    systemModal.style.display = 'block'
    systemTextArea.style.height = 'auto';
    systemTextArea.style.height = `${systemTextArea.scrollHeight}px`;
    systemModalc.style.width = `${systemTextArea.scrollWidth}px`;
    systemModalc.style.height = `${systemTextArea.scrollHeight}px`;
  })
});

submitBtn.onclick = function() {
  botApp.updateSystemMessage(systemTextArea.value).then(res=>{
    //systemModal.style.display = "none";
    $('#systemModal').fadeOut(FADE)
    popup("System message updated");
  }).catch(err=>{
    popup("Error updating the propmt: " + err)
  })
}

logsButton.addEventListener("click", () => {
  displayLogs(logs)
  $('#logModal').fadeIn(FADE)
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
          <span class="time">Role:</span> ${log.role}<br>
          <span class="level">Content:</span> ${log.content}<br>
          <span class="message">Rest:</span> <span class="logs">${log.rest}</span>
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
  $('#popup').html(message);
  $('#popup').fadeIn(500).delay(2000).fadeOut(500);
}

if($.urlParam('introImage')){
  document.getElementById('introImage').src = $.urlParam('introImage')
} else {
  document.getElementById('introImage').src = "images/intro.jpeg"
}

function getGravatar(email) {
  const cleanEmail = email.trim().toLowerCase();
  const hash = md5(cleanEmail);
  return `https://www.gravatar.com/avatar/${hash}`;
}

//MAIN
$('#introFrame').fadeOut(4000, () => {
  if ($.urlParam('token')) {
    boostrapTemplate = $.urlParam('template')
    login({ token: $.urlParam('token') }).then(response => {
      console.log("application loaded")
      loadDataFromLocalstorage();
/*       client.me().then(me=>{
        document.getElementById("avatar").src = getGravatar(me.email);
        $("#avatar").fadeIn(FADE)
      }) */
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
      tippy('#notifications-btn', {
        content: 'Stream alarms'
      })
      tippy('#pdf-btn', {
        content: 'Export to PDF'
      })
    }).catch(error => {
      showError("Bot not loaded " + error)
    })
  } else {
    showError("You need a token to login.")
  }
})

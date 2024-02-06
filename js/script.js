const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const cardContainer = document.querySelector(".card-container");
const themeButton = document.querySelector("#theme-btn");
const deleteButton = document.querySelector("#delete-btn");
const templateButton = document.querySelector("#template-btn");


let userText = null;
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent =
  window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const speachEnabled = SpeechRecognition && SpeechRecognitionEvent
var recognition;

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
  $("#record").css("color","rgb(217, 217, 227)")
}

$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
      return null;
    }
    return decodeURI(results[1]) || 0;
}

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

    clearBuffer() {
      this.buffer = [];
    }
  
    getLatestValue() {
      if (this.buffer.length === 0) {
        return null;
      }
      return this.buffer[this.buffer.length - 1];
    }
}

const myBuffer = new FIFOBuffer(config.bufferSize || 100)
var client, OPENAI_API_KEY, WAYLAY_BOT
var chatMessages = [];
var currentIndex = -1;


async function login(ops) {
    client = new waylay({ token: ops.token })
    await client.withSettings()
    OPENAI_API_KEY = await client.vault.get("OPENAI_API_KEY")
    botSensor = await client.sensors.get(WAYLAY_BOT || config.WAYLAY_BOT || "WoxOpenAI")
  
    slackBot = await client.sensors.get("slackPostMessage")
  }

const loadDataFromLocalstorage = () => {
    // Load saved chats and theme from local storage and apply/add on the page
    const themeColor = localStorage.getItem("themeColor");

    document.body.classList.toggle("light-mode", themeColor === "light_mode");
    themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";

    const defaultText = `<div class="squeeze-and-disappear default-text">
                            <h1>Waylay iBot</h1>
                            <p>Start a conversation and explore the power of AI.<br> Waylay research lab</p>
                        </div>`

    chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to bottom of the chat container
}

const createChatElement = (content, className) => {
    // Create new div and apply chat, specified class and set html content of div
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv; // Return the created chat div
}

const getChatResponse = async (incomingChatDiv) => {
    const pElement = document.createElement("p");

    const slackMessage = userText.split(" ").filter(w => ['forward', 'slack', 'Slack', 'send'].includes(w)).length
    
   if (slackMessage > 1) {
      var channel = config.channel || "bot"
      client.sensors.execute(slackBot.name, slackBot.version, {
        properties: {
          channel,
          text: myBuffer.lastMessage
        }
      }).then(response => {
        pElement.textContent = "message forwarded to " + channel + " channel"
      }).catch(error => {
      }).finally(()=>{
        incomingChatDiv.querySelector(".typing-animation").remove();
        incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
        // localStorage.setItem("all-chats", chatContainer.innerHTML);
        chatContainer.scrollTo(0, chatContainer.scrollHeight); 
      })
    } else {
      if(config.DEBUG){
        console.log('messages prepared for the request:', myBuffer.getBuffer())
      }
      client.sensors.execute(botSensor.name, botSensor.version, {
        properties: {
          question: userText,
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
        pElement.textContent = myBuffer.lastMessage
        if(config.DEBUG){
          console.log('message: response', response.rawData.messages)
        }
      }).catch(error => {
        pElement.classList.add("error");
        pElement.textContent = "Oops! Something went wrong while retrieving the response. Please try again.";
      }).finally(()=>{
        // Remove the typing animation, append the paragraph element and save the chats to local storage
        incomingChatDiv.querySelector(".typing-animation").remove();
        incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
        localStorage.setItem("all-chats", chatContainer.innerHTML);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
      })
    }
}

const copyResponse = (copyBtn) => {
    // Copy the text content of the response to the clipboard
    const reponseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(reponseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
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
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                </div>`;
    // Create an incoming chat div with typing animation and append it to chat container
    const incomingChatDiv = createChatElement(html, "incoming");
    chatContainer.appendChild(incomingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    getChatResponse(incomingChatDiv);
}

const handleOutgoingChat = (text) => {
    const initialInputHeight = chatInput.scrollHeight;

    userText = chatInput.value.trim() || text
    if(!userText) return; // If chatInput is empty return from here

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
    setTimeout(showTypingAnimation, 500);
}


showError = function(error) {
  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="images/bot.png" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
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

$( document ).ready(function() {

  deleteButton.addEventListener("click", () => {
    localStorage.removeItem("all-chats");
    loadDataFromLocalstorage();
    myBuffer.clearBuffer();
  });
  
  themeButton.addEventListener("click", () => {
      // Toggle body's class for the theme mode and save the updated theme to the local storage 
      document.body.classList.toggle("light-mode");
      localStorage.setItem("themeColor", themeButton.innerText);
      themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";
  });
  
  const initialInputHeight = chatInput.scrollHeight;
  
  chatInput.addEventListener("input", () => {   
      // Adjust the height of the input field dynamically based on its content
      chatInput.style.height =  `${initialInputHeight}px`;
      chatInput.style.height = `${chatInput.scrollHeight}px`;
  });
  
  chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
          e.preventDefault();
          if(chatInput.value.trim() != ''){
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
      if(speachEnabled)
        recognition.start();
    });
    
  sendButton.addEventListener("click", handleOutgoingChat);

  templateButton.addEventListener("click", () => {
    const defaultText = `
          <div class="card">
            <img src="images/alarms.png" alt="Card Image">
            <div class="card-content">
              <h4>Alarm queries</h4>
              <ul>
                <li>Which is the last created alarm?</li>
                <li>Which are the last created alarms?</li>
                <li>Last triggered alarm</li>
                <li>Share the last updated alarm</li>
                <li>List alarms assigned to USER</li>
                <li>List alarms with severity CRITICAL</li>
                <li>Describe why was the alarm with ALARM ID raised</li>
                <li>What is the root cause for alarm ALARM ID?</li>
                <li>Describe what does the task that raised alarm ALARM ID do?</li>
                <li>Are there alarms on resource X?</li>
                <li>Give me the last alarm on resource X</li>
              </ul>
            </div>
          </div>
          
          <div class="card">
            <img src="images/tasks.png"  alt="Card Image">
            <div class="card-content">
            <h4>Task queries</h4>
              <ul>
                <li>List RUNNING tasks</li>
                <li>Count RUNNING tasks</li>
                <li>What are the most recent tasks? This cannot be properly implemented while there is no sort and order on tasks endpoint</li>
                <li>Describe what does the task TID do?</li>
              </ul>
            </div>
          </div>`
    var icon = $('#template-btn');
    icon.toggleClass('up');
    if (icon.hasClass('up') ) {
      cardContainer.replaceChildren();
      icon.text('note_stack');
    } else {
      icon.text('stack');
      cardContainer.innerHTML = defaultText;   
    }
 
  });

  $('#introFrame').fadeOut(4000, ()=>{
    loadDataFromLocalstorage();
    if ($.urlParam('token')) {
      login({ token: $.urlParam('token') }).then(response => {
        console.log("application loaded")
      }).catch(error =>{
        showError("not correct token")
      })
    } else {
      showError("You need a token to login.")
    }
  })
});
class GenAIBot {
    constructor(AIModel, client, template, clientSessionFlag) {
      this.AIModel = AIModel
      this.client = client
      this.template = template
      this.fullReply = []
      //should bot be responsible for keeping client session history or not
      this.clientSessionFlag =  clientSessionFlag
      this.lastReplyMessage = "NA"
      this.lastQuestion = "NA"
      this.sessionId = this.generateUUID()
    }

     generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      })
    }

    reset() {
      this.fullReply = []
      this.sessionId = this.generateUUID()
    }
    
    setSessionId () {
      this.sessionId = this.generateUUID()
    }

    getSessionId() {
      return this.sessionId
    }

    getLastQuestion() {
        return this.lastQuestion;
    }

    getTemplate() {
        return this.template;
    }

    getLastReplyMessage() {
      return this.lastReplyMessage;
    }
  
    getFullReply() {
      return this.getFullReply;
    }

    async getSystemMessage() {
      const template = await client.templates.get(this.template);
      var aINode = template.nodes.find(node=> node.properties.sensor && node.properties.sensor.requiredProperties.find(a=>a["system"] !== undefined))
      return aINode?.properties?.sensor?.requiredProperties?.find(a=>a["system"])?.system
    }

    async updateSystemMessage(text) {
      const template = await client.templates.get(this.template);
      var aINode = template.nodes.find(node=> node.properties.sensor && node.properties.sensor.requiredProperties.find(a=>a["system"] !== undefined))
      if(aINode){
        var properties = aINode.properties.sensor.requiredProperties.filter(v => !v.system)
        properties.push({system: text})
        aINode.properties.sensor.requiredProperties = properties
      }
      template.nodes = template.nodes.filter(n=> n.name != aINode.name)
      template.nodes.push(aINode)
      return await client.templates.update(template.name, template)
    }

    async getAgents() {
      const template = await client.templates.get(this.template);
      const agents =  template.nodes.filter(a => a.properties.sensor?.requiredProperties?.find(b=>b.system) === undefined) //filter LLM node
      return agents.map(n=>  n.name).filter(a=> (a.indexOf("AND") === -1 && a.indexOf("TaskOut") === -1 && a.indexOf("AIContext") === -1 ) ) || []
    }
  
    _extractMessageText = (message) => {
      if (message.content) {
        if (typeof message.content === 'string') {
          // openai style
          return message.content
        }
        else if (Array.isArray(message.content) && message.content.length > 0) {
          // AWS bedrock style
          return message.content[message.content.length-1].text
        }
      }
      return "no answer, please try another question"
    }
  
    async runBot(question) {
      console.log('runBot', question);
      this.lastQuestion = question;
      let ret, variables
      try{
        if(this.clientSessionFlag) {
          variables = { question, messages: this.fullReply,  model: this.AIModel}
        } else {
          variables = { question, sessionId: this.sessionId, model: this.AIModel}
        }
        ret = await client.templates.run(this.template, { variables })
      } catch(error){
        throw new Error("error running the bot, template failed to run", error);
      }
      
      if(ret === undefined) {
        throw new Error("error running the bot, template failed to respond", error);
      } else if(ret.taskOutput === undefined) {
        this.reset()
        const errorMessage = ret?.log.filter(a=> a.level === "WARN").length > 0? ret.log.filter(a=> a.level === "WARN")[0].message : "error running the bot, I will reset the cache, please try again"
        throw new Error(errorMessage, error);
      }
      const response = ret.taskOutput;
      const messages = response.messages || response.context?.messages
      const signleResponse = response.response
      if(messages?.length > 1) {
        this.fullReply = messages;
        this.lastReplyMessage = this._extractMessageText(messages[messages.length - 1])
      } else if(signleResponse) {
        this.lastReplyMessage = signleResponse.content
        this.fullReply.push(signleResponse)
      } else {
        throw new Error("error running the bot, there are no messages in the response", error);
      }
      return {
        fullReply: this.fullReply,
        lastReplyMessage: this.lastReplyMessage,
        question
      }
    }
}
  
class GenAIBot {
    constructor(AIModel, client, template) {
      this.AIModel = AIModel;
      this.client = client;
      this.template = template;
      this.fullReply = []
      this.lastReplyMessage = "NA"
      this.lastQuestion = "NA";
    }

    reset() {
      this.fullReply = []
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

    async getAgents() {
      const template = await client.templates.get(this.template);
      const agents =  template.nodes.filter(a => a.properties.sensor?.requiredProperties?.find(b=>b.system) === undefined) //filter LLM node
      return agents.map(n=>  n.name).filter(a=> (a.indexOf("AND") === -1 && a.indexOf("TaskOut") === -1) ) || []
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
      let ret
      try{
        ret = await client.templates.run(this.template, { variables: { question, messages: this.fullReply,  model: this.AIModel}})
      } catch(error){
        throw new Error("error running the bot, template failed to run", error);
      }
      
      if(ret === undefined) {
        throw new Error("error running the bot, template failed to respond", error);
      } else if(ret.taskOutput === undefined) {
        this.reset()
        throw new Error("error running the bot, I will reset the cache, please try again", error);
      }
      const response = ret.taskOutput;
      if(response.messages.length > 1) {
        this.fullReply = response.messages;
        this.lastReplyMessage = this._extractMessageText(response.messages[response.messages.length - 1])
      } else {
        throw new Error("error running the bot, there are no messages in the response", error);
      }
      return {
        fullReply: this.fullReply,
        lastReplyMessage: this.lastReplyMessage,
        logs: ret.log,
        question
      }
    }
}
  
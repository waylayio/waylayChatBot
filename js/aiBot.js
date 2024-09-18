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
      const url = `${this.client.gateway}/rules/v1/templates/${this.template}/run`;
      let trun;
      try {
        trun = await axios.post(url, {
          variables: {
            question,
            messages: this.fullReply,
            openAIModel: this.AIModel
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.client.token}`
          }
        });
      } catch (error) {
        throw new Error("error running bot", error);
      }
      if(trun.data === undefined || trun.data.taskOutput === undefined) {
        throw new Error("error running bot, there is no output in the template", error);
      }
      const response = trun.data.taskOutput;
      if(response.messages.length > 1) {
        this.fullReply = response.messages;
        this.lastReplyMessage = this._extractMessageText(response.messages[response.messages.length - 1])
      } else {
        throw new Error("error running bot, there are no messages in the output", error);
      }
      return {
        fullReply: this.fullReply,
        lastReplyMessage: this.lastReplyMessage,
        question
      }
    }
}
  
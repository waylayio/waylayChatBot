class LinkParser {
    constructor(client) {
        this.client = client;
    }

    parseID(inputString) {
        const regex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
        const match = inputString.match(regex);
        if (inputString.toLowerCase().indexOf('task') > -1 && match) {
            const position = inputString.indexOf(match[0])
            const line = ' <a href="' + this.client.console + '/tasks/' + match[0] + '/debug?token=' + this.client.token + '" target="_blank">' + match[0] + '</a> '
            return inputString.substring(0, position) + line + inputString.substring(position + match[0].length)
        } else if (inputString.toLowerCase().indexOf('alarm') > -1 && match) {
            const position = inputString.indexOf(match[0])
            const line = ' <a href="' + this.client.console + '/alarms/' + match[0] + '/history?token=' + this.client.token + '" target="_blank">' + match[0] + '</a> '
            return inputString.substring(0, position) + line + inputString.substring(position + match[0].length)
        } else {
            return inputString;
        }
    }

    parse(inputString) {
        if(inputString.indexOf('!DOCTYPE html') > -1){
            const text = inputString.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&#39;", "'").replaceAll("&quot;",'\"')
            return {iframe: true, text: text.substring(text.indexOf('<!DOCTYPE html'))}
        } else {
            const lines = inputString.split('\n');
            return {iframe: false, text: lines.map(line => this.parseID(line)).join('\n') }
        }

    }

}
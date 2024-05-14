function findClosestRule(searchStr) {
    const words = searchStr.split(" ");
    return words[words.length - 1];
}

function callNLP(sentence, rule = "weather") {
    const endpointUrl = client.gateway + "/nlp/v0/rulebase/" + rule
    const payload = {
      "targetTemplateName":"test",
      "utterance": sentence
    }
    return new Promise((resolve, reject) => {
        fetch(endpointUrl, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + client.token
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json()
        })
        .then(data => {
            resolve(data);
        })
        .catch(error => {
            reject(error); 
        })
    })
  }
  
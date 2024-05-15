async function findClosestRule(client, searchStr) {
    const words = searchStr.split(" ")
    var searchRule =  words[words.length - 1]
    const endpointUrl = client.gateway + "/nlp/v0/rulebase";
    const response = await fetch(endpointUrl, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + client.token
        }
    });
    if (!response.ok) {
        throw new Error("Your NLP rules are not configured");
    }
    const data = await response.json();
    const rule = data.rulebases.find(value => searchRule === value.id);
    if (rule) {
        return rule.id;
    } else {
        throw new Error("The rule is not found, other rules are: " + data.rulebases.map(value =>value.id));
    }
}

function callNLP(client, sentence, rule = "weather") {
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
                throw new Error("Your sentence couldn't be parsed")
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
  
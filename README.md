# Demo app: Waylay multi-agent appplication as the message bot 

This demo app utilizes waylay.js, with initialization through the Waylay JWT token (client = new waylay({ token: ops.token })). By default, it can be loaded directly within the Waylay Console as an application.
The core functionality is encapsulated in the  [aiBot.js class](./js/aiBot.js), which enables the execution of Waylay templates as a bot.
Demo is written in simple html/css/vanilla js and it doesn't require any specific backend or framework to run. 

If you wish to integrate this app with other messaging platforms (e.g., Teams, Slack), where message conversation is handled by the messaging apps themselves (rather than using Waylay for sending messages), you will need to instantiate waylay.js using Waylay API keys. Other than this modification, the rest of the setup remains unchanged.

const config = {
  template: 'WoxChat',
  AIModel: 'gpt-4o',  
  DEBUG: true,
  PROD_GATEWAY: "https://api.waylay.io",
  PROD_CONSOLE: "https://console.waylay.io",
  DEV_GATEWAY: "https://api-aws-dev.waylay.io",
  DEV_CONSOLE: "https://console-aws.dev.waylay.io",
  cardData: [
    {
      title: "Alarm queries",
      icon: "notifications",
      queries: [
        "List all alarms",
        "Last triggered alarm",
        "Describe the alarm(s) triggered by task TID including the values that triggered them.",
        "List alarms with severity CRITICAL",
        "Describe why was the alarm with ALARM ID raised",
        "What is the root cause for alarm ALARM ID?",
        "Describe what does the task that raised alarm ALARM ID do?",
        "Are there alarms on resource X?",
        "Give me the last alarm on resource X"
      ]
    },
    {
      title: "Task queries",
      icon: "flowsheet",
      queries: [
        "List RUNNING tasks",
        "Count RUNNING tasks",
        "Describe what does the task TID do?",
        "Summarize the alarm(s) triggered by task TID",
        "Describe the alarm(s) triggered by task TID including the values that triggered them.",
        "What are the tasks executed on resource X?",
        "List RUNNING tasks on resource X",
        "Explain me the logic of this task",
        "Tell me the values that this task has collected"
      ]
    },
    {
      title: "Resource queries",
      icon: "precision_manufacturing",
      queries: [
        "List resources of type RESOURCE TYPE",
        "Next page (fetches the next page in the list)",
        "Count resources named 'NAME'",
        "Count resources of type RESOURCE TYPE"
      ]
    }
  ]
}


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
      title: "Fleet status",
      icon: "notifications",
      queries: [
       "What is the status of my fleet"
      ]
    },
    {
      title: "Asset maintenance",
      icon: "flowsheet",
      queries: [
        "Which assets need maintenance"
      ]
    },
    {
      title: "Alarm monitoring",
      icon: "precision_manufacturing",
      queries: [
        "Show me the most recent alarms"
      ]
    }
  ]
}


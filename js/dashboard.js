class Dashboard {
  constructor(client) {
    this.client = client
  }

  async getResources() {
    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    console.log(response)
    return response.values
  }

}

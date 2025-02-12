class Dashboard {
  constructor(client) {
    this.client = client
  }

  async getResources() {
    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    console.log(response)
    return response.values
  }


  async drawOnCanvas() {
    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    let resources = response.values
    this.createResourceTable(resources)
    this.createMap(resources)

  }

  createResourceTable(resources) {
    const upperLeftCanvas = document.getElementById('upperLeftCanvas')
    upperLeftCanvas.className = 'upperLeftCanvas markdown-body'
    upperLeftCanvas.style.backgroundColor = 'inherit'
    // Create a table element
    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse'

    // Create table header row
    const headerRow = document.createElement('tr')
    const headers = ['ID', 'Name', 'Product', 'Account', 'AI Health Score']

    headers.forEach(headerText => {
      const th = document.createElement('th')
      th.textContent = headerText
      table.appendChild(th)
      headerRow.appendChild(th)
    })

    // Append header row to the table
    table.appendChild(headerRow)

    // Populate table rows with resource data
    resources.forEach(resource => {
      const row = document.createElement('tr')

      // Create and append each table cell
      const properties = ['id', 'name', 'resourceTypeId', 'Account', 'AI Health Score']
      properties.forEach(prop => {
        const td = document.createElement('td')
        td.textContent = resource[prop] || 'N/A'
        // td.style.border = '1px solid #ccc';
        //   td.style.padding = '8px';
        row.appendChild(td)
      })

      // Append row to the table
      table.appendChild(row)
    })

    // Append the table to the upperLeftCanvas element
    upperLeftCanvas.appendChild(table)
  }

  createMap(resources) {
    const resMapDiv = document.getElementById('resMap')

    var map = L.map("resMap").setView([resources[0].latitude, resources[0].longitude], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    // Add markers to the map
    resources.forEach(function(resource) {
      L.marker([resource.latitude, resource.longitude])
        .addTo(map)
        .bindPopup("ID: " + resource.id)
        .openPopup();
    });
  }

}

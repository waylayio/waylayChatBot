const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the "project" directory
app.use(express.static(path.join(__dirname)));

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

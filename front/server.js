const express = require('express');
const path = require('path');

const app = express();
const directory = '/' + (process.env.STATIC_DIR || 'build');
app.use(express.static(__dirname + directory));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, directory, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Trackdechets front listening on', port);
});

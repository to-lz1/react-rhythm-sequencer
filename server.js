const path = require('path');
const express = require('express');
const app = express();

app.use('/', express.static(path.join(__dirname, 'dist')));

app.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started: http://localhost:' + port + '/');
});

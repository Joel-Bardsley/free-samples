'use strict';

require('dotenv').config();
const routes = require('./routes');
const app = require('express')();
const bodyParser = require('body-parser');

require('./database');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);


app.listen(80, function () {
  console.log('listening on port 80!');
});

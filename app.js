'use strict';

require('dotenv').config();
const routes = require('./routes');
const app = require('express')();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const dbConnection = process.env.DB_CONNECTION || 'mongodb://localhost/freeSamples';

mongoose.connect(dbConnection, {
  useMongoClient: true,
  /* other options */
  }, function(err) {
  if (err) {
    console.log('Failed connecting to MongoDB!');
  } else {
    console.log('Successfully connected to MongoDB!');
  }
});

mongoose.Promise = global.Promise;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);


app.listen(8080, function () {
  console.log('Listening on port 8080!');
});

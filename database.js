'use strict';

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/freeSamples', {
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
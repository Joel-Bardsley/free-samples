'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shopAuthSchema = new Schema({
  name: String,
  access_token: String,
  install_date: Date,
  uninstall_date: Date
});

const Shop = mongoose.model('shop', shopAuthSchema);
module.exports = Shop;
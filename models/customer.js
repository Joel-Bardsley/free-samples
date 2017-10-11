'use strict';

const data = require('../database');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
  customer_id: Number,
  name: String,
  order_id: Number,
  order_date: Date
});

const Customer = mongoose.model('customer', customerSchema);
module.exports = Customer;
const customer = require('express').Router();
//const mongoose = require('mongoose');
const shopifyAPI = require('shopify-node-api');

//const Shop = require('../models/shop');
//const Customer = require('../models/customer');

let config = {
  shop: process.env.SHOP_NAME, // SHOP_NAME.myshopify.com
  shopify_api_key: process.env.API_KEY, 
  shopify_shared_secret: process.env.SECRET_KEY,
  access_token: process.env.ACCESS_TOKEN, //permanent token
  verbose: false
};

const Shopify = new shopifyAPI(config);

//Shop.findOne({'name': process.env.SHOP_NAME }, function (err, shop) {
//  if (err) return handleError(err);
//  shopifyConfig.access_token = shop.access_token;
//});


customer.get('/', function(req, res) {
  res.status(200).json(config);
});

//customer.get('/:c_id', function(req, res) {
//  
//  const customerID = req.params.c_id;
//  
//  Shopify.get('/admin/customers/'+ customerID +'.json', function(err, data, headers){
//    if (err) res.status(400).json(err);
//    
//    let customerTags = data.customer.tags.split(", ");
//    customerTags.push("swatch_" + 133525);
//    res.status(200).json(customerTags);
//  });
//  
//});


customer.post('/add', function(req, res) {
  if (!req.body || !req.body.c || !req.body.p) return res.sendStatus(400);
  
  console.log(config);
  
  let customerID = req.body.c;
  let productTag = "sample_" + req.body.p;
  let customerTags = [];
  let action = "add";
  let put_data = getCustomerTags(customerID, customerTags, productTag, action);
  
  
  
  if (!put_data) {
    res.status(200).json({"data": put_data});
  } else {
    console.log("No data");
    return res.sendStatus(400);
  }
  //postCustomerTags(customerID, put_data, action);
  
});

customer.post('/remove', function(req, res) {
  
});
customer.post('/:c_id/product/:p_id', function(req, res) {
  if (!req.body && !req.body.p_name) return res.sendStatus(400);
  
  const customerID = req.params.c_id;
  const productTag = "sample_" + req.body.p_name;
  
  function manageTag(err, data, headers) {
    let action = "";
    let customerTags = data.customer.tags.split(", ");
    const customerTagPos = customerTags.indexOf(productTag);
    
    if (customerTagPos === -1) {
      action = "add";
      customerTags.push(productTag);
      console.log("Added product tag");
    } else {
      action = "remove";
      customerTags.splice(customerTagPos, 1);
      console.log("Removed product tag");
    }
    
    let put_data = {
      "customer": {
        "id": customerID,
        "tags": customerTags.join(", ").toString()
      }
    };
    
    Shopify.put('/admin/customers/'+ customerID +'.json', put_data, function(err, data, headers){
      res.status(200).json({"action": action});
    });
    
  }
  
  Shopify.get('/admin/customers/'+ customerID +'.json', manageTag);
  
});

customer.post('/:c_id/order', function(req, res) {
  if (!req.body) return res.sendStatus(400);
  
  const Shopify = new shopifyAPI(shopifyConfig);
  const customerID = req.params.c_id;
  
  function createOrder(err, data, headers) {
    if (err || !data.addresses) return res.sendStatus(400);
    
    let address = data.addresses[0];
    console.log(address);
    
    let products = req.body.fabric;
    let lineItems = products.map(function(x) {
       return {
         "variant_id": x,
         "quantity": 1,
         "price": 0,
       };
    });
    
    let post_data = {
      "order": {
        "note": "Fabric samples only",
        "send_receipt": true,
        "discount_codes": [
          {
            "code": "Free Samples"
          }
        ],
        "line_items": lineItems,
        "shipping_lines": [
          {
            "title": "Free shipping",
            "price": "0.00"
          }
        ],
        "customer": {
          "id": customerID
        },
        "shipping_address": address
      }
    };
    
    if (!post_data) {
      return res.sendStatus(400);
    }
    console.log("Post data: ", post_data);
    
    Shopify.post('/admin/orders.json', post_data, function(err, data, headers){
      console.log("Creating order...");
      if (err) return res.sendStatus(400);
      res.status(200).json(data);
    });
    
  }
  
  Shopify.get('/admin/customers/'+ customerID +'/addresses.json?limit=1', createOrder)
  
  // Get customer tags
    // Delete tags starting with sample_
    // add samples_redeemed tag
});

function getCustomerTags(id, tags, productTag, action) {
  Shopify.get('/admin/customers/'+ id +'.json', function(err, data, headers) {
    if (err) return err;
    tags = data.customer.tags.split(", ");
    return formatCustomerTags(id, tags, productTag, action);
  });
}

function formatCustomerTags(id, tags, productTag, action) {
  if (action === "add") tags.push(productTag);
  if (action === "remove") tags.splice(tags.indexOf(productTag), 1);
  
  tags = tags.join(", ").toString();
  
  return {
    "customer": {
      "id": id,
      "tags": tags
    }
  };
}

function postCustomerTags(id, data, action) {
  Shopify.put('/admin/customers/'+ id +'.json', data, function(err, data, headers){
    res.status(200).json({"action": action});
  });
}

module.exports = customer;
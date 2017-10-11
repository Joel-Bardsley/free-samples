var sample = require('express').Router();
var mongoose = require('mongoose');
var shopifyAPI = require('shopify-node-api');
var Customer = require('../models/customer');
var Shop = require('../models/shop');


sample.use(getShopifyConfig);
sample.use(getCustomerData);
sample.post('/tag/:action', [formatCustomerTags, updateCustomerTags], function(req, res) {
  res.status(200).json({action: req.params.action, success: "Fabric sample added successfully!"});
});


sample.post('/order', [formatOrder, createOrder, createCustomer, formatFinalCustomerTags, updateCustomerTags, getOrder], function(req, res){
  res.json({success: "Order completed!", order: req.orderUrl});
});






function getShopifyConfig(req, res, next) {
  var shopName = req.query.shop.split(".myshopify.com").join("");
  
  Shop.findOne({'name': shopName}, function (err, shop) {
    if (err) {
      res.status(400).json({error: "Error searching in db"});
    } 
    
    if (!shop) {
      res.status(400).json({error: "Couldn't find shop in db"});
      
    } else {
      req.shopifyConfig = {
        shop: shop.name, // SHOP_NAME.myshopify.com
        shopify_api_key: process.env.API_KEY, 
        shopify_shared_secret: process.env.SECRET_KEY,
        access_token: shop.access_token, //permanent token
        verbose: false
      };
      next();
    }
    
  });
}


function getCustomerData(req, res, next) {
  var Shopify = new shopifyAPI(req.shopifyConfig);
  
  Shopify.get('/admin/customers/'+ req.body.c +'.json', function(err, data, headers) {
    if (err) {
      res.status(400).json(err);
    } else {
      req.customer = data.customer;
      next();
    }
  });
}


function formatCustomerTags(req, res, next) {
  var customer = req.customer;
  var tags = customer.tags.split(", ");
  var productTag = "sample_" + req.body.p;
  var action = req.params.action;
  
  if (action === "add") tags.push(productTag);
  else if (action === "remove") tags.splice(tags.indexOf(productTag), 1);
  else res.status(400).send("Invalid action");
  
  tags = tags.join(", ").toString();
  
  req.tag_data = {
    "customer": {
      "id": customer.id,
      "tags": tags
    }
  };
  
  next();
}





function formatOrder(req, res, next) {
  
  var address = req.customer.addresses[0];
  if (!address) {
    res.status(400).json({error: "Could not find customer address."});
  } else {
    
    var products = req.body.fabric;
    var lineItems;
    if (Array.isArray(products)) {
      lineItems = products.map(function(id){
        return {
          "variant_id": id,
          "quantity": 1,
          "price": 0
        };
      });
    } else {
      lineItems = [
        {
          "variant_id": products,
          "quantity": 1,
          "price": 0
        }
      ];
    }
    
    
    req.order_data = {
      "draft_order": {
        "note": "Fabric samples only",
        "line_items": lineItems,
        "shipping_line": {
          "title": "Free shipping",
          "price": "0.00",
          "custom": true
        },
        "customer": {
          "id": req.customer.id
        },
        "use_customer_default_address": true
      }
    };
    console.log("Order formatted");
    next();
  }
}



function createOrder(req, res, next) {
  var Shopify = new shopifyAPI(req.shopifyConfig);
  
  Shopify.post('/admin/draft_orders.json', req.order_data, function(err, data, headers){
    if(err) {
      res.status(400).json({error: "Error creating order"});
    } else {
      req.orderID = data.order.id;
      next();
    }
  });
}



function createCustomer(req, res, next) {
  
  var customerID = req.customer.id;
  var customerName = req.customer.first_name + " " + req.customer.last_name;
  var orderID = req.orderID;
  
  var customerData = {
    customer_id: customerID,
    name: customerName,
    order_id: orderID,
    order_date: new Date()
  };
  
  Customer.create(customerData, function(err, record) {
    if (err) {
      res.status(400).json({error: "Error saving customer to database"});
    } else {
      console.log("Customer saved to database", record);
      next();
    }
  });
}


function formatFinalCustomerTags(req, res, next) {
  // Get all customer tags
  var tags = req.customer.tags.split(", ");
  
  // Get tags that begin with "sample_"
  var sampleTags = tags.filter(function(tag) {
    return tag.indexOf("sample_") != -1;
  });
  
  // Remove "sample_" tags from customer tags
  tags = tags.filter(function(tag) {
    return sampleTags.indexOf(tag) == -1;
  });
  
  tags.push("samples_redeemed");
  tags = tags.join(", ").toString();
  
  req.tag_data = {
    "customer": {
      "id": req.body.c,
      "tags": tags
    }
  };
  next();
}


function updateCustomerTags(req, res, next) {
  
  var Shopify = new shopifyAPI(req.shopifyConfig);
  
  Shopify.put('/admin/customers/'+ req.body.c +'.json', req.tag_data, function(err, data, headers){
    if(err) {
      res.status(400).json({ error: "Error updating customer tags" });
    } else {
      console.log("Tags updated", data.customer.id);
      next();
    }
  });
}


function getOrder(req, res, next) {
  
  if (!req.orderID) {
    res.status(400).json({error: "Error retrieving order ID"});
  } else {
    var Shopify = new shopifyAPI(req.shopifyConfig);
  
    Shopify.get('/admin/orders/'+ req.orderID +'.json', function(err, data, headers){
      if(err) {
        res.status(400).json({error: "Error retrieving order data"});
      } else {
        console.log("Order found: ", data.order.id);
        req.orderUrl = data.order.order_status_url;
        next();
      }
    });
  }
}






module.exports = sample;
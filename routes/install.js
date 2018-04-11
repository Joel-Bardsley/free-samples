const install = require('express').Router();
const shopifyAPI = require('shopify-node-api');
const n = require('nonce')();
const noncestring = n();
const Shop = require('../models/shop');

install.use(getShopName);
install.get('/', function(req, res) {
  
  var Shopify = new shopifyAPI({
    shop: req.shopName, // MYSHOP.myshopify.com
    shopify_api_key: process.env.API_KEY,
    shopify_shared_secret: process.env.SECRET_KEY,
    shopify_scope: process.env.SCOPE,
    redirect_uri: process.env.BASE_URI+'install/auth',
    nonce: noncestring // Randomly generated value unique for each authorization request
  });
  
  var auth_url = Shopify.buildAuthURL();
  
  res.redirect(auth_url); // Shopify redirects to install/auth
});

install.get('/auth', function(req, res){
  
  var Shopify = new shopifyAPI({
    shop: req.shopName,
    shopify_api_key: process.env.API_KEY,
    shopify_shared_secret: process.env.SECRET_KEY,
    shopify_scope: process.env.SCOPE,
    nonce: req.query.state
  });
  
  Shopify.exchange_temporary_token(req.query, function(err, data){
    if (err) res.status(400).json();
    
    Shop.create({ 
      name: req.shopName,
      access_token: data['access_token'],
      install_date: new Date()
    }, function(err) {
      if (err) res.status(400).json({error: "Error saving to database"});
      
      console.log("Installed. Saved to database:", req.shopName);
      res.redirect('https://'+ req.query.shop +'/admin/apps');
    });
  });
});

function getShopName(req, res, next) {
  if (!req.query.shop) {
    res.status(400).json({error: "Could not retrieve shop details."});
  } else {
    req.shopName = req.query.shop.replace('.myshopify.com', '');
    next(); 
  }
}

module.exports = install;
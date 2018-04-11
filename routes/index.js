const routes = require('express').Router();
const install = require('./install');
const sample = require('./sample');

routes.use('/install', install);
routes.use('/sample', sample);

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

module.exports = routes;

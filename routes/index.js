var express = require('express');
var router = express.Router();
var siofu = require("socketio-file-upload");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

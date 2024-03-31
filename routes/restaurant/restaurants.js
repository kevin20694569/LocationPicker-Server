var express = require('express');
var router = express.Router();
const getrestaurantRouter = require('./getrestaurant.js')
const getrestaurantPostsRouter = require('../post/getrestautantPosts.js')


router.use('/', getrestaurantRouter)

module.exports = router;

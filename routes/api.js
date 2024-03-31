var express = require('express');
var router = express.Router();

var usersRouter = require('../routes/users/users');
var postRouter = require('../routes/post/posts');
var nearlocationRouter = require('../routes/post/nearlocation');
var restaurantRouter = require('../routes/restaurant/restaurants')
var chatRouter = require('../socket.io/main')



router.use('/media', express.static('./media'));
router.use('/restaurantimage', express.static('./restaurantimage'));
router.use('/posts', postRouter);
router.use('/users', usersRouter);
router.use('/nearlocation', nearlocationRouter);
router.use('/restaurant', restaurantRouter);
router.use('/chat', chatRouter)


router.use('/', (req, res) => {
  res.end("未輸入路徑")
})

module.exports = router

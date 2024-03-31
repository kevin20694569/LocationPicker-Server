var express = require('express');
var router = express.Router();
var connection = require('../../util/mysql/mysqldatabase')
var uploadpost = require('./uploadpostfile')
var getpost = require('./getpostfile')
var getrestautantPostsRouter = require('./getrestautantPosts')


router.get('/:id', getpost);
router.post('/', uploadpost);
router.get('/', getrestautantPostsRouter)


module.exports = router;

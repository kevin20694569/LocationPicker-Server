var express = require('express');
var router = express.Router();
const loginRouter = require('./login')
const registerRouter = require('./register')
const getuserfile = require('./getuserfile')


router.use('/login', loginRouter)
router.use('/register', registerRouter)
router.use('/', getuserfile)

module.exports = router;

const { Router } = require('express');
const router = Router();
const  io = require('socket.io-client');
const socket = io('http://localhost:3000');

router.get('/', (req, res) => {
  socket.emit('clientMessage', { message: 'Hello from the client!' });
  res.end()
})

module.exports = router;
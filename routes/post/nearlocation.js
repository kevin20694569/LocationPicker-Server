var express = require('express');
var router = express.Router();
var connection = require('../../util/mysql/mysqldatabase')
const posttable = require('../../util/mysql/posttable')


router.get('/', async (req, res, next) => {
    let { latitude, longitude, distance, lastrestaurantid } = req.query
    try {
        let data = await posttable.getnearlocactionPost(latitude, longitude, distance,
            lastrestaurantid )
        res.send(data)
        res.status(200)
        res.end()
    } catch (error) {
        console.log(error)
        res.status(500)
        res.end()
    }
})

module.exports = router
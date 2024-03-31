var express = require('express');
var router = express.Router();
var connection = require('../../util/mysql/mysqldatabase')
const posttable = require('../../util/mysql/posttable')

router.get('/:id', async (req, res, next) => {
    try {
        let id = req.params.id
        let data = await posttable.getPostByID(id)
        if (data.length > 0) {
            let resData = data[0]
            res.send(resData)
        } else {
            throw new Error("查詢失敗 id不存在")
        }
    } catch (error) {
        res.send("查詢失敗")
        console.log(error)
    }
    res.end()
})

module.exports = router
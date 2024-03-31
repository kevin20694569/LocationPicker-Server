const mysql = require('mysql2')
const pool = mysql.createPool ( {
    host: "localhost",
    user: "root",
    password: "j1218s0725v0620",
    database : "mysql_test"
})
module.exports = pool.promise()
const mysql = require('mysql');
require('dotenv').config();

const connectDB = mysql.createConnection({
    host: process.env.HOST,
    user: 'ONTAP@ontap-db',
    password: process.env.PASSWORD,
    database: process.env.DB,
    ssl: true
});

connectDB.connect((err) => {
    if(err) {
        console.error('error connecting: ' + err.stack);
        return
    }
    console.log('OnTap UG DB connected...');
})

// keep my connection always live my dear, please naa
setInterval(function () {
    connectDB.query('SELECT 1');
}, 3000);
// Thank You for keeping my connection life my love

module.exports = connectDB;
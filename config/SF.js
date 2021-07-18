var jsforce = require('jsforce');
var conn = new jsforce.Connection();
require('dotenv').config();

conn.login(process.env.SF_USER, process.env.SF_PASSWORD + process.env.SF_OAUTH)
.then(dat=>console.log('Connected to Salesforce...'))

module.exports = conn;
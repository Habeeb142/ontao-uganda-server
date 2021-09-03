// Plugins used
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))


app.use(express.json());
app.use(cors());
app.use(helmet(
    {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self"],
                scriptSrc: ["'self"]
            }
        },
        referrerPolicy: { policy: 'same-origin'}
    }
));

const GET_SET_DATA = require('./Routes/get_set_data');
const AI = require('./Routes/ai_port');
const AUTHENTICATION = require('./Routes/authentication');
const ADMIN = require('./Routes/admin');
const DATA = require('./Routes/data_port');

app.get('/', (req, res) => {
    res.send('Welcome to OnTap Uganda Server!')
});
// endpoints
app.use('/get_set_data', GET_SET_DATA);
app.use('/ai_port', AI);
app.use('/authentication', AUTHENTICATION);
app.use('/admin', ADMIN);
app.use('/data', DATA);
// Port the app listens too
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
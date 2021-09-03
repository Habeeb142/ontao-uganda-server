const express = require('express');
const router = express.Router();
const DB = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.route('/tasks')
    .get(authenticateToken, 
        async(req, res) => {
        
        try{
            await DB.query(`SELECT * FROM chiller_task`, (err, result) => {
                if(err){
                    res.status(400).send('Unable to Fetch')
                }
                else{                   
                    return res.status(200).send(result)
                }
            })
        }
        catch(err){
            res.status(500).json({
                success: false,
                msg: err
            })
        }

    });

router.route('/current-month-tasks')
    .get(authenticateToken, 
        async(req, res) => {
        
        try{
            await DB.query(`SELECT * FROM chiller_task WHERE month = ${new Date().getMonth() + 1}`, (err, result) => {
                if(err){
                    res.status(400).send('Unable to Fetch')
                }
                else{                   
                    return res.status(200).send(result)
                }
            })
        }
        catch(err){
            res.status(500).json({
                success: false,
                msg: err
            })
        }

    });

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null || jwt.decode(token) !== 'ontap_user') return res.sendStatus(401)
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    
        if (err) return res.sendStatus(403)
    
        req.user = user

    })
    next()
}

module.exports = router;
const express = require('express');
const router = express.Router();
const DB = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

router.route('/dashboard/:taskType')
    .post(
        authenticateToken, 
        body('email').isLength({min: 5}),
        body('before').isLength({min: 5, max: 10}),
        body('after').isLength({min: 5, max: 10}),
        async (req, res) => {
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ messages: errors.array() });
            }
            
            const query = `SELECT * 
            FROM ${req.params.taskType}
            WHERE date BETWEEN '${req.body.before}' AND '${req.body.after}'` 

            await DB.query(query, 
            (err, data) => {
                if (!err) {
                    res.status(200).json({
                        isSuccess: true,
                        visualizer: data
                    })
                }
                else {
                    res.status(202).json({
                        isSuccess: false,
                        message: err
                    })
                }
            })
        }
        catch (err) {
            res.status(500).send({
                isSuccess: false,
                message: err
            })
        }

    });

router.route('/generatePassword')
    .get(async (req, res) => {
    
    try {
        await DB.query("SELECT * FROM admin where password = '' ", 
        (err, rows) => {
            if (!err) {
                if(rows.length > 0) {
                 rows.map(async (data, index) => {
    
                        const detail = data.email.split(".");
                        const password = detail[0].toLowerCase().slice(0, 3) + detail[1].toLowerCase().slice(0,3)
                       
                        const salt = await bcrypt.genSalt(10);
                        const hashed = await bcrypt.hash(password, salt);
    
                        await DB.query(`UPDATE admin SET password = '${hashed}' WHERE email = '${data.email}'`, 
                        (err, results) => {
                            if (err) {
                                return res.status(400).send({
                                    success: false,
                                    msg: err
                                })
                            }
                            else {
                                if(index == rows.length-1) {
                                    return res.status(200).json({
                                        success: true,
                                        msg: 'Updated Successfully',
                                        results
                                    })
                                }
                            }
                        })
                    

                    });
                }
                else {
                    return res.send("No Record")
                }
                
            }
            else {
                res.send(err)
            }
        })
    }
    catch (err) {
        res.status(500).send({
            success: false,
            err
        })
    }
    
})


router.route('/overview')
    .post(
        authenticateToken,
        async (req, res) => {
        
        try {
            await DB.query(`SELECT
            id as taskId, user, pocId, taskType,
            action, date, region, teamlead as team_lead, image
            FROM chiller_task 
            WHERE
            (date BETWEEN '${req.body.before}' AND '${req.body.after}')`, 
            (err, rows) => {
                if (!err) {
                    res.status(200).send({
                        data: rows,
                        isSuccess: true
                    })
                }
                else {console.log(err)
                    res.status(400).send({
                        isSuccess: false
                    })
                }
            })
        }
        catch (err) {
            res.status(500).send({
                isSuccess: false,
                err
            })
        }

    });

router.route('/getTotal')
    .get(async (req, res) => {
        try {
            
            await DB.query("SELECT COUNT (id) AS taskCount FROM chiller_task", 
            // await connectDB.query("SELECT COUNT (*) AS taskCount FROM task where NOT action = 'Awaiting AI'", 
            (err, taskCount) => {
                res.status(200).send({
                    data: {
                        taskCount: taskCount[0].taskCount ,
                        userCount: 'Loading...',
                        pocCount: 'Loading...'
                    },
                    isSuccess: true
                })
            })
        }
        catch (err) {
            res.status(500).send({
                isSuccess: false,
                err
            })
        }
    })

router.route('/report/:type')
    .post(
        authenticateToken,
        async (req, res) => {
            
        try {
            await DB.query(`SELECT
            id, user, taskType,
            action, date, region, teamlead
            FROM chiller_task 
            WHERE
            (date BETWEEN '${req.body.before}' AND '${req.body.after}')`, 
            async (err, rows) => {
                if (!err) {
                    
                    const data = await analytics(rows, req.params.type);

                    res.status(200).send({
                        data,
                        isSuccess: true
                    })
                }
                else {
                    res.status(400).send({
                        isSuccess: false
                    })
                }
            })
        }
        catch (err) {
            res.status(500).send({
                isSuccess: false,
                err
            })
        }

    });

router.route('/summary')
    .post(
        authenticateToken,
        async (req, res) => {
            
        try {
            await DB.query(`SELECT
            id, user, taskType,
            action, date, region, teamlead
            FROM chiller_task 
            WHERE
            (date BETWEEN '${req.body.before}' AND '${req.body.after}')`, 
            async (err, rows) => {
                if (!err) {
                    
                    const data = await summary_analytics(rows);

                    res.status(200).send({
                        data,
                        isSuccess: true
                    })
                }
                else {
                    res.status(400).send({
                        isSuccess: false
                    })
                }
            })
        }
        catch (err) {
            res.status(500).send({
                isSuccess: false,
                err
            })
        }

    });

summary_analytics = async (data) => {
    payload = []
    const users = await data.filter((v,i,a)=>a.findIndex(t=>(t.user === v.user))===i);

    await users.forEach(element => {
        payload.push({
            user: element.user,
            teamlead: element.teamlead,
            region: element.region,
            chillerTask: data.filter(dat=>dat.user == element.user && dat.taskType=='Chiller').length,
            total: data.filter(dat=>dat.user == element.user && dat.taskType=='Chiller').length
        })
    })
    return payload
}

async function analytics(data, type) {

    payload = []
    // delete duplicate
    const users = await data.filter((v,i,a)=>a.findIndex(t=>(t[type.toLowerCase()] === v[type.toLowerCase()]))===i);

    await users.forEach(element => {
        payload.push({
            header: element[type.toLowerCase()],
            goodExec: data.filter(dat=>dat['action']=='success' && dat[type.toLowerCase()]==element[type.toLowerCase()]).length,
            badExec: data.filter(dat=>dat['action']=='bad' && dat[type.toLowerCase()]==element[type.toLowerCase()]).length,
            awaitingAI: data.filter(dat=>dat['action']=='Awaiting AI' && dat[type.toLowerCase()]==element[type.toLowerCase()]).length,
            total: data.filter(dat=>dat[type.toLowerCase()]==element[type.toLowerCase()]).length,
            perGoodExec: ((data.filter(dat=>dat['action']=='success' && dat[type.toLowerCase()]==element[type.toLowerCase()]).length/data.filter(dat=>dat[type.toLowerCase()]==element[type.toLowerCase()]).length)*100).toFixed(0),
            perBadExec: ((data.filter(dat=>dat['action']=='bad' && dat[type.toLowerCase()]==element[type.toLowerCase()]).length/data.filter(dat=>dat[type.toLowerCase()]==element[type.toLowerCase()]).length)*100).toFixed(0),
            perAwaitingAI: ((data.filter(dat=>dat['action']=='Awaiting AI' && dat[type.toLowerCase()]==element[type.toLowerCase()]).length/data.filter(dat=>dat[type.toLowerCase()]==element[type.toLowerCase()]).length)*100).toFixed(0),
        })
    });  
    return payload.sort((a, b)=> b.total - a.total)  
}


// Function Handling Authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null || jwt.decode(token)['email'] !== req['body']['email']) return res.sendStatus(401)

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      
        if (err) return res.sendStatus(403)
        req.user = user

    })
    next()
}

module.exports = router;
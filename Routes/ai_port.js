// Plugins used
const express = require('express');
const router = express.Router();
const DB = require('../config/db');
require('dotenv').config();

const jwt = require('jsonwebtoken');
// Function Handling Authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null || jwt.decode(token) !== 'ontap_user') return res.sendStatus(401)
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  
      if (err) return res.sendStatus(403)
  
      req.user = user

    })

    if(req['method']!=='GET') {
        if(req.body.password !== 'ontap_ai_dev')  return res.sendStatus(403)
        next()
    }
    else {
        next()
    }
}

router.route('/:taskType')
    // Getting all tasks awaiting ai and send to AI for analysis
    .get(authenticateToken, async (req, res) => {
        try {
            // sql sattement doing the fetching using where clause
            await DB.query(`
            SELECT id, image, user, taskType, pocId, teamlead, region
            FROM ${req.params.taskType} 
            WHERE action = 'Awaiting AI'`, (err, results) => {
                
                if (err) {
                    return res.status(400).send({
                        success: false,
                        msg: 'Can not fetch',
                        err
                    })
                }
                else {
                    return res.status(200).json({
                        success: true,
                        results
                    })
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
    // a patch request handling update from ai in other to submit results to our databse
    .patch(authenticateToken, async (req, res) => {
        let trimmed = {};
        let coordinate = {};

        (req.body.good_execution)? trimmed.action = 'success' : trimmed.action = 'bad';
        if(req.body.taskType == 'Chiller') {
            // getting all sku results sent from ai and storing inside an object trimmed
            trimmed.white_space = req.body.whitespace_condition == undefined? null : req.body.whitespace_condition;
            trimmed.white_space_perc = req.body.percentage_whitespace == undefined? null : req.body.percentage_whitespace;
            trimmed.contaminated = req.body.contamination_presence;
            trimmed.ReddsRGB = req.body.present_classes.ReddsRGB;
            trimmed.SafariRGB = req.body.present_classes.SafariRGB;
            trimmed.BalimiRGB = req.body.present_classes.BalimiRGB;
            trimmed.KilimanjaroCAN = req.body.present_classes.KilimanjaroCAN;
            trimmed.SafariCAN = req.body.present_classes.SafariCAN;
            trimmed.CastleLiteCAN = req.body.present_classes.CastleLiteCAN;
            trimmed.BingwaRGB = req.body.present_classes.BingwaRGB;
            trimmed.ReddsCAN = req.body.present_classes.ReddsCAN;
            trimmed.CastleRGB = req.body.present_classes.CastleRGB;
            trimmed.CastleLiteRGB = req.body.present_classes.CastleLiteRGB;
            trimmed.EagleRGB = req.body.present_classes.EagleRGB;
            trimmed.GrandMaltCAN = req.body.present_classes.GrandMaltCAN;
            trimmed.KilimanjaroRGB = req.body.present_classes.KilimanjaroRGB;
            // image_quality
            trimmed.image_quality = req.body.image_quality;
        }

        try {
            // sql statement handle update of databse
            DB.query(`UPDATE ${req.params.taskType} SET ? WHERE id = ` + req.body.id, trimmed,

                (err, results) => {
                    if (err) {
                        return res.status(400).send({
                            success: false,
                            msg: err
                        })
                    }
                    else {
                        return res.status(200).json({
                            success: true,
                            msg: 'Updated Successfully'
                        })

                    }
                }
            )
        
        }
        catch (err) {
            res.status(500).send({
                success: false,
                Errors: err
            })
        }
        
    });

module.exports = router;
// Plugins used
const express = require('express');
const router = express.Router();
const DB = require('../config/db');
require('dotenv').config();
const axios = require('axios')
const jwt = require('jsonwebtoken');
// Function Handling Authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null || jwt.decode(token) !== 'ontap_user') return res.sendStatus(401)
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        console.log(err)
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
            // fetch from Salesforce
            await pullFromSalesforce();
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
    // a patch request handling update from ai in other to submit results to our database
    .patch(authenticateToken, async (req, res) => {
        let trimmed = {};
        let coordinate = {};

        (req.body.good_execution)? trimmed.action = 'success' : trimmed.action = 'bad';
        if(req.body.taskType == 'Chiller') {
            // getting all sku results sent from ai and storing inside an object trimmed
            trimmed.white_space = req.body.whitespace_condition == undefined? null : req.body.whitespace_condition;
            trimmed.white_space_perc = req.body.percentage_whitespace == undefined? null : req.body.percentage_whitespace;
            trimmed.contaminated = req.body.contamination_presence;
            // trimmed.EagleDark = req.body.present_classes.EagleDark;
            // trimmed.NileSpecial = req.body.present_classes.NileSpecial;
            // trimmed.CastleMilkStout = req.body.present_classes.CastleMilkStout;
            // trimmed.CastleLiteCan = req.body.present_classes.CastleliteCan;
            // trimmed.EagleLager = req.body.present_classes.EagleLager;
            // trimmed.Club = req.body.present_classes.Club;
            // trimmed.CastleLite = req.body.present_classes.Castlelite;
            // trimmed.NileStout = req.body.present_classes.NileStout;

            trimmed.CastleLiteCAN = req.body.present_classes.CastleLiteCAN;
            trimmed.CastleLiteRGB330 = req.body.present_classes.CastleLiteRGB330;
            trimmed.CastleMilkStoutRGB330 = req.body.present_classes.CastleMilkStoutRGB330;
            trimmed.ClubRGB330 = req.body.present_classes.ClubRGB330;
            trimmed.ClubRGB500 = req.body.present_classes.ClubRGB500;
            trimmed.EagleDarkRGB300 = req.body.present_classes.EagleDarkRGB300;
            trimmed.EagleDarkRGB500 = req.body.present_classes.EagleDarkRGB500;
            trimmed.EagleExtraRGB300 = req.body.present_classes.EagleExtraRGB300;
            trimmed.EagleExtraRGB500 = req.body.present_classes.EagleExtraRGB500;
            trimmed.EagleLagerRGB300 = req.body.present_classes.EagleLagerRGB300;
            trimmed.EagleLagerRGB500 = req.body.present_classes.EagleLagerRGB500;
            trimmed.NileSpecialRGB330 = req.body.present_classes.NileSpecialRGB330;
            trimmed.NileSpecialRGB500 = req.body.present_classes.NileSpecialRGB500;
            trimmed.NileStoutRGB330 = req.body.present_classes.NileStoutRGB330;

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

pullFromSalesforce = async () => {
    try {
        await axios.get(`${process.env.BASE_URL}/get_set_data/today/chiller_task`, {headers: {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.b250YXBfdXNlcg.Xrn-SjCX4jmbeDDqqMMgDlQkNId17LvNYTpQR52SK88'}})
        return true
        
    } catch (error) {
        console.log(error)
    }
}

module.exports = router;
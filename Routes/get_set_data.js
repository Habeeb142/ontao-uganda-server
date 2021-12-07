const express = require('express');
const router = express.Router();
const SF = require('../config/SF');
const DB = require('../config/db');
require('dotenv').config();
const jwt = require('jsonwebtoken');
// console.log(jwt.sign('ontap_user', process.env.JWT_SECRET));

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

// Function to fetch data from Salesforce and do submission to our databse

router.route('/:weekType/:taskType')
    .get( authenticateToken, async(req, res) => {
        const taskType = req.params.taskType
        let soql = `SELECT ID, CreatedBy.Email,ONTAP__Survey_Question__r.ONTAP__Question__c,CreatedDate,ONTEAF_Attachment_Link_To_Export__c, ONTAP__SurveyTaker__r.ONTAP__Account__c,ONTAP__SurveyTaker__r.ONTAP__Account__r.ONTAP__Region__c,CreatedBy.First_Manager__r.Email FROM ONTAP__SurveyQuestionResponse__c WHERE ONTAP__Survey_Question__r.ONTAP__Survey__r.Name LIKE'%UG _POC EYE%' AND ONTAP__Survey_Question__r.ONTAP__Question__c LIKE '%Take the picture of the stock in the Coolers%' AND ONTEAF_Attachment_Link_To_Export__c != 'https://abiafrica--c.documentforce.com/servlet/servlet.FileDownload?file=' AND CreatedDate = ${req.params.weekType}`
        console.log('***Query Started***')
        // SOQL Query fetching fron SALESFROCE
        let accounts = await SF.query(soql);
        const data = accounts['records'];
        x = new Date().toLocaleDateString().split("/")  
        // console.log(`You have ${data.length} data to upload!`)
        
        setTimeout( async () => {   
            await data.forEach((element, index) => {
                (async()=>{
                    const selectSql = `
                    SELECT id from ${taskType} 
                    WHERE image = '${element.ONTEAF_Attachment_Link_to_Export__c}'
                    `
                 await DB.query(selectSql, 
                    async (err, rows) => {
                        if(!rows.length) {
                           
                            const sql = `
                            INSERT INTO ${taskType} 
                            (user, image, action, date, taskType, pocId, teamlead, region, month) 
                            VALUES ('${element.CreatedBy.Email}', '${element.ONTEAF_Attachment_Link_to_Export__c}', 'Awaiting AI', '${element.CreatedDate}', 'Chiller', '${element.ONTAP__SurveyTaker__r.ONTAP__Account__c}', '${element.CreatedBy.First_Manager__r.Email}', '${element['ONTAP__SurveyTaker__r']['ONTAP__Account__r']['ONTAP__Region__c']}', '${new Date().getMonth() + 1}' )`
                             await DB.query(sql, 
                                (err, rows) => {
                                    try {
                                        (index +1 == data.length) ? res.sendStatus(200) : console.log(index, data.length)
                                    } catch (error) {
                                        console.log(error);
                                        (index +1 == data.length) ? res.sendStatus(200) : console.log(index, data.length)
                                    }               
                                })

                        }     
                        
                        else {
                            (index +1 == data.length) ? res.sendStatus(200) : console.log(index, data.length)
                        }
                    })
                })()
            });
        }, 5000);
    })

module.exports = router;
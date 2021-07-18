const express = require('express');
const router = express.Router();
const DB = require('../config/db');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.route('/login')
    .post(async(req, res)=>{
        const { email, password } = req.body;
        try {
            await DB.query(`SELECT * FROM admin WHERE email = '${email}'`,
                (err, results) => {
                    if (err) {
                        return res.status(404).send({
                            message: 'User does not exist',
                            Error: err
                        })
                    }
                    else {
                        if (results.length <= 0) {
                            res.status(202).send({
                                isSuccess: false,
                                message: 'Email does not exist'
                            })
                        }
                        else {
                            // check password
                            bcrypt.compare(password, results[0].password, (err, isMatch) => {
                                
                                if (!isMatch) {
                                    res.status(202).send({
                                        isSuccess: false,
                                        message: 'Incorrect Password'
                                    })
                                }
                                else {
                                    res.json({
                                        isSuccess: true,
                                        accessToken: jwt.sign({email: results[0].email}, process.env.JWT_SECRET, { expiresIn: '1h' }),
                                        email: results[0].email,
                                        message: 'Signed in successfully'
                                    })
                                }

                            });
                            
                        }
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
    })

module.exports = router;
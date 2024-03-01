const express = require('express')
router = express.Router()

router.get('/' ,(req ,res)=>{
    res.render('index')
})
router.get('/home',(req,res)=>{
    res.render('home')
})

router.get('/transfer' ,(req ,res)=>{
    res.render('transfer')
})
module.exports = router





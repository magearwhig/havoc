var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    req.app.locals.connection(function(err, conn) {
        conn.query("select * from owners", function(err, rows){
            console.log(err, rows);
            conn.release(); 
        });
    });
  res.render('trades', { title: 'Trade Board' });
});

module.exports = router;

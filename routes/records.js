var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    req.app.locals.connection(function(err, conn) {
        conn.query("select p.*, (select owner from teams where id = p.team) as owner from points p order by points DESC LIMIT 0, 10", function(err, mostpoints){
            conn.query("select p.*, (select owner from teams where id = p.team) as owner from points p order by points asc LIMIT 0, 10", function(err, leastpoints){
                conn.release(); 
                res.render('records', {
                    title: 'Records',
                    mostpoints: mostpoints,
                    leastpoints: leastpoints
                });
            });
        });
    });
});

module.exports = router;

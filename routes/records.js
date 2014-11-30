var express = require('express');
var router = express.Router();
var helpers = require('../modules/helpers');
var Q = require('q');

router.get('/', function(req, res) {
    var connection = req.app.locals.connection;
    Q.all([
        helpers.queryWithPromises(connection, "select p.*, (select owner from teams where id = p.team) as owner from points p order by points DESC LIMIT 0, 10"),
        helpers.queryWithPromises(connection, "select p.*, (select owner from teams where id = p.team) as owner from points p order by points asc LIMIT 0, 10"),
        helpers.queryWithPromises(connection, "select * from teams_w_stats order by winpct DESC LIMIT 0,10"),
        helpers.queryWithPromises(connection, "select * from teams_w_stats order by winpct ASC LIMIT 0,10")
    ]).spread(function(mostpoints, leastpoints, bestwinpct, worstwinpct){
        res.render('records', {
            title: 'Records',
            mostpoints: mostpoints,
            leastpoints: leastpoints,
            bestwinpct: bestwinpct,
            worstwinpct: worstwinpct
        });
    });
});

module.exports = router;

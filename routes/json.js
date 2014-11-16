var express = require('express');
var router = express.Router();
var _ = require('lodash');

router.get('/teams', function(req, res) {
    req.app.locals.connection(function(err, conn) {
        conn.query("select * from teams where current = 1", function(err, rows){
            conn.release(); 
            res.json(rows);
        });
    });
});

router.get('/players/available', function(req, res) {
    req.app.locals.connection(function(err, conn) {
        conn.query("select pa.player_available, t.owner as team, pa.positions_sought, pa.timestamp from players_available pa LEFT JOIN teams t on pa.team = t.id WHERE pa.timestamp >= DATE_ADD(CURDATE(), INTERVAL -10 DAY) and t.current = 1 order by timestamp DESC", function(err, rows){
            rows.map(function(item){
                item.positions_sought = JSON.parse(item.positions_sought);
                return item;
            });
            conn.release(); 
            res.json(rows);
        });
    });
});

router.post('/players/available', function(req, res) {
    if (!req.body.player) {
        res.status(400).send({"error": "must include name of player"});
    }
    if (!req.body.team) {
        res.status(400).send({"error": "must include the team making a player available"});
    }
    if (!req.body.positions_sought || !_.isArray(req.body.positions_sought)) {
        res.status(400).send({"error": "must include an array of positions sought"});
    }
    var body = {
        player_available: req.body.player,
        team: req.body.team,
        positions_sought: JSON.stringify(req.body.positions_sought)
    };
    req.app.locals.connection(function(err, conn) {
        conn.query("INSERT INTO players_available SET ?", body, function(err, rows){
            conn.release(); 
            if (err) {
                res.status(500).json({status:"error", code: err.code});
            }
            res.json({status: "ok"});
        });
    });
});

module.exports = router;

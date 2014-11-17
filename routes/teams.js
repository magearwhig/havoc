var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    req.app.locals.connection(function(err, conn) {
        conn.query("select * from teams where current = 1", function(err, rows){
            conn.query("select * from teams where current = 0", function(err, historic){
                conn.release(); 
                res.render('teams', {
                    title: 'Teams',
                    historicTeams: historic,
                    teams: rows
                });
            });
        });
    });
});

router.get('/:id', function(req, res) {
    req.app.locals.connection(function(err, conn) {
        var theId = conn.escape(req.params.id);
        conn.query("select *, (select owner from teams where id = " + theId + ") as team_owner, (select owner from teams where id = g.away_team) AS away_team_name, (select owner from teams where id = g.home_team) AS home_team_name from games g where g.away_team = " + theId + " or g.home_team = " + theId, function(err, rows){
            conn.release(); 
            res.render('team_details', {
                title: 'Team',
                team: theId,
                teamName: rows[0].team_owner,
                games: rows
            });
        });
    });
});

module.exports = router;

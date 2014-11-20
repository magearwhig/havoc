var express = require('express');
var router = express.Router();
var _ = require('lodash');
var q = require('q');

router.get('/', function(req, res) {
    var data = {
        title: 'Admin'
    };
    q.all([
        function(){
            var deferred = q.defer();
            req.app.locals.connection(function(err, conn) {
                conn.query("select * from teams where current = 1", function(err, rows){
                    conn.release(); 
                    data.teams = rows;
                    deferred.resolve();
                });
            });
            return deferred.promise;
        }(),
        function(){
            var deferred = q.defer();
            deferred.resolve();
            return deferred.promise;
        }()
    ]).then(function(){
        res.render('admin', data);
    });
});

router.post('/newgame', function(req, res) {
    var body = {
        away_team: req.body.away_team,
        away_score: req.body.away_score,
        home_team: req.body.home_team,
        home_score: req.body.home_score,
        week: req.body.week,
        year: req.body.year
    };
    req.app.locals.connection(function(err, conn) {
        conn.query("INSERT INTO games SET ?", body, function(err, rows){
            conn.release(); 
            res.redirect('/admin');
        });
    });
});

module.exports = router;


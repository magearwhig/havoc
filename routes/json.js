var express = require('express');
var url = require('url');
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

router.get('/points', function(req, res) {
    var url_parts = url.parse(req.url, true),
        query = url_parts.query,
        allowedSort = [
            "points",
            "teamName",
            "week",
            "year"
        ],
        order = query.order === "ASC" ? "ASC" : "DESC",
        sortValues = {
            "points": "points " + order,
            "teamName": "teamName " + order + ", week " + order + ", year " + order,
            "year": "year " + order + ", week " + order + ", points " + order,
            "week": "week " + order + ", year " + order + ", points " + order
        },
        sortBy = query.sort && allowedSort.indexOf(query.sort) !== -1 ? sortValues[query.sort] : "points",
        limit = !isNaN(query.limit) ? parseInt(query.limit, 10) : 10,
        offset = !isNaN(query.offset) ? parseInt(query.offset, 10) : 0,
        responseObject = {
            limit: limit,
            order: order,
            sort: sortBy,
            offset: offset,
            totalRows: 0,
            result: []
        },
        query = "select p.*, (select count(*) from points where consolation = 0) as totalRows, (select t.owner from teams t where t.id = p.team) as teamName from points p where p.consolation = 0 order by " + sortBy + " LIMIT " + offset + "," + limit;

    req.app.locals.connection(function(err, conn) {
        conn.query(query, function(err, rows){
            conn.release();
            responseObject.totalRows = rows[0] ? rows[0].totalRows : 0;
            _.forEach(rows, function(row) {
                delete row.totalRows;
            });
            responseObject.result = rows;
            res.json(responseObject);
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

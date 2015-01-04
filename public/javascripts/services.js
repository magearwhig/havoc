havocApp.factory('pointsService', function($http) {
    var pointsService = {
        getPoints: function(offset, limit, sort, order) {
            var promise = $http.get('/json/points', {
                params: {
                    offset: offset,
                    limit: limit,
                    sort: sort,
                    order: order
                }
            }).then(function(response) {
                return response.data;
            });
            return promise;
        }
    };
    return pointsService;
});
havocApp.factory('playersService', function($http) {
    var playersService = {
        getPlayers: function() {
            var promise = $http.get('/json/players/available').then(function(response) {
                return response.data;
            });
            return promise;
        },
        postPlayers: function(player, team, positionsSought) {
            var promise = $http.post("/json/players/available", {
                player: player,
                team: team,
                positions_sought: positionsSought
            });
            return promise;
        }
    };
    return playersService;
});
havocApp.factory('teamsService', function($http) {
    var teamsService = {
        getTeams: function() {
            var promise = $http.get('/json/teams').then(function(response) {
                return response.data;
            });
            return promise;
        }
    };
    return teamsService;
});

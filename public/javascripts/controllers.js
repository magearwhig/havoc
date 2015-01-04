havocApp.controller('PointsCtrl', function($scope, pointsService) {

    var orders = {
        teamName: "DESC",
        year: "DESC",
        week: "DESC",
        points: "DESC"
    };

    $scope.currentPage = 1
    $scope.totalItems = 0;
    $scope.maxSize = 5;
    $scope.limit = 10;
    $scope.offset = 0;
    $scope.sort = "points";
    $scope.order = "DESC";

    function updatePoints(offset, limit, sort, order) {
        pointsService.getPoints(offset, limit, sort, order).then(function(data) {
            $scope.points = data;
            $scope.totalItems = data.totalRows;
        });
    }

    $scope.sortData = function(sort) {
        $scope.sort = sort;
        if (orders[sort]) {
            orders[sort] = orders[sort] === "ASC" ? "DESC" : "ASC";
        }
        $scope.order = orders[sort] || "DESC";
        updatePoints($scope.offset, $scope.limit, $scope.sort, $scope.order);
    };

    $scope.pageChanged = function() {
        $scope.offset = $scope.limit * ($scope.currentPage - 1);
        updatePoints($scope.offset, $scope.limit, $scope.sort, $scope.order);
    };

    updatePoints($scope.offset, $scope.limit, $scope.sort, $scope.order);

});

havocApp.controller('OwnerListCtrl', function($scope, teamsService, playersService) {

    teamsService.getTeams().then(function(data) {
        $scope.teams = data;
    });
    function updateAvailablePlayers() {
        playersService.getPlayers().then(function(data) {
            $scope.availablePlayers = data;
        });
    }

    $scope.positions = [
        "QB",
        "RB",
        "WR",
        "TE",
        "DT",
        "DE",
        "LB",
        "CB",
        "S",
        "K",
        "p"
    ];

    function resetTradeBoard() {
        $scope.team = null;
        $scope.positionsSought = [];
        $scope.availablePlayer = "";
        $scope.tradeBoardErrors = [];
        updateAvailablePlayers();
    }
    resetTradeBoard();

    $scope.addPlayer = function(){
        if ($scope.positionsSought.length === 0) {
            $scope.tradeBoardErrors.push("Please list the positions of players you are seeking.");
        }
        if ($scope.availablePlayer.length === 0) {
            $scope.tradeBoardErrors.push("Please enter the name of the player that is available.");
        }
        if (!$scope.team) {
            $scope.tradeBoardErrors.push("Please select your name from the dropdown.");
        }
        if ($scope.tradeBoardErrors.length) {
            return;
        }
        playersService.postPlayers($scope.availablePlayer, $scope.team, $scope.positionsSought).then(function(data, status, headers, config){
            resetTradeBoard();
        });
    };

    $scope.positionSelection = function(position) {

        var positionIndex = $scope.positionsSought.indexOf(position);

        if (positionIndex > -1) {
            $scope.positionsSought.splice(positionIndex, 1);
        } else {
            $scope.positionsSought.push(position);
        }
    };
});

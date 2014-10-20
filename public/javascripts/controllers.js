havocApp.controller('OwnerListCtrl', function($scope, $http) {

    $http.get('/json/teams').success(function(data) {
        $scope.teams = data;
    });
    function updateAvailablePlayers() {
        $http.get('/json/players/available').success(function(data) {
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
        console.log($scope.positionsSought, $scope.availablePlayer, $scope.team);
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
        $http.post("/json/players/available", {
            player: $scope.availablePlayer,
            team: $scope.team,
            positions_sought: $scope.positionsSought
        }).success(function(data, status, headers, config){
            resetTradeBoard();
        }).error(function(data, status, headers, config){
        });
    };

    $scope.positionSelection = function(position) {

        var positionIndex = $scope.positionsSought.indexOf(position);

        if (positionIndex > -1) {
            $scope.positionsSought.splice(positionIndex, 1);
        } else {
            $scope.positionsSought.push(position);
        }
        console.log($scope.positionsSought)
    };
});

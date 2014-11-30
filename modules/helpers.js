var helpers = {};
var Q = require('q');

helpers.queryWithPromises = function(connection, query) {
    var deferred = Q.defer();
    connection(function(err, conn) {
        conn.query(query, function(err, result){
            conn.release(); 
            if (err) {
                deferred.reject(new Error(error));
            } else {
                deferred.resolve(result);
            }
        });
    });
    return deferred.promise;
};

module.exports = helpers;

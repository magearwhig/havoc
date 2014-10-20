if (typeof process.argv[2] === "undefined" || ["app","deps"].indexOf(process.argv[2]) === -1) {
    console.warn("You need at least one argument:\n\ndeps = dependencies\napp = deploy applications");
    throw new Error("Missing argument");
}

if (typeof process.argv[3] === "undefined") {
    console.warn("You need a second argument with the ip of the instance.");
    throw new Error("Missing argument");
}

if(!process.env.HAVOC_PEM){
    console.warn(
        '\nPlease configure the location of the Havoc PEM:\n\n' +
        'export HAVOC_PEM=<HAVOC_PEM>\n'
    );
    throw new Error("Missing PEM configuration");
}

var Connection = require('ssh2'),
    Q = require('q'),
    config = {
        sampleHost: process.argv[3]
    },
    c = new Connection(),
    runCommand = function(command, step) {
        var deferred = Q.defer();
        c.exec(command, {pty: true}, function(err, stream) {
            if (err) {
                deferred.reject(new Error(err));
            }
            stream.on('data', function(data, extended) {
                console.log("STEP: " + step);
                console.log((extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
            });
            stream.on('end', function() {
                console.log("STEP: " + step);
                console.log('Stream :: EOF');
            });
            stream.on('close', function() {
                console.log("STEP: " + step);
                console.log('Stream :: close');
            });
            stream.on('exit', function(code, signal) {
                console.log("STEP: " + step);
                console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                deferred.resolve();
            });
        });
        return deferred.promise;
    },
    putFile = function (local, home, remote) {
        var deferred = Q.defer();
     
        c.sftp(function (err, sftp) {
            if (err) {
                deferred.reject(new Error(err));
            }
     
            sftp.fastPut(local, home, {}, function (err) {
                if (err) {
                    console.log("Could not deploy " + local);
                    deferred.reject(new Error(err));
                } else {
                    console.log("copied to " + home);
                    if (!remote) {
                        sftp.end();
                        deferred.resolve();
                    } else {
                        c.exec('sudo mv ' + home + ' ' + remote, {pty: true}, function(err, stream) {
                            if (err) {
                                deferred.reject(new Error(err));
                            }
                            stream.on('data', function(data, extended) {
                                console.log("STEP: putFile " + local);
                                console.log((extended === 'stderr' ? 'STDERR: ' : 'STDOUT: ') + data);
                            });
                            stream.on('end', function() {
                                console.log("STEP: putFile " + local);
                                console.log('Stream :: EOF');
                            });
                            stream.on('close', function() {
                                console.log("STEP: putFile " + local);
                                console.log('Stream :: close');
                            });
                            stream.on('exit', function(code, signal) {
                                console.log("STEP: putFile " + local);
                                console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
                                sftp.end();
                                deferred.resolve();
                            });
                        });
                    }
                }
            });
        });
        return deferred.promise;
    };

c.on('ready', function() {
    console.log('Connection :: ready');
    console.log(process.argv[2])

    // dependencies
    if (process.argv[2] === "deps") {
        function uptime() {
            return runCommand('uptime', 'uptime');
        }
        function nginx() {
            return runCommand('sudo yum install -y nginx', 'install nginx');
        }
        function devTools() {
            return runCommand('sudo yum -y groupinstall "Development Tools"', 'install dev tools');
        }
        function installNode() {
            return runCommand('cd /usr/src && sudo wget -o /dev/null http://nodejs.org/dist/v0.10.32/node-v0.10.32.tar.gz && sudo tar zxf node-v0.10.32.tar.gz && cd node-v0.10.32 && sudo ./configure && sudo make && sudo make install && cd .. && sudo rm -rf node-v0.10.32 && sudo rm -f node-v0.10.32.tar.gz', 'install node');
        }
        uptime()
            .then(function(){
                return nginx();
            })
            .then(function(){
                return devTools();
            })
            .then(function(){
                return installNode();
            })
            .then(function(){
                return putFile("conf/nginx", "/home/ec2-user/nginx", "/etc/init.d/nginx");
            })
            .then(function(){
                return runCommand('sudo chmod 755 /etc/init.d/nginx && sudo /sbin/chkconfig nginx on && sudo /etc/init.d/nginx start',"init nginx");
            })
            .then(function(){
                return putFile("conf/nginx.conf", "/home/ec2-user/nginx.conf", "/etc/nginx/nginx.conf");
            })
            .then(function(){
                return runCommand('sudo /etc/init.d/nginx restart',"nginx config");
            })
            .then(function(){
                c.end();
            });
    }

    // app deployment
    if (process.argv[2] === "app") {
        runCommand("cd /home/ec2-user/havoc && ./node_modules/forever/bin/forever stopall", "stop running instances")
            .then(function(){
                return runCommand("cd /home/ec2-user && rm -rf /home/ec2-user/havoc", "cleanup and unzip app");
            })
            .then(function(){
                return runCommand("git clone https://github.com/magearwhig/havoc.git", "clone repo")
            })
            .then(function(){
                return runCommand('cd /home/ec2-user && rm HAVOC_DB && rm HAVOC_DB_HOST && rm HAVOC_DB_PASSWORD && rm HAVOC_DB_USER', "delete files")
            })
            .then(function(){
                return runCommand('cd /home/ec2-user && echo "' + process.env.HAVOC_DB_HOST + '" > HAVOC_DB_HOST && echo "' + process.env.HAVOC_DB_USER + '" > HAVOC_DB_USER && echo "' + process.env.HAVOC_DB + '" > HAVOC_DB && echo "' + process.env.HAVOC_DB_PASSWORD + '" > HAVOC_DB_PASSWORD', "set files")
            })
/*
            .then(function(){
                return runCommand("cd /home/ec2-user/havoc && npm install && ./node_modules/forever/bin/forever start bin/www", "launch prod");
            })
*/
            .then(function(){
                c.end();
            });
    }
});
c.on('error', function(err) {
    console.log('Connection :: error :: ' + err);
});
c.on('end', function() {
    console.log('Connection :: end');
});
c.on('close', function(had_error) {
    console.log('Connection :: close');
});
c.connect({
    host: config.sampleHost,
    port: 22,
    username: 'ec2-user',
    privateKey: require('fs').readFileSync(process.env.HAVOC_PEM)
});

var child = require('child_process'),
    net = require('net'),
    dns = require('dns'),
    isWin = (/^win/.test(require('os').platform()));


function parseOutput(output,cb) {
  var lines = output.split('\n'),
      hops=[];
  var ipRe = /\b\d+\.\d+\.\d+\.\d+\b/
  var timingRe = /([\d\.]+)\s+ms\b/g;

  var results = []
  for (var i = 0; i < lines.length; i++) {
    var timingMatches = lines[i].match(timingRe)
    if (timingMatches) {
      ip = lines[i].match(ipRe)[0];
      var timings = []
      for (var j=0; j < timingMatches.length; j++) {
	timingMatches[j].match(timingRe)
	timings.push(parseFloat(RegExp.$1));
      }
      var record = {};
      record[ip] = timings;
      results.push(record);
    }
  }
  cb(null,results);
}

function trace(host,opts,cb) {
  if (arguments.length == 2) {
    cb = opts;
    opts = {};
  }
  dns.lookup(host, function (err) {
    if (err && net.isIP(host) === 0)
      cb('Invalid host');
    else {
      var cmd;
      if (isWin) {
	cmd = 'tracert -d';
	if (opts.maxHops) cmd += ' -h ' + opts.maxHops;
      } else {
	cmd = 'traceroute -q 1 -n';
	if (opts.maxHops) cmd += ' -m ' + opts.maxHops;
      }
      child.exec(cmd + ' ' + host, function (err,stdout,stderr) {
        if (err) {
	  cb(err)
	} else {
	  parseOutput(stdout,cb);
	}
      });
    }
  });
}

exports.trace = function (host,opts,cb) {
  host = host + '';
  trace(host.toUpperCase(),opts,cb);
}

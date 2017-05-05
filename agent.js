var https = require('https');

var options = {
  host: 'mooped.net',
  port: 443,
  path: '/local/its/index.php?module=game&action=agentaction&gameid=15&userid=3574&act=noAct%20noAct',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
};

var request = https.request(options, function(result) {
  var jsonResponseStr = '';
  result.on('data', function (data) {
    jsonResponseStr += data;
  });
  result.on('end', function() {
    var jsonResponse = JSON.parse(jsonResponseStr);
    // TODO: Сохраняем нужную нам информацию из JSON объекта
  });
});


request.on('error', function(e) {
  console.log('Problem with request: ' + e.message);
});


request.end();

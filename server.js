var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "restapi"  //här ska namnet på din databas stå
});

con.connect(function(err) { // anslut till databasen
  if (err) throw err;
  console.log("Connected");
});


var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 5000

app.use(express.json())

app.get('/', function(req, res) {
  //Metoden res.send() skickar ett response och försöker lista ut vad det innehåller. 
  //Du kan använda res.sendFile() istället om du vill skicka en HTML-sida
  res.send(`<html><body><h1>Dokumentation av det här APIet</h1></body></html>`);
});

/*
  Det här definerar en route /hello och vad som ska göras om den anropas med GET.

  Om någon anropar den med query-parametrar så hamnar de i req.query
*/
app.get('/hello', function(req, res) {
  //Metoden res.json() skickar ett svar som JSON.
  res.json({
    message: "Hello REST world!"
  });
});

http.listen(port, function() {
  console.log('Server started. Listening on localhost:' + port);
});
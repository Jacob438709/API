var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "restapi"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to database");
});

var express = require('express');
var app = express();
var http = require('http').Server(app);

var port = 5000;

app.use(express.json());

/*
  Dokumentation
*/
app.get('/', function(req, res) {
  res.send(`
    <html>
      <body>
        <h1>Dokumentation av API</h1>

        <h2>Routes</h2>

        <p>GET /users - Hämtar alla users</p>

        <p>GET /users/:id - Hämtar en user via id</p>

        <p>POST /users - Skapar en ny user</p>

        <h3>Exempel på POST JSON:</h3>

        <pre>
{
  "name": "Boaty McBoatface",
  "age": 25
}
        </pre>

      </body>
    </html>
  `);
});

/*
  GET alla users
*/
app.get('/users', function(req, res) {

  var sql = "SELECT * FROM users";

  con.query(sql, function(err, result) {
    if (err) throw err;

    res.json(result);
  });

});

/*
  GET user via ID
*/
app.get('/users/:id', function(req, res) {

  var id = req.params.id;

  var sql = "SELECT * FROM users WHERE id = ?";

  con.query(sql, [id], function(err, result) {
    if (err) throw err;

    // Om ingen user hittas
    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(result[0]);
  });

});

/*
  POST skapa ny user
*/
app.post('/users', function(req, res) {

  var name = req.body.name;
  var age = req.body.age;

  var sql = "INSERT INTO users (name, age) VALUES (?, ?)";

  con.query(sql, [name, age], function(err, result) {
    if (err) throw err;

    res.status(201).json({
      id: result.insertId,
      name: name,
      age: age
    });
  });

});

http.listen(port, function() {
  console.log('Server started on port ' + port);
});
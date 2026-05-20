var mysql = require('mysql');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var SECRET_KEY = "hemligt";

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

function authenticateToken(req, res, next) {

  var authHeader = req.headers['authorization'];

  var token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: "Token required"
    });
  }

  jwt.verify(token, SECRET_KEY, function(err, user) {

    if (err) {
      return res.status(403).json({
        message: "Invalid token"
      });
    }

    req.user = user;

    next();

  });

}

/*
  Dokumentation
*/
app.get('/', function(req, res) {
  res.send(`
    <html>
      <body>

        <h1>Dokumentation av det här APIet</h1>

        <h2>Routes</h2>

        <ul>

          <li>
            <b>GET /users</b> - Returnerar alla användare. Kräver JWT-token.
          </li>

          <li>
            <b>GET /users/{id}</b> - Returnerar en användare med angivet id. Kräver JWT-token.
          </li>

          <li>
            <b>POST /users</b> - Skapar en ny användare.
            Accepterar JSON på formatet som står nedan.
          </li>

          <li>
            <b>PUT /users/{id}</b> - Uppdaterar en användare. Kräver JWT-token.
          </li>

          <li>
            <b>POST /login</b> - Loggar in en användare.
          </li>
        </ul>
<h2>Authentication</h2>

<p>
Följande routes kräver JWT-token:
</p>

<ul>
  <li>GET /users</li>
  <li>GET /users/{id}</li>
  <li>PUT /users/{id}</li>
</ul>

<p>
Token skickas i Authorization-headern i formatet
Bearer {Token}
</p>

<h3>POST /users</h3>
<pre>
{
  "username": "...",
  "password": "...",
  "name": "...",
  "age": ...
}
</pre>
<h3>POST /login</h3>

<pre>
{
  "username": "...",
  "password": "..."
}
</pre>

<h3>PUT /users/{id}</h3>

<pre>
{
  "username": "...",
  "name": "...",
  "age": ...
}
</pre>

      </body>
    </html>
  `);
});

/*
  GET alla users
*/
app.get('/users', authenticateToken, function(req, res) {

  var sql = "SELECT id, username, name, age FROM users";

  con.query(sql, function(err, result) {
    if (err) {
      return res.status(500).json({
        message: "Database error"
      });
    }

    res.json(result);
  });

});

/*
  GET user via ID
*/
app.get('/users/:id', authenticateToken, function(req, res) {

  var id = req.params.id;

  var sql = `SELECT id, username, name, age
  FROM users
  WHERE id = ?
`;

  con.query(sql, [id], function(err, result) {
    if (err) {
      return res.status(500).json({
        message: "Database error"
      });
    }

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
app.post('/users', async function(req, res) {

  var username = req.body.username;
  var password = req.body.password;
  var name = req.body.name;
  var age = req.body.age;

  if (!username || !password || !name || !age) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  // Hasha lösenord
  var hashedPassword = await bcrypt.hash(password, 10);

  var sql = `
    INSERT INTO users (username, password, name, age)
    VALUES (?, ?, ?, ?)
  `;

  con.query(sql, [username, hashedPassword, name, age], function(err, result) {

    

    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          message: "Username already exists"
        });
      }
      return res.status(500).json({
        message: err.message
      });
    }

    res.status(201).json({
      id: result.insertId,
      username: username,
      name: name,
      age: age
    });

  });

});

app.put('/users/:id', authenticateToken, function(req, res) {

  var id = req.params.id;

  var username = req.body.username;
  var name = req.body.name;
  var age = req.body.age;

  var sql = `
    UPDATE users
    SET username = ?, name = ?, age = ?
    WHERE id = ?
  `;
  if (!username || !name || !age) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }
  con.query(sql, [username, name, age, id], function(err, result) {

    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      return res.status(500).json({
        message: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Hämta uppdaterad användare
    var sql2 = "SELECT id, username, name, age FROM users WHERE id = ?";

    con.query(sql2, [id], function(err, result2) {

      if (err) {
        return res.status(500).json({
          message: "Database error"
        });
      }

      res.status(200).json(result2[0]);

    });

  });

});

app.post('/login', function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password required"
    });
  }

  var sql = "SELECT * FROM users WHERE username = ?";

  con.query(sql, [username], async function(err, result) {

    if (err) {
      return res.status(500).json({
        message: "Database error"
      });
    }

    // Ingen användare hittades
    if (result.length === 0) {
      return res.status(401).json({
        message: "Wrong username or password"
      });
    }

    var user = result[0];

    // Jämför lösenord med hash
    var correctPassword = await bcrypt.compare(password, user.password);

    if (!correctPassword) {
      return res.status(401).json({
        message: "Wrong username or password"
      });
    }

    // Returnera INTE password
    var token = jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    SECRET_KEY,
    {
      expiresIn: '1h'
    }
  );

  res.status(200).json({
    message: "Login successful",
    token: token
  });

  });

});

http.listen(port, function() {
  console.log('Server started on port ' + port);
});
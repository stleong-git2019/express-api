var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql');

var crypto = require('crypto');

function randomValueHex (len) {
	return crypto.randomBytes(Math.ceil(len/2))
		.toString('hex') // convert to hexadecimal format
		.slice(0,len);   // return required number of characters
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
  
  
// default route
app.get('/', function (req, res) {
    return res.send({ error: true, message: 'hello' })
});
// connection configurations
var dbConn = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'localhost123$%',
    database: 'node_express'
});
  
// connect to database
dbConn.connect(); 
 
 
// Retrieve all users 
app.get('/users', function (req, res) {
    dbConn.query('SELECT id, name, email FROM users', function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'users list.' });
    });
});
 
 
// Retrieve user with name 
app.get('/user/:name', function (req, res) {
  
    let searchname = '%'+req.params.name+'%'
  
    dbConn.query('SELECT name FROM users WHERE name like ?', searchname, function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'users list.' });
    });
  
});


// Retrieve user with name 
app.get('/login/:email/:password', function (req, res) {
  
    let email = req.params.email
    let password = req.params.password
  
    dbConn.query(' SELECT name FROM users WHERE user_pwd = SHA(CONCAT("hidden",?,user_pwd_key)) AND email=?', [password,email], function (error, results, fields) {
        if (error) throw error;
		if (results.length==0) 
			return res.send({ error: 'Login Failed',message: 'Login Failed' });
		else
			return res.send({ error: false, message: 'Login Successful' });
    });
  
});

 
// Add a new user  
app.post('/user', function (req, res) {
  
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let password_key = randomValueHex(10);
  
    if (!name) {
        return res.status(400).send({ error:true, message: 'Please provide name' });
    }
    if (!email) {
        return res.status(400).send({ error:true, message: 'Please provide email' });
    }
    if (!password) {
        return res.status(400).send({ error:true, message: 'Please provide password' });
    }
    let passwordHash = 'SHA(CONCAT("hidden",'+dbConn.escape(password)+',"'+password_key+'"))';
  
  
    dbConn.query(' SELECT name FROM users WHERE  email=?', [email], function (error, results, fields) {
		if (results.length>0) 
			return res.send({ error: 'Duplicate Email',message: 'Duplicate Email' });
		else{
			dbConn.query("INSERT INTO users SET ? ,user_pwd="+passwordHash, { name: name ,email: email,user_pwd_key:password_key }, function (error, results, fields) {
				if (error) throw error;
				return res.send({ error: false, message: 'New user has been created successfully.' });
			});
		}
    });
	
});
 
 
// set static folder
//app.use(express.static('public'))


// set port
app.listen(3001, function () {
    console.log('Node app is running on port 3001');
});
 
module.exports = app;
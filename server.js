var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var request = require('request');
var winston = require('winston');

/////////////////////////////////////////
//
//	Configuration
//
/////////////////////////////////////////

/*	Port to run this server on	*/
var port = 9180;

/*	Add emails to Mailchimp List	*/
var useMailchimp = true;

/*	This is usually found at the end of your API key	*/
var mailchimpRegion = 'us15';

/* To create an API Key on mailchimp, click your name > account on the navbar,
then go to 'Extras' > 'API Keys'. Create an API Key. */
var mailchimpAPIKey = 'EXAMPLE_KEY-us15';

/*	The ID for the list on mailchimp. To find this, select 'Lists'
 from the navbar, select the list you want. On the list, go to
 'settings > List name and defaults'. Find the section called 'ListID'. */
var mailchimpListId = 'a1a1a1a111';

/////////////////////////////////////////

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

/*	route: /emailsub 	*/
router.post('/', function(req, res) {
	var email = req.body.email;
	var geoData = validateGeo(req.body.geo);
	if(geoData == null) {
		winston.log('info', 'No geo data given.');
	}
	
	if(!validateEmail(email)) {
		winston.log('info', 'Malformed email: ' + req.body.email);
		return;
	} else {
		winston.log('info', 'Received email: ' + req.body.email);
		addToDB(email, geoData);
		if(useMailchimp) {
			sendToMailchimp(email, geoData);
		}
	}
});

/*	Add signup to DB	*/
/*	Table Schema:
CREATE TABLE emails (email TEXT UNIQUE NOT NULL, "as" TEXT, city TEXT, country TEXT,
 countryCode TEXT, isp TEXT, lat TEXT, lon TEXT, org TEXT, "query" TEXT, region TEXT,
 regionName TEXT, timezone TEXT, zip TEXT);
*/
function addToDB(email, geo) {
	var db = new sqlite3.Database('db.db');
	var query = 'INSERT INTO emails VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
	var stmt = db.prepare(query);
	if(geo == null) {
		stmt.run(email, null, null, null, null, null, null, null, null,
			null, null, null, null, null, checkDBError);
		
	} else {
		stmt.run(email, geo.as, geo.city, geo.country, geo.countryCode,
			geo.isp, geo.lat, geo.lon, geo.org, geo.query, geo.region,
			geo.regionName, geo.timezone, geo.zip, checkDBError);
	}
	stmt.finalize();
	db.close();
}

function checkDBError(error) {
	if(error != null) {
		winston.log('error', 'Error adding to db: ' + error);
	} else {
		winston.log('info', 'Added to db.');
	}
}

/*	Send signup to Mailchimp	*/
function sendToMailchimp(email, geo) {
	var headers = {
	    'Authorization': 'apikey ' + mailchimpAPIKey,
		'Content-Type': 'application/json'
	}

	var body = {
		"email_address": email,
		"status": "subscribed",
		"merge_fields": {
			"FNAME": "",
			"LNAME": ""
		}
	}

	if(geo != null) {
		body.location = {
			"latitude": geo.lat,
			"longitude": geo.lon
		}
	}

	var options = {
	    url: 'https://' + mailchimpRegion + '.api.mailchimp.com/3.0/lists/' 
			+ mailchimpListId + '/members',
	    method: 'POST',
	    headers: headers,
	    body: JSON.stringify(body)
	}

	request(options, function (error, response, body) {
		if(!error && response.statusCode == 200) {
			winston.log('info', 'Sent to mailchimp.');
		} else {
			winston.log('error', 'Mailchimp error: ' + body);
		}
	});
}


/*	Validate email using REGEX	*/
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

/*	Verify whether GEO data was obtained	*/
function validateGeo(geo) {
	if(geo == null || geo == '') {						// No geodata
		return null;
	} else if(geo.status == null || geo.status == '') {	// No Status
		return null;
	} else if(geo.status == 'success') {	// success
		return geo;
	} else {
		return null;
	}
}

winston.add(winston.transports.File, { filename: 'debug.log' });
app.use('/emailsub', router);

app.listen(port);

console.log("Started Form Hook...");

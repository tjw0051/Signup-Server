# Signup Server
A simple, minimal email signup server with db storage, geo-data logging and mailchimp integration.

## Introduction

The example is quite basic and does not include features such as email-confirmation or authentication, but these can easily be added as required.

Its important to note that some countries and jurisdictions require a confirmation email to be sent to the user before storing their address, and agreement from them for you to store their location data.

## Quickstart

Clone the repository then run `npm install` in the root directory to install dependencies. Open `server.js` and change the configuration options at the top of the script.

## Example Website Code

The following is an example of how signup-server can be integrated into a website.

#### Signup Form

```html
<form class="hero-form" action="http://localhost:9180/emailsub" method="post" id="hero-form" name="email-form" target="_blank" novalidate>
	<input class="hero-form-input" type="email" name="email" placeholder="Email me about your cool new product!">
	<input type="submit" name="subscribe" value="Send" data-toggle="modal" data-target="#signup-modal">
</form>
```

#### Javascript 
*(requires jquery)*

```javascript
// Get GEO data using ip-api service
var geoData = '';
$.ajax({
  url: "http://ip-api.com/json",
  type: 'GET',
  success: function(json)
  {
    geoData = json;
  },
  error: function(err) {}
});

// User submitted email using form
$(function() {
	$('form.hero-form').submit(function(event) {
		event.preventDefault();
		var email = jQuery(".hero-form-input").val();
		sendEmail(email);
	});
});

// Send email to server
function sendEmail(email) {
	var data = {
		email: email,
		geo: geoData
	}

	$.ajax({
      type: 'post',
      url: 'http://localhost:9180/emailsub',
      dataType: "json",
      data: data
    }).done(function(data) {
		// 'your email has been saved'
    }).fail(function(data) {
		// 'we could not save your email'
    });
}
```

## Storage

Emails and geographical data are stored in the db.db sqlite3 database and on mailchimp, if activated in the configuration. The script also stores geo data of users, and integrates with mailchimps geo data. 


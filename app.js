
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var sms = require('./routes/sms');
var user = require('./routes/user');
var encryption = require('./modules/encryption');
var http = require('http');
var path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var config = require('./config.json');
var db = monk('10.0.0.5/smsalert');
var twilio = require('twilio');
var twilioRest = require('twilio')(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
var config = require('./config');
var app = express();
var XivelyClient = require('xively');
var x = new XivelyClient();
var util = require('util');
var moment = require('moment-timezone');
x.setKey('Qdl21X6zZ3rv1OwrRPndEpOramwh7vE7EbbiWkRxV7pYAVtN');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
app.get('/', routes.index);
app.get('/users', user.list);
*/
app.get('/helloworld', routes.helloworld);
/*
app.get('/userlist', routes.userlist(db));
app.get('/newuser', routes.newuser);
app.post('/adduser', routes.adduser(db));
*/
app.post('/trigger', function(req,res){
  console.log(req.body.body);
  if (req){
    try{
        var a=JSON.parse(req.body.body);
        console.log("Got Trigger:" + a);
        res.send(200);
        saveTrigger(a);
    }catch(e){
        //alert(e); //error in the above string(in this case,yes)!
        console.log(e);
        res.end(e.toString());

    }
  }
});

function saveTrigger(obj){
  var tid = obj.environment.id.toString();
  if(tid == "44129"){
	  var tds = obj.triggering_datastream.id.toString();
	  var current = obj.triggering_datastream.value.value;
	  var newnow = moment().tz("America/New_York").format('lll');
		var now = moment(newnow);
		var collection = db.get('locations');
		//var location = {;
		collection.findOne({'location':tds}, function(err,o){
	    if(err !=null ){
	    	//got an error
	      console.log("ERROR");
	      console.log(err);
	    }
	    if(o){
	    	//console.log("found o");
	    	//console.log(util.inspect(o));
	    	//got a location object that matches the trigger -- use the location object from the db
	    	o.current_value = current;
	    	o.last_update = newnow;
	    }else{
	    	//console.log("not o");
	    	//No location object in db from trigger -- lets create one
	    	var o = {
					location:tds,
					current_value:current,
					last_update:newnow
				};
	    }
			if(current >0){
				o.last_alert = newnow;
				if(tds == "15"){
					sms.sendAlerts(twilioRest,db,encryption);
				}

			}
			console.log(util.inspect(o));
				collection.update({'location':tds},o,{ upsert: true }, function (err, doc) {
					if (err) {
						// If it failed, return error
						console.log("Location update error")
						//res.send('There was a problem adding the information to the database.');
					}
					else {
						// If it worked, set the header so the address bar doesn't still say /adduser
						console.log("Location " + tds+ " updated success " + doc);
					}
				});
    });
	}
}

app.post('/sms', twilio.webhook({validate:process.env.NODE_ENV === 'production'}), sms.incomingSMS(twilio,twilioRest,db,encryption));
//validate:false
//validate:process.env.NODE_ENV === 'production'
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



var hw = encryption.encrypt("hello world")
console.log(hw);
console.log(encryption.decrypt(hw));

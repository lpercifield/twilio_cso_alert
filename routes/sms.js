/*
 * POST users listing.
 */
var util = require('util');
var isNumeric = require("isnumeric");
var moment = require('moment-timezone');
exports.incomingSMS = function(twilio,twilioRest,db,encryption) {
return function(req, res) {
	var twiml = new twilio.TwimlResponse();
	var message = req.body.Body.trim().toLowerCase();
	var messages = message.split(" ");
	console.log(util.inspect(req.body));
	var from = encryption.encrypt(req.body.From);
	console.log(messages[0]);
	console.log(isNumeric(messages[0]));
	if(isNumeric(messages[0])){
		console.log("number");
	}else{
		switch(messages[0]){
			case "status":
				console.log("status");
				getStatus(db,function(err,mes){
					if(err){

					}
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				break;
			case "signup":
				console.log("signup");
				signUp(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				break;
			case "join":
				console.log("join");
				signUp(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				break;
			case "register":
				console.log("register");
				signUp(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				break;
			case "update":
				console.log("update");
				twiml = getStatus(twiml,db);
				break;
			case "subscribe":
				console.log("subscribe");
				signUp(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				/*
twiml.message("Subscribe coming soon... use 'status' for CSO status");
				res.type('text/xml');
				res.send(twiml.toString());
*/
				break;
			case "leave":
				console.log("leave");
				removeUser(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				/*
twiml.message("Leave coming soon... use 'status' for CSO status");
				res.type('text/xml');
				res.send(twiml.toString());
*/

				break;
			case "unsubscribe":
				console.log("unsubscribe");
				removeUser(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});
				/*
twiml.message("Unsubscribe coming soon... use 'status' for CSO status");
				res.type('text/xml');
				res.send(twiml.toString());
*/

				break;
/*
			case "report":
				console.log("report");
				twiml.message("Report coming soon... use 'status' for CSO status");
				res.type('text/xml');
				res.send(twiml.toString());

				break;
*/
			case "stop":
				console.log("stop");

				removeUser(db,from,function(err,mes){
					if(mes){
						twiml.message(mes);
						res.type('text/xml');
						res.send(twiml.toString());
					}
				});

				break;
			case "help":
				console.log("help");
				getStatus(db,function(err,mes){
					if(err){
						console.log("somethings wrong in help")
						twiml.message("Yikes... somethings wrong...");
					}
					if(mes){
						//twiml.message(mes);
						twiml.message("For current CSO status send - status. Signup - to receive CSO alerts, Stop - cancel alerts, About - more info BTW: " + mes);
					}
					res.type('text/xml');
					res.send(twiml.toString());
				});

				break;
			case "about":
				console.log("about");
				getStatus(db,function(err,mes){
					if(err){
						twiml.message("Yikes... somethings wrong...");
					}
					if(mes){
						//twiml.message(mes);
						twiml.message("Combined Sewer Overflow (CSO) Alert system, created by Newtown Creek Alliance and DontFlush.me with funding from Deutsche Bank - more info: http://goo.gl/2UB0x BTW: " + mes);
					}
					res.type('text/xml');
					res.send(twiml.toString());
				});

				break;
			case "report":
				if(messages[1] != null){
					console.log("report");
					sendReport(db,twilioRest,req.body.From,req.body.Body.trim(),function(err,mes){
						if(err){
							twiml.message("Yikes... somethings wrong...");
						}
						if(mes){
							//twiml.message(mes);
							twiml.message(mes);
						}
						res.type('text/xml');
						res.send(twiml.toString());
					});
				}else{
					twiml.message("hmm... looks like the report was empty...");
					res.type('text/xml');
					res.send(twiml.toString());
				}

				break;
			default:
				console.log("default");
				twiml.message("Sorry, I didn't understand... use Status for CSO status or Help");
				res.type('text/xml');
				res.send(twiml.toString());
				break;
		}
	}
	}
}

exports.sendAlerts = function(twilioRest,db,encryption) {
	var collection = db.get('users');
	collection.find({},function(err, doc) {
  	if(doc != null) console.log("Doc");
		console.log(util.inspect(doc));
		for(var i =0;i<doc.length;i++){
			var user = doc[i];
			console.log(util.inspect(user));
			var newnow = moment().tz("America/New_York").format('lll');
			var now = moment(newnow);
			var timeSinceLastSMS = now.diff(user.last_message_sent,"seconds");
			console.log("Time since last message: "+timeSinceLastSMS);
			if(timeSinceLastSMS > 43200){ //43200 = 12 hrs
				//Send an SMS text message
				twilioRest.sendMessage({

			    to:encryption.decrypt(user.number), // Any number Twilio can deliver to
			    from: '+16465767448', // A number you bought from Twilio and can use for outbound communication
			    body: 'Watchout! CSOs may be overflowing right now! - reply help, about, or stop' // body of the SMS message

				}).then(function(responseData) { //this function is executed when a response is received from Twilio

	        // "responseData" is a JavaScript object containing data received from Twilio.
	        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
	        // http://www.twilio.com/docs/api/rest/sending-sms#example-1

	        //console.log(responseData.to); // outputs "+14506667788"
	        //console.log(responseData.body); // outputs "word to your mother."

	        var newnow = moment().tz("America/New_York").format('lll');
	        var toNum = encryption.encrypt(responseData.to);
	        //user.last_message_sent = newnow;
	        collection.findAndModify({'number':toNum},{$set: {last_message_sent: newnow}},{ upsert: true }, function (err, doc) {
						if(err){
							console.log("user save error")
							//callback(null,"Yikes... somethings wrong...")
						}
						if(doc){
							console.log("looks good")
							console.log(util.inspect(doc));
							//callback(null,"Sweet, you're all setup!")
						}else{
							console.log("Something else")
						}
					});
				});//end of sendmessage.then
			}else{
				console.log("TOO SOON");
			}
		}//end of loop
  });
	/*
collection.find().toArray(function(err,doc){
		if(err){
			console.log("ERROR: find users from send alert");
		}if(doc){
			console.log(util.inspect(doc));
		}else{
			console.log("No doc found in send alert")
		}
	});
*/
}

function sendReport(db,twilioRest,number,details,callback){
	var collection = db.get('reports');
	var newnow = moment().tz("America/New_York").format('lll');
	var report = {number:number,report_date:newnow,report_details:details.slice(7)};
	console.log(util.inspect(report));
	collection.update({'report_date':newnow},report,{ upsert: true }, function (err, doc) {
		if(err){
			console.log("user save error")
			callback(null,"Yikes... somethings wrong...")
		}
		if(doc){
			console.log("looks good")
			twilioRest.sendMessage({
			    to:'3478241085', // Any number Twilio can deliver to
			    from: '+16465767448', // A number you bought from Twilio and can use for outbound communication
			    body: 'CSO REPORT from: '+ number +' : '+details.slice(7) // body of the SMS message
			});
			twilioRest.sendMessage({
			    to:'7135016400', // Any number Twilio can deliver to
			    from: '+16465767448', // A number you bought from Twilio and can use for outbound communication
			    body: 'CSO REPORT from: '+ number +' : '+details.slice(7) // body of the SMS message
			});/*
, function(err, text) {
				console.log('You sent: '+ text.body);
				console.log('Current status of this text message is: '+ text.status);
		});
*/
			callback(null,"Your report has been submitted, we might be in contact if we need more details - your info is keep private and confidential")
		}else{
			console.log("Something else")
		}
	});
}

function getStatus(db,callback){
	var collection = db.get('locations');
	collection.findOne({"location":"15"},function(err,o){
		if(err){
			console.log("get status error")
			callback(null,"Yikes... somethings wrong...")
		}
		if(o){
			if(o.current_value >0){
				console.log("Status: watch out!")
				callback(null,"Watchout! CSOs may be overflowing! Last Overflow: " + o.last_alert);
			}else{
				console.log("Status: GTG!")
				callback(null,"Looks like you're good! Last Overflow: " + o.last_alert);
			}
		}else{
			console.log("Status: Yikes! not available");
			callback(null,"Yikes... somethings wrong...")
		}
	});
}

function signUp(db,from,callback){
	var collection = db.get('users');
	//var encodedFrom = encryption.encrypt(from);
	collection.findOne({'number':from},function(err,doc){
		if(err){
			//user error
			console.log("user find error")
			callback(null,"Yikes... somethings wrong...")
		}
		if(doc){
			//found a user already
			console.log("already reg")
			callback(null,"Looks like you're already registered. Send stop to unsubscribe");
		}else{
			//new user
			var newnow = moment().tz("America/New_York").format('lll');
			var user = {number:from,join_date:newnow,last_message_sent:newnow};
			console.log(util.inspect(user));
			collection.update({'number':from},user,{ upsert: true }, function (err, doc) {
				if(err){
					console.log("user save error")
					callback(null,"Yikes... somethings wrong...")
				}
				if(doc){
					console.log("looks good")
					callback(null,"Welcome - Combined Sewer Overflow (CSO) Alert system, created by Newtown Creek Alliance and DontFlush.me with funding from Deutsche Bank - more info: http://goo.gl/2UB0x reply help for details or stop to cancel")
				}else{
					console.log("Something else")
				}
			});
		}
	})
}

function removeUser(db,from,callback){
	var collection = db.get('users');
	collection.remove({'number':from},function(err,doc){
		if(err){
			//user error
			console.log("user find error")
			callback(null,"Yikes... somethings wrong...")
		}
		if(doc){
			//found a user already
			console.log("removed: " + doc);
			callback(null,"You are removed!");
		}else{
			console.log("number not found");
			callback(null,"Hmm... We couldn't find you, looks like you weren't registered");
		}
	});
}

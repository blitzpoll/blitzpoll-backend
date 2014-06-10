var express = require('express'),
	app = express(),
	fs = require('fs'),
	routes = require('./routes'),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	url = require('url'),
	mongoose = require('mongoose'),
	dbHost = process.env.DBHOST || 'mongodb://127.0.0.1/questions',
	net = require('net'),
	lineReader = require('line-reader');

server.listen(5000);

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.get('/', routes.index);

mongoose.connect(dbHost, function(err){
	if(err){
		console.log(err);
	} else {
		console.log('connected');
	}
});

var questionSchema = {
	question: String,
	answers: Array,
	time: Number,
	created: { type: Date, default: Date.now } 
}
var Question = mongoose.model('Question', questionSchema);

var client = net.connect({ path: '/tmp/hacksports.sock' }, function() {
    console.log('got connection!');
});



io.sockets.on('connection', function(socket){
	console.log('socket connection');
	var query = Question.find({}, function(err,docs){
		if(err) throw err
		socket.emit('load old questions', docs);
	});

	socket.on('new question', function(data){
		var newQuestion = new Question({
			question: data.question,
			answers: data.answers,
			time: data.time
		});
		newQuestion.save(function(err){
			if(err) throw err;
			else
				io.sockets.emit('new question added',{data:newQuestion})
				client.write(JSON.stringify(newQuestion));
		});
	});
});


app.get('/teamInfo', function(req,res){
	var reqFile = 'world-cup/2014--brazil/squads/'+req.query.country+'.txt';
	var html = '<div><ul class="teamlist">'
	lineReader.eachLine(reqFile, function(line, last) {
	  //console.log(line);
	  var frag = '<li class="teamlist-item">'+line+'</li>';
	  html += frag;

	  if(last){

	    res.send(html+'</ul></div>');
	  }
	});

	// lineReader.open(reqFile, function(reader) {
	//   if (reader.hasNextLine()) {
	//     reader.nextLine(function(line) {
	//       console.log('a'+line);
	//     });
	//   }
	// });

	// var html = '<ul>';
	
	// var lr = new LineByLineReader(reqFile);

	// lr.on('line', function (line) {
	//    //console.log(line);
	//    var frag = '<li>'+line+'</li>';
	//   // console.log(frag);
	//    html += frag;
	// });
	// console.log(html);
	// res.send(html+'</ul>');

	// fs.readFile(reqFile, function(err,data){
	// 	if(err) throw err
	// 	res.send(data);
	// })
	//res.send('wheed')
});

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
	lineReader = require('line-reader'),
	http = require('http'),
	busboy = require('connect-busboy');;

server.listen(5000);

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.get('/', routes.index);

app.use(busboy());


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
});

app.post('/file-upload', function(req,res,next){
	var query = url.parse(req.url,true).query.q;
	console.log(query);
	var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        fstream = fs.createWriteStream(__dirname + '/files/' + query +'.png');
        file.pipe(fstream);
        fstream.on('close', function () {
            res.redirect('back');
        });
    });
});

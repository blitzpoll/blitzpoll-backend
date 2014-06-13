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
	busboy = require('connect-busboy');

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
		
	  // var name = line.substr(0, line.indexOf('##'));
	  // var nr = name.match(nrPatt);
	  // var pos = name.match(posPatt);
	  // var club = line.substr(line.indexOf('##'));
	  // //console.log(pos);
	  // html += '<div>'+'<span>'+nr+'</span>'+'<span>'+name+'</span>'+'<span>'+club+'</span>'+'</div>';

	  var frag = '<li class="teamlist-item">'+line+'</li>';
	  html += frag;
	  // var frag = parseTeamInfo(line);
	  // html += frag;
	  if(last){

	    res.send(html+'</ul></div>');
	  }
	});
});

parseTeamInfo = function(line){
	/*regexp*/
	var html = '';
	if(line == ''){
		html = '<li></li>'
	} else {
		var nrPatt = /\((.*?)\)/;
		var posPatt = /[A-Z0-9]{2,}/;
		var numGamesPatt =  /\d+/;
		var clubPatt = /\,(.*)/;
		var namePatt = /[A-Z]{2,}(.*)/;

		var nr_pos_name = line.substr(0, line.indexOf('##'));
		var games_club = line.substr(line.indexOf('##'));

		var nr = nr_pos_name.match(nrPatt)[0];

		var pos = nr_pos_name.match(posPatt)[0];
		var name = nr_pos_name.match(namePatt)[1].substr(1);
		var games = games_club.match(numGamesPatt)[0];
		var club = games_club.match(clubPatt)[1].substr(1);
		// console.log(nr);
		// console.log(pos);
		// console.log(name);
		// console.log(games);
		// console.log(club);
		html = '<li><div class="ti-nr">'+nr+'</div><div class="ti-pos">'+pos+'</div><div class="ti-name">'+name+'</div><div class="ti-games">'+games+'</div><div class="ti-club">'+club+'</div></li>'
		
	}

	return html;
}

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

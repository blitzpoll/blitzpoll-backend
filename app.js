var express = require('express'),
	app = express(),
	fs = require('fs'),
	routes = require('./routes'),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	url = require('url'),
	//mongoose = require('mongoose'),
	//dbHost = process.env.DBHOST || 'mongodb://127.0.0.1/questions',
	net = require('net'),
	lineReader = require('line-reader'),
	http = require('http'),
	busboy = require('connect-busboy'),
	dnode = require('dnode');

server.listen(5000);
currentGameId = null;

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.get('/', routes.index);

app.use(busboy());

var d = dnode();
d.on('remote', function (remote) {

	io.sockets.on('connection', function(socket){
		console.log('socket connection');

		socket.on('new game', function(data){

			
			remote.setCurrentGame(data.home, data.away, function(err, id) {
				console.log('set current game ' + id);
				currentGameId = id;
				//newGame[id] = id;
				var newGame = {
					id: id,
					home: data.home,
					away: data.away
				};
				socket.emit('new game initiated',newGame);
		    });    
		});

		socket.on('new question', function(data){
			var newQuestion= {
				text: data.question,
				answers: data.answers,
				minute: 40,
				timeout: data.time
			};

			remote.addQuestion(newQuestion, function(err){
				if(err)
					console.log(err)
				else
					socket.emit('new question added', newQuestion);
			});
		});


		app.post('/file-upload', function(req,res,next){
			fs.mkdir(__dirname + '/files/'+ currentGameId, function(err){
				if(err)
					console.log(err);
			});
			var query = url.parse(req.url,true).query.q;

			var fstream;
		    req.pipe(req.busboy);

		    req.busboy.on('file', function (fieldname, file, filename) {
		        console.log("Uploading: " + filename); 
		        fstream = fs.createWriteStream(__dirname + '/files/'+currentGameId+'/' + query +'.png');
		        file.pipe(fstream);
		        fstream.on('close', function () {
		        	//res.redirect('back');
		        	console.log('######')
		        	console.log(currentGameId)
		        	console.log(query)
		        	if(query == 'home'){
		        		var path = '/files/'+currentGameId+'/home.png';
		        		console.log(path)
		           		socket.emit('file saved',{path:path,which:'home'});
		        	} else {
		        		var path = '/files/'+currentGameId+'/away.png';
		           		socket.emit('file saved',{path:path,which:'away'});
		        	}
		        	
		        });
		    });
		});


	});
});





var c = net.connect('/tmp/hacksports.sock');
c.pipe(d).pipe(c);

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

// app.post('/file-upload', function(req,res,next){
// 	fs.mkdir(__dirname + '/files/'+ currentGameId, function(err){
// 		if(err)
// 			console.log(err);
// 	});
// 	var query = url.parse(req.url,true).query.q;

// 	var fstream;
//     req.pipe(req.busboy);

//     req.busboy.on('file', function (fieldname, file, filename) {
//         console.log("Uploading: " + filename); 
//         fstream = fs.createWriteStream(__dirname + '/files/'+currentGameId+'/' + query +'.png');
//         file.pipe(fstream);
//         fstream.on('close', function () {
//         	res.redirect('back');
//            // socket.emit('file home saved',{path:'dominik'})
//         });
//     });
// });

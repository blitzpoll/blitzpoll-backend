exports.index = function(req, res){
  res.render('index', { title: 'Journalist Backend'});
};

exports.teamInfo = function(req, res){
	console.log('here');
  res.send(200, 'ok');
};
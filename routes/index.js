exports.index = function(req, res){
  res.render('index',{ title: 'Journalist Backend', currentGameId: currentGameId});
};

exports.teamInfo = function(req, res){
  res.send(200, 'ok');
};
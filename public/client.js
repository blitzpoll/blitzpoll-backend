jQuery(function($){
	var socket = io.connect();
	var question = $('#question');
  var answers = $('#possible-answers');
  var time = $('#time-frame');
  var countdownindicator =$('#countdown-indicator');
  var readyindicator = $('#ready-indicator');
  var activequestion = $('#active-question');
  countdownindicator.hide();
  readyindicator.show();

  var countdown = $('#countdown');
  var count = 0;
  var counter;

  var resetForm = function(){
    question.val('');
    answers.val('');
    time.val('');
  };

  var clearTimer = function(){
    clearInterval(counter);
  }
  var activateTimer = function(data){
    readyindicator.hide();
    countdownindicator.show();
    //offset to compensate latency:
    var offset = 1;
    count = parseInt(data.timeout)+ offset;
    qText = data.text;
    activequestion.text(qText);
    counter=setInterval(timer, 1000);
    function timer(){
      count = count -1;
      countdown.text(count);
       if (count <= 0)
        {
           clearTimer();
           countdownindicator.hide();
           readyindicator.show();
           return;
        }
    }
  };


  $('#sendnewgame').click(function(e){
    e.preventDefault();
    var home = $('#home-name').val();
    var away = $('#away-name').val();
    var game = {
      home: home,
      away:away
    }
    socket.emit('new game', game);
  });



 $('#newquestion-form').submit(function(e){
    e.preventDefault();
    clearTimer();
    var newQuestion = {
      question: question.val(),
      answers: answers.val().split(','),
      time: time.val()
    }
    socket.emit('new question', newQuestion);  	
  });

 socket.on('new question added', function(data){
    //var timeout = parseInt(data.timeout);
    $('#q-container').append('<div>'+data.text+'</div>');
    console.log(data);
    activateTimer(data);
    resetForm();
  });

 socket.on('load old questions', function(docs){
    for(var i= docs.length-1; i>0; i--){
      displayQuestions(docs[i]);
    }

 });

 socket.on('new game initiated', function(game){

  $('#newgamesetup').html('');

  $('#newgamesetup').html('<div>'+game.id+'</div><div><span>'+game.home+'</span>'+' : '+'<span>'+game.away+'</span></div>');

 });


 socket.on('file saved', function(data){
  debugger;
  if(data.which == 'home'){
    $('#homeformcontainer').html('');
    var html = '<img src="'+data.path+'"/>'
    $('#homeformcontainer').html(html);
  } else {
    $('#awayformcontainer').html('');
    var html = '<img src="'+data.path+'"/>'
    $('#awayformcontainer').html(html);
  }


 });

 function displayQuestions(data){
   $('#q-container').append('<div>'+data.question+'</div>');
 };

 $('.info-team').click(function(e){
  e.preventDefault();
  var country = $(this).children('a').attr('href');
  $.get('/teamInfo', {country:country}, function(data){
    $('#team-container').html('<div>'+data+'</div>');
  });
 });

});
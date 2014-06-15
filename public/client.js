jQuery(function($){
	var socket = io.connect();
  var question = $('#question');
	var gameMinute = $('#game-minute');
  var answers = $('#possible-answers');
  var time = $('#time-frame');
  var countdownindicator =$('#countdown-indicator');
  var readyindicator = $('#ready-indicator');
  var activequestion = $('#active-question');
  countdownindicator.hide();
  readyindicator.show();
  $("#question-main").hide();
  var countdown = $('#countdown');
  var count = 0;
  var counter;

  var resetForm = function(){
    question.val('');
    answers.val('');
    gameMinute.val('');
    time.val('');
  };

  $('.choose-home').click(function(e){
    e.preventDefault();
    var team = {
        home : $(this).children(":first-child").attr('href')
    } 
    socket.emit('set home client', team);
  }); 

  $('.choose-away').click(function(e){
    e.preventDefault();
    var team = {
        away : $(this).children(":first-child").attr('href')
    } 
    socket.emit('set away client', team);
  }); 

  socket.on('set home server', function(data){
    $('#home-team-container').html('');
    $('#home-team-container').html(data);

  });

  socket.on('set away server', function(data){
    $('#away-team-container').html('');
    $('#away-team-container').html(data);
  });

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

   $('.team-info').click(function(e){

    e.preventDefault();
    var country = $(this).children('a').attr('href');
    $.get('/teamInfo', {country:country}, function(data){
      $('#team-container').html('<div>'+data+'</div>');
    });
   });


  $('#sendnewgame').click(function(e){
    
    e.preventDefault();
    var home = $('#home-team-set > span').attr('data-url');
    var away = $('#away-team-set > span').attr('data-url');

    //validate
    if(home === undefined || away === undefined){
      alert('Team missing.');
      return false;
    }
    if( home === away){
      alert('Home and away are the same');
      return false;
    }

    var game = {
      home: home,
      away:away
    }
    socket.emit('new game', game);
  });



 $('#newquestion-form').submit(function(e){
    e.preventDefault();
    clearTimer();

    //validate
    var tmpTime = time.val();
    var answersLength = answers.val().split(',').length;
    
    if(answersLength <= 1){
      alert('Invalid Number of answers (must be bigger than one)');
      return false;
    }
    if( isNaN(parseFloat(tmpTime)) ){
      alert('Time value not numeric');
      return false;
    }

    var newQuestion = {
      question: question.val(),
      answers: answers.val().split(','),
      minute: gameMinute.val(),
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


 socket.on('new game initiated', function(game){
  if(game.id.length){
    var homeNameOnly = game.home.substr(3);
    var awayNameOnly = game.away.substr(3);
    var homeTeamInfo = '<a class="team-info" href='+game.home+'>'+homeNameOnly.charAt(0).toUpperCase() + homeNameOnly.slice(1);
    var awayTeamInfo = '<a class="team-info" href='+game.away+'>'+awayNameOnly.charAt(0).toUpperCase() + awayNameOnly.slice(1);
    $('#sendnewgame').hide();
    $("#question-main").show();

    $('#team-info-home').append(homeTeamInfo);
    $('#team-info-away').append(awayTeamInfo);
    
  }
 });




 function displayQuestions(data){
   $('#q-container').append('<div>'+data.question+'</div>');
 };


});
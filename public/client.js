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
    count = parseInt(data.time)+ offset;
    qText = data.question;
    activequestion.text(qText);
    counter=setInterval(timer, 1000);
    function timer(){
      count = count -1;
      countdown.text(count);
       if (count <= 0)
        {
           clearTimer();
           //countdown.text('');
           countdownindicator.hide();
           readyindicator.show();
           return;
        }
    }
    //countdown.text(data.time);
  };

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
    $('#q-container').append('<div>'+data.data.question+'</div>');
    activateTimer(data.data);
    resetForm();
  });

 socket.on('load old questions', function(docs){
    for(var i= docs.length-1; i>0; i--){
      displayQuestions(docs[i]);
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
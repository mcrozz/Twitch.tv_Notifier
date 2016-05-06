/*
* Based on http://codepen.io/hendrysadrak/pen/yNKZWO
* @PROD: need to be optimized for 60fps
*/
$(document).on('mouseover', '.ripple', function(e) {
	var $rippleElement = $('<span class="ripple-effect" />'),
    $buttonElement = $(this),
    btnOffset = $buttonElement.offset(),
    xPos = e.pageX - btnOffset.left,
    yPos = e.pageY - btnOffset.top,
    size = parseInt(Math.max($buttonElement.height(), $buttonElement.width())),
    animateSize = parseInt(Math.max($buttonElement.width(), $buttonElement.height()) * Math.PI);
  $rippleElement
    .css({
      top: yPos,
      left: xPos,
      width: size,
      height: size,
			color: 'white',
      backgroundColor: $buttonElement.attr('color'),
			opacity: 0
    })
    .appendTo($buttonElement)
		.data('created', new Date().getTime())
		.delay(250)
    .animate({
      width: animateSize,
      height: animateSize,
      opacity: 0.5
    }, { duration: 500, easing: 'swing' });
});
$(document).on('mouseout', '.ripple', function(e) {
	var $rippleElement = $('.ripple-effect', this);
	if (new Date().getTime() - $rippleElement.data('created') <= 250)
		$rippleElement.remove();
	else
		$rippleElement.animate({
			width: 10,
			height: 10,
			opacity: 0
		}, 350, function() {
			$(this).remove();
		});
});


$(function(){
  if (settings.isSet('ui', 'size')) {
    /*
    // @TODO
    4:3
    (W*H/7)*[4|3]
    W=(W*H*4)/7
    7W=4WH

    */
    var vh = settings.get('ui', 'size')*screen.availHeight;
    var vw = vh

    $('html').css({
      width: vh+'px',
      height: vw+'px'
    });
  } else {
    // 
  }

  $('html').css({
    width: '450px',
    height: '350px'
  });
});
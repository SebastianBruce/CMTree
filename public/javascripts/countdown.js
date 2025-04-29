document.addEventListener("DOMContentLoaded", function () {
  const countdownEl = document.getElementById("countdown-timer");
  const eventDateStr = countdownEl?.getAttribute("data-event-date");
  if (!countdownEl || !eventDateStr) return;

  const countDownDate = new Date(eventDateStr).getTime();

  var prevDays1 = -1,
    prevDays2 = -1,
    prevDays3 = -1,
    prevHours1 = -1,
    prevHours2 = -1,
    prevMinutes1 = -1,
    prevMinutes2 = -1,
    prevSeconds1 = -1,
    prevSeconds2 = -1;

  function updateCountdown() {
    const now = new Date().getTime();
    let distance = countDownDate - now;
    if (distance < 0) distance = 0;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysStr = days.toString().padStart(3, '0');
    const days1 = parseInt(daysStr.charAt(0));
    const days2 = parseInt(daysStr.charAt(1));
    const days3 = parseInt(daysStr.charAt(2));

    const days1El = document.querySelector('.days-1');
    if (days >= 100) {
      if (days1El) days1El.style.display = 'block';
    } else {
      if (days1El) days1El.style.display = 'none';
    }

    if (days1 !== prevDays1) {
      animateFigure($('.days-1'), days1);
      prevDays1 = days1;
    }
    if (days2 !== prevDays2) {
      animateFigure($('.days-2'), days2);
      prevDays2 = days2;
    }
    if (days3 !== prevDays3) {
      animateFigure($('.days-3'), days3);
      prevDays3 = days3;
    }

    const hours1 = Math.floor(hours / 10);
    const hours2 = hours % 10;
    if (hours1 !== prevHours1) {
      animateFigure($('.hours-1'), hours1);
      prevHours1 = hours1;
    }
    if (hours2 !== prevHours2) {
      animateFigure($('.hours-2'), hours2);
      prevHours2 = hours2;
    }

    const minutes1 = Math.floor(minutes / 10);
    const minutes2 = minutes % 10;
    if (minutes1 !== prevMinutes1) {
      animateFigure($('.min-1'), minutes1);
      prevMinutes1 = minutes1;
    }
    if (minutes2 !== prevMinutes2) {
      animateFigure($('.min-2'), minutes2);
      prevMinutes2 = minutes2;
    }

    const seconds1 = Math.floor(seconds / 10);
    const seconds2 = seconds % 10;
    if (seconds1 !== prevSeconds1) {
      animateFigure($('.sec-1'), seconds1);
      prevSeconds1 = seconds1;
    }
    if (seconds2 !== prevSeconds2) {
      animateFigure($('.sec-2'), seconds2);
      prevSeconds2 = seconds2;
    }

    if (distance <= 0) {
      distance = 0;
    
      // Add flashing effect
      const countdownContainer = document.getElementById("countdown-timer");
      countdownContainer.classList.add("flash");
    
      // Stop the timer
      clearInterval(timerInterval);
    
      // Make sure all numbers stay zero
      animateFigure($('.days-1'), 0);
      animateFigure($('.days-2'), 0);
      animateFigure($('.days-3'), 0);
      animateFigure($('.hours-1'), 0);
      animateFigure($('.hours-2'), 0);
      animateFigure($('.min-1'), 0);
      animateFigure($('.min-2'), 0);
      animateFigure($('.sec-1'), 0);
      animateFigure($('.sec-2'), 0);
    
      return; // Stop further processing
    }    
  }

  function animateFigure($el, value) {
    var $top = $el.find('.top'),
      $bottom = $el.find('.bottom'),
      $back_top = $el.find('.top-back'),
      $back_bottom = $el.find('.bottom-back');

    $back_top.find('span').html(value);
    $back_bottom.find('span').html(value);

    TweenMax.to($top, 0.8, {
      rotationX: '-180deg',
      transformPerspective: 300,
      ease: Quart.easeOut,
      onComplete: function () {
        $top.html(value);
        $bottom.html(value);
        TweenMax.set($top, { rotationX: 0 });
      }
    });

    TweenMax.to($back_top, 0.8, {
      rotationX: 0,
      transformPerspective: 300,
      ease: Quart.easeOut,
      clearProps: 'all'
    });
  }

  // Do one render before showing the timer
  updateCountdown();

  // Then run every second
  const timerInterval = setInterval(updateCountdown, 1000);
});

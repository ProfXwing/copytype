export function addNotification(type: string, text: string) {
  const notif = $(`
    <div class="notif">
        <div class="icon"></div>
        <div class="message"><div class="title"></div></div>
    </div>
    `)
  $("#notificationCenter .history").prepend(notif)

  if (type == 'good') {
    $("#notificationCenter .history .notif").addClass('good');
    $("#notificationCenter .history .notif .icon").html(`<i class="fas fa-fw fa-check"></i>`);
    $("#notificationCenter .history .notif .message .title").text('Success');

  } else if (type == 'notice') {
    $("#notificationCenter .history .notif").addClass('notice');
    $("#notificationCenter .history .notif .icon").html(`<i class="fas fa-fw fa-exclamation"></i>`);
    $("#notificationCenter .history .notif .message .title").text('Notice');

  }

  notif.find(".message").append(text);

  notif.click(function () {
    $(this).remove();
  });

  setTimeout((notif) => {
    notif.addClass('slow-hide');
  }, 4000, notif);
  setTimeout((notif) => {
    notif.remove();
  }, 4250, notif);
}
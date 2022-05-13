// thanks bro

import {settings} from "./typing.js";

console.log('caps loaded')
let capsState = false;

function show() {
    if ($("#capsWarning").hasClass("hidden")) {
      $("#capsWarning").removeClass("hidden");
    }
  }
  
  function hide() {
    if (!$("#capsWarning").hasClass("hidden")) {
      $("#capsWarning").addClass("hidden");
    }
  }
  
$(document).keydown(function (event) {
    if (
      event?.originalEvent?.getModifierState &&
      event?.originalEvent?.getModifierState("CapsLock")
    ) {
      capsState = true;
    } else {
      capsState = false;
    }
  
    try {
      if (settings.capsLockWarning && capsState) {
        show();
      } else {
        hide();
      }
    } catch {}
  });
  
  $(document).keyup(function (event) {
    if (
      event?.originalEvent?.getModifierState &&
      event?.originalEvent?.getModifierState("CapsLock")
    ) {
      capsState = true;
    } else {
      capsState = false;
    }
  
    try {
      if (settings.capsLockWarning && capsState) {
        show();
      } else {
        hide();
      }
    } catch {}
  });
  
let setAtLeastOnce = false;
let tabVol = 1.0;

let lastScrollPosition = 0;
document.addEventListener("scroll", (event) => {
  if (Math.abs(window.scrollY - lastScrollPosition) >= 500) {
    lastScrollPosition = window.scrollY;
    if (!setAtLeastOnce) getVolume();
    setVolume(tabVol);
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.extension == "volumeControl") {
    if (message.action == "setVolume") setVolume(message.value, (message.value > 0 && tabVol == 0) || (message.value == 0));
    else if (message.action = "getVolume") {
      getVolume();
      return Promise.resolve({ response: tabVol });
    };
  }
});

function setVolume(value, updateMutedFlag = false) {
  tabVol = parseFloat(value).toFixed(2);
  elements = document.querySelectorAll("video, audio, [id=movie_player], [id^=player-volume-slider], [class^=ytp-volume-panel]");
  elements.forEach((element) => {
    if (element.tagName == "VIDEO" || element.tagName == "AUDIO") {
      element.volume = tabVol;
      // Unmute / mute only elements that are not paused - I don't want to unmute something somewhere in the page that shouldn't be playing
      if (updateMutedFlag && !element.paused) {
        // Set muted if volume is set to 0
        if (tabVol == 0) element.muted = true;
        else element.muted = false;
      }
      // Try catch everywhere because not every website allows adding listeners to video / audio elements?
      // Attach listeners when document content changed to update new video and audio controls
      // YouTube shorts - assign new video previously set tab volume
      try { element.addEventListener("loadedmetadata", (event) => { event.target.volume = tabVol; }); }
      catch { }
      // Instagram stories - previous video ended and new is loaded
      try { element.addEventListener("emptied", (event) => { setVolume(tabVol) }); }
      catch { }
    } else if (element.id == "movie_player") {
      // YouTube stream
      try {
        // Something about extension not running in the same enviroment as YouTube API and not working,
        // the solution is to inject javascript into the page and run it there
        var script = document.createElement("script");
        var code = `document.getElementById("movie_player").setVolume(` + (tabVol * 100) + `);`;
        script.appendChild(document.createTextNode(code));
        document.querySelector("head").appendChild(script);
        script.remove();
        // It would be a lot easier if code below would work
        // element.setVolume(tabVol);
        // if (updateMutedFlag && element.getPlayerState() == 1) { // getPlayerState() == 1 playing, == 2 paused ??
        //   // Set muted if volume is set to 0
        //   if (tabVol == 0) element.mute();
        //   else element.unMute();
        // }
      } catch { }
    } else {
      // Try to set value of volume sliders
      try {
        element.setAttribute("aria-valuenow", Math.floor(tabVol * 100));
        element.setAttribute("aria-valuetext", Math.floor(tabVol * 100) + "%");
        element.setAttribute("value", tabVol);
        element.value = tabVol;
      }
      catch { }
    }
  });
  setAtLeastOnce = true;
}

function getVolume() {
  elements = document.querySelectorAll("video, audio");
  if (elements.length > 0) {
    if (!setAtLeastOnce) {
      // Assume that first element on website has correct volume
      tabVol = parseFloat(elements[0].volume).toFixed(2);
    }
    elements.forEach((element) => {
      // Try catch everywhere because not every website allows adding listeners to video / audio elements?
      // Standard volume change event on player - set volume remembered by extension from volume change on player
      try { element.addEventListener("volumechange", (event) => { tabVol = parseFloat(event.target.volume).toFixed(2); }); }
      catch { } // Do nothing?
    });

    setVolume(tabVol);
  }
  setAtLeastOnce = true;
}
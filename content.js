let setAtLeastOnce = false;
let tabVol = 1.0;
let mediaElements = new Array();

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
  tabVol = parseFloat(value).toFixed(3);
  elements = document.querySelectorAll("video, audio, [id=movie_player], [id^=player-volume-slider], [class^=ytp-volume-panel]");
  elements.forEach((element) => {
    if (element.tagName.toLowerCase() == "video" || element.tagName.toLowerCase() == "audio") {
      element.volume = tabVol;
      // Unmute / mute only elements that are not paused - I don't want to unmute something somewhere in the page that shouldn't be playing
      if (updateMutedFlag && !element.paused) {
        // Set muted if volume is set to 0
        if (tabVol == 0) element.muted = true;
        else element.muted = false;
      }
      addEventlisteners(element);
    } else if (element.id.toLowerCase() == "movie_player") {
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
      tabVol = parseFloat(elements[0].volume).toFixed(3);
    }

    setVolume(tabVol);
  }
  setAtLeastOnce = true;
}

function loadedMetaDataEvent(event) {
  event.target.volume = tabVol;
}

function emptiedEvent(event) {
  // If the media element is empited it no longer is being used? Clear previous events. Just to be sure clear everything.
  while (mediaElements.length > 0) {
    let element = mediaElements.pop();
    try { element.removeEventListener("empited", emptiedEvent); }
    catch { }
    try { element.removeEventListener("loadedmetadata", loadedMetaDataEvent); }
    catch { }
    try { element.removeEventListener("loadedmetadata", volumeChangeEvent); }
    catch { }
  }

  // Set media elements volume - if emptied element was replaced with some other
  setVolume(tabVol);
}

function volumeChangeEvent(event) {
  tabVol = parseFloat(event.target.volume).toFixed(3);
}

function addEventlisteners(element) {
  if (!mediaElements.includes(element)) {
    mediaElements.push(element);
    // Try catch everywhere because not every website allows adding listeners to video / audio elements?
    // Attach listeners when document content changed to update new video and audio controls
    try { element.addEventListener("volumechange", volumeChangeEvent); }
    catch { }
    // YouTube shorts - assign new video previously set tab volume
    try { element.addEventListener("loadedmetadata", loadedMetaDataEvent); }
    catch { }
    // Instagram stories - previous video ended and new is loaded
    try { element.addEventListener("emptied", emptiedEvent); }
    catch { }
  }
}
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
    if (message.action == "setVolume") setVolume(message.value);
    else if (message.action = "getVolume") {
      getVolume();
      return Promise.resolve({ response: tabVol });
    };
  }
});

function setVolume(value) {
  tabVol = value;
  elements = document.querySelectorAll("video, audio");
  elements.forEach((element) => {
    element.volume = value;
    // Try catch everywhere because not every website allows adding listeners to video / audio elements?
    // Attach listeners when document content changed to update new video and audio controls
    // Youtube shorts - assign new video previously set tab volume
    try { element.addEventListener("loadedmetadata", (event) => { event.target.volume = tabVol; }); }
    catch { } // Do nothing?
    // Instagram stories - previous video ended and new is loaded
    try { element.addEventListener("emptied", (event) => { setVolume(tabVol) }); }
    catch { } // Do nothing?
  });
  setAtLeastOnce = true;
}

function getVolume() {
  elements = document.querySelectorAll("video, audio");
  if (elements.length > 0) {
    if (!setAtLeastOnce) tabVol = elements[0].volume; // Assume that first element on website has correct volume
    elements.forEach((element) => {
      // Try catch everywhere because not every website allows adding listeners to video / audio elements?
      // Standard volume change event on player - set volume remembered by extension from volume change on player
      try { element.addEventListener.addEventListener("volumechange", (event) => { tabVol = event.target.volume; }); }
      catch { } // Do nothing?
    });

    setVolume(tabVol);
  }
  setAtLeastOnce = true;
}
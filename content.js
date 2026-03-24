let setAtLeastOnce = false;
let tabVol = 1.0;
let mediaElements = new Array();
let extensionOpenedAtLeastOnce = false;

browser.runtime.onMessage.addListener((message) => {
  if (message.extension == "volumeControl") {
    switch (message.action) {
      case "setVolume":
        setVolume(message.value, (message.value > 0 && tabVol == 0) || (message.value == 0));
        break;

      case "getVolume":
        extensionOpenedAtLeastOnce = true;
        getVolume();
        return Promise.resolve({ response: tabVol });
    }
  }
});

const observer = new MutationObserver(mutations => {
  // Clear previously added volume change events
  while (mediaElements.length > 0) {
    const element = mediaElements.pop();
    element.removeEventListener("volumechange", updateTabVolumeFromElement);
  }

  // Add new events
  attachVolumeChangeEvents();
  setVolume(tabVol);
});
observer.observe(document.body, { childList: true, subtree: true });

function attachVolumeChangeEvents() {
  document.querySelectorAll("video, audio").forEach(element => {
    element.addEventListener("volumechange", updateTabVolumeFromElement);
    mediaElements.push(element);
  });
}

function updateTabVolumeFromElement(event) {
  if (!event.target.muted && event.eventPhase != 0) {
    setVolume(event.target.volume, false, event.target);
  }
}

function setVolume(value, updateMutedFlag = false, skipElement = undefined) {
  tabVol = parseFloat(value).toFixed(3);

  // Skip volume changes if the extension was not opened at least once
  if (!extensionOpenedAtLeastOnce) { return; }
  mediaElements.forEach(element => {
    if (element == skipElement) {
      // Skip
    } else {
      element.volume = tabVol;
      if (updateMutedFlag && !element.paused) {
        if (tabVol == 0) { element.muted = true; }
        else { element.muted = false; }
      }
      element.dispatchEvent(new Event("volumechange"));
    }
  });

  setAtLeastOnce = true;
}

function getVolume() {
  if (mediaElements.length == 0) {
    attachVolumeChangeEvents();
  }

  if (mediaElements.length > 0) {
    if (!setAtLeastOnce) {
      // Assume that first element on the website has correct volume
      tabVol = parseFloat(mediaElements[0].volume).toFixed(3);
    }

    setVolume(tabVol);
  }
}

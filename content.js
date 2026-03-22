let setAtLeastOnce = false;
let tabVol = 1.0;
let mediaElements = new Array();

browser.runtime.onMessage.addListener((message) => {
  if (message.extension == "volumeControl") {
    switch (message.action) {
      case "setVolume":
        setVolume(message.value, (message.value > 0 && tabVol == 0) || (message.value == 0));
        break;

      case "getVolume":
        getVolume();
        return Promise.resolve({ response: tabVol });
    }
  }
});

function attachVolumeChangeEvents() {
  // Clear previously added volume change events
  while (mediaElements.length > 0) {
    const element = mediaElements.pop();
    element.removeEventListener("volumechange", updateTabVolumeFromElement);
  }

  // Add new events
  document.querySelectorAll("video, audio").forEach(element => {
    element.addEventListener("volumechange", updateTabVolumeFromElement);
  });
}

function updateTabVolumeFromElement(event) {
  if (!event.target.muted && event.eventPhase != 0) {
    tabVol = parseFloat(event.target.volume).toFixed(3);
  }
}

attachVolumeChangeEvents();

const observer = new MutationObserver(() => {
  attachVolumeChangeEvents();
  if (!setAtLeastOnce) getVolume();
  setVolume(tabVol);
});
observer.observe(document.body, { childList: true, subtree: true });

function setVolume(value, updateMutedFlag = false) {
  tabVol = parseFloat(value).toFixed(3);

  elements = document.querySelectorAll("video, audio");
  elements.forEach(element => {
    element.volume = tabVol;
    if (updateMutedFlag && !element.paused) {
      if (tabVol == 0) { element.muted = true; }
      else { element.muted = false; }
    }
    element.dispatchEvent(new Event("volumechange"));
  });

  setAtLeastOnce = true;
}

function getVolume() {
  elements = document.querySelectorAll("video, audio");
  if (elements.length > 0) {
    if (!setAtLeastOnce) {
      // Assume that first element on the website has correct volume
      tabVol = parseFloat(elements[0].volume).toFixed(3);
    }

    setVolume(tabVol);
  }
  setAtLeastOnce = true;
}

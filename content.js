let tabVol = 1.0;

let lastScrollPosition = 0;
document.addEventListener("scroll", (event) => {
  if (Math.abs(window.scrollY - lastScrollPosition) >= 500) {
    lastScrollPosition = window.scrollY;
    setVolume(tabVol);
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.extension == "volumeControl") {
    if (message.action == "setVolume") setVolume(message.value);
    else if (message.action = "getVolume") {
      elements = document.querySelectorAll("video, audio");
      if (elements.length == 1) tabVol = elements[0].volume;
      return Promise.resolve({ response: tabVol });
    };
  }
});

function setVolume(value) {
  tabVol = value;
  elements = document.querySelectorAll("video, audio");
  for (element of elements) { element.volume = value; }
}
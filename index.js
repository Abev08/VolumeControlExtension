let currentTabID = -1;
let volumeSlider = document.getElementById("volumeSlider");
volumeSlider.oninput = setVolume;
let volumeText = document.getElementById("volumeText");
getVolume();

function getVolume() {
  browser.tabs.query({ active: true, currentWindow: true }, async (tab) => {
    if (tab.length != 1) return;
    currentTabID = tab[0].id;

    let val = 1.0;
    await browser.tabs
      .sendMessage(currentTabID, {
        extension: "volumeControl",
        action: "getVolume"
      })
      .then((resp) => { val = resp.response; })
      .catch((error) => { console.log(error); });

    if (volumeSlider != null) volumeSlider.value = val * 100.0;
    updateVolumeText();
  });
}

function setVolume() {
  if (volumeSlider == null) return;
  if (currentTabID == -1) return;

  browser.tabs
    .sendMessage(currentTabID, {
      extension: "volumeControl",
      action: "setVolume",
      value: (volumeSlider.value / 100.0).toFixed(2)
    })
    .catch((error) => { console.log(error); });

  updateVolumeText();
}

function updateVolumeText() {
  if (volumeText == null) return;
  if (volumeSlider == null) return;

  volumeText.textContent = "Volume: " + volumeSlider.value + "%";
}
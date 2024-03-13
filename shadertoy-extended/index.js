(function () {
  function getEntries() {
    const text = Array.from(document.querySelectorAll(".CodeMirror-code pre"))
      .map((el) => el.textContent)
      .join("\n");

    const regexPattern = /\/\/iChannel(\d+):([^:]+):(.+)/g;
    const matches = Array.from(text.matchAll(regexPattern));

    return matches.map((match) => {
      return {
        channel: Number(match[1]),
        type: match[2],
        src: match[3],
      };
    });
  }

  function onClick() {
    // todo: configure params based on type ?
    const entries = getEntries();

    entries.forEach((entry) => {
      gShaderToy.SetTexture(entry.channel, {
        mSrc: entry.src,
        mType: entry.type,
        mID: 1,
        mSampler: {
          filter: "mipmap",
          wrap: "repeat",
          vflip: "true",
          srgb: "false",
          internal: "byte",
        },
      });
    });
  }

  function createButton() {
    const id = "x-myUpload";
    const existingButton = document.getElementById(id);
    if (existingButton !== null) {
      existingButton.remove();
    }

    const button = document.createElement("div");
    button.className = "uiButton";
    button.id = id;
    button.style.backgroundImage =
      "url(https://www.shadertoy.com/img/themes/classic/options.png)";

    button.addEventListener("click", () => onClick());
    const parent = document.querySelector(".playerBar").children[2];
    parent.prepend(button);
  }

  createButton();
})();

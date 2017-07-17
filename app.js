const { decode } = require("../../");

const elm = document.getElementById("drop");

elm.addEventListener("dragenter", e => e.preventDefault());
elm.addEventListener("dragover", e => e.preventDefault());
elm.addEventListener("drop", e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  const reader = new FileReader();
  reader.addEventListener("load", e => {
    const arrayBuffer = e.target.result;
    const { width, height, ifdEntries } = decode(arrayBuffer);
    const IFDs = JSON.stringify({ width, height, ifdEntries }, null, 2);
    elm.innerHTML = `
      <pre>${IFDs}</pre>
    `;
  });
  reader.readAsArrayBuffer(file);
});

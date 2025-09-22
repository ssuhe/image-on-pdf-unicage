const PADDING = 5;

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  loading(true);
  return originalFetch(...args).finally(() => {
    loading(false);
  });
};

const getPdfList = async () => {
  const method = "POST";
  let body = "";

  const form = document.getElementById("FORM");
  if (form) body = new URLSearchParams(new FormData(form));

  try {
    const response = await fetch("./AJAX/get-pdf-list.ajax", {
      method,
      body,
    });

    const totalSize = response.headers.get("totalSize");
    document.getElementById("totalSize").textContent = totalSize;
    const visibleSize = response.headers.get("visibleSize");
    document.getElementById("visibleSize").textContent = visibleSize;

    const totalPage = response.headers.get("totalPage");
    const page = parseInt(response.headers.get("page"));
    const pageEl = document.getElementById("page");
    pageEl.innerHTML = "";
    for (let i = 1; i <= parseInt(totalPage); i++) {
      const option = pageEl.appendChild(document.createElement("option"));
      option.value = i;
      option.textContent = i;
      if (i === page) option.selected = true;
    }

    const result = await response.text();

    if (response.status !== 200) throw new Error(result);

    const resultEl = document.getElementById("RESULT");
    resultEl.innerHTML = result;
  } catch (error) {
    console.warn(error);
  }
};

const uploadFile = async (event) => {
  const files = event.target.files;
  const body = new FormData();
  const params = new URLSearchParams();
  params.append("count", files.length);
  for (let i = 0; i < files.length; i++) {
    body.append(`file-${i}`, files[i]);
    params.append(`filename-${i}`, files[i].name);
  }
  body.append("params", params);

  try {
    const response = await fetch("./AJAX/upload-pdf.ajax", {
      method: "POST",
      body,
    });
    const result = await response.text();
    if (response.status !== 201) throw new Error(result);
    alert(result);

    getPdfList();
  } catch (error) {
    console.warn(error);
    alert(error.message);
  }
};

const handleUploadButton = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.click();
  input.onchange = uploadFile;
};

const deletePdf = async (id) => {
  try {
    const response = await fetch("./AJAX/delete-pdf.ajax?id=" + id, {
      method: "POST",
      body: "",
    });
    const result = await response.text();

    if (response.status !== 204) throw new Error(result);
    alert("削除しました。");
    getPdfList();
  } catch (error) {
    console.warn(error.message);
    alert(error.message);
  }
};

const getPdfPage = async (page) => {
  const section = document.querySelector(".iframe-container");

  section.classList.remove("hidden");

  const id = section.id;
  const iframe = section.querySelector("iframe");
  const canvas = section.querySelector("#pdf-widgets");

  const pageEl = document.getElementById("pdf-page");
  pageEl.textContent = page;

  try {
    const response = await fetch(
      "./AJAX/get-pdf-page.ajax?id=" + id + "&page=" + page
    );
    const result = await response.text();

    if (response.status !== 200) throw new Error(result);

    const { pageCount, height, width, widgets, uploadedDate } =
      JSON.parse(result);

    const pagesEl = document.getElementById("pdf-pages");
    pagesEl.textContent = pageCount;

    iframe.src = `./INPUT/${uploadedDate}/PDF_LIST/${id}/PDF.${page}#toolbar=0`;
    iframe.style.height = height + "px";
    iframe.style.width = width + "px";

    canvas.style.height = height + "px";
    canvas.style.width = width + "px";

    const svgContent = await fetch(
      `./INPUT/${uploadedDate}/PDF_LIST/${id}/WIDGETS/page-${page}/SVG?v=${new Date().getTime()}`
    )
      .then(async (res) => {
        if (res.status !== 200) return "";
        else return res.text();
      })
      .catch(() => "");

    const svg = document.getElementById("pdf-widgets");
    if (svg) {
      if (svgContent) svg.innerHTML = svgContent;
      else svg.innerHTML = "";
    }
  } catch (error) {
    console.warn(error);
    alert(error.message);
  }
};

const editPdf = (event) => {
  const row = event.target.closest("tr");
  const { id } = row.dataset;
  const section = document.querySelector(".iframe-container");
  section.id = id;
  getPdfPage(1);
};

const pdfPrevPage = () => {
  const section = document.querySelector(".iframe-container");
  const iframe = section.querySelector("iframe");
  const src = new URL(iframe.src);
  const pageNo = parseInt(src.pathname.split("/").pop().split(".").pop());
  if (pageNo - 1 <= 0) return;
  getPdfPage(pageNo - 1);
};

const pdfNextPage = () => {
  const pages = parseInt(document.getElementById("pdf-pages").textContent);
  const section = document.querySelector(".iframe-container");
  const iframe = section.querySelector("iframe");
  const src = new URL(iframe.src);
  const pageNo = parseInt(src.pathname.split("/").pop().split(".").pop());
  if (pageNo + 1 > pages) return;
  getPdfPage(pageNo + 1);
};

function getRgba(hex, alpha) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const a = alpha;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getHex(rgb) {
  // Match rgba(r,g,b,a)
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const hex =
    "#" +
    [r, g, b]
      .map((x) => {
        const h = x.toString(16);
        return h.length === 1 ? "0" + h : h;
      })
      .join("");
  match[3], 10;

  return hex;
}

function getHexAlpha(rgba) {
  // Match rgba(r,g,b,a)
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d\.]+)?\)/);
  if (!match) return;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

  // Convert RGB back to hex
  const hex =
    "#" +
    [r, g, b]
      .map((x) => {
        const h = x.toString(16);
        return h.length === 1 ? "0" + h : h;
      })
      .join("");

  return [hex, a];
}

const setProperties = (event) => {
  const selectedShape = document.querySelector(".selected");
  if (!selectedShape) return alert("OBJECTを選択してください。");

  switch (event.target.id) {
    case "border-width":
      selectedShape.setAttribute("stroke-width", event.target.value);
      break;
    case "border-color":
      selectedShape.setAttribute("stroke", event.target.value);
      break;
    case "background-color":
      selectedShape.setAttribute(
        "fill",
        getRgba(
          event.target.value,
          event.target.closest("#properties").querySelector("#opacity").value
        )
      );
      break;
    case "opacity":
      selectedShape.setAttribute(
        "fill",
        getRgba(
          event.target.closest("#properties").querySelector("#background-color")
            .value,
          event.target.value
        )
      );
      break;
    case "shape-text":
      selectedShape.textContent = event.target.value;
    default:
      break;
  }
};

const initDrawing = () => {
  const svg = document.getElementById("pdf-widgets");
  let currentTool = "rect";
  let drawing = false;
  let startX, startY;
  let shape;
  let selectedShape = null;
  let dragging = false;
  let offsetX, offsetY;

  window.setTool = (tool) => {
    currentTool = tool;
    window.clearSelection();
  };

  window.clearSelection = () => {
    if (selectedShape) {
      selectedShape.classList.remove("selected");
      selectedShape = null;
    }
  };

  window.deleteShape = () => {
    if (selectedShape) {
      svg.removeChild(selectedShape);
      selectedShape = null;
    }
  };

  // Create shapes
  svg.addEventListener("mousedown", (e) => {
    if (e.target.tagName !== "svg") {
      // Selecting existing shape
      clearSelection();
      selectedShape = e.target;
      selectedShape.classList.add("selected");

      const borderColor = getHex(selectedShape.style.stroke || "rgba(0,0,0ß)");
      const [bgColor, alpha] = getHexAlpha(
        selectedShape.style.fill || "rgba(0,0,0,0)"
      );
      const borderWidth = selectedShape.style.strokeWidth || 2;

      document.getElementById("border-width").value = borderWidth;
      document.getElementById("background-color").value = bgColor;
      document.getElementById("opacity").value = alpha;
      document.getElementById("border-color").value = borderColor;

      if (selectedShape.localName === "text") {
        document.getElementById("shape-text").value = selectedShape.textContent.trim();
      }



      // Start dragging
      dragging = true;
      const rect = svg.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      return;
    }

    clearSelection();
    drawing = true;
    const rect = svg.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    switch (currentTool) {
      case "rect":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        break;
      case "ellipse":
        shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "ellipse"
        );
        shape.setAttribute("cx", startX);
        shape.setAttribute("cy", startY);
        shape.setAttribute("rx", 0);
        shape.setAttribute("ry", 0);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        break;
      case "line":
      case "arrow":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
        shape.setAttribute("x1", startX);
        shape.setAttribute("y1", startY);
        shape.setAttribute("x2", startX);
        shape.setAttribute("y2", startY);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        break;
      case "text":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "text");
        shape.setAttribute("x", e.clientX - rect.x);
        shape.setAttribute("y", e.clientY - rect.y);
        shape.textContent = "Edit Text";
        break;
    }
    svg.appendChild(shape);
  });

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawing) {
      switch (currentTool) {
        case "rect":
          shape.setAttribute("x", Math.min(x, startX));
          shape.setAttribute("y", Math.min(y, startY));
          shape.setAttribute("width", Math.abs(x - startX));
          shape.setAttribute("height", Math.abs(y - startY));
          break;

        case "ellipse":
          shape.setAttribute("cx", (x + startX) / 2);
          shape.setAttribute("cy", (y + startY) / 2);
          shape.setAttribute("rx", Math.abs(x - startX) / 2);
          shape.setAttribute("ry", Math.abs(y - startY) / 2);
          break;

        case "line":
        case "arrow":
          shape.setAttribute("x2", x);
          shape.setAttribute("y2", y);
          break;
      }
    } else if (dragging && selectedShape) {
      const dx = x - offsetX;
      const dy = y - offsetY;
      offsetX = x;
      offsetY = y;

      switch (selectedShape.tagName) {
        case "rect":
          case "text":
          selectedShape.setAttribute(
            "x",
            +selectedShape.getAttribute("x") + dx
          );
          selectedShape.setAttribute(
            "y",
            +selectedShape.getAttribute("y") + dy
          );
          break;
        case "ellipse":
          selectedShape.setAttribute(
            "cx",
            +selectedShape.getAttribute("cx") + dx
          );
          selectedShape.setAttribute(
            "cy",
            +selectedShape.getAttribute("cy") + dy
          );
          break;
        case "line":
          selectedShape.setAttribute(
            "x1",
            +selectedShape.getAttribute("x1") + dx
          );
          selectedShape.setAttribute(
            "y1",
            +selectedShape.getAttribute("y1") + dy
          );
          selectedShape.setAttribute(
            "x2",
            +selectedShape.getAttribute("x2") + dx
          );
          selectedShape.setAttribute(
            "y2",
            +selectedShape.getAttribute("y2") + dy
          );
          break;
      }
    }
  });

  svg.addEventListener("mouseup", () => {
    drawing = false;
    dragging = false;
  });

  // Delete key shortcut
  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      window.deleteShape();
    }
  });
};

const loading = (visible = true) => {
  const e = document.querySelector(".loading");
  e.classList.toggle("visible", visible);
};

const convertSvg2Png = (svgEl) =>
  new Promise((resolve, reject) => {
    const scale = 4;

    try {
      const svgContainer = svgEl.closest("svg");

      const width = parseFloat(svgContainer.style.width.replace("px", ""));
      const height = parseFloat(svgContainer.style.height.replace("px", ""));

      const svgElClone = svgEl.cloneNode(true);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.height = `${height}px`;
      svg.style.width = `${width}px`;
      svg.append(svgElClone);

      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

      const img = new Image();
      img.src = svg64;

      img
        .decode()
        .then(() => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          // canvas.width = width*scale;
          // canvas.height = height*scale;

          const ctx = canvas.getContext("2d");
          // ctx.setTransform(scale, 0, 0, scale, 0, 0); // scale everything
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Blob creation failed"));
          }, "image/png");
        })
        .catch((err) => {
          reject(err);
        });
    } catch (error) {
      reject(`catch:`, error);
    }
  });

const saveObjectOnThePage = async () => {
  try {
    const formdata = new FormData();
    const params = new URLSearchParams();

    const svgContainer = document.getElementById("pdf-widgets");

    // 保存した要素を再表示するとき使う
    const svgContent = svgContainer.innerHTML;
    formdata.append("svgContent", svgContent);

    // PDFをダウンロードするとき使う画像とポジーションを保存。
    let index = 0;

    const widgets = [...svgContainer.querySelectorAll("svg > *:not(defs)")];

    await Promise.all(
      widgets.map((e) => {
        let x, y;
        const name = e.localName;
        const bouding = e.getBoundingClientRect();
        const { width, height } = bouding;
        if (width === 0 && height === 0) return;
        switch (name) {
          case "rect":
            x = parseFloat(e.getAttribute("x"));
            y = parseFloat(e.getAttribute("y"));
            break;
          case "ellipse":
            x =
              parseFloat(e.getAttribute("cx")) -
              parseFloat(e.getAttribute("rx"));
            y =
              parseFloat(e.getAttribute("cy")) -
              parseFloat(e.getAttribute("ry"));
            break;
          case "line":
            x = Math.min(e.getAttribute("x1"), e.getAttribute("x2"));
            y = Math.min(e.getAttribute("y1"), e.getAttribute("y2"));
            break;
          default:
            break;
        }

        return convertSvg2Png(e).then((blob) => {
          // test
          const img = document.createElement("img");
          img.src = URL.createObjectURL(blob);
          formdata.append(`widget-${index}`, blob, `widget-${index}.png`);
          index++;
        });
      })
    );

    params.append(
      "id",
      parseInt(document.querySelector(".iframe-container").id)
    );
    params.append(
      "page",
      parseInt(document.getElementById("pdf-page").textContent)
    );
    params.append("count", index);
    formdata.append("params", params);

    const response = await fetch("./AJAX/save-widgets-on-page.ajax", {
      method: "POST",
      body: formdata,
    });

    const result = await response.text();

    if (response.status !== 201) throw new Error(result);

    alert(result);
  } catch (error) {
    console.warn(error);
  }
};

const saveObjectOnAllPage = () => {};
const downloadPdf = async () => {
  const section = document.querySelector(".iframe-container");
  const id = section.id;

  try {
    const response = await fetch("./AJAX/download-pdf.ajax?id=" + id);

    if (response.status !== 200) {
      const error = await response.text();
      throw new Error(error);
    } else {
      const result = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(result);
      a.download = document.querySelector(`tr[data-id="${id}"] a`).textContent;
      a.click();
    }
  } catch (error) {
    alert(error.message);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getPdfList();
  initDrawing();
});

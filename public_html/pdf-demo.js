const PADDING = 10;
const markerRegex = new RegExp(/\(#(.*)\)/);

const defs = `<defs>
  <!-- Circle marker -->
  <marker
    id="circle"
    markerWidth="8"
    markerHeight="8"
    refX="5"
    refY="5"
  >
    <circle cx="5" cy="5" r="3" fill="black" />
  </marker>

  <!-- Arrow marker -->
  <marker
    id="arrow"
    markerWidth="10"
    markerHeight="10"
    refX="5"
    refY="5"
    orient="auto"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
  </marker>
</defs>`;

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
      else svg.innerHTML = defs.trim();
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
  const match = rgb.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/);
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
    case "text-color":
      selectedShape.setAttribute("fill", event.target.value);
      break;
    case "border-width":
      selectedShape.setAttribute("stroke-width", event.target.value);
      break;
    case "border-color":
      console.log(event.target.value);
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
      if (selectedShape.localName !== "text")
        return alert("ラインOBJECTを選択してください。");
      selectedShape.textContent = event.target.value;
      break;
    case "border-radius":
      if (selectedShape.localName !== "rect")
        return alert("ラインOBJECTを選択してください。");
      selectedShape.setAttribute("rx", event.target.value);
      selectedShape.setAttribute("ry", event.target.value);
      break;
    case "marker-1":
      if (selectedShape.localName !== "line")
        return alert("ラインOBJECTを選択してください。");
      selectedShape.setAttribute("marker-start", `url(#${event.target.value})`);
      break;
    case "marker-2":
      if (selectedShape.localName !== "line")
        return alert("ラインOBJECTを選択してください。");
      selectedShape.setAttribute("marker-end", `url(#${event.target.value})`);
      break;
    default:
      break;
  }
};

const initDrawing = () => {
  const svg = document.getElementById("pdf-widgets");
  let currentTool = "";
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

      if (selectedShape.hasAttribute("data-group-id")) {
        const groupid = selectedShape.getAttribute("data-group-id");
        svg
          .querySelectorAll(`[data-group-id="${groupid}"]`)
          .forEach((groupElement) => {
            if (groupElement !== selectedShape) {
              svg.removeChild(groupElement);
            }
          });
      }

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

      const borderColor = selectedShape.getAttribute("stroke") || "#000000";

      if (selectedShape.localName !== "text") {
        const [bgColor, alpha] = getHexAlpha(
          selectedShape.getAttribute("fill") !== "none"
            ? selectedShape.getAttribute("fill")
            : "rgba(0,0,0,0)"
        );

        if (alpha !== undefined) {
          document.getElementById("opacity").value = alpha;
        }
        if (bgColor !== undefined) {
          document.getElementById("background-color").value = bgColor;
        }
      } else {
        const textColor = selectedShape.getAttribute("fill") || "#000000";
        if (textColor) {
          document.getElementById("text-color").value = textColor;
        }
      }
      const borderWidth = selectedShape.getAttribute("stroke-width") || 2;
      if (borderColor !== undefined) {
        document.getElementById("border-color").value = borderColor;
      }

      if (borderWidth !== undefined) {
        document.getElementById("border-width").value = borderWidth;
      }

      if (selectedShape.localName === "text") {
        document.getElementById("shape-text").value =
          selectedShape.textContent.trim();
      }

      if (selectedShape.localName === "rect") {
        document.getElementById("border-radius").value =
          selectedShape.getAttribute("rx") || "0";
      }

      if (selectedShape.localName === "line") {
        const markerStart = selectedShape.getAttribute("marker-start") || "";
        const markerStartValid = String(markerStart).match(markerRegex);
        if (markerStartValid) {
          document.getElementById("marker-1").value = `${
            markerStartValid[1] || ""
          }`;
        }

        const markerEnd = selectedShape.getAttribute("marker-end") || "";
        const markerEndValid = String(markerEnd).match(markerRegex);
        if (markerEndValid) {
          document.getElementById("marker-2").value = `${
            markerEndValid[1] || ""
          }`;
        }
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

    if (currentTool === "") return;

    switch (currentTool) {
      case "01":
      case "rect":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "#000000");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        svg.appendChild(shape);
        break;
      case "02":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("rx", 10);
        shape.setAttribute("ry", 10);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "#000000");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        svg.appendChild(shape);
        break;
      case "04":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "#000000");
        shape.setAttribute("fill", "rgba(255,255,255,1)");
        shape.setAttribute("stroke-width", "0");
        svg.appendChild(shape);
        break;
      case "07":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "#000000");
        shape.setAttribute("fill", "rgba(237, 227, 132, 0.5)");
        shape.setAttribute("stroke-width", "0");
        svg.appendChild(shape);
        break;
      case "03":
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
        svg.appendChild(shape);
        break;
      case "05":
      case "line":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
        shape.setAttribute("x1", startX);
        shape.setAttribute("y1", startY);
        shape.setAttribute("x2", startX);
        shape.setAttribute("y2", startY);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        svg.appendChild(shape);
        break;
      case "06":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
        shape.setAttribute("x1", startX);
        shape.setAttribute("y1", startY);
        shape.setAttribute("x2", startX);
        shape.setAttribute("y2", startY);
        shape.setAttribute("marker-end", "url(#arrow)");
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        svg.appendChild(shape);
        break;
      case "08":
      case "text":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "text");
        shape.setAttribute("x", e.clientX - rect.x);
        shape.setAttribute("y", e.clientY - rect.y);
        shape.textContent = "Edit Text";
        svg.appendChild(shape);
        break;
      case "10":
        shape = document.createElementNS("http://www.w3.org/2000/svg", "text");
        shape.setAttribute("x", e.clientX - rect.x);
        shape.setAttribute("y", e.clientY - rect.y);
        shape.textContent = "様";
        svg.appendChild(shape);
        break;
      case "14":
      case "hanko":
        const hankoPath = location.href.split("/");
        const hankoFullPath =
          [...hankoPath.slice(0, hankoPath.length - 1)].join("/") +
          "/hanko.png";
        shape = document.createElementNS("http://www.w3.org/2000/svg", "image");
        shape.setAttribute("href", hankoFullPath);
        shape.setAttribute("x", e.clientX - rect.x - 25);
        shape.setAttribute("y", e.clientY - rect.y - 25);
        shape.setAttribute("width", 50);
        shape.setAttribute("height", 50);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        shape.setAttribute("preserveAspectRatio", "none");
        svg.appendChild(shape);
        break;
      case "09":
        const checkboxPath = location.href.split("/");
        const checkboxFullPath =
          [...checkboxPath.slice(0, checkboxPath.length - 1)].join("/") +
          "/check.png";
        shape = document.createElementNS("http://www.w3.org/2000/svg", "image");
        shape.setAttribute("href", checkboxFullPath);
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        shape.setAttribute("preserveAspectRatio", "none");
        svg.appendChild(shape);
        break;
      case "11":
        const doubleLinePath = location.href.split("/");
        const doubleLineFullPath =
          [...doubleLinePath.slice(0, doubleLinePath.length - 1)].join("/") +
          "/double-line.png";
        shape = document.createElementNS("http://www.w3.org/2000/svg", "image");
        shape.setAttribute("href", doubleLineFullPath);
        shape.setAttribute("x", startX);
        shape.setAttribute("y", startY);
        shape.setAttribute("width", 0);
        shape.setAttribute("height", 0);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        shape.setAttribute("preserveAspectRatio", "none");
        svg.appendChild(shape);
        break;
      case "12":
        const stamp1LinePath = location.href.split("/");
        const stamp1LineFullPath =
          [...stamp1LinePath.slice(0, stamp1LinePath.length - 1)].join("/") +
          "/stamp.png";
        shape = document.createElementNS("http://www.w3.org/2000/svg", "image");
        shape.setAttribute("href", stamp1LineFullPath);
        shape.setAttribute("x", e.clientX - rect.x - 50);
        shape.setAttribute("y", e.clientY - rect.y - 50);
        shape.setAttribute("width", 100);
        shape.setAttribute("height", 100);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        shape.setAttribute("preserveAspectRatio", "none");

        const stamp1Text1 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        stamp1Text1.textContent = document.getElementById("stamp-name").value;
        svg.append(stamp1Text1);
        const stamp1Box1 = stamp1Text1.getBBox();
        stamp1Text1.setAttribute(
          "x",
          e.clientX - rect.x - stamp1Box1.width / 2
        );
        stamp1Text1.setAttribute("y", e.clientY - rect.y - 25);

        const stamp1today = new Date();

        const stamp1Text2 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        stamp1Text2.textContent = document.getElementById("stamp-date").value;
        svg.append(stamp1Text2);
        const stamp1Box2 = stamp1Text2.getBBox();
        stamp1Text2.setAttribute(
          "x",
          e.clientX - rect.x - stamp1Box2.width / 2
        );
        stamp1Text2.setAttribute("y", e.clientY - rect.y + 5);

        const stamp1Text3 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        svg.append(stamp1Text3);
        stamp1Text3.textContent = document.getElementById("stamp-comp").value;
        const stamp1Box3 = stamp1Text3.getBBox();
        stamp1Text3.setAttribute(
          "x",
          e.clientX - rect.x - stamp1Box3.width / 2
        );
        stamp1Text3.setAttribute("y", e.clientY - rect.y + 30);

        shape.setAttribute("data-group-id", stamp1today.getTime());
        stamp1Text1.setAttribute("data-group-id", stamp1today.getTime());
        stamp1Text2.setAttribute("data-group-id", stamp1today.getTime());
        stamp1Text3.setAttribute("data-group-id", stamp1today.getTime());

        svg.appendChild(shape);

        drawing = false;
        dragging = false;
        break;
      case "13":
        const stamp2LinePath = location.href.split("/");
        const stamp2LineFullPath =
          [...stamp2LinePath.slice(0, stamp2LinePath.length - 1)].join("/") +
          "/stamp.png";
        shape = document.createElementNS("http://www.w3.org/2000/svg", "image");
        shape.setAttribute("href", stamp2LineFullPath);
        shape.setAttribute("x", e.clientX - rect.x - 50);
        shape.setAttribute("y", e.clientY - rect.y - 50);
        shape.setAttribute("width", 100);
        shape.setAttribute("height", 100);
        shape.setAttribute("stroke", "black");
        shape.setAttribute("fill", "rgba(0,0,0,0)");
        shape.setAttribute("stroke-width", "2");
        shape.setAttribute("preserveAspectRatio", "none");

        const stamp2Text1 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        stamp2Text1.textContent = document.getElementById("stamp-head").value;
        svg.append(stamp2Text1);
        const stamp2Box1 = stamp2Text1.getBBox();
        stamp2Text1.setAttribute(
          "x",
          e.clientX - rect.x - stamp2Box1.width / 2
        );
        stamp2Text1.setAttribute("y", e.clientY - rect.y - 25);

        const stamp2Today = new Date();
        const stamp2Text2 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        stamp2Text2.textContent = document.getElementById("stamp-date").value;
        svg.append(stamp2Text2);
        const stamp2Box2 = stamp2Text2.getBBox();
        stamp2Text2.setAttribute(
          "x",
          e.clientX - rect.x - stamp2Box2.width / 2
        );
        stamp2Text2.setAttribute("y", e.clientY - rect.y + 5);

        const stamp2Text3 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        svg.append(stamp2Text3);
        stamp2Text3.textContent = document.getElementById("stamp-comp").value;
        const stamp2Box3 = stamp2Text3.getBBox();
        stamp2Text3.setAttribute(
          "x",
          e.clientX - rect.x - stamp2Box3.width / 2
        );
        stamp2Text3.setAttribute("y", e.clientY - rect.y + 30);

        const stamp2Text4 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        svg.append(stamp2Text4);
        stamp2Text4.textContent = document.getElementById("stamp-name").value;
        const stamp2Box4 = stamp2Text4.getBBox();
        stamp2Text4.setAttribute(
          "x",
          e.clientX - rect.x - stamp2Box4.width / 2
        );
        stamp2Text4.setAttribute("y", e.clientY - rect.y + 45);
        stamp2Text4.setAttribute("font-size", 12)
        

        shape.setAttribute("data-group-id", stamp2Today.getTime());
        stamp2Text1.setAttribute("data-group-id", stamp2Today.getTime());
        stamp2Text2.setAttribute("data-group-id", stamp2Today.getTime());
        stamp2Text3.setAttribute("data-group-id", stamp2Today.getTime());
        stamp2Text4.setAttribute("data-group-id", stamp2Today.getTime());

        svg.appendChild(shape);

        drawing = false;
        dragging = false;
        break;
    }
  });

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawing) {
      switch (currentTool) {
        case "14":
        case "11":
        case "09":
        case "07":
        case "04":
        case "02":
        case "01":
        case "rect":
        // case "hanko":
          shape.setAttribute("x", Math.min(x, startX));
          shape.setAttribute("y", Math.min(y, startY));
          shape.setAttribute("width", Math.abs(x - startX));
          shape.setAttribute("height", Math.abs(y - startY));
          break;
        case "03":
        case "ellipse":
          shape.setAttribute("cx", (x + startX) / 2);
          shape.setAttribute("cy", (y + startY) / 2);
          shape.setAttribute("rx", Math.abs(x - startX) / 2);
          shape.setAttribute("ry", Math.abs(y - startY) / 2);
          break;

        case "06":
        case "05":
        case "line":
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
        case "image":
          selectedShape.setAttribute(
            "x",
            +selectedShape.getAttribute("x") + dx
          );
          selectedShape.setAttribute(
            "y",
            +selectedShape.getAttribute("y") + dy
          );

          if (selectedShape.hasAttribute("data-group-id")) {
            const groupid = selectedShape.getAttribute("data-group-id");
            svg
              .querySelectorAll(`[data-group-id="${groupid}"]`)
              .forEach((groupElement) => {
                if (groupElement !== selectedShape) {
                  groupElement.setAttribute(
                    "x",
                    Number(groupElement.getAttribute("x")) + dx
                  );
                  groupElement.setAttribute(
                    "y",
                    Number(groupElement.getAttribute("y")) + dy
                  );
                }
              });
          }
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

const convertSvg2Png = (svgEl, w, h) =>
  new Promise((resolve, reject) => {
    try {
      let width = w + PADDING * 2;
      let height = h + PADDING * 2;
      let src = "";

      const scale = 4;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("height", height);
      svg.setAttribute("width", width);
      const svgElClone = svg.appendChild(svgEl.cloneNode(true));

      switch (svgElClone.localName) {
        case "rect":
        case "image":
          svgElClone.setAttribute("x", PADDING);
          svgElClone.setAttribute("y", PADDING);
          break;
        case "ellipse":
          const rx = Number(svgElClone.getAttribute("rx"));
          const ry = Number(svgElClone.getAttribute("ry"));
          svgElClone.setAttribute("cx", rx + PADDING);
          svgElClone.setAttribute("cy", ry + PADDING);

          break;
        case "line":
          const lineX1 = Number(svgElClone.getAttribute("x1"));
          const lineX2 = Number(svgElClone.getAttribute("x2"));
          const lineY1 = Number(svgElClone.getAttribute("y1"));
          const lineY2 = Number(svgElClone.getAttribute("y2"));

          const dx = Math.abs(lineX1 - lineX2);
          const dy = Math.abs(lineY1 - lineY2);

          svgElClone.setAttribute(
            "x1",
            lineX2 > lineX1 ? PADDING : dx + PADDING
          );
          svgElClone.setAttribute(
            "y1",
            lineY2 > lineY1 ? PADDING : dy + PADDING
          );
          svgElClone.setAttribute(
            "x2",
            lineX2 > lineX1 ? dx + PADDING : PADDING
          );
          svgElClone.setAttribute(
            "y2",
            lineY2 > lineY1 ? dy + PADDING : PADDING
          );

          svg.innerHTML += defs.trim();

          break;
        case "text":
          svgElClone.setAttribute("x", PADDING);
          svgElClone.setAttribute("y", PADDING + 5);
          break;
        default:
          break;
      }

      if (svgElClone.localName === "image") {
        src = svgElClone.getAttribute("href");
        width = Math.min(width, height);
        height = Math.min(width, height);
      } else {
        const xml = new XMLSerializer().serializeToString(svg);
        src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
      }

      const img = new Image();
      img.src = src;

      img
        .decode()
        .then(() => {
          const canvas = document.createElement("canvas");
          // canvas.width = width;
          // canvas.height = height;
          canvas.width = width * scale;
          canvas.height = height * scale;

          const ctx = canvas.getContext("2d");
          ctx.setTransform(scale, 0, 0, scale, 0, 0); // scale everything
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
          case "image":
          case "text":
            x = Number(e.getAttribute("x"));
            y = Number(e.getAttribute("y"));
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

        return convertSvg2Png(e, width, height).then((blob) => {
          // test
          const img = document.createElement("img");
          img.src = URL.createObjectURL(blob);
          formdata.append(`widget-${index}`, blob, `widget-${index}.png`);
          params.append(`widget-${index}-x`, x - PADDING);
          params.append(`widget-${index}-y`, y - PADDING);
          params.append(`widget-${index}-w`, width + PADDING * 2);
          params.append(`widget-${index}-h`, height + PADDING * 2);
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

const imageList = {};

const loadImage = async (url = []) => {
  await Promise.all(
    url.map((u) =>
      fetch(u)
        .then((res) => res.blob())
        .then((blob) => (imageList[`${u}`] = URL.createObjectURL(blob)))
    )
  );
};

function handleChangeTools(event) {}

document.addEventListener("DOMContentLoaded", () => {
  getPdfList();
  initDrawing();
});

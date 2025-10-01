const ACTIONS = ["resize", "move", "drawing"];

const SHAPES: {
  rect: typeof CustomRectangle;
  line: typeof CustomLine;
  arrow: typeof CustomArrow;
  textbox: typeof CustomText;
  hanko: typeof CustomText;
  ellipse: typeof CustomEllipse;
} = {
  rect: CustomRectangle,
  line: CustomLine,
  arrow: CustomArrow,
  textbox: CustomText,
  hanko: CustomText,
  ellipse: CustomEllipse,
};

document.addEventListener("DOMContentLoaded", () => {
  const shape = document.getElementById("shape");
  const container = new Container({
    id: "drawing-area",
  });

  if (shape instanceof HTMLSelectElement) {
    const defaultSelected = "rect";
    shape.value = defaultSelected;
    container.selectedShape = defaultSelected;
    shape.addEventListener("change", (e) => {
      if (!(e.target instanceof HTMLSelectElement)) return;
      container.selectedShape = e.target.value;
    });
  }
});

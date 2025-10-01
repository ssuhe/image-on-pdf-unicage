const CALLER = ["drawing", "resizing", "moving", "config"];

      class Rectangle {
        x = 0;
        y = 0;
        w = 0;
        h = 0;

        strokeWidth = 1;
        stroke = "black";

        constructor({ event, parent, id, stroke, strokeWidth, x, y, w, h }) {
          this.id = id;
          this.parent = parent;

          if (stroke !== undefined) this.stroke = stroke;
          if (strokeWidth !== undefined) this.strokeWidth = strokeWidth;
          if (x !== undefined) this.x = x;
          if (y !== undefined) this.y = y;
          if (w !== undefined) this.w = w;
          if (h !== undefined) this.h = h;

          this.mount();
        }
        createElement() {
          this.element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          this.element.setAttribute("data-id", this.id);
          this.element.setAttribute("x", this.x);
          this.element.setAttribute("y", this.y);
          this.element.setAttribute("stroke-width", this.strokeWidth);
          this.element.setAttribute("stroke", this.stroke);
          this.element.setAttribute("fill", "transparent");
        }
        mount() {
          this.createElement();
          const placeholder = this.parent.element.getElementById("placeholder");
          this.parent.element.insertBefore(this.element, placeholder);
        }
        memoPosition(event) {
          if (event) {
            this.x = event.clientX - this.parent.bouding.x;
            this.y = event.clientY - this.parent.bouding.y;

            this.position = {
              x: this.x,
              y: this.y,
              clientX: event.clientX,
              clientY: event.clientY,
            };
          }
        }

        updateW(w) {
          this.w = w;
          this.element.setAttribute("width", this.w);
        }
        updateH(h) {
          this.h = h;
          this.element.setAttribute("height", this.h);
        }
        updateX(x) {
          this.x = x;
          this.element.setAttribute("x", this.x);
        }
        updateY(y) {
          this.y = y;
          this.element.setAttribute("y", this.y);
        }

        update({ caller, event }) {
          if (caller === CALLER[0]) {
          const dx = event.clientX - this.position.clientX;
          this.updateW(Math.abs(dx));

          const dy = event.clientY - this.position.clientY;
          this.updateH(Math.abs(dy));

          if (dx < 0) {
            const x = this.position.x + dx;
            this.updateX(x);
          }

          if (dy < 0) {
            const y = this.position.y + dy;
            this.updateY(y);
          }
          }
        }

        endUpdate({ caller, event }) {}

        umount() {}
      }

      const shapeTypes = {
        Rectangle,
      };

      class Container {
        placeholder = null;

        uniq = 1;

        shapeType = null;
        selected = null;

        drawing = null;
        resizing = null;
        moving = null;

        bouding = null;
        children = [];

        constructor({ id = null, shapeType = null }) {
          this.id = id;
          this.shapeType = shapeType;
          this.element = document.getElementById(this.id);
          if (!this.element) throw new Error("Container element not defined!");
          this.bouding = this.element.getBoundingClientRect();

          //   Create placeholder and append
          this.addPlaceHolder();
          //   Bind this to event handlers
          this.mousedown = this.mousedown.bind(this);
          this.mousemove = this.mousemove.bind(this);
          this.mouseup = this.mouseup.bind(this);

          //   Listen events
          ["mousedown", "mousemove", "mouseup"].forEach((event) =>
            this.element.addEventListener(event, this[event])
          );
        }

        addPlaceHolder() {
          const placeholder = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          placeholder.setAttribute("x", 0);
          placeholder.setAttribute("y", 0);
          placeholder.setAttribute("width", 0);
          placeholder.setAttribute("height", 0);
          placeholder.setAttribute("id", "placeholder");
          this.element.append(placeholder);
        }

        mouseDownAddElement(event) {
          const Cls = shapeTypes[this.shapeType];
          if (!Cls) return;
          const child = new Cls({ event, parent: this, id: this.uniq });
          child.memoPosition(event)
          this.drawing = child;
          this.children[this.uniq] = child;
          this.uniq++;
        }

        mouseDownResizeElement(event) {}
        mouseDownMoveElement(event) {}
        mouseDownSelectedElement(event) {
          const id = event.target.dataset.id;
          const selected = this.children[id];
          if (selected) {
            this.selected = selected;
            this.selected.memoPosition(event);
            this.selected.select();
          }
        }
        mouseDownUnSelectedElement(event) {}

        inResizeArea(event) {}
        inMoveArea(event) {}

        mousedown(event) {
          // add element
          if (this.selected === null && event.target.id === this.id)
            this.mouseDownAddElement(event);

          // selected element
          if (this.selected === null && event.target.id !== this.id)
            this.mouseDownSelectedElement(event);

          if (this.selected !== null) {
            //  - start resize element
            if (this.inResizeArea(event)) {
            }
            //  - start move element
            if (this.inMoveArea(event)) {
            }
            // unselect element
            if (event.target.id === this.id)
              this.mouseDownUnSelectedElement(event);
          }
        }

        mousemove(event) {
          if (this.drawing) {
            this.drawing.update({ caller: CALLER[0], event });
          }
          if (this.resizing) {
            this.drawing.update({ caller: CALLER[1], event });
          }
          if (this.moving) {
            this.drawing.update({ caller: CALLER[2], event });
          }
        }

        mouseup(event) {
          if (this.drawing) {
            this.drawing = null;
          }

          if (this.resizing) {
            this.resizing = null;
          }

          if (this.moving) {
            this.moving = null;
          }
        }
      }

      const container = new Container({
        id: "drawing-area",
        shapeType: "Rectangle",
      });
      const shapeTypeSelect = document.getElementById("shape");
      shapeTypeSelect.addEventListener("change", (e) => {
        container.shapeType = e.target.value;
      });
class Container {
    constructor({ id }) {
        this.shapes = {};
        this.mousedownTriggered = false;
        this.action = "";
        this.uniq = 1;
        const element = document.getElementById(id);
        if (!element)
            throw new Error("container not defined!");
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
        this.placeholder = new CustomPlaceholder({
            id: "placeholder",
            x: 0,
            w: 0,
            y: 0,
            h: 0,
            parent: this,
        });
        this.placeholder.memoPosition();
        this.mousedown = this.mousedown.bind(this);
        this.mouseup = this.mouseup.bind(this);
        this.mousemove = this.mousemove.bind(this);
        this.element.addEventListener("mousedown", this.mousedown);
        this.element.addEventListener("mouseup", this.mouseup);
        this.element.addEventListener("mousemove", this.mousemove);
    }
    addShape(event) {
        if (!(this.selectedShape in SHAPES))
            return;
        const Cls = SHAPES[this.selectedShape];
        const id = String(this.uniq);
        const shape = new Cls({
            id: id,
            x: event.clientX - this.rect.x,
            y: event.clientY - this.rect.y,
            w: 0,
            h: 0,
            parent: this,
        });
        shape.memoPosition(event);
        this.action = "creating";
        this.selected = shape;
        this.shapes[id] = shape;
        this.uniq++;
    }
    unselect() {
        this.overingShape = null;
        this.selected.svg.removeAttribute("data-selected");
        this.selected = null;
        this.placeholder.svg.removeAttribute("data-visible");
    }
    overing(event) {
        if (!(event.target instanceof SVGElement))
            return;
        const id = event.target.id;
        if (!(id in this.shapes))
            return;
        this.overingShape = this.shapes[id];
        this.placeholder.update({
            x: this.overingShape.x,
            y: this.overingShape.y,
            w: this.overingShape.w,
            h: this.overingShape.h,
        });
        this.placeholder.svg.setAttribute("data-visible", "true");
    }
    select(event) {
        this.overing(event);
        if (!this.overingShape)
            return;
        this.selected = this.overingShape;
        if (!this.selected)
            return;
        if (!this.selected.svg)
            return;
        this.selected.svg.setAttribute("data-selected", "true");
        this.placeholder.svg.setAttribute("data-visible", "selected");
        this.placeholder.svg.setAttribute("fill", "none");
    }
    mousedown(event) {
        this.mousedownTriggered = true;
        if (event.target === this.element) {
            if (!this.selected) {
                // add item
                this.addShape(event);
            }
            else {
                // unselect
                this.unselect();
            }
        }
        else {
            if (this.selected) {
                if (!(event.target instanceof SVGElement))
                    return;
                // move start
                if (this.selected.svg === event.target) {
                    this.selected.memoPosition(event);
                    this.action = "move";
                    this.placeholder.move("start");
                }
                else {
                    // select
                    this.unselect();
                    this.select(event);
                }
            }
            else {
                // select
                this.select(event);
            }
        }
    }
    mouseup(event) {
        if (this.action === "creating") {
            this.action = "";
            this.selected = null;
        }
        if (this.action === "move") {
            this.action = "";
            const x = this.placeholder.x;
            const y = this.placeholder.y;
            this.selected.update({
                x,
                y,
                w: this.selected.w,
                h: this.selected.h,
            });
            this.placeholder.move("end");
        }
        this.mousedownTriggered = false;
    }
    mousemove(event) {
        if (this.mousedownTriggered) {
            if (this.action === "creating" && this.selected) {
                const { x, y, w, h } = this.selected.calcPosition(event);
                this.selected.update({ x, y, w, h });
            }
            if (this.action === "move" && this.selected) {
                const { dx, dy } = this.selected.calcPosition(event);
                const x = this.selected.x + dx;
                const y = this.selected.y + dy;
                this.placeholder.update({
                    x,
                    y,
                    w: this.placeholder.w,
                    h: this.placeholder.h,
                });
                this.placeholder.move("inprocess");
            }
        }
        else {
            if (this.selected)
                return;
            if (event.target === this.element) {
                this.placeholder.svg.removeAttribute("data-visible");
            }
            else {
                this.overing(event);
            }
        }
    }
}

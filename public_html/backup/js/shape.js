class SVGOject {
    constructor({ id, x, y, w, h, parent }) {
        this.position = [0, 0, 0, 0];
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.parent = parent;
    }
    // Initially render stored shape
    // Draw on the screen
    create() { }
    delete() { }
    update(args) { }
    getPng() { }
    memoPosition(event) {
        if (event) {
            // Other rectangle case
            this.position = [
                event.clientX - this.parent.rect.x,
                event.clientY - this.parent.rect.y,
                event.clientX,
                event.clientY,
            ];
        }
        else {
            // Placeholder case
            this.position = [0, 0, this.parent.rect.x, this.parent.rect.y];
        }
    }
    calcPosition(event) {
        const [x, y, clientX, clientY] = this.position;
        const dx = event.clientX - clientX;
        const dy = event.clientY - clientY;
        const _w = Math.abs(dx);
        const _h = Math.abs(dy);
        let _x = x, _y = y;
        if (dx < 0)
            _x = x + dx;
        if (dy < 0)
            _y = y + dy;
        return {
            x: _x,
            y: _y,
            w: _w,
            h: _h,
            dx,
            dy,
        };
    }
}
class CustomRectangle extends SVGOject {
    constructor(args) {
        super(args);
        this.strokeWidth = 1;
        this.stroke = "black";
        this.fill = "transparent";
        if (args.strokeWidth)
            this.strokeWidth = args.strokeWidth;
        if (args.stroke)
            this.stroke = args.stroke;
        if (args.fill)
            this.fill = args.fill;
        this.create();
    }
    create() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.svg.setAttribute("id", this.id);
        this.svg.setAttribute("x", String(this.x));
        this.svg.setAttribute("y", String(this.y));
        this.svg.setAttribute("width", String(this.w));
        this.svg.setAttribute("height", String(this.h));
        this.svg.setAttribute("stroke-width", String(this.strokeWidth));
        this.svg.setAttribute("stroke", this.stroke);
        this.svg.setAttribute("fill", this.fill);
        const placeholder = this.parent.element.querySelector("#placeholder");
        if (!placeholder)
            return;
        this.parent.element.insertBefore(this.svg, placeholder);
    }
    update({ x, y, w, h }) {
        this.svg.setAttribute("x", String(x));
        this.svg.setAttribute("y", String(y));
        this.svg.setAttribute("width", String(w));
        this.svg.setAttribute("height", String(h));
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}
class CustomLine extends SVGOject {
}
class CustomArrow extends CustomLine {
}
class CustomText extends CustomRectangle {
}
class CustomImage extends SVGOject {
}
class CustomEllipse extends SVGOject {
}
class CustomPlaceholder extends CustomRectangle {
    constructor(args) {
        const fill = "none";
        const strokeWidth = 5;
        const stroke = "transparent";
        super({ ...args, fill, stroke, strokeWidth });
    }
    create() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.svg.setAttribute("id", this.id);
        this.svg.setAttribute("x", String(this.x));
        this.svg.setAttribute("y", String(this.y));
        this.svg.setAttribute("width", String(this.w));
        this.svg.setAttribute("height", String(this.h));
        this.svg.setAttribute("stroke-width", String(this.strokeWidth));
        this.svg.setAttribute("stroke", this.stroke);
        this.svg.setAttribute("fill", this.fill);
        this.parent.element.appendChild(this.svg);
    }
    move(command) {
        switch (command) {
            case "start":
                this.svg.setAttribute("data-moving", "true");
                break;
            case "inprocess":
                this.svg.setAttribute("fill", "rgba(0,0,0,0.3)");
                break;
            case "end":
                this.svg.setAttribute("fill", "none");
                this.svg.removeAttribute("data-moving");
                break;
            default:
                break;
        }
    }
}

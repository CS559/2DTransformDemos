/*jshint esversion: 6 */
// @ts-check

/**
 *  Simple version of an auto-update slider to have looping time
 *
 * Designed for making quick UIs for CS559 demos
 */

 // useful utility function for creating HTML
/**
 * https://plainjs.com/javascript/manipulation/insert-an-element-after-or-before-another-32/
 * @param {HTMLElement} el 
 * @param {HTMLElement} referenceNode 
 */
function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

/**
 * the main thing is implemented as a class in case you want access to everything
 */
export class RunCanvas {
    constructor(canvasName,drawFunc,step=.01,noLoop=false) {
        this.canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasName));
        this.canvasName = canvasName;
        this.step=step;
        this.drawFunc = drawFunc;
        this.noloop = noLoop;

        // create the elements
        this.br = document.createElement("br");
        this.br.id = canvasName + "-br";

        this.range = document.createElement("input");
        this.range.id = canvasName + "-slider";
        this.range.setAttribute("type","range");
        this.range.style.width = String(this.canvas.width - 50 - 20);
        this.setupSlider(0,1,step);

        this.text = document.createElement("input");
        this.text.id = canvasName+"-text";
        this.text.setAttribute("type","text");
        this.text.style.width = "50";
        this.text.setAttribute("readonly","1");

        this.runbutton = document.createElement("input");
        this.runbutton.id=canvasName + "-run";
        this.runbutton.setAttribute("type","checkbox");
        this.runbutton.width=20;
     
        insertAfter(this.br, this.canvas);
        insertAfter(this.runbutton, this.br);
        insertAfter(this.text, this.runbutton);
        insertAfter(this.range,this.text);

        let self = this;
        this.runbutton.onchange = function () { 
            if (self.noloop && Number(self.range.value)>=1) {
                self.setValue(0);
            }
            self.advance(); 
        };
        this.range.oninput = function() {
            let val = Number(self.range.value);
            self.setValue(val);
        };
    
     }
    /**
     * Setup aspects of the slider - as a function in case you need to change them
     * @param {Number} min 
     * @param {Number} max 
     * @param {Number} step 
     */
    setupSlider(min,max,step) {
        this.step = step;
        this.range.setAttribute("min",String(min));
        this.range.setAttribute("max",String(max));
        this.range.setAttribute("step",String(step));
    }

    setValue(value) {
        let valString = String(value);
        this.range.value = valString;
        this.text.value = valString;
        if (this.drawFunc) {
            this.drawFunc(this.canvas,value);
        }
    }

    advance() {
        let value = Number(this.range.value) + this.step;
        if (this.noloop) {
            if (value >= 1) {
                this.runbutton.checked = false;
            }
            value = Math.min(1,value);
        } else {
            value = value % 1;
        }
        this.setValue(value);
        if (this.runbutton.checked) {
            let self=this;
            window.requestAnimationFrame(function () {self.advance()} );
        }
    }

}

/**
 * simple entry point - give it the name of a canvas
 * @param {string} canvasName 
 * @param {function(HTMLCanvasElement, Number) : any} [drawFunc]
 */ 
export function runCanvas(canvasName, drawFunc = undefined, initial=0.5, noloop=false) {
    let step = 0.01;

    let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasName));

    let rc = new RunCanvas(canvasName,drawFunc,.01,noloop);
    rc.setValue(initial);
 }



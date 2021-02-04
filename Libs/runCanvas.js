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
    /**
     * 
     * @param {string} canvasName 
     * @param {function} drawFunc 
     * @param {boolean} noLoop 
     */
    constructor(canvasName,drawFunc,noLoop=false) {
        this.canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasName));
        this.canvasName = canvasName;
        this.drawFunc = drawFunc;
        this.noloop = noLoop;

        // create the elements
        this.br = document.createElement("br");
        this.br.id = canvasName + "-br";

        this.title = document.createElement("p");
        this.title.id = canvasName + "title";
        let node = document.createTextNode("Hit play to run the transformations");
        this.title.appendChild(node);
        this.title.style.marginTop = '5px';
        this.title.style.marginBottom = '5px';

        this.range = document.createElement("input");
        this.range.id = canvasName + "-slider";
        this.range.setAttribute("type","range");
        this.range.style.width = String(this.canvas.width - 50 - 20);
        // give default values for range
        this.setupSlider(0,1,0.01);

        this.text = document.createElement("input");
        this.text.id = canvasName+"-text";
        this.text.setAttribute("type","text");
        this.text.style.width = "50";
        this.text.setAttribute("readonly","1");

        this.runbutton = document.createElement("input");
        this.runbutton.id=canvasName + "-run";
        this.runbutton.setAttribute("type","checkbox");
        this.runbutton.width=20;
        this.runbutton.style.display = 'none';

        this.playicon = document.createElement("label");
        this.playicon.id = canvasName + "-play";
        this.playicon.setAttribute("for", canvasName+"-run");
        // this.playicon.setAttribute("class", "fas fa-play-circle fa-lg");
        this.playicon.style.marginRight='5';
        // this.playicon.style.marginLeft='5';
        this.playicon.style.color = "blue";
        this.playicon.style.cssText = "margin-right: 5;";

        this.playimage = document.createElement("img");
        this.playimage.id = "play";
        this.playimage.setAttribute("src", "./images/play-button.png");
        this.playimage.style.cssText = "width: 20px; height: 20px; ";
        this.playicon.appendChild(this.playimage);
     
        insertAfter(this.br, this.canvas);
        insertAfter(this.runbutton, this.br);
        insertAfter(this.text, this.runbutton);
        insertAfter(this.range,this.text);

        let self = this;
        let play = "./images/play-button.png";
        let pause = "./images/pause-button.png";
        this.runbutton.onchange = function () { 
            if (self.runbutton.checked) {
                self.playimage.setAttribute("src", pause)
            } else {
                self.playimage.setAttribute("src", play)
            }

            if (self.noloop && Number(self.range.value)>=Number(self.range.max)) {
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
        let maxV = Number(this.range.max);
        let stepV = Number(this.range.step);
        let value = Number(this.range.value) + stepV;
        if (this.noloop) {
            if (value >= maxV) {
                this.runbutton.checked = false;
                this.playimage.setAttribute("src", "./images/play-button.png");
            }
            value = Math.min(maxV,value);
        } else {
            value = value % maxV;
        }
        this.setValue(value);
        if (this.runbutton.checked) {
            let self=this;
            window.requestAnimationFrame(function () {self.advance();} );
        }
    }

}

/**
 * simple entry point - give it the name of a canvas, and it guesses the rest
 * but it also loses access to all the parameters
 * 
 * @param {string} canvasName 
 * @param {function(HTMLCanvasElement, Number) : any} [drawFunc]
 */ 
export function runCanvas(canvasName, drawFunc = undefined, initial=0.5, noloop=false) {
    let step = 0.01;

    let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasName));

    let rc = new RunCanvas(canvasName,drawFunc,noloop);
    rc.setValue(initial);
 }



/*jshint esversion: 6 */
// @ts-check

// a premade function to construct a running canvas, 
// please read runCanvas.js for more details 
import { RunCanvas } from "./Libs/runCanvas.js";

// default transforms
let test1 = [
    ["rotate", 45],
    ["scale", 2, 1],
    ["rotate", -45],
    ["fillrect", -10, -10, 20, 20]
];

/**
 * Convert angles from degrees to radians
 * @param {Number} angle 
 */
function degToRad(angle) {
    return angle / 180 * Math.PI;
}

/**
 * Draw a filled square - but don't rely on
 * fillRect (which doesn't transform correctly)
 * @param {CanvasRenderingContext2D} context 
 * @param {Number} r 
 */
function square(context, r = 20) {
    context.save();
    context.beginPath();
    context.moveTo(-r, -r);
    context.lineTo(r, -r);
    context.lineTo(r, r);
    context.lineTo(-r, r);
    context.closePath();
    context.fill();
    context.restore();
}

/**
 * Draw a coordinate system
 * @param {CanvasRenderingContext2D} context 
 * @param {String} color 
 * @param {String} [drawBlock=undefined] 
 */
function drawCsys(context, color = "#7F0000", drawBlock = undefined) {
    context.save();

    context.fillStyle = "#FFFFFF80"; // color + "10";
    // draw the original block if asked
    if (drawBlock) {
        context.fillStyle = drawBlock;
        square(context);
    }
    context.strokeStyle = color;
    // draw the horizontal and vertical lines
    context.beginPath();
    for (let x = -5; x < 6; x += 1) {
        context.moveTo(x * 10, -50);
        context.lineTo(x * 10, 50);
        context.moveTo(50, x * 10);
        context.lineTo(-50, x * 10);
    }
    context.lineWidth = 0.5;
    context.stroke();

    // draw the two axes in bold lines 
    context.save();
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, -50);
    context.lineTo(0, 50);
    context.moveTo(-50, 0);
    context.lineTo(50, 0);
    context.stroke();
    context.restore();

    context.restore();
}

/**
 * Do transforms as specified in transformList. The number of transforms 
 * to do is decided by param
 * @param {CanvasRenderingContext2D} context 
 * @param {Array} transformList 
 * @param {Number} param 
 * @param {*} [direction]
 */
function doTransform(context, transformList, param, direction = 1) {
    // is the text in the code section under the canvas
    let html = "";
    // iterate through all transforms in the list
    // but some will get done, some will not (based on how big param is)
    // look at the array test1 in the beginning of this script to have an idea of how "t
    // below would be like
    transformList.forEach(function (t, i) {
        let command = t[0][0]; // should be the first letter of the transfrom
        let amt = (direction >= 0) ?
            (i > param) ? 0 : Math.min(1, param - i) : // if direction >= 0, do this line
            ((i + 1) < param) ? 0 : Math.min(1, (i + 1) - param); // if not, do this line

        // console.log(`param ${param} i ${i} amt ${amt} `)

        /**
         * made a local function so it has access to direction and list
         * @param {Number} amt
         * @param {string} htmlLine
         */
        function stylize(amt, htmlLine) {
            let style = (amt <= 0) ? "c-zero" : ((amt < 1) ? "c-act" : "c-one");
            return (`<span class="${style}">${htmlLine}</span><br/>`);
        }

        // translate, rotate, scale, or fillRect
        if (command == "t") {
            let x = t[1] * amt;
            let y = t[2] * amt;
            context.translate(x, y);
            html += stylize(amt, `context.translate(${x.toFixed(1)},${y.toFixed(1)});`);
        } else if (command == "r") {
            let a = t[1] * amt;
            context.rotate(degToRad(a));
            html += stylize(amt, `context.rotate(${a.toFixed(1)});`);
        } else if (command == "s") {
            let x = amt * t[1] + (1 - amt) * 1;
            let y = amt * t[2] + (1 - amt) * 1;
            context.scale(x, y);
            html += stylize(amt, `context.scale(${x.toFixed(1)},${y.toFixed(1)});`);
        } else if (command == "f") {
            let color = t.length > 5 ? t[5] : "blue";
            if (amt > 0) {
                context.save();
                context.fillStyle = color;
                context.beginPath();
                context.moveTo(t[1], t[2]);
                context.lineTo(t[1], t[2] + t[4]);
                context.lineTo(t[1] + t[3], t[2] + t[4]);
                context.lineTo(t[1] + t[3], t[2]);
                context.closePath();
                context.fill();
                context.restore();
            }
            html += stylize(amt, `context.fillStyle="${color}"`);
            html += stylize(amt, `context.fillRect(${t[1]},${t[2]},${t[3]},${t[4]});`);
        } else {
            console.log(`Bad transform ${t}`);
        }
    }); // end foreach transform
    return html;
}

/**
 * Make the draw function that the canvas will need
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<Array>} transformList 
 * @param {HTMLElement} div 
 * @param {HTMLInputElement} dirTog
 * @param {HTMLInputElement} csTog
 */
function makeDraw(canvas, transformList, div, dirTog = undefined, csTog = undefined) {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} param
     */
    function draw(canvas, param) {
        let context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.scale(2, 2);

        context.save();
        drawCsys(context, "black");
        let html = doTransform(context, transformList, param, dirTog ? (dirTog.checked ? -1 : 1) : 1);
        if (!(csTog && !csTog.checked)) {            
            drawCsys(context);
        }
        context.restore();

        context.restore();

        div.innerHTML = html;
    }
    return draw;
}

// function makeSelect(values, where, initial) {
//     let select = document.createElement("select");
//     values.forEach(function(ch) {
//         let opt = document.createElement("option");
//         opt.value = ch;
//         opt.text = ch;
//         select.add(opt);
//         if (initial) select.value = initial;
//     });
//     where.parentNode.insertBefore(select, where.nextSibling);
//     return select;
// }

/**
 * Create a transformation example
 * 
 * @param {string} title 
 * @param {Array} transforms 
 */
export function createExample(title, transforms = undefined) {
    // make sure each canvas has a different name?
    let canvasName = performance.now().toString();
    // console.log(canvasName);

    // heading
    let heading = document.createElement("h2");
    heading.innerText = title;
    document.getElementsByTagName("body")[0].appendChild(heading);

    // division to hold these two canvases 
    let twoCanvasesDiv = document.createElement("div");
    twoCanvasesDiv.id = canvasName + "-two";
    twoCanvasesDiv.style.cssText = "display: flex; align-items: flex-start";
    document.getElementsByTagName("body")[0].appendChild(twoCanvasesDiv);

    // left part, including a canvas, checkboxes, a slider, and a code block
    let leftDiv = document.createElement("div");
    leftDiv.id = canvasName + "-leftDiv";
    leftDiv.style.cssText = "padding-right: 30px";
    document.getElementById(twoCanvasesDiv.id).appendChild(leftDiv);

    let leftCanvas = document.createElement("canvas");
    leftCanvas.width = 400;
    leftCanvas.height = 400;
    leftCanvas.id = canvasName;
    document.getElementById(leftDiv.id).appendChild(leftCanvas);

    let leftBrOne = document.createElement("br");
    document.getElementById(leftDiv.id).appendChild(leftBrOne);

    // checkbox and label for reversion
    let dirTog = document.createElement("input");
    dirTog.setAttribute("type", "checkbox");
    dirTog.id = canvasName + "-dt";
    document.getElementById(leftDiv.id).appendChild(dirTog);

    let dirLabel = document.createElement("label");
    dirLabel.setAttribute("for", dirTog.id);
    dirLabel.innerText = "Reverse";
    document.getElementById(leftDiv.id).appendChild(dirLabel);

    let leftBrTwo = document.createElement("br");
    document.getElementById(leftDiv.id).appendChild(leftBrTwo);

    // checkbox and label for showing the final result
    let resultTog = document.createElement("input");
    resultTog.setAttribute("type", "checkbox");
    resultTog.setAttribute("checked", "true");
    resultTog.id = canvasName + "-rt";
    document.getElementById(leftDiv.id).appendChild(resultTog);

    let resultLabel = document.createElement("label");
    resultLabel.setAttribute("for", resultTog.id);
    resultLabel.innerText = "Show the final result";
    document.getElementById(leftDiv.id).appendChild(resultLabel);

    let leftCodeDiv = document.createElement("div");
    leftCodeDiv.style.cssText = "font-family: 'Courier New', Courier, monospace; " +
        "font-size: 120%; padding-top: 5px";
    document.getElementById(leftDiv.id).appendChild(leftCodeDiv);

    // right part, including a canvas, a code block
    let rightDiv = document.createElement("div");
    rightDiv.id = canvasName + "-rightDiv";
    document.getElementById(twoCanvasesDiv.id).appendChild(rightDiv);

    let rightCanvas = document.createElement("canvas");
    rightCanvas.width = 400;
    rightCanvas.height = 400;
    rightCanvas.id = canvasName + "-right";
    document.getElementById(rightDiv.id).appendChild(rightCanvas);

    // checkbox and label for showing the final coordinate system
    let csTog = document.createElement("input");
    csTog.setAttribute("type", "checkbox");
    csTog.id = canvasName + "-cst";
    document.getElementById(rightDiv.id).appendChild(csTog);

    let csLabel = document.createElement("label");
    csLabel.setAttribute("for", csTog.id);
    csLabel.innerText = "Show the final coordinate system";
    document.getElementById(rightDiv.id).appendChild(csLabel);

    let rightCodeDiv = document.createElement("div");
    rightCodeDiv.style.cssText = "font-family: 'Courier New', Courier, monospace; " +
        "font-size: 120%; padding-top: 53px";
    document.getElementById(rightDiv.id).appendChild(rightCodeDiv);
    
    // line breaker to prepare for the next example
    let br = document.createElement("br");
    document.getElementsByTagName("body")[0].appendChild(br);

    if (transforms) {
        // set up the left part
        let md = makeDraw(leftCanvas, transforms, leftCodeDiv, dirTog);
        let rc = new RunCanvas(canvasName, md);
        rc.noloop = true;
        rc.setupSlider(0, transforms.length, 0.02);
        rc.setValue(0);

        dirTog.onchange = function () {
            md(leftCanvas, Number(rc.range.value));
        };

        // set up the right part if the checkbox is checked
        resultTog.onchange = function () {
            if (resultTog.checked) {
                document.getElementById(rightDiv.id).style.display = "block";
            } else {
                document.getElementById(rightDiv.id).style.display = "none";
            }
        };

        // set up the right part
        let mdFinal = makeDraw(rightCanvas, transforms, rightCodeDiv, undefined, csTog);
        mdFinal(rightCanvas, transforms.length);

        csTog.onchange = function() {
            mdFinal(rightCanvas, transforms.length);
        };
    } else {
        // TODO: Enable customization.
    }
    
}

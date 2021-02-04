/*jshint esversion: 6 */
// @ts-check

// a premade function to construct a running canvas, 
// please read runCanvas.js for more details 
import { RunCanvas } from "./Libs/runCanvas.js";

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
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(0, -50);
    context.lineTo(0, 50);
    context.moveTo(-50, 0);
    context.lineTo(50, 0);
    context.stroke();
    context.restore();

    // draw two arrows pointing the postive dir of axes
    context.save();
    context.fillStyle = color;
    context.moveTo(3, 50);
    context.lineTo(0, 56);
    context.lineTo(-3, 50);
    context.closePath();
    context.moveTo(50, -3);
    context.lineTo(56, 0);
    context.lineTo(50, 3);
    context.closePath();
    context.fill();
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
    // add a stack to store user transform save/restore specially
    let transformStack = [];

    // iterate through all transforms in the list
    // but some will get done, some will not (based on how big param is)
    // look at the array test1 in the beginning of this script to have an idea of how "t
    // below would be like
    transformList.forEach(function (t, i) {
        let command = t[0]; // should be the first letter of the transfrom
        // since 2 different things begin with t...

        // keep track of which commands are ready to be run
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

        // translate, rotate, scale, fillRect, save or restore
        if (command == "translate") {
            let x = t[1] * amt;
            let y = t[2] * amt;
            context.translate(x, y);
            html += stylize(amt, `context.translate(${x.toFixed(1)},${y.toFixed(1)});`);
        } else if (command == "rotate") {
            let a = t[1] * amt;
            context.rotate(degToRad(a));
            html += stylize(amt, `context.rotate(${a.toFixed(1)});`);
        } else if (command == "scale") {
            let x = amt * t[1] + (1 - amt) * 1;
            let y = amt * t[2] + (1 - amt) * 1;
            context.scale(x, y);
            html += stylize(amt, `context.scale(${x.toFixed(1)},${y.toFixed(1)});`);
        } else if (command == "fillRect") {
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
        } else if (command == "triangle") {
            let color = t.length > 3 ? t[3] : "blue";
            if (amt > 0) {
                context.save();
                context.translate(t[1], t[2]);
                context.fillStyle = color;
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(10, 0);
                context.lineTo(0, 20);
                context.closePath();
                context.fill();
                context.restore();
            }
            html += stylize(amt, `context.fillStyle="${color}"`);
            html += stylize(amt, `triangle(context,${t[1]},${t[2]},${t[3]});`);
        } else if (command == "save") {
            if (amt > 0) {
                transformStack.push(context.getTransform());
            }
            html += stylize(amt, `context.save();`);
        } else if (command == "restore") {
            if (amt > 0 && transformStack.length) {
                context.setTransform(transformStack.pop());
            }
            html += stylize(amt, `context.restore();`);
        } else { // bad command
            console.log(`Bad transform ${t}`);
        }
    });
    return html;
}

/**
 * Make the draw function that the canvas will need
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<Array>} transformList 
 * @param {HTMLElement} div 
 * @param {HTMLInputElement} dirTog
 * @param {HTMLInputElement} finalTog
 */
function makeDraw(canvas, transformList, div, dirTog = undefined, orTog = undefined, finalTog = undefined) {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} param
     */
    function draw(canvas, param) {
        let context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        // move to the center of the canvas
        context.translate(canvas.width / 2, canvas.height / 2);
        context.scale(2, 2);

        context.save();
        // draw the original coor system if the toggle is checked
        if (!(orTog && !orTog.checked)) {
            drawCsys(context, "black");
        }
        let html = doTransform(context, transformList, param, dirTog ? (dirTog.checked ? -1 : 1) : 1);
        // draw the final coor system if the toggle is checked
        if (!(finalTog && !finalTog.checked)) {
            drawCsys(context);
        }
        context.restore();

        context.restore();

        div.innerHTML = html;
    }
    return draw;
}

/**
 * Useful utility function for creating HTML
 * https://plainjs.com/javascript/manipulation/insert-an-element-after-or-before-another-32/
 * @param {HTMLElement} el 
 * @param {HTMLElement} referenceNode 
 */
function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

/**
 * Create a slider with given parameters
 * @param {string} name
 * @param {number} min
 * @param {number} max
 * @param {number} value
 * @param {number} step
 */
function createSlider(name, min, max, value, step) {
    let sliderDiv = document.createElement("div");

    let slider = document.createElement("input");
    slider.setAttribute("type", "range");
    slider.style.width = String(270);
    slider.setAttribute("min", String(min));
    slider.setAttribute("max", String(max));
    slider.setAttribute("value", String(value));
    slider.setAttribute("step", String(step));
    sliderDiv.appendChild(slider);

    let sliderLabel = document.createElement("label");
    sliderLabel.setAttribute("for", slider.id);
    sliderLabel.innerText = name + slider.value;
    sliderLabel.style.cssText = "margin-left: 7px";
    sliderDiv.appendChild(sliderLabel);

    slider.oninput = function () {
        sliderLabel.innerText = name + String(slider.value);
    };

    return sliderDiv;
}

/**
 * Make a select with given parameters
 * @param {string[]} values
 * @param {HTMLDivElement} where
 * @param {string} [initial]
 */
export function makeSelect(values, where, initial) {
    let select = document.createElement("select");
    values.forEach(function (ch) {
        let opt = document.createElement("option");
        opt.value = ch;
        opt.text = ch;
        select.add(opt);
        if (initial) select.value = initial;
    });
    where.appendChild(select);
    return select;
}

/**
 * Create a transformation example
 * @param {string} title 
 * @param {Array} transforms 
 */
export function createExample(title, transforms = undefined) {
    // make sure each canvas has a different name
    let canvasName = title;

    // division to hold the example 
    let exampleDiv = document.createElement("div");
    exampleDiv.id = canvasName + "-example";
    exampleDiv.style.cssText = "display: none; align-items: flex-start";
    document.getElementsByTagName("body")[0].appendChild(exampleDiv);

    // left part, including a canvas, checkboxes, a slider, and a code block
    let leftDiv = document.createElement("div");
    leftDiv.id = canvasName + "-leftDiv";
    leftDiv.style.cssText = "padding-right: 30px";
    document.getElementById(exampleDiv.id).appendChild(leftDiv);

    let leftCanvas = document.createElement("canvas");
    leftCanvas.width = 400;
    leftCanvas.height = 400;
    leftCanvas.id = canvasName;
    document.getElementById(leftDiv.id).appendChild(leftCanvas);

    let leftPanel = document.createElement("div");
    leftPanel.id = canvasName + "-leftPanel";
    document.getElementById(leftDiv.id).appendChild(leftPanel);

    // checkbox and label for reversion
    let dirTog = document.createElement("input");
    dirTog.setAttribute("type", "checkbox");
    dirTog.id = canvasName + "-dt";
    document.getElementById(leftPanel.id).appendChild(dirTog);

    let dirLabel = document.createElement("label");
    dirLabel.setAttribute("for", dirTog.id);
    dirLabel.innerText = "Reverse";
    document.getElementById(leftPanel.id).appendChild(dirLabel);

    let leftBrOne = document.createElement("br");
    leftBrOne.id = canvasName + "-leftBr2";
    document.getElementById(leftPanel.id).appendChild(leftBrOne);

    // checkbox and label for showing the final result
    let resultTog = document.createElement("input");
    resultTog.setAttribute("type", "checkbox");
    resultTog.setAttribute("checked", "true");
    resultTog.id = canvasName + "-rt";
    document.getElementById(leftPanel.id).appendChild(resultTog);

    let resultLabel = document.createElement("label");
    resultLabel.setAttribute("for", resultTog.id);
    resultLabel.innerText = "Show the final result";
    document.getElementById(leftPanel.id).appendChild(resultLabel);

    let leftCodeDiv = document.createElement("div");
    leftCodeDiv.style.cssText = "font-family: 'Courier New', Courier, monospace; " +
        "font-size: 120%; padding-top: 5px";
    document.getElementById(leftDiv.id).appendChild(leftCodeDiv);

    // right part, including a canvas, a code block
    let rightDiv = document.createElement("div");
    rightDiv.id = canvasName + "-rightDiv";
    document.getElementById(exampleDiv.id).appendChild(rightDiv);

    let rightCanvas = document.createElement("canvas");
    rightCanvas.width = 400;
    rightCanvas.height = 400;
    rightCanvas.id = canvasName + "-right";
    document.getElementById(rightDiv.id).appendChild(rightCanvas);

    let rightPanel = document.createElement("div");
    rightPanel.id = canvasName + "-rightPanel";
    rightPanel.style.cssText = "margin-top: 27px";
    document.getElementById(rightDiv.id).appendChild(rightPanel);

    // checkbox and label for showing the original coordinate system
    let orTogRight = document.createElement("input");
    orTogRight.setAttribute("type", "checkbox");
    orTogRight.setAttribute("checked", "true");
    orTogRight.id = canvasName + "-ot";
    document.getElementById(rightPanel.id).appendChild(orTogRight);

    let orLabelRight = document.createElement("label");
    orLabelRight.setAttribute("for", orTogRight.id);
    orLabelRight.innerText = "Show the original coordinate system";
    document.getElementById(rightPanel.id).appendChild(orLabelRight);

    let rightBrOne = document.createElement("br");
    rightBrOne.id = canvasName + "-rightBr1";
    document.getElementById(rightPanel.id).appendChild(rightBrOne);

    // checkbox and label for showing the final coordinate system
    let finalTog = document.createElement("input");
    finalTog.setAttribute("type", "checkbox");
    finalTog.id = canvasName + "-cst";
    document.getElementById(rightPanel.id).appendChild(finalTog);

    let finalLabel = document.createElement("label");
    finalLabel.setAttribute("for", finalTog.id);
    finalLabel.innerText = "Show the final coordinate system";
    document.getElementById(rightPanel.id).appendChild(finalLabel);

    let rightCodeDiv = document.createElement("div");
    rightCodeDiv.style.cssText = "font-family: 'Courier New', Courier, monospace; " +
        "font-size: 120%; padding-top: 5px";
    document.getElementById(rightDiv.id).appendChild(rightCodeDiv);

    /**
     * Run the program with a given transform list
     * @param {Array<Array>} transformsToDo
     */
    function run(transformsToDo) {
        // set up the left part
        let md = makeDraw(leftCanvas, transformsToDo, leftCodeDiv, dirTog);
        let rc = new RunCanvas(canvasName, md);
        rc.noloop = true;
        rc.setupSlider(0, transformsToDo.length, 0.02);
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
        let mdFinal = makeDraw(rightCanvas, transformsToDo, rightCodeDiv, undefined, orTogRight, finalTog);
        mdFinal(rightCanvas, transformsToDo.length);

        finalTog.onchange = function () {
            mdFinal(rightCanvas, transformsToDo.length);
        };

        orTogRight.onchange = function () {
            mdFinal(rightCanvas, transformsToDo.length);
        };
    }

    /**
     * Hide the user input sliders
     * @param {{ sliders: HTMLDivElement[]; }} customCommand
     */
    function hideSliders(customCommand) {
        if (customCommand && customCommand.sliders) {
            customCommand.sliders.forEach(
                /**
                 * @param {HTMLDivElement} sd
                 */
                function (sd) {
                    sd.style.display = "none";
                }
            );
        }
    }

    /**
     * Hide reverse if there is save/restore command
     * @param {Array<Array>} transformList
     */
    function hideDirTog(transformList) {
        for (let i = 0; i < transformList.length; i++) {
            let t = transformList[i];
            if (t[0] == "save" || t[0] == "restore") {
                dirTog.disabled = true;
                dirLabel.style.color = "lightgray";
                return;
            }
        }
        dirTog.disabled = false;
        dirLabel.style.color = "black";
    }

    /**
     * Reset the running canvas
     */
    function reset() {
        leftCanvas.getContext("2d").clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightCanvas.getContext("2d").clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        document.getElementById(canvasName + "-slider").style.display = "none";
        document.getElementById(canvasName + "-text").style.display = "none";
        document.getElementById(canvasName + "-run").style.display = "none";
        document.getElementById(canvasName + "-br").style.display = "none";
    }

    if (transforms) {
        hideDirTog(transforms);
        run(transforms);
    } else {
        // the customized example
        let customDiv = document.createElement("div");
        customDiv.id = canvasName + "-custom";
        insertAfter(customDiv, leftPanel);

        // explanation title
        let title = document.createElement("p");
        title.id = canvasName + "-instruction";
        title.innerHTML = "Construct your own code segment of transformations <br>"
        + "You can: <br>"
        + "<b>Add</b> a command by selecting it from the dropbox<br>"
        + "<b>Delete</b> the last command in your code segment <br>"
        + "<b>Run</b> the code segement to animate the transformation <br>"
        + "<b>Reset</b> all commands";
        // let node = document.createTextNode("Construct your own code segment of transformations");
        // title.appendChild(node);
        title.style.marginTop = '0';
        title.style.marginBottom = '0';
        customDiv.appendChild(title);

        // a dropdown menu used to select a command
        let select = makeSelect(["Please select one command", "translate", "scale", 
        "rotate", "fillRect", "save", "restore"], customDiv);
        select.id = canvasName + "-select";
        select.style.cssText = "margin-bottom: 5px; margin-top: 10px";

        // button to add the selected transform to the list
        let addButton = document.createElement("button");
        addButton.id = canvasName + "-addB";
        addButton.innerHTML = "Add";
        addButton.style.cssText = "margin-left: 7px";
        customDiv.appendChild(addButton);

        // button to delete the last transform from the list
        let deleteButton = document.createElement("button");
        deleteButton.id = canvasName + "-deleteB";
        deleteButton.innerHTML = "Delete";
        deleteButton.style.cssText = "margin-left: 7px";
        customDiv.appendChild(deleteButton);

        // button to run the program
        let runButton = document.createElement("button");
        runButton.id = canvasName + "-runB";
        runButton.innerHTML = "Run";
        runButton.style.cssText = "margin-left: 7px";
        customDiv.appendChild(runButton);

        // button to reset the program
        let resetButton = document.createElement("button");
        resetButton.id = canvasName + "-resetB";
        resetButton.innerHTML = "Reset";
        resetButton.style.cssText = "margin-left: 7px";
        customDiv.appendChild(resetButton);

        rightCodeDiv.style.paddingTop = "38px";

        // prompt for parameters
        let prompt = document.createElement("p");
        prompt.id = canvasName + "-prompt";
        prompt.innerHTML = "Set the parameters of your command";
        prompt.style.cssText = "margin: 0";
        customDiv.appendChild(prompt);

        // initially hide the panels
        prompt.style.display = "none";
        leftPanel.style.display = "none";
        rightPanel.style.display = "none";

        let customTransformList = [];
        let customCommand;
        let running;
        let lastInnerHTML = [];

        addButton.onclick = function () {
            if (customCommand) {
                let customTransform = [];
                let parameters = "";
                customTransform.push(customCommand.name);
                // read the value of sliders
                if (customCommand.sliders) {
                    customCommand.sliders.forEach(
                        /**
                         * @param {HTMLDivElement} sd
                         * @param {Number} i
                         */
                        function (sd, i) {
                            let sdSlider = /** @type {HTMLInputElement} */ (sd.children[0]);
                            customTransform.push(Number(sdSlider.value));
                            parameters += (i ? "," : "") + sdSlider.value;
                        }
                    );
                }
                customTransformList.push(customTransform);
                // console.log(customTransform);
                lastInnerHTML.push(leftCodeDiv.innerHTML);
                let htmlLine = "context." + customTransform[0] + "(" + parameters + ");";
                leftCodeDiv.innerHTML += `<span class="c-one">${htmlLine}</span><br/>`;
            }
        };

        deleteButton.onclick = function () {
            if (customTransformList.length > 0) {
                customTransformList.pop();
                leftCodeDiv.innerHTML = lastInnerHTML.pop();
            }
        };

        runButton.onclick = function () {
            // hide prompt
            document.getElementById(canvasName + "-prompt").style.display = "none";

            // hide the sliders and reverse toggle
            hideSliders(customCommand);
            hideDirTog(customTransformList);
            // reset the drop down menu
            select.options[0].selected = true;
            // in case the user keeps clicking run
            if (running) {
                leftCodeDiv.innerHTML = "";
                rightCodeDiv.innerHTML = "";
                reset();
            }
            // if there is a valid transforamtion list
            if (customTransformList.length > 0) {
                run(customTransformList);
                leftPanel.style.display = "block"; // show the panels
                rightPanel.style.display = "block";
                // in case the user clicks add when an example is running
                addButton.disabled = true;
                deleteButton.disabled = true;
                select.disabled = true;
                running = true;
                document.getElementById(canvasName + "-instruction").style.display = "none";
            }
            // console.log(customTransformList);
        };

        resetButton.onclick = function () {
            // reset the instructions
            document.getElementById(canvasName + "-instruction").style.display = "block";
            // reset the prompt
            document.getElementById(canvasName + "-prompt").style.display = "none";
            // reset the drop down menu
            select.options[0].selected = true;
            // clear the code divisions
            leftCodeDiv.innerHTML = "";
            rightCodeDiv.innerHTML = "";
            document.getElementById(canvasName + "-play").style.display = "none";
            document.getElementById(canvasName + "title").style.display = "none";
            // hide the sliders if there are any
            hideSliders(customCommand);
            leftPanel.style.display = "none";
            rightPanel.style.display = "none";
            // reset reverse toggle
            dirTog.checked = false;
            // enable the button
            addButton.disabled = false;
            deleteButton.disabled = false;
            select.disabled = false;
            // reset these if it is running
            if (running) {
                reset();
                running = false;
            }
            // clear the transformation parameters
            customCommand = undefined;
            customTransformList = [];
        };

        select.onchange = function () {
            let command = select.options[select.selectedIndex].text;
            // hide the sliders if there are any
            hideSliders(customCommand);
            document.getElementById(canvasName + "-prompt").style.display = "block";

            // create sliders and transformation command based on the selected option
            if (command == "translate") {
                // each slider corresponds to a parameter
                let translateX = createSlider("translateX: ", -50, 50, 0, 5);
                translateX.id = canvasName + "-tX";
                let translateY = createSlider("translateY: ", -50, 50, 0, 5);
                translateY.id = canvasName + "-tY";
                // store the sliders to a custom command
                customCommand = { name: "translate", sliders: [translateX, translateY] };
            } else if (command == "scale") {
                let scaleX = createSlider("scaleX: ", 0, 3, 1, 0.5);
                scaleX.id = canvasName + "-sX";
                let scaleY = createSlider("scaleY: ", 0, 3, 1, 0.5);
                scaleY.id = canvasName + "-sY";
                customCommand = { name: "scale", sliders: [scaleX, scaleY] };
            } else if (command == "rotate") {
                let rotate = createSlider("angle: ", -180, 180, 0, 5);
                rotate.id = canvasName + "-rotate";
                customCommand = { name: "rotate", sliders: [rotate] };
            } else if (command == "fillRect") {
                let posX = createSlider("posX: ", -50, 50, 0, 10);
                posX.id = canvasName + "-pX";
                let posY = createSlider("posY: ", -50, 50, 0, 10);
                posY.id = canvasName + "-pY";
                let sizeX = createSlider("sizeX: ", 0, 100, 0, 10);
                sizeX.id = canvasName + "-sizeX";
                let sizeY = createSlider("sizeY: ", 0, 100, 0, 10);
                sizeY.id = canvasName + "-sizeY";
                customCommand = { name: "fillRect", sliders: [posX, posY, sizeX, sizeY] };
            } else if (command == "save") {
                customCommand = { name: "save"};
            } else if (command == "restore") {
                customCommand = { name: "restore"};
            } else {
                // bad transforamtion command
                customCommand = undefined;
            }
            // if a valid command, show related input sliders
            if (customCommand && customCommand.sliders) {
                customCommand.sliders.forEach(
                    /**
                     * @param {HTMLDivElement} sd
                     */
                    function (sd) {
                        customDiv.appendChild(sd);
                        sd.style.display = "block";
                    }
                );
            }
        };
    }
    return exampleDiv;
}

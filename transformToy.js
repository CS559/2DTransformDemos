/*jshint esversion: 6 */
// @ts-check

// a premade function to construct a running canvas, 
// please read runCanvas.js for more details 
import { RunCanvas } from "./Libs/runCanvas.js";

// Constants
const CANVAS_SIZE = 500;
const CANVAS_SCALE = 2;
const GRID_SIZE = 50;
const GRID_LINE_WIDTH = 0.5;
const AXIS_LINE_WIDTH = 3;
const ARROW_SIZE = 6;
const SQUARE_SIZE = 20;
const SLIDER_WIDTH = 270;
const ANIMATION_DURATION = 300; // milliseconds

/**
 * Convert angles from degrees to radians
 * @param {Number} angle 
 */
function degToRad(angle) {
    return (angle * Math.PI) / 180;
}

/**
 * Draw a filled square - but don't rely on
 * fillRect (which doesn't transform correctly)
 * @param {CanvasRenderingContext2D} context 
 * @param {Number} r 
 */
function square(context, r = SQUARE_SIZE) {
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

    // Draw the original block if requested
    if (drawBlock) {
        context.fillStyle = drawBlock;
        square(context);
    }
    
    context.strokeStyle = color;
    
    // Draw grid lines
    context.beginPath();
    for (let i = -5; i <= 5; i++) {
        const pos = i * 10;
        // Vertical lines
        context.moveTo(pos, -GRID_SIZE);
        context.lineTo(pos, GRID_SIZE);
        // Horizontal lines
        context.moveTo(-GRID_SIZE, pos);
        context.lineTo(GRID_SIZE, pos);
    }
    context.lineWidth = GRID_LINE_WIDTH;
    context.stroke();

    // Draw axes in bold
    context.lineWidth = AXIS_LINE_WIDTH;
    context.beginPath();
    context.moveTo(0, -GRID_SIZE);
    context.lineTo(0, GRID_SIZE);
    context.moveTo(-GRID_SIZE, 0);
    context.lineTo(GRID_SIZE, 0);
    context.stroke();

    // Draw arrows pointing in positive direction
    context.fillStyle = color;
    context.beginPath();
    // Y-axis arrow
    context.moveTo(3, GRID_SIZE);
    context.lineTo(0, GRID_SIZE + ARROW_SIZE);
    context.lineTo(-3, GRID_SIZE);
    context.closePath();
    // X-axis arrow
    context.moveTo(GRID_SIZE, -3);
    context.lineTo(GRID_SIZE + ARROW_SIZE, 0);
    context.lineTo(GRID_SIZE, 3);
    context.closePath();
    context.fill();

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

    // If running backwards, invert the param
    let effectiveParam = direction >= 0 ? param : transformList.length - param;

    // iterate through all transforms in the list
    // but some will get done, some will not (based on how big param is)
    // look at the array test1 in the beginning of this script to have an idea of how "t
    // below would be like
    transformList.forEach(function (t, i) {
        let command = t[0]; // should be the first letter of the transfrom
        // since 2 different things begin with t...

        // keep track of which commands are ready to be run
        let amt = (i >= effectiveParam) ? 0 : Math.min(1, effectiveParam - i);

        // console.log(`param ${param} i ${i} amt ${amt} `)

        /**
         * @param {Number} amt
         * @param {string} htmlLine
         * @param {Number} instructionIndex
         */
        function stylize(amt, htmlLine, instructionIndex) {
            let color = "";
            let style = "";
            
            // Calculate distance from current effectiveParam to this instruction
            let distance = Math.abs(effectiveParam - instructionIndex);
            
            // Check if we're exactly on this instruction
            if (distance < 0.001) {
                // Exactly on this instruction - fully red
                color = "rgb(255, 0, 0)";
            } else if (distance < 1) {
                // We're within 1 step of this instruction
                // Red amount decreases as we move away
                let redAmount = Math.floor(255 * (1 - distance));
                color = `rgb(${redAmount}, 0, 0)`;
            }
            
            if (color) {
                style = `style="color: ${color}; font-weight: bold;"`;
            } else {
                style = `style="font-weight: bold;"`;
            }
            
            return (`<span ${style}>${htmlLine}</span><br/>`);
        }

        // Process transformation commands
        if (command === "translate") {
            const x = t[1] * amt;
            const y = t[2] * amt;
            context.translate(x, y);
            html += stylize(amt, `context.translate(${x.toFixed(1)},${y.toFixed(1)});`, i);
        } else if (command === "rotate") {
            const angle = t[1] * amt;
            context.rotate(degToRad(angle));
            html += stylize(amt, `context.rotate(${angle.toFixed(1)});`, i);
        } else if (command === "scale") {
            const x = amt * t[1] + (1 - amt);
            const y = amt * t[2] + (1 - amt);
            context.scale(x, y);
            html += stylize(amt, `context.scale(${x.toFixed(1)},${y.toFixed(1)});`, i);
        } else if (command === "fillRect") {
            const color = t.length > 5 ? t[5] : "blue";
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
            html += stylize(amt, `context.fillStyle="${color}"`, i);
            html += stylize(amt, `context.fillRect(${t[1]},${t[2]},${t[3]},${t[4]});`, i);
        } else if (command === "triangle") {
            const color = t.length > 3 ? t[3] : "blue";
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
            html += stylize(amt, `context.fillStyle="${color}"`, i);
            html += stylize(amt, `triangle(context,${t[1]},${t[2]});`, i);
        } else if (command === "transform") {
            // Lerp from identity matrix [1, 0, 0, 1, 0, 0] to target matrix
            const a = amt * t[1] + (1 - amt);
            const b = amt * t[2];
            const c = amt * t[3];
            const d = amt * t[4] + (1 - amt);
            const e = amt * t[5];
            const f = amt * t[6];
            context.transform(a, b, c, d, e, f);
            html += stylize(amt, `context.transform(${a.toFixed(2)},${b.toFixed(2)},${c.toFixed(2)},${d.toFixed(2)},${e.toFixed(2)},${f.toFixed(2)});`, i);
        } else if (command === "save") {
            if (amt > 0) {
                transformStack.push(context.getTransform());
            }
            html += stylize(amt, `context.save();`, i);
        } else if (command === "restore") {
            if (amt > 0 && transformStack.length) {
                context.setTransform(transformStack.pop());
            }
            html += stylize(amt, `context.restore();`, i);
        } else {
            console.log(`Unknown transform command: ${t}`);
        }
    });
    return html;
}

/**
 * Make the draw function that the canvas will need
 * @param {HTMLCanvasElement} canvas 
 * @param {any[][]} transformList 
 * @param {HTMLElement} div 
 * @param {HTMLInputElement} dirTog
 * @param {HTMLInputElement} orTog
 * @param {HTMLInputElement} finalTog
 */
function makeDraw(canvas, transformList, div, dirTog = undefined, orTog = undefined, finalTog = undefined) {
    return function draw(canvas, param) {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.scale(CANVAS_SCALE, CANVAS_SCALE);

        // Draw original coordinate system if enabled
        if (!orTog || orTog.checked) {
            drawCsys(context, "black");
        }
        
        const direction = dirTog?.checked ? -1 : 1;
        const html = doTransform(context, transformList, param, direction);
        
        // Draw final coordinate system if enabled
        if (!finalTog || finalTog.checked) {
            drawCsys(context);
        }
        
        context.restore();
        div.innerHTML = html;
    };
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
    const sliderDiv = document.createElement("div");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.style.width = `${SLIDER_WIDTH}px`;
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.step = String(step);
    sliderDiv.appendChild(slider);

    const sliderLabel = document.createElement("label");
    sliderLabel.htmlFor = slider.id;
    sliderLabel.innerText = name + slider.value;
    sliderLabel.style.marginLeft = "7px";
    sliderDiv.appendChild(sliderLabel);

    slider.oninput = () => {
        sliderLabel.innerText = name + slider.value;
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
    const select = document.createElement("select");
    values.forEach(ch => {
        const opt = document.createElement("option");
        opt.value = ch;
        opt.text = ch;
        select.add(opt);
    });
    if (initial) {
        select.value = initial;
    }
    where.appendChild(select);
    return select;
}

/**
 * Create a transformation example
 * @param {string} title 
 * @param {Array} transforms 
 */
export function createExample(title, transforms = undefined) {
    // useful strings
    const exampleCSS = "display: none; flex-wrap: wrap; align-items: flex-start; justify-content: center; margin: auto;";
    const codeCSS = "font-family: 'Courier New', Courier, monospace; " +
    "font-size: 120%; padding-top: 5px; padding-bottom: 20px";

    // Get canvas size from URL parameter, default to CANVAS_SIZE constant
    const urlParams = new URLSearchParams(window.location.search);
    const canvasSize = parseInt(urlParams.get('canvasSize')) || CANVAS_SIZE;

    // make sure each canvas has a different name
    let canvasName = title;

    // division to hold the example 
    let exampleDiv = document.createElement("div");
    exampleDiv.id = canvasName + "-example";
    exampleDiv.style.cssText = exampleCSS;
    document.getElementsByTagName("body")[0].appendChild(exampleDiv);

    // left part, including a canvas, checkboxes, a slider, and a code block
    let leftDiv = document.createElement("div");
    leftDiv.id = canvasName + "-leftDiv";
    //leftDiv.style.cssText = "padding-right: 30px";
    exampleDiv.appendChild(leftDiv);

    let leftHeader = document.createElement("h2");
    leftHeader.innerHTML = "Transformation Panel";
    leftHeader.id = canvasName + "-leftHeader";
    leftHeader.style.cssText = "text-align: center";
    leftDiv.appendChild(leftHeader);

    let leftCanvas = document.createElement("canvas");
    leftCanvas.width  = canvasSize;
    leftCanvas.height = canvasSize;
    leftCanvas.id = canvasName;
    leftCanvas.style.cssText = "max-width: 100%; height: auto; display: block;";
    leftDiv.appendChild(leftCanvas);

    // Button container for step controls (before leftPanel)
    let buttonContainer = document.createElement("div");
    buttonContainer.id = canvasName + "-buttonContainer";
    buttonContainer.style.cssText = "margin-top: 10px; margin-bottom: 10px; text-align: center;";
    leftDiv.appendChild(buttonContainer);

    let leftPanel = document.createElement("div");
    leftPanel.id = canvasName + "-leftPanel";
    leftDiv.appendChild(leftPanel);

    // Create step buttons
    let firstButton = document.createElement("button");
    firstButton.innerHTML = "First";
    firstButton.id = canvasName + "-first";
    firstButton.style.cssText = "margin: 0 5px;";
    buttonContainer.appendChild(firstButton);

    let prevButton = document.createElement("button");
    prevButton.innerHTML = "Previous";
    prevButton.id = canvasName + "-prev";
    prevButton.style.cssText = "margin: 0 5px;";
    buttonContainer.appendChild(prevButton);

    let nextButton = document.createElement("button");
    nextButton.innerHTML = "Next";
    nextButton.id = canvasName + "-next";
    nextButton.style.cssText = "margin: 0 5px;";
    buttonContainer.appendChild(nextButton);

    let lastButton = document.createElement("button");
    lastButton.innerHTML = "Last";
    lastButton.id = canvasName + "-last";
    lastButton.style.cssText = "margin: 0 5px;";
    buttonContainer.appendChild(lastButton);

    // checkbox and label for reversion
    let dirTog = document.createElement("input");
    dirTog.setAttribute("type", "checkbox");
    dirTog.id = canvasName + "-dt";
    leftPanel.appendChild(dirTog);

    let dirLabel = document.createElement("label");
    dirLabel.setAttribute("for", dirTog.id);
    dirLabel.innerText = "Run the program backwards (from the end to the slider)";
    leftPanel.appendChild(dirLabel);

    let leftBrOne = document.createElement("br");
    leftBrOne.id = canvasName + "-leftBr2";
    leftPanel.appendChild(leftBrOne);

    // checkbox and label for showing the final result
    let resultTog = document.createElement("input");
    resultTog.setAttribute("type", "checkbox");
    resultTog.setAttribute("checked", "true");
    resultTog.id = canvasName + "-rt";
    leftPanel.appendChild(resultTog);

    let resultLabel = document.createElement("label");
    resultLabel.setAttribute("for", resultTog.id);
    resultLabel.innerText = "Show the final result";
    leftPanel.appendChild(resultLabel);
    
    // Check URL for showFinal parameter
    const showFinalParam = urlParams.get('showFinal');
    if (showFinalParam !== null) {
        resultTog.checked = showFinalParam === 'true';
    }

    let leftCodeDiv = document.createElement("div");
    leftCodeDiv.id = canvasName + "-leftCode";
    leftCodeDiv.style.cssText = codeCSS;
    leftDiv.appendChild(leftCodeDiv);

    // right part, including a canvas, a code block
    let rightDiv = document.createElement("div");
    rightDiv.id = canvasName + "-rightDiv";
    exampleDiv.appendChild(rightDiv);
    
    // Set initial visibility based on checkbox state
    if (!resultTog.checked) {
        rightDiv.style.display = "none";
    }

    let rightHeader = document.createElement("h2");
    rightHeader.innerHTML = "Final Result";
    rightHeader.id = canvasName + "-rightHeader";
    rightHeader.style.cssText = "text-align: center";
    document.getElementById(rightDiv.id).appendChild(rightHeader);

    let rightCanvas = document.createElement("canvas");
    rightCanvas.width = canvasSize;
    rightCanvas.height = canvasSize;
    rightCanvas.id = canvasName + "-right";
    rightCanvas.style.cssText = "max-width: 100%; height: auto; display: block;";
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

    let rightBrTwo = document.createElement("br");
    rightBrTwo.id = canvasName + "-rightBr2";
    document.getElementById(rightPanel.id).appendChild(rightBrTwo);

    // checkbox and label for showing the final result instructions
    let rightInstructionsTog = document.createElement("input");
    rightInstructionsTog.setAttribute("type", "checkbox");
    rightInstructionsTog.setAttribute("checked", "true");
    rightInstructionsTog.id = canvasName + "-rit";
    document.getElementById(rightPanel.id).appendChild(rightInstructionsTog);

    let rightInstructionsLabel = document.createElement("label");
    rightInstructionsLabel.setAttribute("for", rightInstructionsTog.id);
    rightInstructionsLabel.innerText = "Show instructions";
    document.getElementById(rightPanel.id).appendChild(rightInstructionsLabel);

    let rightCodeDiv = document.createElement("div");
    rightCodeDiv.id = canvasName + "-rightCode";
    rightCodeDiv.style.cssText = "font-family: 'Courier New', Courier, monospace; " +
        "font-size: 120%; padding-top: 5px; padding-bottom: 20px;";
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

        let animationFrameId = null;
        let currentTarget = 0;
        let lastClickType = null;

        /**
         * Animate slider to target value with easing
         * @param {number} targetValue
         * @param {string} clickType
         */
        function animateToValue(targetValue, clickType) {
            // If animation is running and same button clicked, update target
            if (animationFrameId !== null && clickType === lastClickType) {
                currentTarget = targetValue;
                return;
            }

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            currentTarget = targetValue;
            lastClickType = clickType;
            const startValue = Number(rc.range.value);
            let startTime = null;

            function animate(currentTime) {
                if (startTime === null) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
                
                // Ease in-out cubic
                const easeProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const currentValue = startValue + (currentTarget - startValue) * easeProgress;
                rc.setValue(currentValue);
                md(leftCanvas, currentValue);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animate);
                } else {
                    animationFrameId = null;
                    lastClickType = null;
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        dirTog.onchange = () => md(leftCanvas, Number(rc.range.value));

        // Set up step button handlers with animation
        firstButton.onclick = () => animateToValue(0, 'first');

        prevButton.onclick = () => {
            const currentValue = Number(rc.range.value);
            const isOnInteger = Math.abs(currentValue - Math.round(currentValue)) < 0.001;
            const newValue = isOnInteger 
                ? Math.max(0, currentValue - 1)
                : Math.max(0, Math.floor(currentValue));
            animateToValue(newValue, 'prev');
        };

        nextButton.onclick = () => {
            const currentValue = Number(rc.range.value);
            const isOnInteger = Math.abs(currentValue - Math.round(currentValue)) < 0.001;
            const newValue = isOnInteger
                ? Math.min(transformsToDo.length, currentValue + 1)
                : Math.min(transformsToDo.length, Math.ceil(currentValue));
            animateToValue(newValue, 'next');
        };

        lastButton.onclick = () => animateToValue(transformsToDo.length, 'last');

        // set up the right part if the checkbox is checked
        resultTog.onchange = function () {
            if (resultTog.checked) {
                document.getElementById(rightDiv.id).style.display = "block";
            } else {
                document.getElementById(rightDiv.id).style.display = "none";
            }
            
            // Update URL with showFinal parameter
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('showFinal', resultTog.checked.toString());
            const newUrl = window.location.pathname + '?' + urlParams.toString();
            window.history.pushState({showFinal: resultTog.checked}, '', newUrl);
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
        
        // Handle showing/hiding final result instructions
        rightInstructionsTog.onchange = function () {
            if (rightInstructionsTog.checked) {
                document.getElementById(rightCodeDiv.id).style.display = "block";
            } else {
                document.getElementById(rightCodeDiv.id).style.display = "none";
            }
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
        document.getElementById(canvasName + "-play").style.display = "none";
        document.getElementById(canvasName + "-title").style.display = "none";
        buttonContainer.style.display = "none";
    }

    if (transforms) {
        hideDirTog(transforms);
        buttonContainer.style.display = "block";
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
        + "Enter commands in the text editor below. Supported commands:<br>"
        + "<b>translate(x, y)</b> - Move the coordinate system<br>"
        + "<b>scale(x, y)</b> - Scale the coordinate system<br>"
        + "<b>rotate(angle)</b> - Rotate by angle in degrees<br>"
        + "<b>fillRect(x, y, width, height)</b> - Draw a rectangle<br>"
        + "<b>transform(a, b, c, d, e, f)</b> - Apply transformation matrix<br>"
        + "<b>save()</b> and <b>restore()</b> - Save/restore transformation state<br>"
        + "Enter one command per line. Example: translate(10, 20)";
        title.style.marginTop = '0';
        title.style.marginBottom = '10px';
        customDiv.appendChild(title);

        // Text area for entering commands
        let textArea = document.createElement("textarea");
        textArea.id = canvasName + "-textarea";
        textArea.style.cssText = "width: 100%; height: 150px; font-family: 'Courier New', Courier, monospace; font-size: 14px; margin-bottom: 5px; padding: 5px; box-sizing: border-box;";
        textArea.placeholder = "translate(10, 20)\nrotate(45)\nscale(1.5, 1.5)";
        customDiv.appendChild(textArea);

        // Error message display
        let errorDiv = document.createElement("div");
        errorDiv.id = canvasName + "-error";
        errorDiv.style.cssText = "color: red; font-weight: bold; margin-bottom: 5px; min-height: 20px; font-size: 14px;";
        customDiv.appendChild(errorDiv);

        // Button container
        let buttonRow = document.createElement("div");
        buttonRow.style.cssText = "margin-bottom: 10px;";
        customDiv.appendChild(buttonRow);

        // button to run the program
        let runButton = document.createElement("button");
        runButton.id = canvasName + "-runB";
        runButton.innerHTML = "Run";
        runButton.style.cssText = "margin-right: 7px;";
        buttonRow.appendChild(runButton);

        // button to reset the program
        let resetButton = document.createElement("button");
        resetButton.id = canvasName + "-resetB";
        resetButton.innerHTML = "Reset";
        resetButton.style.cssText = "margin-right: 7px;";
        buttonRow.appendChild(resetButton);

        // button to edit the commands
        let editButton = document.createElement("button");
        editButton.id = canvasName + "-editB";
        editButton.innerHTML = "Edit";
        editButton.style.cssText = "margin-right: 7px; display: none;";
        buttonRow.appendChild(editButton);

        rightCodeDiv.style.paddingTop = "38px";

        // initially hide the panels
        leftPanel.style.display = "none";
        rightPanel.style.display = "none";

        let customTransformList = [];
        let running;

        /**
         * Parse a command string into a transformation array
         * @param {string} line
         * @returns {{transform: Array, error: string|null}}
         */
        function parseCommand(line) {
            line = line.trim();
            if (!line) return { transform: null, error: null };

            // Match command pattern: commandName(params)
            let match = line.match(/^(\w+)\((.*)\)$/);
            if (!match) {
                return { transform: null, error: `Invalid syntax: "${line}". Expected format: command(params)` };
            }

            let command = match[1];
            let paramsStr = match[2].trim();

            // Parse parameters
            let params = [];
            if (paramsStr) {
                let paramParts = paramsStr.split(',');
                for (let p of paramParts) {
                    let num = parseFloat(p.trim());
                    if (isNaN(num)) {
                        return { transform: null, error: `Invalid number: "${p.trim()}" in command: ${line}` };
                    }
                    params.push(num);
                }
            }

            // Validate commands
            if (command === "translate") {
                if (params.length !== 2) {
                    return { transform: null, error: `translate requires 2 parameters (x, y), got ${params.length}` };
                }
                return { transform: ["translate", params[0], params[1]], error: null };
            } else if (command === "scale") {
                if (params.length !== 2) {
                    return { transform: null, error: `scale requires 2 parameters (x, y), got ${params.length}` };
                }
                return { transform: ["scale", params[0], params[1]], error: null };
            } else if (command === "rotate") {
                if (params.length !== 1) {
                    return { transform: null, error: `rotate requires 1 parameter (angle), got ${params.length}` };
                }
                return { transform: ["rotate", params[0]], error: null };
            } else if (command === "fillRect") {
                if (params.length !== 4) {
                    return { transform: null, error: `fillRect requires 4 parameters (x, y, width, height), got ${params.length}` };
                }
                return { transform: ["fillRect", params[0], params[1], params[2], params[3]], error: null };
            } else if (command === "transform") {
                if (params.length !== 6) {
                    return { transform: null, error: `transform requires 6 parameters (a, b, c, d, e, f), got ${params.length}` };
                }
                return { transform: ["transform", params[0], params[1], params[2], params[3], params[4], params[5]], error: null };
            } else if (command === "save") {
                if (params.length !== 0) {
                    return { transform: null, error: `save requires no parameters, got ${params.length}` };
                }
                return { transform: ["save"], error: null };
            } else if (command === "restore") {
                if (params.length !== 0) {
                    return { transform: null, error: `restore requires no parameters, got ${params.length}` };
                }
                return { transform: ["restore"], error: null };
            } else {
                return { transform: null, error: `Unknown command: "${command}". Supported: translate, scale, rotate, fillRect, transform, save, restore` };
            }
        }

        /**
         * Parse all commands from textarea
         * @returns {{transforms: Array, error: string|null}}
         */
        function parseAllCommands() {
            let lines = textArea.value.split('\n');
            let transforms = [];
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue; // Skip empty lines
                
                let result = parseCommand(line);
                if (result.error) {
                    return { transforms: [], error: `Line ${i + 1}: ${result.error}` };
                }
                if (result.transform) {
                    transforms.push(result.transform);
                }
            }
            
            return { transforms: transforms, error: null };
        }

        // Real-time validation as user types
        textArea.oninput = function () {
            if (running) return; // Don't validate while running
            
            let result = parseAllCommands();
            if (result.error) {
                errorDiv.textContent = result.error;
                errorDiv.style.color = "red";
            } else if (result.transforms.length === 0) {
                errorDiv.textContent = "";
            } else {
                errorDiv.textContent = `✓ ${result.transforms.length} valid command${result.transforms.length > 1 ? 's' : ''}`;
                errorDiv.style.color = "green";
            }
        };

        runButton.onclick = function () {
            // Parse commands from textarea
            let result = parseAllCommands();
            
            if (result.error) {
                errorDiv.textContent = result.error;
                errorDiv.style.color = "red";
                return;
            }
            
            if (result.transforms.length === 0) {
                errorDiv.textContent = "No commands to run. Please enter at least one command.";
                errorDiv.style.color = "red";
                return;
            }

            // Clear any previous error
            errorDiv.textContent = "";
            
            // in case the user keeps clicking run
            if (running) {
                leftCodeDiv.innerHTML = "";
                rightCodeDiv.innerHTML = "";
                reset();
            }
            
            customTransformList = result.transforms;
            hideDirTog(customTransformList);
            
            // Run the transformations
            run(customTransformList);
            buttonContainer.style.display = "block"; // show the buttons
            leftPanel.style.display = "block"; // show the panels
            rightPanel.style.display = "block";
            
            // Hide the input elements and Run/Reset buttons while running
            textArea.style.display = "none";
            errorDiv.style.display = "none";
            title.style.display = "none";
            runButton.style.display = "none";
            resetButton.style.display = "none";
            editButton.style.display = "inline-block";
            running = true;
        };

        editButton.onclick = function () {
            // Show the input elements and Run/Reset buttons
            title.style.display = "block";
            textArea.style.display = "block";
            errorDiv.style.display = "block";
            runButton.style.display = "inline-block";
            resetButton.style.display = "inline-block";
            editButton.style.display = "none";
            
            // Hide the running elements
            buttonContainer.style.display = "none";
            leftPanel.style.display = "none";
            rightPanel.style.display = "none";
            leftCodeDiv.innerHTML = "";
            rightCodeDiv.innerHTML = "";
            
            // Clear canvases
            reset();
            running = false;
        };

        resetButton.onclick = function () {
            // show the input elements
            title.style.display = "block";
            textArea.style.display = "block";
            errorDiv.style.display = "block";
            runButton.style.display = "inline-block";
            resetButton.style.display = "inline-block";
            editButton.style.display = "none";
            // clear the code divisions
            leftCodeDiv.innerHTML = "";
            rightCodeDiv.innerHTML = "";
            document.getElementById(canvasName + "-play").style.display = "none";
            document.getElementById(canvasName + "-title").style.display = "none";
            buttonContainer.style.display = "none";
            leftPanel.style.display = "none";
            rightPanel.style.display = "none";
            // reset reverse toggle
            dirTog.checked = false;
            // reset textarea
            textArea.disabled = false;
            textArea.value = "";
            errorDiv.textContent = "";
            // reset these if it is running
            if (running) {
                reset();
                running = false;
            }
            // clear the transformation list
            customTransformList = [];
        };
    }
    return exampleDiv;
}
/*jshint esversion: 6 */
// @ts-check

import { RunCanvas } from "./Libs/runCanvas.js";


let test1 = [
    ["rotate",45],
    ["scale",2,1],
    ["rotate",-45],
    ["fillrect",-10,-10,20,20]
];

function degToRad(angle) {
    return angle / 180 * Math.PI;
}

/**
 * Draw a filled square - but don't rely on
 * fillRect (which doesn't transform correctly)
 * @param {CanvasRenderingContext2D} context 
 * @param {Number} r 
 */
function square(context,r=20){
    context.beginPath();
    context.moveTo(-r,-r);
    context.lineTo( r,-r);
    context.lineTo( r, r);
    context.lineTo(-r, r);
    context.closePath();
    context.fill();           
}
/**
 * Draw a coordinate system
 * @param {CanvasRenderingContext2D} context 
 * @param {String} color 
 * @param {String} [drawBlock=undefined] 
 */
function drawCsys(context,color="#7F0000",drawBlock=undefined) {
    context.save();
    context.fillStyle = "#FFFFFF80"; // color + "10";

    if (drawBlock) {
        context.fillStyle = drawBlock;
        square(context);
    }
    context.strokeStyle = color;
    context.beginPath();
    for (let x=-5; x<6; x+=1) {
        context.moveTo(x*10, -50);
        context.lineTo(x*10, 50);
        context.moveTo(50, x*10);
        context.lineTo(-50,x*10);
    }
    context.lineWidth = 0.5;
    context.stroke();
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0,-50);
    context.lineTo(0,50);
    context.moveTo(-50,0);
    context.lineTo(50,0);
    context.stroke();
    context.restore();
}


/**
 * 
 * @param {CanvasRenderingContext2D} context 
 * @param {Array} transformList 
 * @param {Number} param 
 * @param {*} [direction]
 */
function doTransform(context, transformList, param, direction=1) {
    let html = "";

    

    transformList.forEach(function(t,i) {
        let command = t[0][0];
        let amt = (direction >= 0) ? 
        (i>param) ? 0 : Math.min(1,param-i) : 
        ((i+1)<param) ? 0 : Math.min(1,(i+1)-param) ;  

        // console.log(`param ${param} i ${i} amt ${amt} `)

        /* made a local function so it has access to direction and list */
        function stylize(amt,htmlLine) {
            let style = (amt <= 0) ? "c-zero" : ((amt < 1) ? "c-act" : "c-one");
            return (`<span class="${style}">${htmlLine}</span><br/>`);
        }        

        if (command == "t") {
            let x = t[1] * amt;
            let y = t[2] * amt;
            context.translate(x,y);
            html += stylize(amt,`context.translate(${x.toFixed(1)},${y.toFixed(1)});`);
        } else if (command=="r") {
            let a = t[1] * amt;
            context.rotate(degToRad(a));
            html += stylize(amt,`context.rotate(${a.toFixed(1)});`);
        } else if (command=="s") {
            let x = amt * t[1] + (1-amt) * 1;
            let y = amt * t[2] + (1-amt) * 1;
            context.scale(x,y);
            html += stylize(amt,`context.scale(${x.toFixed(1)},${y.toFixed(1)});`);
        } else if (command=="f") {
            let color = t.length > 5 ? t[5] : "blue";
            if (amt > 0) {
                context.save();
                context.fillStyle = color;
                context.beginPath();
                context.moveTo(t[1],     t[2]);
                context.lineTo(t[1],     t[2]+t[4]);
                context.lineTo(t[1]+t[3],t[2]+t[4]);
                context.lineTo(t[1]+t[3],t[2]);
                context.closePath();
                context.fill();
                context.restore();
            }
            html += stylize(amt,`context.fillStyle="${color}"`);
            html += stylize(amt,`context.fillRect(${t[1]},${t[2]},${t[3]},${t[4]});`);
        } else {
            console.log(`Bad transform ${t}`);
        }
    });     // end foreach transform
    return html;
}

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<Array>} transformList 
 * @param {HTMLElement} div 
 */
function makeDraw(canvas,transformList, div, dirTog)
{
    function draw(canvas,param) {
        let context = canvas.getContext("2d");
        context.clearRect(0,0,canvas.width,canvas.height);

        context.save();
        context.translate(canvas.width/2,canvas.height/2);
        context.scale(2,2);
        context.save();

        drawCsys(context,"black");

        let html = doTransform(context,transformList,param,dirTog.checked ? -1 : 1);
        drawCsys(context);

        context.restore();
        context.restore();

        div.innerHTML = html;
    }
    return draw;
}

export function test (title,transforms=test1)
{
    // let mycanvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));

    let canvasName = performance.now().toString();

    let heading = document.createElement("h2");
    heading.innerText = title;
    document.getElementsByTagName("body")[0].appendChild(heading);

    let mycanvas = document.createElement("canvas");
    mycanvas.width = 400;
    mycanvas.height = 400;
    mycanvas.id = canvasName;
    document.getElementsByTagName("body")[0].appendChild(mycanvas);

    let dirTog = document.createElement("input");
    dirTog.setAttribute("type","checkbox");
    dirTog.id = canvasName + "-dt";
    document.getElementsByTagName("body")[0].appendChild(dirTog);

    let dirLabel = document.createElement("label");
    dirLabel.setAttribute("for",dirTog.id);
    dirLabel.innerText = "Reverse";
    document.getElementsByTagName("body")[0].appendChild(dirLabel);
   

    let div = document.createElement("div");
    div.style.cssText = "font-family: 'Courier New', Courier, monospace; font-size: 120%";
    document.getElementsByTagName("body")[0].appendChild(div);

    let md = makeDraw(mycanvas,transforms,div,dirTog);
    let rc = new RunCanvas(canvasName,md);
    rc.noloop = true;
    rc.setupSlider(0,transforms.length,0.02);
    rc.setValue(0);

    dirTog.onchange = function() {
        md(mycanvas,Number(rc.range.value));
    };

    let br = document.createElement("br");
    document.getElementsByTagName("body")[0].appendChild(br);
}
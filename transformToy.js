/*jshint esversion: 6 */
// @ts-check

import { RunCanvas } from "./Libs/runCanvas.js";


let test1 = [
    ["rotate",45],
    ["scale",2,1],
    ["rotate",-45]
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
function doTransform(context, transformList, param, direction) {
    let html = "";

    transformList.forEach(function(t,i) {
        let command = t[0][0];
        let amt = (i>param) ? 0 : Math.min(1,param-i); 

        // console.log(`param ${param} i ${i} amt ${amt} `)

        if (command == "t") {
            let x = t[1] * amt;
            let y = t[2] * amt;
            context.translate(x,y);
            html += `context.translate(${x.toFixed(1)},${y.toFixed(1)});<br/>`;
        } else if (command=="r") {
            let a = t[1] * amt;
            context.rotate(degToRad(a));
            html += `context.rotate(${a.toFixed(1)}); <br/>`;
        } else if (command=="s") {
            let x = amt * t[1] + (1-amt) * 1;
            let y = amt * t[2] + (1-amt) * 1;
            context.scale(x,y);
            html += `context.scale(${x.toFixed(1)},${y.toFixed(1)});<br/>`;
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
function makeDraw(canvas,transformList, div)
{
    return function draw(canvas,param) {
        let context = canvas.getContext("2d");
        context.clearRect(0,0,canvas.width,canvas.height);

        context.save();
        context.translate(canvas.width/2,canvas.height/2);
        context.save();

        let html = doTransform(context,transformList,param);
        drawCsys(context);

        context.restore();
        context.restore();

        div.innerHTML = html;
    };
}

export function test ()
{
    let mycanvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
    
    let rc = new RunCanvas("canvas",makeDraw(mycanvas,test1,document.getElementById("mydiv")));
    rc.setupSlider(0,3,0.02);
    rc.setValue(0);
}
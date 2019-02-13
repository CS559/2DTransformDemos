/*jshint esversion: 6 */
// @ts-check

import {RunCanvas} from "./Libs/runCanvas.js";

export function test() {
    let mycanvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));

    function drawExp(canvas,param) {
        let context = canvas.getContext("2d");
        context.save();
        context.clearRect(0,0, canvas.width, canvas.height);
        /**
         * 0 = draw square
         * 1 - initial coordinate system
         * 2 - rotated coordinate system
         * 3 - scaled coordinate system
         * 4 - un-rotated coordinate system
         * 5 - draw square
         */
        let u = param;
        function drawCsys(color="#7F0000",drawBlock=undefined) {
                context.save();
                context.fillStyle = "#FFFFFF80"; // color + "10";
        
                if (drawBlock) {
                    context.fillStyle = drawBlock;
                    context.beginPath();
                    context.moveTo(-20,-20);
                    context.lineTo( 20,-20);
                    context.lineTo( 20, 20);
                    context.lineTo(-20, 20);
                    context.closePath();
                    context.fill();           
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
        context.translate(canvas.width/2,canvas.height/2);

        // always draw the base coordinate system in black
        // only draw the original object if in step 0
        drawCsys("#000000",  (u<1) ? "#80000080" : undefined);

        let html = "// angles shown in degrees<br/>";

        if (u>1) {
            context.save();
            let a1 = Math.PI/4 * Math.min(u-1,1);
            context.rotate(a1);
            if (a1>0) {
                let a1deg = Math.round(a1 / Math.PI * 180);
                html += `context.rotate(${a1deg}); <br/>`;
            }
            let s2 = u<2 ? 1 : Math.min(2,u-1);
            context.scale(s2,1);
            if (s2>1) {
                html += `context.scale(${s2.toFixed(2)},1); <br/>`;
            }
            let a2 = u<3 ? 0 : -Math.PI/4 * Math.min(1,u-3);
            context.rotate(a2);
            if (a2<0) {
                let a2deg = Math.round(a2 / Math.PI * 180);
                html += `context.rotate(${a2deg}); <br/>`;
                html += `// warning: this is a rotation in the stretched space<br/>`;
                html += `// it looks weird - it is not rigid in screen coordinates<br/>`;
            }
            drawCsys("#FF0000",u>4 ? "#FF000080" : "underfined");   
            context.restore();
        }
        if (u>5) {
            drawCsys("#00000000","#800000");
        }

        let mydiv=document.getElementById("mydiv");
        mydiv.innerHTML = html;

       context.restore();
    } // drawExp
    let rc = new RunCanvas("canvas",drawExp,true);
    rc.setValue(0);
    rc.setupSlider(0,6,0.02);
  }

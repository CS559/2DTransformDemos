/* jshint -W069, esversion:6 */
// @ts-check
export {};
import { createExample, makeSelect } from "./transformToy.js";

/**
 * Set up the demo
 */

let headingDiv = document.createElement("div");
headingDiv.id = "headingDiv";
document.getElementsByTagName("body")[0].appendChild(headingDiv);

let headerTitle = document.createElement("h1");
headerTitle.innerHTML = "2D Transformation Toy"
headingDiv.appendChild(headerTitle);

let br = document.createElement("br");
document.getElementsByTagName("body")[0].appendChild(br);

// get the filename for the examples list as the query string
// don't forget to remove the "?"
const filename = window.location.search.substring(1) || "examples.json";
console.log(`getting example list file ${filename}`) ;

fetch(filename).then(response => response.json())
    .then(data => selectAndGo(data))
    .catch(error => console.log(`Error loading ${filename} - ${error}`));

function selectAndGo(examples) {
    console.log(examples);

    let titles = ["Please select one example"];
    let exampleDivs = [];
    examples.forEach(e => {
        exampleDivs.push(createExample(e.title, e.transformations));
        titles.push(e.title);
    });

    // make a dropdown menu to select examples
    let selectExample = makeSelect(titles, headingDiv);
    selectExample.id = "exampleSelect";

    // switch between different examples
    let currentExample;
    selectExample.onchange = function () {
        document.getElementById("headingDiv").style.paddingTop = 0;
        if (currentExample) currentExample.style.display = "none";
        let selectedTitle = selectExample.options[selectExample.selectedIndex].text;
        exampleDivs.forEach(ed => {
            if (ed.id == selectedTitle + "-example") {
                currentExample = ed;
            }
        });
        if (currentExample){ 
            currentExample.style.display = "flex";
        }
    };
}
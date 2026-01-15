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

// Create a container for selector and button
let controlsDiv = document.createElement("div");
controlsDiv.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 20px;";
headingDiv.appendChild(controlsDiv);

// Create a button to toggle interface visibility
let toggleInterfaceButton = document.createElement("button");
toggleInterfaceButton.innerHTML = "Hide Interface";
toggleInterfaceButton.style.cssText = "padding: 10px 15px; display: none; white-space: nowrap; flex-shrink: 0;";
toggleInterfaceButton.id = "toggleInterfaceButton";
controlsDiv.appendChild(toggleInterfaceButton);

let br = document.createElement("br");
document.getElementsByTagName("body")[0].appendChild(br);

// get the filename for the examples list from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file') || "examples.json";
console.log(`getting example list file ${filename}`) ;

fetch(filename).then(response => response.json())
    .then(data => selectAndGo(data))
    .catch(error => console.log(`Error loading ${filename} - ${error}`));

function selectAndGo(examples) {
    let titles = ["Please select one example"];
    let exampleDivs = [];
    examples.forEach(e => {
        exampleDivs.push(createExample(e.title, e.transformations));
        titles.push(e.title);
    });

    // make a dropdown menu to select examples
    let selectExample = makeSelect(titles, controlsDiv);
    selectExample.id = "exampleSelect";
    selectExample.style.cssText = "flex: 1; min-width: 200px;";
    
    // Move the button after the select in the DOM (so it appears on the right)
    controlsDiv.removeChild(toggleInterfaceButton);
    controlsDiv.appendChild(toggleInterfaceButton);

    let interfaceHidden = false;
    
    toggleInterfaceButton.onclick = function() {
        if (!currentExample) return;
        
        interfaceHidden = !interfaceHidden;
        
        // Get the interface elements from the current example
        let exampleId = currentExample.id.replace("-example", "");
        let leftPanel = document.getElementById(exampleId + "-leftPanel");
        let buttonContainer = document.getElementById(exampleId + "-buttonContainer");
        let slider = document.getElementById(exampleId + "-slider");
        let sliderText = document.getElementById(exampleId + "-text");
        let sliderTitle = document.getElementById(exampleId + "-title");
        let runButton = document.getElementById(exampleId + "-run");
        let playButton = document.getElementById(exampleId + "-play");
        let rightPanel = document.getElementById(exampleId + "-rightPanel");
        let leftCodeDiv = document.getElementById(exampleId + "-leftCode");
        let rightCodeDiv = document.getElementById(exampleId + "-rightCode");
        let rightInstructionsTog = document.getElementById(exampleId + "-rit");
        
        // Toggle visibility
        if (interfaceHidden) {
            // Hide elements (keep selector, canvases, slider, play button, and step buttons visible)
            if (leftPanel) leftPanel.style.display = "none";
            if (sliderText) sliderText.style.display = "none";
            if (sliderTitle) sliderTitle.style.display = "none";
            if (runButton) runButton.style.display = "none";
            if (rightPanel) rightPanel.style.display = "none";
            if (leftCodeDiv) leftCodeDiv.style.display = "none";
            if (rightCodeDiv) rightCodeDiv.style.display = "none";
            if (rightInstructionsTog) rightInstructionsTog.checked = false;
            // Keep slider, playButton, and buttonContainer visible
        } else {
            // Show elements by removing display override (restores original CSS)
            if (leftPanel) leftPanel.style.display = "";
            if (buttonContainer) buttonContainer.style.display = "";
            if (slider) slider.style.display = "";
            if (sliderText) sliderText.style.display = "";
            if (sliderTitle) sliderTitle.style.display = "";
            // Don't restore runButton - keep it hidden
            if (playButton) playButton.style.display = "";
            if (rightPanel) rightPanel.style.display = "";
            if (leftCodeDiv) leftCodeDiv.style.display = "";
            if (rightCodeDiv) rightCodeDiv.style.display = "";
            if (rightInstructionsTog) rightInstructionsTog.checked = true;
        }
        
        // Update button text
        toggleInterfaceButton.innerHTML = interfaceHidden ? "Show Interface" : "Hide Interface";
        
        // Update URL with hideInterface parameter
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('hideInterface', interfaceHidden.toString());
        const newUrl = window.location.pathname + '?' + urlParams.toString();
        window.history.pushState({hideInterface: interfaceHidden}, '', newUrl);
    };

    // switch between different examples
    let currentExample;
    selectExample.onchange = function () {
        document.getElementById("headingDiv").style.paddingTop = 0;
        if (currentExample) currentExample.style.display = "none";
        
        let selectedTitle = selectExample.options[selectExample.selectedIndex].text;
        
        // Reset currentExample
        currentExample = null;
        
        exampleDivs.forEach(ed => {
            if (ed.id == selectedTitle + "-example") {
                currentExample = ed;
            }
        });
        
        if (currentExample){ 
            currentExample.style.display = "flex";
            
            // Show toggle interface button
            toggleInterfaceButton.style.display = "block";
            
            // Check URL for hideInterface parameter
            const urlParams = new URLSearchParams(window.location.search);
            const hideInterfaceParam = urlParams.get('hideInterface');
            interfaceHidden = hideInterfaceParam === 'true';
            toggleInterfaceButton.innerHTML = interfaceHidden ? "Show Interface" : "Hide Interface";
            
            // Apply the interface visibility state
            let exampleId = currentExample.id.replace("-example", "");
            let leftPanel = document.getElementById(exampleId + "-leftPanel");
            let sliderText = document.getElementById(exampleId + "-text");
            let sliderTitle = document.getElementById(exampleId + "-title");
            let runButton = document.getElementById(exampleId + "-run");
            let rightPanel = document.getElementById(exampleId + "-rightPanel");
            let leftCodeDiv = document.getElementById(exampleId + "-leftCode");
            let rightCodeDiv = document.getElementById(exampleId + "-rightCode");
            let rightInstructionsTog = document.getElementById(exampleId + "-rit");
            
            if (interfaceHidden) {
                if (leftPanel) leftPanel.style.display = "none";
                if (sliderText) sliderText.style.display = "none";
                if (sliderTitle) sliderTitle.style.display = "none";
                if (runButton) runButton.style.display = "none";
                if (rightPanel) rightPanel.style.display = "none";
                if (leftCodeDiv) leftCodeDiv.style.display = "none";
                if (rightCodeDiv) rightCodeDiv.style.display = "none";
                if (rightInstructionsTog) rightInstructionsTog.checked = false;
            }
            
            // Update URL with demo name
            urlParams.set('demo', selectedTitle);
            const newUrl = window.location.pathname + '?' + urlParams.toString();
            window.history.pushState({demo: selectedTitle}, '', newUrl);
        } else {
            // If no demo selected (back to "Please select"), remove demo param
            toggleInterfaceButton.style.display = "none";
            
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete('demo');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.pushState({}, '', newUrl);
        }
    };
    
    // Check URL for demo parameter and auto-select if found
    const urlParams = new URLSearchParams(window.location.search);
    const demoName = urlParams.get('demo');
    
    if (demoName) {
        // Find matching demo in the titles list
        let matchIndex = -1;
        for (let i = 0; i < titles.length; i++) {
            if (titles[i].toLowerCase() === demoName.toLowerCase()) {
                matchIndex = i;
                break;
            }
        }
        
        // If found, select it
        if (matchIndex > 0) {
            selectExample.selectedIndex = matchIndex;
            selectExample.onchange();
        }
    }
}
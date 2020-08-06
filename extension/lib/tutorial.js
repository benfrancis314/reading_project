"use strict";
(function(){
var namespace = "lib/tutorial.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

// URLs for various images; putting here for readability
let popupCheckmarkUrl = chrome.runtime.getURL('/images/checkMark.svg');
let downArrow = chrome.runtime.getURL('/images/downArrow.svg');
let upArrow = chrome.runtime.getURL('/images/upArrow.svg');
let leftArrow = chrome.runtime.getURL('/images/leftArrow.svg');
let rightArrow = chrome.runtime.getURL('/images/rightArrow.svg');
let leftArrowKey = chrome.runtime.getURL('/images/leftArrowKey.svg');
let rightArrowKey = chrome.runtime.getURL('/images/rightArrowKey.svg');
let upArrowKey = chrome.runtime.getURL('/images/upArrowKey.svg');
let downArrowKey = chrome.runtime.getURL('/images/downArrowKey.svg');
let spaceBar = chrome.runtime.getURL('/images/instructionAutoRead.svg');
let slashKey = chrome.runtime.getURL('/images/instructionKeywordToggle.svg');
let shiftButton = chrome.runtime.getURL('/images/instructionHighlight.svg');
let alt_r = chrome.runtime.getURL('/images/instructionOnOff.svg');
let logo = chrome.runtime.getURL('/images/logoWithBackground.svg');
let puzzle = chrome.runtime.getURL('/images/puzzlePiece.svg');
let pin = chrome.runtime.getURL('/images/pin.svg');

/*
Represents the tutorial objects
*/
class Tutorial {
    /*
    Initialize the tutorial. 
    */
    constructor() {
        // Track which step you're on now; for bidirectional control (TODO)
        this.currentStep = 0;
        // Html blocks to be inserted
        this.startHtml = null;
        this.instructionsHtml = null;
        this.moveHtml = null;
        this.autoHtml = null;
        this.keywordsHtml = null;
        this.highlightHtml = null;
        this.onOffHtml = null;

        this.setHtmlElements();
        this.startTutorial();
    }

    // Define the different HTML blocks
    setHtmlElements() {
        this.startHtml = `
            <div id="tutorialStartContainer" class="tutorialContainer">
                <div id="tutorialStartWelcome">welcome to</div>
                <div id="tutorialStartTitle">READER<span class="highlightText">EASE&#8239;</span></div>
                <div id="tutorialStartSlogan">FOCUS&#8239;<span class="highlightTextItalic">&#8239;FASTER&#8239;</span></div>
                <div id="tutorialStartButtonsContainer">
                    <div id="tutorialStartSkipButton">SKIP</div>
                    <div id="tutorialStartTutorialButton">TUTORIAL</div>
                </div>
            </div>`;
        this.instructionsHtml = `
            <div id="tutorialInstructionsContainer" class="tutorialContainer">
                <div id="tutorialTextTwo">Click<span id="tutorialSettingsButton">${window.gearLogo}</span>for <span class="bold">instructions</span></div>
                <div class="popupCheckmark"></div>
                <div id="tutorialStepTwoDownArrow"></div>
            </div>`;
        this.moveHtml = `
            <div id="tutorialMoveContainer" class="tutorialContainer">
                <div id="tutorialTextThree">Use <span id="tutorialMoveBackwardLogo"></span>&nbsp;and <span id="tutorialMoveForwardLogo"></span>&nbsp;to <span class="bold">move</span><br/> the current sentence. </div>
                <div class="popupCheckmark" id="popupCheckmarkTwoLiner"></div>
                <div id="tutorialStepThreeDownArrow"></div>
            </div>`;
        this.autoHtml = `
            <div id="tutorialAutoContainer" class="tutorialContainer">
                <div id="tutorialTextFourContainer">
                    <div class="tutorialTextPartOne">
                        Turn <span class="bold">auto-scroll</span> on or off<br/>using <span id="tutorialSpaceLogo"></span>
                    </div>
                    <div class="tutorialTextPartTwo">
                        Adjust the <span class="bold">speed</span> using<br/><span id="tutorialSlowLogo"></span> and <span id="tutorialFastLogo"></span>
                    </div>
                </div>
                <div class="popupCheckmark" id="popupCheckmarkFourLiner"></div>
                <div id="tutorialStepFourLeftArrow"></div>
            </div>`;
        this.keywordsHtml = `
            <div id="tutorialKeywordsContainer" class="tutorialContainer">
                <div id="tutorialTextFive">
                    Try different <span class="bold">keyword</span><br/>colors using <span id="tutorialSlashLogo"></span>
                </div>
                <div class="popupCheckmark" id="popupCheckmarkTwoLiner"></div>
                <div id="tutorialStepFiveUpArrow"></div>
            </div>`;
        this.highlightHtml = `
            <div id="tutorialHighlightContainer" class="tutorialContainer">
                <div id="tutorialTextSix">
                    <span class="bold">Highlight</span> a sentence<br/>for later using <span id="tutorialShiftLogo"></span>
                </div>
                <div class="popupCheckmark" id="popupCheckmarkTwoLiner"></div>
                <div id="tutorialStepSixRightArrow"></div>
            </div>`;
        this.onOffHtml = `
            <div id="tutorialOnOffContainer" class="tutorialContainer">
                <div id="tutorialTextSevenContainer">
                    <div class="tutorialTextPartOne" id="tutorialTextOneLiner">
                        Click <span id="tutorialIconLogo"></span> to turn <span class="bold">ON/OFF</span>
                    </div>
                    <div class="tutorialTextPartTwo">
                        <span class="softText">Don't see this?</span><br/>Click <span id="tutorialPuzzleLogo"></span> then <span id="tutorialPinLogo"></span> to <span class="bold">pin</span>
                    </div>
                </div>
                <div class="popupCheckmark" id="endTutorialButton"><div id="endTutorialButtonText">END</div></div>                
                <div id="tutorialStepSevenUpArrow"></div>
            </div>`;
    }
    
    // Welcome
    startTutorial() {
        let self = this;
        $(this.startHtml).insertAfter($("body").children().first());
        let startContainer = $("#tutorialStartContainer");
        startContainer.animate({"opacity": "1"}, 500);
        $("#tutorialStartSkipButton").click(function() {
            startContainer.fadeOut(250);
        });
        $("#tutorialStartTutorialButton").click(function() {
            self.tutorialStepTwo();
            startContainer.fadeOut(250);
        });
    }
    // Instructions
    // TODO: Change these names to descriptive instead of numbers. 
    // Having them as numbers makes it significantly harder to add or remove steps
    tutorialStepTwo() {
        let self = this;
        let instructionsHtml = self.instructionsHtml;
        $(instructionsHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialInstructionsContainer");
        $(tutorialPopup).delay(500).animate({"opacity": "1"}, 500);
        $("#tutorialStepTwoDownArrow").css('background-image', "url("+downArrow+")");
        let optionsButton = $("#optionsButton");
        optionsButton.on("click.tutorial", function() {
            self.tutorialStepThree();
            $("#tutorialInstructionsContainer").fadeOut(250);
            optionsButton.off("click.tutorial");
        });
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
        });
    }

    // Move
    tutorialStepThree() {
        let self = this;
        let moveHtml = self.moveHtml;
        
        $(moveHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialMoveContainer");
        $(tutorialPopup).delay(1500).animate({"opacity": "1"}, 500);
        $("#tutorialMoveForwardLogo").css('background-image', "url("+rightArrowKey+")");
        $("#tutorialMoveBackwardLogo").css('background-image', "url("+leftArrowKey+")");
        $("#tutorialStepThreeDownArrow").css('background-image', "url("+downArrow+")");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            self.tutorialStepFour();
            tutorialPopup.fadeOut(250);
        });
    }
    // Auto mode and speed
    tutorialStepFour() {
        let self = this;
        let autoHtml = self.autoHtml;
        
        $(autoHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialAutoContainer");
        $(tutorialPopup).delay(500).animate({"opacity": "1"}, 500);
        $("#tutorialSpaceLogo").css('background-image', "url("+spaceBar+")");
        $("#tutorialSlowLogo").css('background-image', "url("+downArrowKey+")");
        $("#tutorialFastLogo").css('background-image', "url("+upArrowKey+")");
        $("#tutorialStepFourLeftArrow").css('background-image', "url("+leftArrow+")");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            self.tutorialStepFive();
            tutorialPopup.fadeOut(250);
        });
    }
    // Keywords and Highlight
    tutorialStepFive() {
        let self = this;
        let keywordsHtml = self.keywordsHtml;
        $("#customizeContainer").delay(500).animate({"transform": "1.05"}, 500);
        $(keywordsHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialKeywordsContainer");
        $(tutorialPopup).delay(500).animate({"opacity": "1"}, 500);
        $("#tutorialSlashLogo").css('background-image', "url("+slashKey+")");
        $("#tutorialStepFiveUpArrow").css('background-image', "url("+upArrow+")");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            self.tutorialStepSix();
            tutorialPopup.fadeOut(250);
            $("#customizeContainer").animate({"transform": "1"}, 250);
        });

    }
    // Keywords and Highlight
    tutorialStepSix() {
        let self = this;
        let highlightHtml = self.highlightHtml;
        $("#customizeContainer").delay(500).animate({"transform": "1.05"}, 500);
        $(highlightHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialHighlightContainer");
        $(tutorialPopup).delay(500).animate({"opacity": "1"}, 500);
        $("#tutorialShiftLogo").css('background-image', "url("+shiftButton+")");
        $("#tutorialStepSixRightArrow").css('background-image', "url("+rightArrow+")");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            self.tutorialStepSeven();
            tutorialPopup.fadeOut(250);
            $("#customizeContainer").animate({"transform": "1"}, 250);
        });

    }
    // On/Off
    tutorialStepSeven() {
        let self = this;
        let onOffHtml = self.onOffHtml;
        $(onOffHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialOnOffContainer");
        $(tutorialPopup).delay(500).animate({"opacity": "1"}, 500);
        $("#tutorialIconLogo").css('background-image', "url("+logo+")");
        $("#tutorialAltRLogo").css('background-image', "url("+alt_r+")");
        $("#tutorialPuzzleLogo").css('background-image', "url("+puzzle+")");
        $("#tutorialPinLogo").css('background-image', "url("+pin+")");
        $("#tutorialStepSevenUpArrow").css('background-image', "url("+upArrow+")");
        $(".popupCheckmark").click(function() {
            tutorialPopup.fadeOut(250);
        });
    }
}
    

// Expose to global.
window.Tutorial = Tutorial;
})(); // End of namespace
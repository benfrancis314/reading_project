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

        this.setHtmlElements();
        this.startTutorial();
    }

    // Define the different HTML blocks
    setHtmlElements() {
        let contentHtml = `
            <div id="tutorialStartContainer" class="tutorialContainer">
                <div id="tutorialStartWelcome">welcome to</div>
                <div id="tutorialStartTitle">READER<span class="highlightText">EASE&#8239;</span></div>
                <div id="tutorialStartSlogan">FOCUS&#8239;<span class="highlightTextItalic">&#8239;FASTER&#8239;</span></div>
                <div id="tutorialStartButtonsContainer">
                    <div id="tutorialStartSkipButton">SKIP</div>
                    <div id="tutorialStartTutorialButton">TUTORIAL</div>
                </div>
            </div>
            <div id="tutorialInstructionsContainer" class="tutorialContainer">
                <div class="tutorialText">
                    <div id="tutorialTextInstructions">Click<span id="tutorialSettingsButton">${window.gearLogo}</span>for <span class="bold">instructions</span></div>
                    <div class="popupCheckmark" id="instructionsDone"></div>
                </div>
                <div class="tutorialDownArrow"></div>
            </div>        
            <div id="tutorialMoveContainer" class="tutorialContainer">
                <div class="tutorialText">
                    <div id="tutorialTextMove">Use <span id="tutorialMoveBackwardLogo"></span>&nbsp;and <span id="tutorialMoveForwardLogo"></span>&nbsp;to <span class="bold">move</span><br/> the current sentence. </div>
                    <div class="popupCheckmark" id="moveDone"></div>
                </div>
                <div class="tutorialDownArrow"></div>
            </div>
            <div id="tutorialAutoContainer" class="tutorialContainer">
                <div class="tutorialText">
                    <div id="tutorialTextAutoContainer">
                        <div class="tutorialTextPartOne">
                            Turn <span class="bold">auto-scroll</span> on or off<br/>using <span id="tutorialSpaceLogo"></span>
                        </div>
                        <div class="tutorialTextPartTwo">
                            Adjust the <span class="bold">speed</span> using<br/><span id="tutorialSlowLogo"></span> and <span id="tutorialFastLogo"></span>
                        </div>
                    </div>
                    <div class="popupCheckmark" id="autoDone"></div>
                </div>
                <div class="tutorialDownArrow"></div>
            </div>
            <div id="tutorialKeywordsContainer" class="tutorialContainer">
                <div class="tutorialText">
                    <div id="tutorialTextKeywords">
                        Try different <span class="bold">keyword</span><br/>colors using <span id="tutorialSlashLogo"></span>
                    </div>
                    <div class="popupCheckmark" id="keywordsDone"></div>
                </div>
                <div class="tutorialDownArrow"></div>
            </div>
            <div id="tutorialHighlightContainer" class="tutorialContainer">
                <div class="tutorialText">
                    <div id="tutorialTextHighlight">
                        <span class="bold">Highlight</span> a sentence<br/>for later using <span id="tutorialShiftLogo"></span>
                    </div>
                    <div class="popupCheckmark" id="highlightDone"></div>
                </div>
                <div class="tutorialDownArrow"></div>
            </div>
            <div id="tutorialOnOffContainer" class="tutorialContainer">
                <div class="tutorialText">
                    <div id="tutorialTextOnOffContainer">
                        <div class="tutorialTextPartOne">
                            Click <span id="tutorialIconLogo"></span> to turn <span class="bold">ON/OFF</span>
                        </div>
                        <div class="tutorialTextPartTwo">
                            <span class="softText">Don't see this?</span><br/>Click <span id="tutorialPuzzleLogo"></span> then <span id="tutorialPinLogo"></span> to <span class="bold">pin</span>
                        </div>
                    </div>
                    <div class="popupCheckmark" id="endTutorialButton"><div id="endTutorialButtonText">END</div></div> 
                </div>
                <div class="tutorialDownArrow"></div>
            </div>`;
        $(contentHtml).insertAfter($("body").children().first());
        $(".tutorialDownArrow").css('background-image', "url("+downArrow+")");
        $(".popupCheckmark:not(#endTutorialButton)").css("background-image", "url("+popupCheckmarkUrl+")");
    }
    
    // Welcome
    startTutorial() {
        let self = this;
        let startContainer = $("#tutorialStartContainer");
        startContainer.animate({"opacity": "1"}, 500);
        $("#tutorialStartSkipButton").one("click", function() {
            startContainer.fadeOut(250);
        });
        $("#tutorialStartTutorialButton").one("click", function() {
            startContainer.fadeOut(250, function() {
                self.tutorialInstructions();
            });
            $("#persistentUIDisplay").draggable("disable"); // Prevent dragging during tutorial
        });
    }
    // Instructions
    // TODO: These are all very similar, so there is a lot of redundancy. Refactor
    tutorialInstructions() {
        let self = this;
        let tutorialPopup = $("#tutorialInstructionsContainer");
        let optionsButton = $("#optionsButton");
        this.showTutorialStep(tutorialPopup, optionsButton);
        optionsButton.one("click", function() {
            // Wait for the options-click has fully rendered the options before moving to the next step.
            $("#tutorialInstructionsContainer").fadeOut(250, function() {
                setTimeout(function() {
                    self.tutorialMove();
                }, 300);
            });
        });
        $("#instructionsDone").one("click", function() {
            $("#optionsButton").click();
            $("#uiContainer").draggable("disable"); // Prevent dragging during tutorial
        });
    }

    // Move
    tutorialMove() {
        let self = this;
        let tutorialPopup = $("#tutorialMoveContainer");
        this.showTutorialStep(tutorialPopup, $("#instructionGroupTwo"));
        $("#tutorialMoveForwardLogo").css('background-image', "url("+rightArrowKey+")");
        $("#tutorialMoveBackwardLogo").css('background-image', "url("+leftArrowKey+")");
        $("#moveDone").one("click", function() {
            tutorialPopup.fadeOut(250, function() {
                self.tutorialAuto();
            });
        });
    }
    // Auto mode and speed
    tutorialAuto() {
        let self = this;

        let tutorialPopup = $("#tutorialAutoContainer");
        this.showTutorialStep(tutorialPopup, $("#instructionGroupThree"));
        $("#tutorialSpaceLogo").css('background-image', "url("+spaceBar+")");
        $("#tutorialSlowLogo").css('background-image', "url("+downArrowKey+")");
        $("#tutorialFastLogo").css('background-image', "url("+upArrowKey+")");
        $("#autoDone").one("click", function() {
            tutorialPopup.fadeOut(250, function() {
                self.tutorialKeywords();
            });
        });
    }
    // Keywords
    tutorialKeywords() {
        let self = this;
        let tutorialPopup = $("#tutorialKeywordsContainer");
        this.showTutorialStep(tutorialPopup, $("#customizeContainer"));
        $("#tutorialSlashLogo").css('background-image', "url("+slashKey+")");
        $("#keywordsDone").one("click", function() {
            tutorialPopup.fadeOut(250, function() {
                self.tutorialHighlight();
            });
        });

    }
    // Highlight
    tutorialHighlight() {
        let self = this;
        let tutorialPopup = $("#tutorialHighlightContainer");
        this.showTutorialStep(tutorialPopup, $("#instructionGroupFour"));
        $("#tutorialShiftLogo").css('background-image', "url("+shiftButton+")");
        $("#highlightDone").one("click", function() {
            tutorialPopup.fadeOut(250, function() {
                self.tutorialOnOff();
            });
        });

    }
    // On/Off
    tutorialOnOff() {
        let self = this;
        let tutorialPopup = $("#tutorialOnOffContainer");
        this.showTutorialStep(tutorialPopup, $("#instructionGroupOne"));
        $("#tutorialIconLogo").css('background-image', "url("+logo+")");
        $("#tutorialAltRLogo").css('background-image', "url("+alt_r+")");
        $("#tutorialPuzzleLogo").css('background-image', "url("+puzzle+")");
        $("#tutorialPinLogo").css('background-image', "url("+pin+")");
        $("#endTutorialButton").one("click", function() {
            tutorialPopup.fadeOut(250);
        });
        $("#uiContainer").draggable("enable");
        $("#persistentUIDisplay").draggable("enable");
    }
    // Show tutorial step right above a settings element.
    showTutorialStep(tutorialEl, settingsEl) {
        let settingsElRect = settingsEl.get(0).getBoundingClientRect();
        let settingsLeft = settingsElRect.left;
        let settingsTop = settingsElRect.top;
        let settingsWidth = settingsEl.width();
        let tutorialWidth = tutorialEl.width();
        let tutorialHeight = tutorialEl.height();
    
        let tutorialLeft = settingsLeft - tutorialWidth / 2 + settingsWidth / 2;
        let tutorialTop = settingsTop - tutorialHeight;
        tutorialEl.css({"left":tutorialLeft, "top":tutorialTop});
        $(tutorialEl).delay(100).animate({"opacity": "1"}, 500);
    }
}
    

// Expose to global.
window.Tutorial = Tutorial;
})(); // End of namespace
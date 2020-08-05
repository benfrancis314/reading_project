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
let rightArrowKey = chrome.runtime.getURL('/images/rightArrow.svg');
let spaceBar = chrome.runtime.getURL('/images/instructionAutoRead.svg');
let shiftButton = chrome.runtime.getURL('/images/instructionHighlight.svg');
let alt_r = chrome.runtime.getURL('/images/instructionOnOff.svg');
let logo = chrome.runtime.getURL('/images/logoWithBackground.svg');
let puzzleIcon = chrome.runtime.getURL('/images/puzzlePiece.svg');
let pinIcon = chrome.runtime.getURL('/images/pin.svg');


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
        this.speedHtml = null; 
        this.highlightHtml = null;
        this.onOffHtml = null;

        this.setHtmlElements();
        this.startTutorial();
    }

    setHtmlElements() {
        this.startHtml = `
            <div id="tutorialStartContainer">
                <div id="tutorialStartWelcome">welcome to</div>
                <div id="tutorialStartTitle">READER<span id="highlightText">EASE&#8239;</span></div>
                <div id="tutorialStartSlogan">FOCUS&#8239;<span id="highlightText">&#8239;FASTER&#8239;</span></div>
                <div id="tutorialStartButtonsContainer">
                    <div id="tutorialStartSkipButton">SKIP</div>
                    <div id="tutorialStartTutorialButton">TUTORIAL</div>
                </div>
            </div>`;
        this.estimatedTimeHtml = `
            <div id="tutorialEstimatedTimeContainer">
                <div class="popupText">Estimated time remaining</div>
                <div class="popupCheckmark"></div>
                <div id="tutorialStepTwoDownArrow"></div>
            </div>`;
        this.instructionsHtml = `
            <div id="tutorialInstructionsContainer">
                <div class="popupText">Click<span id="tutorialSettingsButton">${window.gearLogo}</span>for instructions</div>
                <div class="popupCheckmark"></div>
                <div id="tutorialStepThreeDownArrow"></div>
            </div>`;
        this.moveHtml = `
            <div id="tutorialMoveContainer">
                <div class="popupText">Press the <span id="tutorialMoveLogo"></span>key to move forward</div>
                <div class="popupCheckmark"></div>
                <div id="tutorialStepFourDownArrow"></div>
            </div>`;
        this.autoHtml = `
            <div id="tutorialAutoContainer">
                <div class="popupText">Press the <span id="tutorialSpaceLogo"></span>to turn auto-scroll on or off</div>
                <div class="popupCheckmark"></div>
                <div id="tutorialStepTwoDownArrow"></div>
            </div>`;
        this.speedHtml = `
            <div id="tutorialSpeedContainer">
                <div class="popupText">Press the <span id="tutorialSlowLogo"></span> and <span id="tutorialFastLogo"></span> to change reading speed</div>
                <div class="popupCheckmark"></div>
                <div id="tutorialStepTwoDownArrow"></div>
            </div>`;
        this.highlightHtml = `
            <div id="tutorialHighlightContainer">
                <div class="popupText">Press the<span id="tutorialShiftLogo"></span> key to highlight a sentence for later</div>
                <div class="popupCheckmark"></div>                
                <div id="tutorialStepTwoDownArrow"></div>
            </div>`;
        this.onOffHtml = `
            <div id="tutorialOnOffContainer">
                <div class="popupText">Click <span id="tutorialIconLogo"></span> in the toolbar or press <span id="tutorialAltRightLogo"></span> to turn ON/OFF</div>
                <div class="endOfTutorialButton">END OF TUTORIAL</div>
                <div id="tutorialStepTwoDownArrow"></div>
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

        // TODO: Also remove tutorial if click normal gear icon. 
    }
    // Estimated time
    tutorialStepTwo() {
        let self = this;
        let estimatedTimeHtml = self.estimatedTimeHtml;

        $(estimatedTimeHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialEstimatedTimeContainer");
        $("#tutorialStepTwoDownArrow").css('background-image', "url("+downArrow+")");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            self.tutorialStepThree();
            tutorialPopup.fadeOut(250);
        });
    }
    // Instructions
    tutorialStepThree() {
        let self = this;
        let instructionsHtml = self.instructionsHtml;
        
        $(instructionsHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialInstructionsContainer");
        $("#tutorialStepThreeDownArrow").css('background-image', "url("+downArrow+")");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            self.tutorialStepFour();
            tutorialPopup.fadeOut(500);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            self.tutorialStepFour();
            tutorialPopup.fadeOut(250);
        });
    }
    // Move
    tutorialStepFour() {
        let self = this;
        let moveHtml = self.moveHtml;
        
        $(moveHtml).insertAfter($("body").children().first());
        $("#tutorialMoveLogo").css('background-image', "url("+rightArrowKey+")");
        $("#tutorialStepFourDownArrow").css('background-image', "url("+downArrow+")");
        let tutorialPopup = $("#tutorialMoveContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            self.tutorialStepFive();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            self.tutorialStepFive();
            tutorialPopup.fadeOut(250);
        });
    }
    // Auto mode
    tutorialStepFive() {
        let self = this;
        let autoHtml = self.autoHtml;
        
        $(autoHtml).insertAfter($("body").children().first());
        $("#tutorialSpaceLogo").css('background-image', "url("+spaceBar+")");
        let tutorialPopup = $("#tutorialAutoContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            self.tutorialStepSix();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            self.tutorialStepSix();
            tutorialPopup.fadeOut(250);
        })
    }
    // Speed
    tutorialStepSix() {
        let self = this;
        let speedHtml= self.speedHtml;
        
        $(speedHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialSpeedContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            self.tutorialStepSeven();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            self.tutorialStepSeven();
            tutorialPopup.fadeOut(250);
        })
    }
    // Speed
    tutorialStepSix() {
        let self = this;
        let speedHtml= self.speedHtml;
        
        $(speedHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialSpeedContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            self.tutorialStepSeven();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            self.tutorialStepSeven();
            tutorialPopup.fadeOut(250);
        })
    }
    // Highlight
    tutorialStepSeven() {
        let self = this;
        let highlightHtml = self.highlightHtml;
        
        $(highlightHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialHighlightContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            tutorialPopup.fadeOut(250);
        })
    }
    // Highlight
    tutorialStepSeven() {
        let self = this;
        let highlightHtml = self.highlightHtml;
        
        $(highlightHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialHighlightContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            tutorialPopup.fadeOut(250);
        })
    }
    // On/Off
    tutorialStepEight() {
        let self = this;
        let onOffHtml = self.onOffHtml;
                
        $(onOffHtml).insertAfter($("body").children().first());
        let tutorialPopup = $("#tutorialOnOffContainer");
        $(".popupCheckmark").css("background-image", "url("+popupCheckmarkUrl+")").click(function() {
            $("#optionsButton").click();
            tutorialPopup.fadeOut(250);
        });
        $("#optionsButtonTutorial").click(function() {
            $("#optionsButton").click();
            tutorialPopup.fadeOut(250);
        })
    }
}
    

// Expose to global.
window.Tutorial = Tutorial;
})(); // End of namespace
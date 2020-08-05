"use strict";
(function(){
var namespace = "lib/tutorial.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

// URL for checkmark logo
let popupCheckmarkUrl = chrome.runtime.getURL('/images/checkMark.svg');
// URL for down arrow
let downArrow = chrome.runtime.getURL('/images/downArrow.svg');
// URL for up arrow
let upArrow = chrome.runtime.getURL('/images/upArrow.svg');

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
                <div id="tutorialStepTwoDownArrow"></div>
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
    tutorialStepFour() {
        let self = this;
        let moveHtml = self.moveHtml;
        
        $(moveHtml).insertAfter($("body").children().first());
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
    tutorialStepFive() {
        let self = this;
        let autoHtml = self.autoHtml;
        
        $(autoHtml).insertAfter($("body").children().first());
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
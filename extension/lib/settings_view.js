"use strict";
(function(){
var namespace = "lib/settings_view.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

var trackerStyle = null;

/*
Contains style information about the tracker. 
*/
class TrackerStyle {
    constructor() {
        this.keywordStyle = null; // CSS class for current keyword style
    }
    getKeywordStyle() {
        return this.keywordStyle;
    }
    setKeywordStyle(keywordStyle) {
        let oldKeywordStyle = this.keywordStyle;
        this.keywordStyle = keywordStyle;
        $("."+oldKeywordStyle).removeClass(oldKeywordStyle).addClass(keywordStyle);
    }
}

/*
UI for showing instructions and customizing tracker and keyword colors. 
*/
class SettingsView {
    
    constructor(settings) {
        this.uiStatus = false; // Is the UI (Instructions & Customizations) ON or OFF?
        this.uiHtml = null; // HTML for the UI (instructions & customizations)
        this.settings = settings;
        trackerStyle = window.trackerStyle;

        this.trackerSetting = settings.getCustomizations();
        this.defineUiHtml();
        this.setHtmlListeners(); 
        this.loadSettings();
    }

    /* 
    Given a tracker setting key the chosen value, update just that setting key
    while leaving other tracker settings unchanged.

    Save this preference in storage, then redraw the tracker and settings UI

    Called by onClick handler on each button of the customization UI.
    
    Parameters:
    - settingKey: trackerSettingKey
    - settingValue: trackerSettingValue 
    */
    changeSetting(settingKey, settingValue) {
        let oldSettingValue = this.trackerSetting[settingKey];
        this.trackerSetting[settingKey] = settingValue;
        this.settings.setCustomizations(this.trackerSetting);
        this.redrawTracker();
        this.redrawOneSetting(settingKey, oldSettingValue, settingValue);
    }
     
    /*
    Read settings from storage, then redraw the entire settings UI and tracker.
    */
    loadSettings() {
        this.trackerSetting = this.settings.getCustomizations();
        this.redrawTracker();
        for (const [key, value] of Object.entries(trackerSettingKey)) {
            this.redrawOneSetting(key, null, this.trackerSetting[value]);
        }
    }

    // Get the el id of the button element corresponding to a single
    // value in a single setting row.
    getSettingEl(settingKey, settingValue) {
        return $(`#button${pascalCase(settingKey)}${pascalCase(settingValue)}`);
    }

    // Redraw only the row corresponding to settingKey
    // Dims the old value, light up the new value.
    // if oldSettingValue is null, then no dimming happens.
    redrawOneSetting(settingKey, oldSettingValue, newSettingValue) {
        if (oldSettingValue !== null) {
            this.getSettingEl(settingKey, oldSettingValue).css({
                "opacity": "0.75",
                "transform": "scale(1)",
                "box-shadow": "0pt 0.5pt 0.5pt 0.5pt rgb(0, 0, 0, 0.35)",
                "font-weight": "400"
            });
        }
        this.getSettingEl(settingKey, newSettingValue).css({
                "opacity": "1",
                "transform": "scale(1.02)",
                "box-shadow": "0pt 1pt 1pt 1pt rgb(0, 0, 0, 0.5)",
                "font-weight": "700"
        });
    }

    redrawTracker() {
        let keywordSetting = pascalCase(this.trackerSetting[trackerSettingKey.KEYWORD]);
        trackerStyle.setKeywordStyle("keyWord"+keywordSetting);
    };

    /*
    Setup listeners on the inject HTML. 
    Here, we just listen on the options button (the gear) to toggle the UI display.
    */
    setHtmlListeners() {
        let optionsButton = $("#optionsButton");
        if (optionsButton) {
            optionsButton.on("click", this.toggleUI.bind(this));
        }
    }

    // Turn UI on and off. 
    // Also defines the eventListeners for the buttons on the UI display. 
    toggleUI() {
        var self = this; 



        if (this.uiStatus) {
            $("#bottomOfPageUI").animate({"height":"30%"}, 500);
            let uiContainer = $("#uiContainer");
            $(uiContainer).animate({"bottom": "-50%", "opacity": "0"}, 500, function() {
                uiContainer.remove();
            });
            $("#persistentUIDisplay").animate({"bottom": "10%"}, 500);
            this.uiStatus = false;
        } else {
            // Load UI display
            let optionsButton = $("#optionsButton");
            $("#bottomOfPageUI").animate({"height":"50%"}, 500);

            $("#persistentUIDisplay").animate({"bottom": "37%"}, 500);
            $(this.uiHtml).insertAfter(optionsButton);
            $("#uiContainer").animate({"bottom": "-2%", "opacity": "1"}, 500);
            

            // Load background images
            $("#keywordsToggleGraphic").css('background-image', "url("+chrome.runtime.getURL('/images/instructionKeywordToggle.svg')+")");
            $("#instructionsGraphicAutoRead").css('background-image', "url("+chrome.runtime.getURL('/images/instructionAutoRead.svg')+")");
            $("#instructionsGraphicHighlight").css('background-image', "url("+chrome.runtime.getURL('/images/instructionHighlight.svg')+")");
            $("#instructionsGraphicMove").css('background-image', "url("+chrome.runtime.getURL('/images/instructionMove.svg')+")");
            $("#instructionsGraphicOnOff").css('background-image', "url("+chrome.runtime.getURL('/images/instructionOnOff.svg')+")");
            $("#instructionsGraphicSentenceHop").css('background-image', "url("+chrome.runtime.getURL('/images/instructionSentenceHop.svg')+")");
            $("#instructionsGraphicSpeed").css('background-image', "url("+chrome.runtime.getURL('/images/instructionSpeed.svg')+")");
            $("#closeUIButton").css('background-image', "url("+chrome.runtime.getURL('/images/closeButton.svg')+")");

            // Setup exit button
            let closeUIButton = $("#closeUIButton");
            closeUIButton.on("click", this.toggleUI.bind(this));

            // Setup click listeners for all setting buttons.
            for (const [k1, settingKeyStr] of Object.entries(trackerSettingKey)) {
                for (const [k2, settingValStr] of Object.entries(trackerSettingValue)) {
                    if(!isSettingPairSupported(settingKeyStr, settingValStr)) {
                        continue;
                    }
                    self.getSettingEl(settingKeyStr, settingValStr).on("click", function() {
                        self.changeSetting(settingKeyStr, settingValStr);
                    });
                }
            }
            

            this.loadSettings();
            // Set UI status to true
            this.uiStatus = true;
        };
    }

    defineUiHtml() {
        this.uiHtml = this.uiHtml = `
        <div id="uiContainer">
            <div id="closeUIButton"></div>
            <div id="uiSections">
                <div id="customizeContainer">
                        <div id="keywordsTitle">
                            KEYWORDS
                        </div> 
                        <div id="toggleWordKeywords">TOGGLE </div><div id="keywordsToggleGraphic"></div>
                        <div id="keywordsOptions">
                            <div class="keywordsButton" id="buttonKeywordLight">LIGHT</div>
                            <div class="keywordsButton" id="buttonKeywordBright">BRIGHT</div>
                            <div class="keywordsButton" id="buttonKeywordGentle">GENTLE</div>
                            <div class="keywordsButton" id="buttonKeywordOff">OFF</div>
                        </div>
                </div>
                <div id="instructionsContainer">
                    <div id="instructionsTitle">INSTRUCTIONS</div>
                    <div id="instructionsSectionContainer">
                        <div id="instructionGroupOne">
                            <div class="instructionsComponent">
                                <div class="instructionsName">ON/OFF</div>
                                <div id="instructionsGraphicOnOff"></div>
                            </div>
                        </div>
                        <div id="instructionGroupTwo">
                            <div class="instructionsComponent">
                                <div class="instructionsName">MOVE</div>
                                <div id="instructionsGraphicMove"></div>
                            </div>
                            <div class="instructionsComponentTwo">
                                <div class="instructionsName">SENTENCE HOP</div>
                                <div id="instructionsGraphicSentenceHop"></div>
                            </div>
                        </div>
                        <div id="instructionGroupThree">
                            <div class="instructionsComponent">
                                <div class="instructionsName">TOGGLE AUTO-READ</div>
                                <div id="instructionsGraphicAutoRead"></div>
                            </div>
                            <div class="instructionsComponentTwo">
                                <div class="instructionsName">SPEED</div>
                                <div id="instructionsGraphicSpeed"></div>
                            </div>
                        </div>
                        <div id="instructionGroupFour">
                            <div class="instructionsComponent">
                                <div class="instructionsName">HIGHLIGHT</div>
                                <div id="instructionsGraphicHighlight"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }
}

{/* <div class="instructionsComponent">
<div class="instructionsName">TOGGLE KEYWORDS</div>
<div id="instructionsGraphicKeywordToggle"></div>
</div> */}



// TODO: Support all combinations after refacotring is complete.
// Supported values for each setting key.
var SUPPORTED_SETTINGS = {
    [trackerSettingKey.KEYWORD]: new Set([
        trackerSettingValue.LIGHT,
        trackerSettingValue.BRIGHT,
        trackerSettingValue.GENTLE,
        trackerSettingValue.OFF
        ])
};
function isSettingPairSupported(settingKey, settingValue) {
    return SUPPORTED_SETTINGS[settingKey].has(settingValue);
}


// Capitalize the first letter and lower case the rest.
function pascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Expose to global.
window.SettingsView = SettingsView;
window.TrackerStyle = TrackerStyle;
})(); // End of namespace

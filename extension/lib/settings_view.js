"use strict";
(function(){
var namespace = "lib/settings_view.js";
if (window[namespace] === true) {
    return;
} else {
    window[namespace] = true;
}

// Access to settings
var settings = null;
var trackerStyle = null;

/*
Contains style information about the tracker. 
*/
class TrackerStyle {
    constructor() {
        this.sentenceStyle = null; // CSS class for current sentence style
        this.keywordStyle = null; // CSS class for current keyword style
    }
    getSentenceStyle() {
        return this.sentenceStyle;
    }
    getKeywordStyle() {
        return this.keywordStyle;
    }
    setSentenceStyle(sentenceStyle) {
        let oldSentenceStyle = this.sentenceStyle;
        this.sentenceStyle = sentenceStyle;
        $("."+oldSentenceStyle).removeClass(oldSentenceStyle).addClass(sentenceStyle);
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
    
    constructor() {
        this.uiStatus = false; // Is the UI (Instructions & Customizations) ON or OFF?
        this.uiHtml = null; // HTML for the UI (instructions & customizations)
        
        // TODO: Do this in a better way
        // Setting these here instead of beginning of file bc need to wait due to async problems,
        // window.trackerStyle is not ready if set in beginning of file, is ready if set here
        settings = window.settings;
        trackerStyle = window.trackerStyle;

        this.trackerSetting = settings.getDefaultTrackerSettings();
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
        var self = this;
        settings.setCustomizations(this.trackerSetting, function() {
            self.redrawTracker();
            self.redrawOneSetting(settingKey, oldSettingValue, settingValue);
        });
    }
     
    /*
    Read settings from storage, then redraw the entire settings UI and tracker.
    */
    loadSettings() {
        var self = this;
        settings.getCustomizations(function(trackerSetting) {
            self.trackerSetting = trackerSetting;            
            self.redrawTracker();
            for (const [key, value] of Object.entries(trackerSettingKey)) {
                self.redrawOneSetting(key, null, self.trackerSetting[value]);
            }
        });
    }

    // Get the el id of the button element corresponding to a single
    // value in a single setting row.
    getSettingEl(settingKey, settingValue) {
        return $(`#custom${pascalCase(settingKey)}${pascalCase(settingValue)}`);
    }

    // Redraw only the row corresponding to settingKey
    // Dims the old value, light up the new value.
    // if oldSettingValue is null, then no dimming happens.
    redrawOneSetting(settingKey, oldSettingValue, newSettingValue) {
        if (oldSettingValue !== null) {
            this.getSettingEl(settingKey, oldSettingValue).css("fillOpacity", 0.28);
        }
        this.getSettingEl(settingKey, newSettingValue).css("fillOpacity", 1);
    }

    redrawTracker() {
        let keywordSetting = pascalCase(this.trackerSetting[trackerSettingKey.KEYWORD]);
        let highlighterSetting = pascalCase(this.trackerSetting[trackerSettingKey.HIGHLIGHTER]);
        let shadowSetting = pascalCase(this.trackerSetting[trackerSettingKey.SHADOW]);

        // TODO: Autogenerate the css instead of keeping track of exponential number of classes.
        trackerStyle.setSentenceStyle("sentenceHighlighter"+highlighterSetting+"Shadow"+shadowSetting);
        trackerStyle.setKeywordStyle("keyWord"+keywordSetting);
    };

    /*
    Setup listeners on the inject HTML. 
    Here, we just listen on the options button (the gear) to toggle the UI display.
    */
    setHtmlListeners() {
        let optionsButton = document.getElementById("optionsButton"); // TODO: Replace with $("#optionsButton")[0]
        if (optionsButton) {
            optionsButton.addEventListener("click", this.toggleUI.bind(this));
        }
    }

    // Turn UI on and off. 
    // Also defines the eventListeners for the buttons on the UI display. 
    toggleUI() {
        var self = this; 

        if (this.uiStatus) {
            let uiContainer = document.getElementById("uiContainer");
            uiContainer.remove();
            this.uiStatus = false;
        } else {
            // Load UI display
            let optionsButton = document.getElementById("optionsButton");
            optionsButton.insertAdjacentHTML("afterend", this.uiHtml);

            // Setup exit button
            let exitButton = document.getElementById("exitButton");
            exitButton.addEventListener("click", this.toggleUI.bind(this));

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
            <div id 
        </div>
    `;
    }
    
}

// TODO: Support all combinations after refacotring is complete.
// Supported values for each setting key.
var SUPPORTED_SETTINGS = {
    [trackerSettingKey.KEYWORD]: new Set([
        trackerSettingValue.GREEN,
        trackerSettingValue.YELLOW,
        trackerSettingValue.OFF
        ]),
    [trackerSettingKey.HIGHLIGHTER]: new Set([
        trackerSettingValue.BLUE,
        trackerSettingValue.YELLOW,
        trackerSettingValue.GREEN
        ]),
    [trackerSettingKey.SHADOW]: new Set([
        trackerSettingValue.BLUE,
        trackerSettingValue.YELLOW,
        trackerSettingValue.GREEN
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
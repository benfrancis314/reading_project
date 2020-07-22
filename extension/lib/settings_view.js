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

        this.keywordSetting = "Green"; // str: "Green", "Yellow", or "Off"
        this.highlighterSetting = "Blue"; // str: "Blue", Yellow", or "Green"
        this.shadowSetting = "Blue"; // str: "Blue", "Yellow", or "Green"
        
        // TODO: Do this in a better way
        // Setting these here instead of beginning of file bc need to wait due to async problems,
        // window.trackerStyle is not ready if set in beginning of file, is ready if set here
        settings = window.settings;
        trackerStyle = window.trackerStyle;

        this.defineUiHtml();
        this.setHtmlListeners(); 
        this.updateSettings();
    }

            /*
    Called by onClick handler on each button of the customization UI. 
    Given a setting and choice, it uses provides an array to setCustomizations containing
    two unchanged customizations settings and one changed customization setting. 
    It also gives a callback to updateSettings. 
    */
    changeSetting(setting, choice) {
        var self = this;
        if (setting == "keyword") {
            settings.setCustomizations([choice, self.highlighterSetting, self.shadowSetting], function() {
                self.updateSettings();
            });
        } else if (setting == "highlighter") {
            settings.setCustomizations([self.keywordSetting, choice, self.shadowSetting], function() {
                self.updateSettings();
            });
        } else if (setting == "shadow") {
            settings.setCustomizations([self.keywordSetting, self.highlighterSetting, choice], function() {
                self.updateSettings();
            });
        } 
    }
     
    // --> Gets called as cb from settings.setCustomizations --> 
    // Updates the settings stored by chrome
    updateSettings() {
        var self = this;
        settings.getCustomizations(function(customs) { // --> 
            self.setSettings(customs); // --> Callback of getCustomizations
        });
    }

    // Sets the attributes of Display to reflect the new settings. 
    // Updates global variables used for tracker and keyword styling. 
    setSettings(customs) {
        let keywordSetting = customs[0];
        let highlighterSetting = customs[1];
        let shadowSetting = customs[2];
        this.keywordSetting = keywordSetting;
        this.highlighterSetting = highlighterSetting;
        this.shadowSetting = shadowSetting;
        trackerStyle.setKeywordStyle("keyWord"+keywordSetting);
        trackerStyle.setSentenceStyle("sentenceHighlighter"+highlighterSetting+"Shadow"+shadowSetting);
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

    // Update styles of customization buttons so that the one that is lighted up switches
    // when the user clicks on another one
    updateCustomizationButtonStyles(setting, choice) {
        let current_keyword_setting = this.keywordSetting;
        let current_highlighter_setting = this.highlighterSetting;
        let current_shadow_setting = this.shadowSetting;
        switch(setting) {
            case "keyword":
                switch(choice) {
                    case "Green":
                        // Turn new one to high opacity, old one to low opacity
                        document.getElementById("customKeywordGreen").style.fillOpacity = "1";
                        document.getElementById("customKeyword"+current_keyword_setting).style.fillOpacity = "0.28";
                        break;
                    case "Yellow":
                        document.getElementById("customKeywordYellow").style.fillOpacity = "1";
                        document.getElementById("customKeyword"+current_keyword_setting).style.fillOpacity = "0.28";
                        break;
                    case "Off":
                        // This one is actually an exception case
                        document.getElementById("customKeywordOff").style.fillOpacity = "0.5";
                        document.getElementById("customKeyword"+current_keyword_setting).style.fillOpacity = "0.28";
                        break;
                }
            break;
            case "highlighter":
                switch(choice) {
                    case "Blue":
                        document.getElementById("customHighlighterBlue").style.fillOpacity = "1";
                        document.getElementById("customHighlighter"+current_highlighter_setting).style.fillOpacity = "0.28";
                        break;
                    case "Yellow":
                        document.getElementById("customHighlighterYellow").style.fillOpacity = "1";
                        document.getElementById("customHighlighter"+current_highlighter_setting).style.fillOpacity = "0.28";
                        break;
                    case "Green":
                        document.getElementById("customHighlighterGreen").style.fillOpacity = "1";
                        document.getElementById("customHighlighter"+current_highlighter_setting).style.fillOpacity = "0.28";
                        break;
                }
            break;
            case "shadow": 
                switch(choice) {
                    case "Blue":
                        document.getElementById("customShadowBlue").style.fillOpacity = "1";
                        document.getElementById("customShadow"+current_shadow_setting).style.fillOpacity = "0.28";
                        break;
                    case "Yellow":
                        document.getElementById("customShadowYellow").style.fillOpacity = "1";
                        document.getElementById("customShadow"+current_shadow_setting).style.fillOpacity = "0.28";
                        break;
                    case "Green":
                        document.getElementById("customShadowGreen").style.fillOpacity = "1";
                        document.getElementById("customShadow"+current_shadow_setting).style.fillOpacity = "0.28";
                        break;
                }
            break;
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

            // Setup customization buttons
            let keywordButtonGreen = document.getElementById("customKeywordGreen");
            let keywordButtonYellow = document.getElementById("customKeywordYellow");
            let keywordButtonOff = document.getElementById("customKeywordOff");
            let highlighterButtonBlue = document.getElementById("customHighlighterBlue");
            let highlighterButtonYellow = document.getElementById("customHighlighterYellow");
            let highlighterButtonGreen = document.getElementById("customHighlighterGreen");
            let shadowButtonBlue = document.getElementById("customShadowBlue");
            let shadowButtonYellow = document.getElementById("customShadowYellow");
            let shadowButtonGreen = document.getElementById("customShadowGreen");

            // Define event listeners
            keywordButtonGreen.addEventListener("click", function () {
                self.changeSetting("keyword", "Green");
                self.updateCustomizationButtonStyles("keyword", "Green");
            });
            keywordButtonYellow.addEventListener("click", function () {
                self.changeSetting("keyword", "Yellow");
                self.updateCustomizationButtonStyles("keyword", "Yellow");
            });
            keywordButtonOff.addEventListener("click", function () {
                self.changeSetting("keyword", "Off");
                self.updateCustomizationButtonStyles("keyword", "Off");
            });
            highlighterButtonBlue.addEventListener("click", function () {
                self.changeSetting("highlighter", "Blue");
                self.updateCustomizationButtonStyles("highlighter", "Blue");
            });
            highlighterButtonYellow.addEventListener("click", function () {
                self.changeSetting("highlighter", "Yellow");
                self.updateCustomizationButtonStyles("highlighter", "Yellow");
            });
            highlighterButtonGreen.addEventListener("click", function () {
                self.changeSetting("highlighter", "Green");
                self.updateCustomizationButtonStyles("highlighter", "Green");
            });
            shadowButtonBlue.addEventListener("click", function () {
                self.changeSetting("shadow", "Blue");
                self.updateCustomizationButtonStyles("shadow", "Blue");
            });
            shadowButtonYellow.addEventListener("click", function () {
                self.changeSetting("shadow", "Yellow");
                self.updateCustomizationButtonStyles("shadow", "Yellow");
            });
            shadowButtonGreen.addEventListener("click", function () {
                self.changeSetting("shadow", "Green");
                self.updateCustomizationButtonStyles("shadow", "Green");
            });

            // Initialize customization button styling
            switch (this.keywordSetting) {
                case "Green":
                    document.getElementById("customKeywordGreen").style.fillOpacity = "1";
                    break;
                case "Blue":
                    document.getElementById("customKeywordYellow").style.fillOpacity = "1";
                    break;
                case "Off":
                    document.getElementById("customKeywordOff").style.fillOpacity = "0.5";
                    break;
            }
            switch (this.highlighterSetting) {
                case "Blue":
                    document.getElementById("customHighlighterBlue").style.fillOpacity = "1";
                    break;
                case "Yellow":
                    document.getElementById("customHighlighterYellow").style.fillOpacity = "1";
                    break;
                case "Green":
                    document.getElementById("customHighlighterGreen").style.fillOpacity = "1";
                    break;
            }
            switch (this.shadowSetting) {
                case "Blue":
                    document.getElementById("customShadowBlue").style.fillOpacity = "1";
                    break;
                case "Yellow":
                    document.getElementById("customShadowYellow").style.fillOpacity = "1";
                    break;
                case "Green":
                    document.getElementById("customShadowGreen").style.fillOpacity = "1";
                    break;
            }

            // Set UI status to true
            this.uiStatus = true;
        };
    }

    defineUiHtml() {
        this.uiHtml = this.uiHtml = `
        <div id="uiContainer">
            <svg width="100%" height="100%" viewBox="0 0 2031 1167" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
                <g transform="matrix(1,0,0,1,-4102.57,553.328)">
                    <g>
                        <g transform="matrix(1,0,0,1,-686.643,490.58)">
                            <!-- BOX BORDER AND DIVIDING LINES -->
                            <g>
                                <g transform="matrix(1,0,0,1.12667,0,211.351)">
                                    <path d="M6816.87,-1078.23C6816.87,-1096.52 6800.14,-1111.36 6779.54,-1111.36L5003.32,-1111.36C4982.71,-1111.36 4965.99,-1096.52 4965.99,-1078.23L4965.99,-114.614C4965.99,-96.329 4982.71,-81.484 5003.32,-81.484L6648.12,-81.484C6741.26,-81.484 6816.87,-148.595 6816.87,-231.256L6816.87,-1078.23Z" style="fill:rgb(15,19,28);fill-opacity:0.84;stroke:rgb(0,220,255);stroke-width:5.87px;"/>
                                </g>
                                <path d="M4969.87,-909.345L6819.98,-904.502" style="fill:rgb(0,220,255);stroke:rgb(0,220,255);stroke-width:5.9px;"/>
                                <path d="M6133.22,-1107.73L6134.71,154.772" style="fill:rgb(0,220,255);stroke:rgb(0,220,255);stroke-width:5.92px;"/>
                            </g>
                            <g transform="matrix(1.20829,0,0,1.20829,-914.235,196.238)">
                                <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">INS<tspan x="5240.66px " y="-950.424px ">T</tspan>RUC<tspan x="5385.45px " y="-950.424px ">T</tspan>IONS</text>
                            </g>
                            <g transform="matrix(1,0,0,1,-8.5278,-54.1027)">
                                <!-- INSTRUCTION LABELS -->
                                <g transform="matrix(1,0,0,1,8.41686,2.78843)">
                                    <g transform="matrix(1.20829,0,0,1.20829,-817.36,426.808)">
                                        <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">ON / OFF</text>
                                    </g>
                                    <g transform="matrix(1.20829,0,0,1.20829,-881.267,733.672)">
                                        <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">A<tspan x="5188.01px 5228.25px 5257.42px " y="-950.424px -950.424px -950.424px ">UTO</tspan> - READ</text>
                                    </g>
                                    <g transform="matrix(1.20829,0,0,1.20829,-781.517,1052.66)">
                                        <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">SP<tspan x="5220.13px " y="-950.424px ">E</tspan>ED</text>
                                    </g>
                                </g>
                                <!-- INSTRUCTIONS: SPEED -->
                                <g>
                                    <path d="M5262.93,-12.583L5262.93,8.478L5230.53,-23.923L5262.93,-56.323L5262.93,-35.263L5855.32,-35.263L5855.32,-56.323L5887.72,-23.923L5855.32,8.478L5855.32,-12.583L5262.93,-12.583Z" style="fill:rgb(0,220,255);fill-opacity:0.84;stroke:rgb(0,220,255);stroke-width:4.17px;"/>
                                    <g transform="matrix(0.204964,0,0,0.204964,4425.35,54.0405)">
                                        <g transform="matrix(1.39979,0,0,1.31866,-2937.45,226.989)">
                                            <path d="M7761.48,-602.438C7761.48,-663.085 7715.1,-712.322 7657.97,-712.322L7450.94,-712.322C7393.81,-712.322 7347.42,-663.085 7347.42,-602.438L7347.42,-382.6C7347.42,-321.953 7393.81,-272.716 7450.94,-272.716L7657.97,-272.716C7715.1,-272.716 7761.48,-321.953 7761.48,-382.6L7761.48,-602.438Z" style="fill:rgb(0,220,255);fill-opacity:0;stroke:rgb(0,220,255);stroke-width:22.42px;"/>
                                        </g>
                                        <g transform="matrix(1,0,0,1,-29.7067,12.3071)">
                                            <text x="7559.94px" y="-337.772px" style="font-family:'Montserrat-Bold', 'Montserrat';font-weight:700;font-size:265.748px;fill:rgb(0,220,255);">D</text>
                                        </g>
                                    </g>
                                    <g transform="matrix(0.204964,0,0,0.204964,3597.01,-285.888)">
                                        <g transform="matrix(1.39979,0,0,1.31866,-3094.45,1924.47)">
                                            <path d="M7761.48,-602.438C7761.48,-663.085 7715.1,-712.322 7657.97,-712.322L7450.94,-712.322C7393.81,-712.322 7347.42,-663.085 7347.42,-602.438L7347.42,-382.6C7347.42,-321.953 7393.81,-272.716 7450.94,-272.716L7657.97,-272.716C7715.1,-272.716 7761.48,-321.953 7761.48,-382.6L7761.48,-602.438Z" style="fill:rgb(0,220,255);fill-opacity:0;stroke:rgb(0,220,255);stroke-width:22.42px;"/>
                                        </g>
                                        <g transform="matrix(1,0,0,1,-161.44,1710.78)">
                                            <text x="7559.94px" y="-337.772px" style="font-family:'Montserrat-Bold', 'Montserrat';font-weight:700;font-size:265.748px;fill:rgb(0,220,255);">S</text>
                                        </g>
                                    </g>
                                </g>
                                <!-- INSTRUCTIONS: AUTO-READ -->
                                <g transform="matrix(0.18074,0,0,0.18074,4521.86,-579.204)">
                                    <g transform="matrix(8.90685,0,0,1.31866,-61540.1,2127.59)">
                                        <path d="M7761.48,-602.421C7761.48,-663.077 7754.19,-712.322 7745.21,-712.322L7363.69,-712.322C7354.71,-712.322 7347.42,-663.077 7347.42,-602.421L7347.42,-382.617C7347.42,-321.961 7354.71,-272.716 7363.69,-272.716L7745.21,-272.716C7754.19,-272.716 7761.48,-321.961 7761.48,-382.617L7761.48,-602.421Z" style="fill:rgb(0,220,255);fill-opacity:0;stroke:rgb(0,220,255);stroke-width:5.43px;"/>
                                    </g>
                                    <g transform="matrix(1,0,0,1,-2274.33,1908.91)">
                                        <text x="7559.94px" y="-337.772px" style="font-family:'Montserrat-Bold', 'Montserrat';font-weight:700;font-size:265.748px;fill:rgb(0,220,255);">SP<tspan x="7912.05px 8112.96px " y="-337.772px -337.772px ">AC</tspan>E</text>
                                    </g>
                                </g>
                                <!-- INSTRUCTIONS: ON/OFF -->
                                <g transform="matrix(1,0,0,1,22.5627,-19)">
                                    <g transform="matrix(0.204964,0,0,0.204964,3679.95,-852.561)">
                                        <g transform="matrix(1.39979,0,0,1.31866,-2140.6,1922.95)">
                                            <path d="M7761.48,-602.438C7761.48,-663.085 7715.1,-712.322 7657.97,-712.322L7450.94,-712.322C7393.81,-712.322 7347.42,-663.085 7347.42,-602.438L7347.42,-382.6C7347.42,-321.953 7393.81,-272.716 7450.94,-272.716L7657.97,-272.716C7715.1,-272.716 7761.48,-321.953 7761.48,-382.6L7761.48,-602.438Z" style="fill:rgb(0,220,255);fill-opacity:0;stroke:rgb(0,220,255);stroke-width:22.42px;"/>
                                        </g>
                                        <g transform="matrix(0.717177,0,0,0.976494,2839.48,1694.14)">
                                            <text x="7559.94px" y="-337.772px" style="font-family:'Montserrat-Bold', 'Montserrat';font-weight:700;font-size:265.748px;fill:rgb(0,220,255);">AL<tspan x="7906.74px " y="-337.772px ">T</tspan></text>
                                        </g>
                                    </g>
                                    <g transform="matrix(0.204964,0,0,0.204964,4099.17,-665.646)">
                                        <g transform="matrix(1.39979,0,0,1.31866,-2924.71,1009.3)">
                                            <path d="M7761.48,-602.438C7761.48,-663.085 7715.1,-712.322 7657.97,-712.322L7450.94,-712.322C7393.81,-712.322 7347.42,-663.085 7347.42,-602.438L7347.42,-382.6C7347.42,-321.953 7393.81,-272.716 7450.94,-272.716L7657.97,-272.716C7715.1,-272.716 7761.48,-321.953 7761.48,-382.6L7761.48,-602.438Z" style="fill:rgb(0,220,255);fill-opacity:0;stroke:rgb(0,220,255);stroke-width:22.42px;"/>
                                        </g>
                                        <g transform="matrix(1,0,0,1,-14.5533,794.621)">
                                            <text x="7559.94px" y="-337.772px" style="font-family:'Montserrat-Bold', 'Montserrat';font-weight:700;font-size:265.748px;fill:rgb(0,220,255);">R</text>
                                        </g>
                                    </g>
                                    <g transform="matrix(1.52282,0,0,1.52282,-2894.3,365.148)">
                                        <text x="5515.36px" y="-598.509px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:83.733px;fill:rgb(0,220,255);">+</text>
                                    </g>
                                </g>
                            </g>
                            <!-- CUSTOMIZATION LABELS -->
                            <g transform="matrix(1,0,0,1,-2.06066,-30.6602)">
                                <g transform="matrix(1.20829,0,0,1.20829,93.431,425.879)">
                                    <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">K<tspan x="5187.23px 5217.96px " y="-950.424px -950.424px ">ey</tspan> W<tspan x="5314.17px 5346.6px 5366.67px " y="-950.424px -950.424px -950.424px ">ord</tspan>s</text>
                                </g>
                                <g transform="matrix(1.20829,0,0,1.20829,80.6185,724.058)">
                                    <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">Highlight<tspan x="5396.52px " y="-950.424px ">e</tspan>r</text>
                                </g>
                                <g transform="matrix(1.20829,0,0,1.20829,134.462,1022.24)">
                                    <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">Sha<tspan x="5249.15px 5284.22px 5315.87px " y="-950.424px -950.424px -950.424px ">dow</tspan></text>
                                </g>
                            </g>
                            <!-- CUSTOMIZATION BUTTONS -->
                            <g transform="matrix(1.20829,0,0,1.20829,70.089,193.513)">
                                <!-- CUSTOMIZATION TITLE -->
                                <text x="5151.7px" y="-950.424px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:51.726px;fill:rgb(211,211,211);">C<tspan x="5188.78px 5229.75px 5261.05px 5290.22px " y="-950.424px -950.424px -950.424px -950.424px ">USTO</tspan>MIZE</text>
                            </g>
                            <!-- KEYWORD: GREEN -->
                            <g transform="matrix(1,0,0,1,-4.65112,-47.8655)">
                                <path id="customKeywordGreen" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(0,231,56);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- KEYWORD: Yellow -->
                            <g transform="matrix(1,0,0,1,177.305,-47.8655)">
                                <path id="customKeywordYellow" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(255,255,0);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- KEYWORD: OFF TEXT -->
                            <g transform="matrix(1,0,0,1,-4.75896,-14.7848)">
                                <text id="customKeywordOffText" x="6632.01px" y="-627.14px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:37.5px;fill:white;fill-opacity:1;">OFF</text>
                            </g>
                            <!-- KEYWORD: OFF BORDER -->
                            <g transform="matrix(1,0,0,1,359.261,-47.8655)">
                                <path id="customKeywordOff" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgba(0,220,255,0.5);fill-opacity:0;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- HIGHLIGHTER: BLUE -->
                            <g transform="matrix(1,0,0,1,-4.65112,247.608)">
                                <path id="customHighlighterBlue" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(230,239,253);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- HIGHLIGHTER: YELLOW -->
                            <g transform="matrix(1,0,0,1,177.305,247.608)">
                                <path id="customHighlighterYellow" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(255,255,0);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- HIGHLIGHTER: GREEN -->
                            <g transform="matrix(1,0,0,1,359.261,247.608)">
                                <path id="customHighlighterGreen" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(0,231,56);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- SHADOW: BLUE -->
                            <g transform="matrix(1,0,0,1,-4.65112,543.082)">
                                <path id="customShadowBlue" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(0,220,255);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- SHADOW: YELLOW -->
                            <g transform="matrix(1,0,0,1,177.305,543.082)">
                                <path id="customShadowYellow" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(255,255,0);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                            <!-- SHADOW: GREEN -->
                            <g transform="matrix(1,0,0,1,359.261,543.082)">
                                <path id="customShadowGreen" d="M6383.21,-623.587C6383.21,-632.639 6375.86,-639.989 6366.81,-639.989L6248.59,-639.989C6239.54,-639.989 6232.19,-632.639 6232.19,-623.587L6232.19,-590.783C6232.19,-581.73 6239.54,-574.38 6248.59,-574.38L6366.81,-574.38C6375.86,-574.38 6383.21,-581.73 6383.21,-590.783L6383.21,-623.587Z" style="fill:rgb(0,231,56);fill-opacity:0.28;stroke:rgb(0,220,255);stroke-opacity:0.48;stroke-width:2.08px;"/>
                            </g>
                        </g>
                        <!-- EXIT BUTTON -->
                        <g id="exitButton" transform="matrix(3.54031e-17,-0.574888,0.574888,3.54031e-17,5493.27,3411.7)">
                            <g transform="matrix(0.747537,0,0,1,1453.24,2.7525)">
                                <path id="exitButtonBorder" d="M6718.89,-2362.78C6718.89,-2392.37 6686.75,-2416.4 6647.16,-2416.4L5093.61,-2416.4C5054.02,-2416.4 5021.88,-2392.37 5021.88,-2362.78L5021.88,-2255.53C5021.88,-2225.93 5054.02,-2201.91 5093.61,-2201.91L6647.16,-2201.91C6686.75,-2201.91 6718.89,-2225.93 6718.89,-2255.53L6718.89,-2362.78Z" style="fill:rgb(15,19,28);fill-opacity:0.83;stroke:rgb(255,94,94);stroke-width:12.31px;"/>
                            </g>
                            <g transform="matrix(1,0,0,1,-298.657,185.065)">
                                <text id="exitButtonText" x="5978.87px" y="-2435.24px" style="font-family:'Montserrat-Regular', 'Montserrat';font-size:150px;fill:rgb(255,89,89);">E<tspan x="6077.87px 6172.67px " y="-2435.24px -2435.24px ">XI</tspan>T</text>
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    `;
    }
    
}


// Expose to global.
window.SettingsView = SettingsView;
window.TrackerStyle = TrackerStyle;
})(); // End of namespace
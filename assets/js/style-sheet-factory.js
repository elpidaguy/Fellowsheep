/***********************************************************************
Style Sheet Factory
Author: Brenton Klik

Prerequisites: AngularJS

Description:
This factory provides a series of methods to make management of CSS
styles in javascript easier. Directives may take advantage of these
to include thier CSS as part of their code, rather than an external
style sheet.
/**********************************************************************/
angular.module('style-sheet-factory', [])

.factory('styleSheetFactory', ['$log', function($log) {
    /************************************************************************
    Local Variables
    ************************************************************************/
    // Array of selectors modified by the browser.
    var _modifiedSelectors = [];

    var _insertCSSRule = function(sheet, selector, rules, index) {
        index = index || 1;

        try {
            sheet.insertRule(selector + "{" + rules + "}", index);

            // Parse browser's selector
            var newSelector = sheet.cssRules[index].cssText.split(' {')[0];

            // If browser modified the selector, store it.
            if(selector !== newSelector) {
                var selectorObj = {
                    'old': selector,
                    'new': newSelector
                };

                _modifiedSelectors.push(selectorObj);
            }

            return sheet.cssRules[1].cssText;
        } catch(e) {
            $log.error('Failed to add rule: ' + selector);
        }
    };

    return {
        // Finds and returns the browsers's main style sheet.
        getStyleSheet: function() {
            for(var i=0; i<document.styleSheets.length; i++) {
                if(
                    document.styleSheets[i].media.mediaText === '' ||
                    document.styleSheets[i].media.mediaText === 'all' ||
                    document.styleSheets[i].media.mediaText === 'screen'
                ) {
                    return document.styleSheets[i];
                }
            }
    
            return null;
        },
    
        // Gets the prefix related to the user's browser type. Used in
        // CSS for non-standardized properties.
        getPrefix: function() {
            var prefixes = ['Webkit', 'Moz', 'ms', 'O', 'Khtml'];
            var len = prefixes.length;

            for(var i=0; i<len; i++) {
                if(document.body.style[ prefixes[i] + 'AnimationName' ] !== undefined) {
                    return '-'+prefixes[i].toLowerCase()+'-';
                }
            }
            return '';
        },
    
        // Returns whether a rule of that selector exists in the stylesheet.
        hasCSSRule: function(sheet, selector) {
            var rules = sheet.cssRules;
            var len = _modifiedSelectors.length

            // Check for a modified selector.
            for(var m=0; m<len; m++) {
                if(selector === _modifiedSelectors[m].old) {
                    selector = _modifiedSelectors[m].new;
                }
            }

            len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].selectorText === selector) {
                    return true;
                }
            }

            return false;
        },

        // Returns whether a keyframe of that name exists in the stylesheet.
        hasCSSKeyframes: function(sheet, name) {
            var rules = sheet.cssRules;
            var len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].name === name) {
                    return true;
                }
            }
    
            return false;
        },
    
        // If no selector of that rule exists, adds the new rule to the stylesheet.
        addCSSRule: function(sheet, selector, rules, index) {
            if(!this.hasCSSRule(sheet, selector)) {
                return _insertCSSRule(sheet, selector, rules, index);
            }
        },
    
        // Removes a rule of the given selector from the stylesheet.
        removeCSSRule: function(sheet, selector) {
            var rules = sheet.cssRules;
            var len = _modifiedSelectors.length;

            // Check for a modified selector and remove it.
            for(var m=0; m<len; m++) {
                if(selector === _modifiedSelectors[m].old) {
                    selector = _modifiedSelectors[m].new;

                    _modifiedSelectors.splice(m, 1);
                }
            }

            len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].selectorText === selector) {
                    sheet.deleteRule(i);
                    return true;
                }
            }

            return false;
        },

        // Removes a keyframe of the given name from the stylesheet.
        removeCSSKeyframes: function(sheet, name) {
            var rules = sheet.cssRules;
            var len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].name === name) {
                    sheet.deleteRule(i);
                    return true;
                }
            }

            return false;
        },
    
        // Adds a keyframes animation to the stylesheet with te appropriate prefixing.
        addCSSKeyframes: function(sheet, name, rules, index) {
            if(!this.hasCSSKeyframes(sheet, name)) {
                return _insertCSSRule(sheet, '@'+this.getPrefix()+'keyframes '+name, rules, index);
            }
        }
    }
}]);

/**
 * @fileoverview Data validator.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */
Validator = {};


/**
 * State abbreviations used for state validation.
 * @const {Array.<string>}
 */
Validator.STATE = [
  'alabama',
  'alaska',
  'american samoa',
  'arizona',
  'arkansas',
  'california',
  'colorado',
  'connecticut',
  'delaware',
  'district of columbia',
  'florida',
  'georgia',
  'guam',
  'hawaii',
  'idaho',
  'illinois',
  'indiana',
  'iowa',
  'kansas',
  'kentucky',
  'louisiana',
  'maine',
  'maryland',
  'massachusetts',
  'michigan',
  'minnesota',
  'mississippi',
  'missouri',
  'montana',
  'nebraska',
  'nevada',
  'new hampshire',
  'new jersey',
  'new mexico',
  'new york',
  'north carolina',
  'north dakota',
  'ohio',
  'oklahoma',
  'oregon',
  'pennsylvania',
  'puerto rico',
  'rhode island',
  'south carolina',
  'south dakota',
  'tennessee',
  'texas',
  'utah',
  'vermont',
  'virginia',
  'washington',
  'west virginia',
  'wisconsin',
  'wyoming'
];


/**
 * State abbreviations used for state validation.
 * @const {Array.<string>}
 */
Validator.STATE_ABBREV = [
  'AL',
  'AK',
  'AS',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'GU',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'PR',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY'
];




/**
 * Validate and correct phone number format. This function does not
 * support international numbers.
 * @param {Object} input
 * @return {string} output
 */
Validator.phoneNumber = function(input) {
  if (!input) {
    return '';
  }
  
  // Strip all stuff except numbers and x.
  var fromString = input.toString().replace(/[^\d+!x]/g, '').split('x');
  if (fromString.length <= 2) {
    if (fromString[0].length == 10) {
      var retValue = fromString[0].substr(0, 3) + '-' +
          fromString[0].substr(3, 3) + '-' +
          fromString[0].substr(6, 4);
      if (fromString.length == 2 && fromString[1].length) {
        retValue += 'x' + fromString[1];
      }
      return retValue;
    }
  }
  return '';
};


function testValidatorPhoneNumber() {
  assertEquals('626-123-4567x88999',
               Validator.phoneNumber('(626)123-4567 ext 88999'));
  assertEquals('626-123-4567',
               Validator.phoneNumber('(626) 123 4567 xray department'));
  assertEquals('626-123-4567',
               Validator.phoneNumber(6261234567));
  assertEquals('626-123-4567',
               Validator.phoneNumber('626.123.4567'));
  assertEquals('626-123-4567',
               Validator.phoneNumber('626 1234567'));
  assertEquals('626-123-4567',
               Validator.phoneNumber('626 123-4567'));
  assertEquals('',
               Validator.phoneNumber('+886-2-2571-4438'));
  assertEquals('',
               Validator.phoneNumber('886225714438'));
  doLog('testValidatorPhoneNumber', 'PASSED');
}


/**
 * Validate email address.
 * @param {Object} input
 * @return {string} output
 */
Validator.email = function(input) {
  if (!input) {
    return '';
  }
  
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
  return re.test(input) ? input.toLowerCase() : '';
};


function testValidatorEmail() {
  assertEquals('whatever@gmail.com', Validator.email('whatever@gmail.com'));
  assertEquals('what.ever@gmail.com', Validator.email('what.ever@gmail.com'));
  // The regex is not perfect, it does not like the case below.
  //assertEquals('whatever@gmail.com.', Validator.email('whatever@gmail.com.'));
  assertEquals('what_ever@gmail.com', Validator.email('What_Ever@GMAIL.COM'));
  assertEquals('', Validator.email('what@ever@gmail.com'));
  assertEquals('', Validator.email('whatever'));
  assertEquals('', Validator.email('whatever@'));
  doLog('testValidatorEmail', 'PASSED');
}


/**
 * Validate ZIP code. (US only)
 * @param {Object} input
 * @return {string} output
 */
Validator.zip = function(input) {
  if (!input) {
    return '';
  }
  
  var re = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
  return re.test(input) ? input.toString() : '';
};


function testValidatorZip() {
  assertEquals('90034', Validator.zip('90034'));
  assertEquals('90034-7865', Validator.zip('90034-7865'));
  assertEquals('', Validator.zip('what?'));
  assertEquals('', Validator.zip('012ab'));
  assertEquals('', Validator.zip('90034-56789'));
  doLog('testValidatorZip', 'PASSED');
}


/**
 * Validate State. (US only)
 * @param {Object} input
 * @return {string} output
 */
Validator.state = function(input) {
  if (!input) {
    return '';
  }
  
  if (input.length == 2) {
    var result = input.toUpperCase();
    return (Validator.STATE_ABBREV.indexOf(input.toUpperCase()) !== -1) ? result : '';
  } else {
    var index = Validator.STATE.indexOf(input.toLowerCase());
    return (index !== -1) ? Validator.STATE_ABBREV[index] : '';
  }
}


function testValidatorState() {
  assertEquals('CA', Validator.state('California'));
  assertEquals('CA', Validator.state('Ca'));
  assertEquals('', Validator.state('tw'));
  assertEquals('', Validator.state('Calibania'));
  doLog('testValidatorState', 'PASSED');
}


/**
 * Checks published DB.
 * @return {!Array.<string>} Parser warnings.
 * @throw {GSError}
 */
function checkDb() {
  var db = Db.getInstance();
  var warnings = [];
  db.detectError(warnings);
  return warnings;
}
/**
 * @fileoverview Doc id constants and common function that requires configuration.
 *
 * Doc id can be found from URL. For example:
 * https://docs.google.com/a/westsidechineseschool.org/spreadsheets/d/1cPxKNHb7UkX-HYX6C92foLGDEUJB8KTkVxbkZwOODKU/edit#gid=0
 * The doc id is the 1cPx...DKU part.
 */

function loadConfig() {
  // Dummy function to make sure this file is loaded in advance
}

/**
 * Returns current school year, if not specified.
 * The cut-off date is June 20 of every year.
 * @return {number}
 */
function getSchoolYear() {
  return 2017;
}

var NAME_LOOKUP = '12ZOp_uNOha9kA3vRyjk0EbfboxN0_lZONTRw1Os8wNg';
var DB_DOCID = '1dtBHk5sEjJt4RXHFCzArFw6iDqw8M7HifyPDLhoL6xU';

// ServiceDB2016 (previous year)
var SERVICEDB_DOCID = '19UMfbAKD-t6iyF22FDeMO2Ta2pIldbVFTeBhBG9jeNE';

var TUITION_BREAKDOWN_DOCID = '1d3Q1VR9aO-ItFSUBvI6a9INdEkkt0FJMMPldDlNeDHg';

// Cut off date. 2017-08-01. This is GMT, so PST daylight time is 7 hours later.
var CUT_OFF_DATE = new Date(Date.UTC(2017, 7, 1, 7)).getTime();

var PAYMENT_DOCID = '1jqUeJNGEKLWB8otJMCD9e4gYGYQ67GHG0evv6wHLjIE';
var WITHDRAW_SHEET_DOCID = '1At5Kv3JK9tbTRAn4XCUTjiCnoYiq7fvz5TXY-sTqS0g';
var WITHDRAW_FORM_DOCID = '1hZemgsVVPAbg5_7tbO2NTwiYlkOV4_Wt-x74h4aUeNw';
var MAIL_BLAST_TEMPLATE = 'ReturningStudentInfo2017-en.html';
var EC_DOCID = '1LfCjVxymw_OYFLlcwuqNKFJBHAxFUklIRMVSrjXtaTs';


/**
 * School start date, used to calculate EC eligibility.
 * 2017-09-09. This is GMT, so PST daylight time is 7 hours later.
 * @const {number}
 */
var SCHOOL_START_DATE = new Date(Date.UTC(2017, 9, 9, 7)).getTime();


/**
 * Early bird tuition per student.
 * @const {number}
 */
var EARLY_BIRD_TUITION = 700;


/**
 * Normal tuition per student.
 * @const {number}
 */
var NORMAL_TUITION = 800;


/**
 * Service points deposit per family.
 * @const {number}
 */
var SERVICE_DEPOSIT = 200;


/**
 * Service fine per point.
 * @const {number}
 */
var SERVICE_FINE = 20;


/**
 * Minimal service points requirements.
 * @const {number}
 */
var MIN_SERVICE_POINTS = 20;


/**
 * New Family non-refundable fee.
 * @const {number}
 */
var NEW_FAMILY_FEE = 100;

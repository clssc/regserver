/**
 * @fileoverview The EC database.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */


/**
 * EC2017
 * @const {string}
 */
var EC_DOCID = '1LfCjVxymw_OYFLlcwuqNKFJBHAxFUklIRMVSrjXtaTs';


/**
 * EC class entry.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
var ECClassItem = function(values) {
  /** @type {string} */
  this.code = values[0];
  
  /** @type {string} */
  this.name = values[1];
  
  /** @type {number} */
  this.min_age = values[2];

  /** @type {number} */
  this.max_size = values[3];
  
  /** @type {number} */
  this.current_size = values[4];
};


/**
 * EC classes.
 * @param {Sheet} sheet
 * @constructor
 * @private
 */
var ECClasses_ = function(sheet) {
  /** @type {Array.<ECClassItem>} */
  this.data = [];

  if (sheet) {
    // Skip title row.
    var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
    if (range) {
      var rows = range.getValues();
      for (var i = 0; i < rows.length; ++i) {
        if (typeof(rows[i][0]) != 'string' || !rows[i][0]) continue;
        this.data.push(new ECClassItem(rows[i]));
      }
    }
  }
};


/**
 * The EC sheet.
 * @param {string=} opt_dbName Spreadsheet name to open as database.
 * @constructor
 */
var ECDB = function(opt_dbName) {
  /** @private {ECClasses_} */
  this.classes_;
  
  /** @private {ECEnrollment} */
  this.enrollment_;
  
  this.initialize_(opt_dbName || EC_DOCID);
};


/**
 * Reads the DB and construct map.
 * @param {string=} opt_dbName Spreadsheet name to open as database
 * @private
 */
ECDB.prototype.initialize_ = function(opt_dbName) {
  var dbName = opt_dbName || 'EC' + getSchoolYear().toString();
  var openById = (dbName == EC_DOCID);
  var spreadsheet = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  
  this.classes_ = new ECClasses_(spreadsheet.getSheetByName('Classes'));
};


/** @return {!Array.<ECClassItem>} */
ECDB.prototype.getClasses = function() {
  return this.classes_.data;
};


/**
 * Register students to EC class. The transaction will succeed/fail as a whole.
 * @param {Array.<{family_id: number, student: string, class: string}>} data
 * @return {string}
 */
ECDB.prototype.register = function(data) {
  return 'FAILED: not implemented';
};


function testGetClasses() {
  var ec = new ECDB();
  Logger.log(ec.getClasses());
}

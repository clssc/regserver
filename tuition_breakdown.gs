/**
 * @fileoverview The tuition breakdown abstraction.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */


/**
 * TuitionBreakdown2016
 * @const {string}
 */
var TUITION_BREAKDOWN_DOCID = '1o_Bluuj8KaOYQR6uQBBr84vm6p3Mj97JM07xTP7ga0g';


/**
 * Cut off date. 2016-08-01. This is GMT, so PST daylight time is 7 hours later.
 */
var CUT_OFF_DATE = new Date(Date.UTC(2016, 7, 1, 7)).getTime();


/**
 * Data item of 'TuitionBreakdown'.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
TuitionItem = function(values) {
  /** @type {number} */
  this.family_number = values[0];
  
  /** @type {number} */
  this.num_students = values[1];
  
  /** @type {number} */
  this.service_points = values[2];
  
  /** @type {number} */
  this.early_tuition = values[3];
  
  /** @type {number} */
  this.normal_tuition = values[4];
  
  /** @type {number} */
  this.actual_tuition = values[5];
  
  /** @type {number} */
  this.service_fine = values[6];
  
  /** @type {number} */
  this.credits = values[7];
  
  /** @type {number} */
  this.total = values[8];
  
  /** @type {Date} */
  this.transaction_date = values[9]
  
  /** @type {string} */
  this.notes = values[10];
};



/**
 * The tuition breakdown sheet.
 * @param {string=} opt_dbName Spreadsheet name to open as database.
 * @constructor
 */
var TuitionBreakdownDB = function(opt_dbName) {
  /** @private {!Sheet} */
  this.sheet_;
  
  this.initialize_(opt_dbName || TUITION_BREAKDOWN_DOCID);
};


/**
 * Reads the DB and construct map.
 * @param {string=} opt_dbName Spreadsheet name to open as database
 */
TuitionBreakdownDB.prototype.initialize_ = function(opt_dbName) {
  var dbName = opt_dbName || 'TuitionBreakdownDB' + getSchoolYear().toString();
  var openById = (dbName == TUITION_BREAKDOWN_DOCID);
  var spreadsheet = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  
  this.sheet_ = spreadsheet.getSheets()[0];
};


/**
 * Finds row by family id.
 * @param {number} familyId
 * @return {?Range} The row, or null if not found.
 * @private
 */
TuitionBreakdownDB.prototype.findRow_ = function(familyId) {
  var range = this.sheet_.getRange(2, 1, this.sheet_.getLastRow(), this.sheet_.getLastColumn());
  var rows = range.getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (rows[i][0] == familyId) {
      var cellRange = 'A' + (i + 2).toString() + ':K' + (i + 2).toString();
      return this.sheet_.getRange(cellRange.toString());
    }
  }
  return null;
};


/**
 * Deletes a row.
 * @param {number} familyId
 */
TuitionBreakdownDB.prototype.remove = function(familyId) {
  var row = this.findRow_(familyId);
  if (row) {
    var position = row.getRow();
    this.sheet_.deleteRow(position);
  }
};


/**
 * Inserts or replaces data in the sheet.
 * @param {TuitionItem} item
 */
TuitionBreakdownDB.prototype.insertOrReplace = function(item) {
  var row = this.findRow_(item.family_number);
  var values = [
    item.family_number,
    item.num_students,
    item.service_points,
    item.early_tuition,
    item.normal_tuition,
    item.actual_tuition,
    item.service_fine,
    item.credits,
    item.total,
    item.transaction_date,
    item.notes
  ];
  
  if (row) {
    // This is an replacement.
    row.setValues([values]);
    return;
  }
  
  // This is an insertion.
  this.sheet_.appendRow(values);
};


/**
 * Select row from the sheet by family id, or return null if not found.
 * @param {number} familyId
 * @return {?TuitionItem}
 */
TuitionBreakdownDB.prototype.select = function(familyId) {
  var range = this.findRow_(familyId);
  if (range) {
    return new TuitionItem(range.getValues()[0]);
  }
  return null;
};


/**
 * Returns family numbers on TuitionBreakdown DB.
 * @return {!Array<number>}
 */
TuitionBreakdownDB.prototype.getFamilyNumbers = function() {
  var range = this.sheet_.getRange(2, 1, this.sheet_.getLastRow() - 1, 1);
  var results = [];
  range.getValues().forEach(function(value) {
    results.push(value[0]);
  });
  return results;
};


function testTuitionBreakdownSelect() {
  var sheet = new TuitionBreakdownDB('TuitionBreakdownTest');
  var item1 = sheet.select(3366);
  var item2 = sheet.select(3388);
  assertNull(item2);
  assertEquals(3366, item1.family_number);
}

function testTuitionBreakdownSCUD() {
  var sheet = new TuitionBreakdownDB('TuitionBreakdownTest');
  sheet.remove(3322);
  var item = new TuitionItem([
    3322,
    1,
    15,
    600,
    700,
    700,
    100,
    0,
    800,
    null,
    'test'
  ]);
  sheet.insertOrReplace(item);
  var item2 = sheet.select(3322);
  assertEquals(15, item2.service_points);
  assertEquals(100, item2.service_fine);
  assertEquals(800, item2.total);
  
  item.service_points = 20;
  item.service_fine = 0;
  item.total = 700;
  sheet.insertOrReplace(item);
  
  var item3 = sheet.select(3322);
  assertEquals(20, item3.service_points);
  assertEquals(0, item3.service_fine);
  assertEquals(700, item3.total);
  
  sheet.remove(3322);
  assertNull(sheet.select(3322));
}


/**
 * @param {number} familyNumber
 * @param {string=} opt_dbName
 * @return {number} Tuition to pay: 0: not found, -1: already paid, positive numbers: amount to pay.
 */
function lookupTuition(familyNumber, opt_dbName) {
  var sheet = new TuitionBreakdownDB(opt_dbName);
  var now = new Date().getTime();
  var item = sheet.select(familyNumber);
  if (item) {
    if (item.transaction_date) {
      return -1;
    } else if (now <= CUT_OFF_DATE) {
      return item.early_tuition + item.service_fine - item.credits;
    } else {
      return item.normal_tuition + item.service_fine - item.credits;
    }
  }
  
  return 0;
}

function testLookupTuition() {
  assertEquals(1140, lookupTuition(3366, 'TuitionBreakdownTest'));
  assertEquals(-1, lookupTuition(3520, 'TuitionBreakdownTest'));
  assertEquals(0, lookupTuition(3388, 'TuitionBreakdownTest'));
}

function testGetFamilyNumbers() {
  var sheet = new TuitionBreakdownDB('TuitionBreakdownTest');
  var results = sheet.getFamilyNumbers();
  assertEquals(2, results.length);
  assertEquals(3366, results[0]);
  assertEquals(3520, results[1]);
}

function testRealLookupTuition() {
  Logger.log(lookupTuition(1020));
}

function testSetPaid() {
  setPaid(1020);
}

/**
 * @param {number} familyNumber
 */
function setPaid(familyNumber) {
  var sheet = new TuitionBreakdownDB();
  var timestamp = Utilities.formatDate(new Date(), 'PST', 'MM-dd-yyyy HH:mm:ss z').toString();
  var item = sheet.select(familyNumber);
  if (item) {
    if (item.transaction_date) {
      // Already set, do nothing.
    } else {
      item.transaction_date = timestamp;
      sheet.insertOrReplace(item);
    }
  }
}
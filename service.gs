/**
 * @fileoverview The service points database, defaulted to previous year.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * File name of the database.
 * @type {string}
 * @const
 */
var SERVICE_DB_NAME = 'ServiceDB';


/**
 * ServiceDB2016 (previous year)
 * @const {string}
 */
var SERVICEDB_DOCID = '19UMfbAKD-t6iyF22FDeMO2Ta2pIldbVFTeBhBG9jeNE';


/**
 * The service points database.
 * @param {string=} opt_dbName Spreadsheet name to open as database.
 * @constructor
 */
var ServiceDb = function(opt_dbName) {
  /** @private {Object} */
  this.map_ = {};
  
  this.initialize_(opt_dbName || SERVICEDB_DOCID);
};


/**
 * Reads the DB and construct map.
 * @param {string=} opt_dbName Spreadsheet name to open as database
 */
ServiceDb.prototype.initialize_ = function(opt_dbName) {
  var dbName = opt_dbName || 'ServiceDB' + (getSchoolYear() - 1).toString();
  var openById = (dbName == SERVICEDB_DOCID);
  var spreadsheet = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  this.map_ = {};
  
  var sheet = spreadsheet.getSheets()[0];
  var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  var rows = range.getValues();
  for (var i = 0; i < rows.length; ++i) {
    var familyNumber = rows[i][1];
    var points = rows[i][3];
    if (typeof(familyNumber) != 'number' || !familyNumber ||
        typeof(points) != 'number' || !points) {
      continue;
    }
    
    if (this.map_[familyNumber] && this.map_[familyNumber] != points) {
      DebugLog('WARNING: inconsistent service point, family# ' + familyNumber + ' ' +
               this.map_[familyNumber] + ' ' + points);
    }
    this.map_[familyNumber] = points;
  }
  DebugLog('opened ' + dbName);
};


/**
 * Looks up service point in DB.
 * @param {number} familyNumber
 * @return {number}
 */
ServiceDb.prototype.lookup = function(familyNumber) {
  return (this.map_[familyNumber]) ? this.map_[familyNumber] : 0;
};


function testServiceDb() {
  var serviceDb = new ServiceDb('ServiceDBTest');
  assertEquals(0, serviceDb.lookup(462));
  assertEquals(20, serviceDb.lookup(968));
  assertEquals(20, serviceDb.lookup(1017));
  assertEquals(12, serviceDb.lookup(1048));
}


function testServiceRevision() {
  var revisions = Drive.Revisions.list(SERVICEDB_DOCID);
  if (revisions.items && revisions.items.length > 0) {
    for (var i = 0; i < revisions.items.length; i++) {
      var revision = revisions.items[i];
      Logger.log(revision);
    }
  } else {
    Logger.log('No revisions found.');
  }
}
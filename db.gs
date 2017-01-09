/**
 * @fileoverview The registration database.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */


/**
 * REGDB2017
 * @const {string}
 */
var DB_DOCID = '1dtBHk5sEjJt4RXHFCzArFw6iDqw8M7HifyPDLhoL6xU';


/**
 * File name of the database.
 * @type {string}
 * @const
 */
var DB_NAME = 'RegDB';


/**
 * Globally cached DB instances.
 * @type {Object}
 * @const
 */
var DBInstances = {};


/**
 * The registration database.
 * @param {string} opt_dbName Spreadsheet name or id to open as database.
 * @param {boolean=} opt_openById The dbName given is a doc id.
 * @constructor
 */
Db = function(opt_dbName, opt_openById) {
  /**
   * Tables in the database. App script does not allow enum,
   * so we need to use fragile strings.
   * @type {Object.<string, Sheet>}
   * @private
   */
  this.tables_ = {
    'Class': null,
    'Family': null,
    'Parent': null,
    'Student': null
  };
  
  /**
   * Cached Class object.
   * @private {Class}
   */
  this.class_;
  
  /**
   * Cached Family object.
   * @private {Family}
   */
  this.family_;
  
  /**
   * Cached Parent object.
   * @private {Parent}
   */
  this.parent_;
  
  /**
   * Cached Student object.
   * @private {Student}
   */
  this.student_;
  
  this.initialize_(opt_dbName, opt_openById);
};


/**
 * Get Class data.
 * @return {Class}
 */
Db.prototype.getClass = function() {
  if (!this.class_) {
    this.class_ = new Class(this.loadData_('Class'));
  }
  return this.class_;
};


/**
 * Get Family data.
 * @return {Family}
 */
Db.prototype.getFamily = function() {
  if (!this.family_) {
    this.family_ = new Family(this.loadData_('Family'));
  }
  return this.family_;
};


/**
 * Get Parent data. This is a very expensive call, and caller is supposed
 * to cache the returned object.
 * @return {Family}
 */
Db.prototype.getParent = function() {
  if (!this.parent_) {
    this.parent_ = new Parent(this.loadData_('Parent'));
  }
  return this.parent_;
};


/**
 * Get Student data. This is a very expensive call, and caller is supposed
 * to cache the returned object.
 * @return {Student}
 */
Db.prototype.getStudent = function() {
  if (!this.student_) {
    this.student_ = new Student(this.loadData_('Student'));
  }
  return this.student_;
};


/**
 * Helper function to load data in table into memory.
 * @param {string} tableName The table to load.
 * @return {Range} Data range of the table (including titles).
 * @private
 */
Db.prototype.loadData_ = function(tableName) {
  var sheet = this.tables_[tableName];
  if (sheet) {
    // Skip title row.
    return sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  }
  return null;
};


/**
 * Initialize database.
 * @param {string} opt_dbName
 * @param {boolean} opt_openById
 * @private_
 */
Db.prototype.initialize_ = function(opt_dbName, opt_openById) {
  this.clear();
  
  // Search and open the spread sheet
  var dbName = opt_dbName || DB_DOCID;
  var openById = opt_openById || (dbName == DB_DOCID);
  var spreadsheet = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  
  // Map all sheet objects
  if (spreadsheet) {
    var sheets = spreadsheet.getSheets();
    for (var i = 0; i < sheets.length; ++i) {
      this.tables_[sheets[i].getName()] = sheets[i];
    }
  }
  
  if (DBInstances[dbName]) {
    DebugLog('WARNING: recreating DB instance for ' + dbName);
  }
  DBInstances[dbName] = this;
  DebugLog('opened ' + dbName);
};


/**
 * Lookup family number by name of any member of that family. The name format
 * must be first_name last_name as what's input in enrollment form.
 * @param {Array<string>|string} names Name of the family member.
 * @return {number} Family number, -1 means not found.
 */
Db.prototype.lookupFamilyNumber = function(names) {
  if (!Array.isArray(names)) {
    names = [names];
  }

  var parents = this.getParent().getAll();
  var students = this.getStudent().getAll();
  
  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    if (name.trim().length == 0) {
      return -1;
    }
    var lowerCaseName = name.toLowerCase();
    
    // Search parent table first.
    for (var j = 0; j < parents.length; ++j) {
      if (parents[j].english_name.toLowerCase() == lowerCaseName ||
          parents[j].chinese_name == name) {
        return parents[j].family_number;
      }
    }
    
    // If not, search student table.
    for (var j = 0; j < students.length; ++j) {
      var english_name = students[j].first_name + ' ' + students[j].last_name;
      english_name = english_name.toLowerCase();
      if (english_name.substring(0, 3) == 'ida') Logger.log(english_name + ' ' + lowerCaseName);
      if (english_name == lowerCaseName || students[j].chinese_name == name) {
        return students[j].family_number;
      }
    }
  }
  
  return -1;
};


/** @param {Db} db Test database to use. */
function testLookupFamilyNumber(db) {
  assertEquals(-1, db.lookupFamilyNumber('Arthur Hsu'));
  assertEquals(8765, db.lookupFamilyNumber('Lily Lee'));
  assertEquals(8765, db.lookupFamilyNumber('lily lee'));
  assertEquals(8765, db.lookupFamilyNumber('李強'));
  assertEquals(8765, db.lookupFamilyNumber(['Lily Lee', '李強']));
  assertEquals(2345, db.lookupFamilyNumber('John Doe'));
  assertEquals(2345, db.lookupFamilyNumber('杜凱琪'));
  DebugLog('testLookupFamilyNumber: PASSED');
}


/**
 * Resets Db to initial state.
 * Google Apps Script does not really supports prototype and
 * JavaScript inheritance. Creating two class objects in the
 * same file will cause merging.
 */
Db.prototype.clear = function() {
  this.tables_ = {
    'Class': null,
    'Family': null,
    'Parent': null,
    'Student': null
  };
  this.class_ = undefined;
  this.family_ = undefined;
  this.parent_ = undefined;
  this.student_ = undefined;
};


/**
 * Detects errors in the database. This detects duplicates and inconsistencies.
 * Inconsistency means that a family number have only data in N of 3 tables where
 * 1 < N < 3.
 * @param {!Array.<string>} warnings Warning messages.
 */
Db.prototype.detectError = function(warnings) {
  this.getClass().detectDupe(warnings);
  this.getFamily().detectDupe(warnings);
  this.getParent().detectDupe(warnings);
  this.getStudent().detectDupe(warnings);
  
  // Now scan through the family numbers.
  var keys = [];
  var values = [];
  var families = this.family_.getAll();
  var parents = this.parent_.getAll();
  var students = this.student_.getAll();

  var mark = function(familyNumber, count) {
    var index = keys.indexOf(familyNumber);
    if (index == -1) {
      keys.push(familyNumber);
      values.push(count);
    } else {
      values[index] += count;
    }
  };
  
  for (var i = 0; i < families.length; ++i) {
    mark(families[i].family_number, 100);
  }
  for (var i = 0; i < parents.length; ++i) {
    mark(parents[i].family_number, 10);
  }
  for (var i = 0; i < students.length; ++i) {
    mark(students[i].family_number, 1);
  }
  
  for (var i = 0; i < keys.length; ++i) {
    if (values[i] < 111 || values[i] % 10 == 0 ||
        (values[i] / 10) % 10 == 0) {
      warnings.push('Inconsistent data: family number: ' + keys[i]);
    }
  }
  
  this.getFamily().detectError(warnings);
  this.getParent().detectError(warnings);
  this.getStudent().detectError(warnings);
};


/**
 * Lookup next available family number.
 * @return {number}.
 */
Db.prototype.nextAvailableFamilyNumber = function() {
  var family = this.getFamily().getAll();
  var family_number = 0;
  for (var i = 0; i < family.length; ++i) {
    if (family[i].family_number > family_number) {
      family_number = family[i].family_number;
    }
  }
  return family_number + 1;  
};


/**
 * Finds row by family id.
 * @param {number} familyId
 */
Db.prototype.setStudentAsActive = function(familyId) {
  var sheet = this.tables_['Student'];
  var range = sheet.getRange(2, 1, sheet.getLastRow(), 1);
  var rows = range.getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (rows[i][0] == familyId) {
      var cellRange = 'A' + (i + 2).toString() + ':M' + (i + 2).toString();
      var target = sheet.getRange(cellRange.toString())
      target.getCell(1, 11).setValue('Y');  // Active
      var memo = target.getCell(1, 13).getValue();
      if (memo && memo.length) {
        memo += '; ';
      }
      memo += 'Sys: Reg: ' + Utilities.formatDate(new Date(), 'PST', 'MM/dd/yy');
      target.getCell(1, 13).setValue(memo);
    }
  }
};


/**
 * Add new family.
 * @param {number} familyId
 * @param {string} submission
 * @return {number} Actual family number assigned
 */
Db.prototype.addNewFamily = function(familyId, submission) {
  var data;
  try {
    data = JSON.parse(submission);
  } catch(e) {
    DebugLog('WARNING: error parsing data: ' + submission);
    return -1;
  }
  
  var nextId = this.nextAvailableFamilyNumber();
  if (nextId != familyId) {
    DebugLog('WARNING: race condition detected: ' + familyId + '->' + nextId);
    familyId = nextId;
  }
  
  var rawData = new RawData(data);
  if (rawData.errMsg.length) {  // This should not happen, unless network errored.
    DebugLog('WARNING: error analyzing data: ' + submission);
    return -1;
  }
  
  rawData.setFamilyNumber(familyId);
  var entry = rawData.entry;
  var familyTable = this.tables_['Family'];
  FamilyItem.serialize(familyTable, entry.family);
  
  var parentTable = this.tables_['Parent'];
  for (var j = 0; j < entry.parents.length; ++j) {
    ParentItem.serialize(parentTable, entry.parents[j]);
  }
  
  var studentTable = this.tables_['Student'];
  for (var j = 0; j < entry.students.length; ++j) {
    StudentItem.serialize(studentTable, entry.students[j]);
  }
  
  if (rawData.entry.ec.length) {
    registerEC(familyId, rawData.entry.ec);
  }
  
  return familyId;
};


/**
 * Get DB instance.
 * @param {string=} opt_dbName
 * @return {Db}
 */
Db.getInstance = function(opt_dbName) {
  var dbName = opt_dbName || DB_DOCID;
  if (!DBInstances.dbName) {
    DBInstances.dbName = new Db(dbName, dbName == DB_DOCID);
  }
  return DBInstances.dbName;
}


/** @param {Db} db Test database to use. */
function testNextAvailableFamilyNumber(db) {
  assertEquals(10000, db.nextAvailableFamilyNumber());
  DebugLog('testNextAvailableFamilyNumber: PASSED');
}


/** Shorthand of getting next available family number of current db */
function getNextAvailableFamilyNumber() {
  var db = Db.getInstance();
  DebugLog(db.nextAvailableFamilyNumber());
}


/** Construct fast name lookup table */
function buildNameLookup() {
  var db = Db.getInstance();
  var parents = db.getParent().getAll();
  var students = db.getStudent().getAll();
  var tuples = [];
  for (var i = 0; i < parents.length; ++i) {
    tuples.push([
        parents[i].english_name,
        parents[i].chinese_name,
        parents[i].family_number]);
  }

  for (var j = 0; j < students.length; ++j) {
    tuples.push([
        students[j].first_name + ' ' + students[j].last_name,
        students[j].chinese_name,
        students[j].family_number]);
  }

  var outputFile = lookupAndOpenFile('NameLookup' + getSchoolYear().toString());
  shareFile(outputFile);
  var sheet = outputFile.getActiveSheet();
  sheet.clear();

  // Output title row
  sheet.appendRow([
    'english_name',
    'chinese_name',
    'family_number'
  ]);

  for (var k = 0; k < tuples.length; ++k) {
    sheet.appendRow(tuples[k]);
  }
}


/** Construct mail blast sheet */
function buildMailBlast() {
  var db = Db.getInstance();
  var outputFile = lookupAndOpenFile('MailBlast' + getSchoolYear().toString());
  var sheet = outputFile.getActiveSheet();
  sheet.clear();
  
  // Construct family data
  var data = {};
  var students = db.getStudent().getAllActive();
  var parents = db.getParent();
  
  for (var i = 0; i < students.length; ++i) {
    var s = students[i];
    if (data.hasOwnProperty(s.family_number)) {
      continue;
    }
    var p = parents.get(s.family_number);
    data[s.family_number] = p.map(function(item) {
      return item.email;
    });
  }
  
  // Output title row
  sheet.appendRow([
    'family_number',
    'email1',
    'email2',
    'form_id'
  ]);
  
  for (var j in data) {
    sheet.appendRow([j].concat(data[j]));
  }
}


/** Construct ServiceDB template */
function buildServiceDb() {
  var db = Db.getInstance();
  var outputFile = lookupAndOpenFile('ServiceDB' + getSchoolYear().toString());
  var sheet = outputFile.getActiveSheet();
  sheet.clear();
  sheet.setName('Service Points');
  sheet.appendRow([
    'class',
    'family_number',
    'last_name',
    'points',
    'cny_requirement_met',
    'memo'
  ]);
  
  // Construct family data
  var data = {};
  var students = db.getStudent().getAllActive();
  
  for (var i = 0; i < students.length; ++i) {
    var s = students[i];
    if (data.hasOwnProperty(s.family_number)) {
      continue;
    }
    data[s.family_number] = [s.currClass, s.family_number, s.last_name, 0, 'N', ''];
  }
  
  for (var j in data) {
    sheet.appendRow(data[j]);
  }
}


/**
 * @param {number} familyNumber
 * @param {string=} opt_db
 * @return {Object} [{name: string, birth_date: Date}]
 */
function getStudentInfo(familyNumber, opt_db) {
  var db = Db.getInstance(opt_db);
  return db.getStudent().get(familyNumber, false);
}

function testGetStudentInfo() {
  var info = getStudentInfo(8765, 'RegDBTest2017');
  assertEquals(2, info.length);
//  Logger.log(info[0]);
//  Logger.log(info[1]);
}


/**
 * @param {number} familyNumber
 * @param {string=} opt_db
 */
function setStudentAsActive(familyNumber, opt_db) {
  var db = Db.getInstance(opt_db);
  db.setStudentAsActive(familyNumber);
}

// Side effect on test DB, need manual edit to set it back
function testSetStudentAsActive() {
  setStudentAsActive(8765, 'RegDBTest2017');
}

function addNewFamily(familyNumber, submission, opt_db) {
  var db = Db.getInstance(opt_db);
  return db.addNewFamily(familyNumber, submission);
}

// Side effect on RegDBTest2017 and EC2017, need manual edit to set it back
function testAddFamily() {
  var submission = JSON.stringify(getTestData());
  addNewFamily(10000, submission, 'RegDBTest2017');
}

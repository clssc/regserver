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
 * School start date, used to calculate EC eligibility.
 * 2017-09-09. This is GMT, so PST daylight time is 7 hours later.
 * @const {number}
 */
var SCHOOL_START_DATE = new Date(Date.UTC(2017, 9, 9, 7)).getTime();


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
  this.current_size = 0;
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
  
  /** @type {Object} */
  this.map = {};

  if (sheet) {
    // Skip title row.
    var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
    if (range) {
      var rows = range.getValues();
      for (var i = 0; i < rows.length; ++i) {
        if (typeof(rows[i][0]) != 'string' || !rows[i][0]) continue;
        var item = new ECClassItem(rows[i]);
        this.data.push(item);
        this.map[item.code] = item;
      }
    }
  }
};


/**
 * EC enrollment entry.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
var ECEnrollmentItem = function(values) {
  /** @type {number} */
  this.family_number = values[0];
  
  /** @type {string} */
  this.student_name = values[1];
  
  /** @type {string} */
  this.class = values[2];
};


/**
 * EC enrollment.
 * @param {Sheet} sheet
 * @constructor
 * @private
 */
var ECEnrollment_ = function(sheet) {
  /** @type {Array.<ECEnrollmentItem>} */
  this.data = [];

  /** @type {Object} */
  this.stats = {};
  
  /** @private {Object} */
  this.map_ = {};
  
  if (sheet) {
    // Skip title row.
    var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
    if (range) {
      var rows = range.getValues();
      for (var i = 0; i < rows.length; ++i) {
        if (typeof(rows[i][0]) != 'number' || !rows[i][0]) continue;
        this.data.push(new ECEnrollmentItem(rows[i]));
      }
    }
    
    this.data.forEach(function(item) {
      this.update_(item.family_number, item.student_name, item.class);      
    }.bind(this));
  }
};


/**
 * @param {number} familyNumber
 * @param {string} studentName
 * @param {string} class
 * @private
 */
ECEnrollment_.prototype.update_ = function(familyNumber, studentName, class) {
  if (this.stats[class]) {
    ++this.stats[class];
  } else {
    this.stats[class] = 1;
  }
      
  if (this.map_[familyNumber]) {
    this.map_[familyNumber].push(studentName);
  } else {
    this.map_[familyNumber] = [studentName];
  }
};


/**
 * @param {number} familyNumber
 * @param {string} studentName
 */
ECEnrollment_.prototype.has = function(familyNumber, studentName) {
  return this.map_[familyNumber] && this.map_[familyNumber].indexOf(studentName.trim()) != -1;
};


/**
 * @param {Array} rowContents
 */
ECEnrollment_.prototype.add = function(rowContents) {
  var item = new ECEnrollmentItem(rowContents);
  this.data.push(item);
  this.update_(rowContents[0], rowContents[1], rowContents[2]);
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
  
  /** @private {Spreadsheet} */
  this.spreadsheet_;
  
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
  this.spreadsheet_ = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  
  this.classes_ = new ECClasses_(this.spreadsheet_.getSheetByName('Classes'));
  this.enrollment_ = new ECEnrollment_(this.spreadsheet_.getSheetByName('Enrollment'));
  this.updateStats_();
};


/** @private */
ECDB.prototype.updateStats_ = function() {
  for (key in this.enrollment_.stats) {
    this.classes_.map[key].current_size = this.enrollment_.stats[key];
  }
};


/** @return {!Array.<ECClassItem>} */
ECDB.prototype.getClasses = function() {
  return this.classes_.data;
};


/**
 * Register students to EC class. The transaction will succeed/fail as a whole.
 * Caller to validate registration condition.
 * @param {Array.<{family_number: number, student_name: string, class: string}>} data
 * @return {string}
 */
ECDB.prototype.register = function(data) {
  if (!data.length) {
    return 'FAIL: empty data';
  }
  
  var count = {};
  for (var i = 0; i < data.length; ++i) {
    var item = data[i];
    if (count[item.class]) {
      ++count[item.class];
    } else {
      count[item.class] = 1;
    }
    
    if (this.enrollment_.has(item.family_number, item.student_name)) {
      return 'FAIL: already registered: ' + item.family_number + ' ' + item.student_name;
    }
  }
  
  for (var item in count) {
    var class = this.classes_.map[item];
    if (!class) {
      return 'FAIL: invalid class ' + item;
    }
    
    if (class.max_size < class.current_size + count[item]) {
      return 'FAIL: class ' + item + ' is full';
    }
  }
  
  // Now we can really register
  var sheet = this.spreadsheet_.getSheetByName('Enrollment');
  for (var i = 0; i < data.length; ++i) {
    var item = data[i];
    var rowContents = [item.family_number, item.student_name, item.class];
    sheet.appendRow(rowContents);
    this.enrollment_.add(rowContents);
  }
  this.updateStats_();
  return 'OK';
};


/**
 * @param {number} familyNumber
 * @param {string=} opt_db optional db name
 * @return {string} JSON string of object
 *     [{stu: string, active: boolean, active_prev: boolean, class: [{code: string, desc: string}]}]
 */
function lookupEC(familyNumber, opt_db) {
  var ec = new ECDB();
  var students = getStudentInfo(familyNumber, opt_db);
  var now = new Date().getTime() / 1000;
  var filterClass = function(bd) {
    var age = (SCHOOL_START_DATE - bd) / 1000 / 60 / 60 / 24 / 365;
    var classes = ec.getClasses().filter(function(cl) {
      return (cl.max_size - cl.current_size) > 0 && cl.min_age < age;
    });
    return classes.map(function(cl) {
      return {code: cl.code, desc: cl.name};
    });
  };
  
  var result = students.map(function(item) {
    return {
      stu: item.first_name,
      class: filterClass(item.dob.getTime()),
      active: item.active,
      active_prev: item.active_prev
    };
  });
  
  return result;
}

function testGetClasses() {
  var ec = new ECDB();
  Logger.log(ec.getClasses());
}


/**
 * Test will create one dummy entry in EC2017 Enrollment.
 */
function testRegister() {
  var ec = new ECDB();
  var message = ec.register([]);
  assertEquals('FAIL: empty data', message);
  message = ec.register([{family_number: 3388, student_name: 'John Doe', class: 'foo'}]);
  assertEquals('FAIL: invalid class foo', message);
  message = ec.register([{family_number: 3388, student_name: 'John Doe', class: 'wes'}]);
  assertEquals('OK', message);
  message = ec.register([{family_number: 3388, student_name: 'John Doe', class: 'pai'}]);
  assertEquals('FAIL: already registered: 3388 John Doe', message);
  ec.classes_.map['wes'].max_size = 1;
  message = ec.register([{family_number: 3389, student_name: 'Johnny Doe', class: 'wes'}]);
  assertEquals('FAIL: class wes is full', message);
  Logger.log('ALL PASSED');
}

function testLookupEC() {
  Logger.log(lookupEC(1014));
}
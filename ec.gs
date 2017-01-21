/**
 * @fileoverview The EC database.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

loadConfig();

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
 * @param {number} familyNumber
 * @return {Array<string>} Students enrolled in EC
 */
ECEnrollment_.prototype.get = function(familyNumber) {
  if (this.map_[familyNumber]) {
    return this.map_[familyNumber];
  }
  return [];
};


/**
 * The EC sheet.
 * @param {string=} opt_dbName Spreadsheet name to open as database.
 * @param {string=} opt_regDbName
 * @constructor
 */
var ECDB = function(opt_dbName, opt_regDbName) {
  /** @private {ECClasses_} */
  this.classes_;
  
  /** @private {ECEnrollment} */
  this.enrollment_;
  
  /** @private {Spreadsheet} */
  this.spreadsheet_;
  
  this.initialize_(opt_dbName || EC_DOCID, opt_regDbName);
};


/**
 * Reads the DB and construct map.
 * @param {string=} opt_dbName Spreadsheet name to open as database
 * @param {string=} opt_regDbName
 * @private
 */
ECDB.prototype.initialize_ = function(opt_dbName, opt_regDbName) {
  var dbName = opt_dbName || 'EC' + getSchoolYear().toString();
  var openById = (dbName == EC_DOCID);
  this.spreadsheet_ = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  
  this.classes_ = new ECClasses_(this.spreadsheet_.getSheetByName('Classes'));
  this.enrollment_ = new ECEnrollment_(this.spreadsheet_.getSheetByName('Enrollment'));
  this.updateStats_();
  this.regDb_ = null;
  this.regDbName_ = opt_regDbName || undefined;
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


/** @return {!Array.<string>} */
ECDB.prototype.getStudents = function(familyNumber) {
  return this.enrollment_.get(familyNumber);
};


/**
 * Register students to EC class. The transaction will succeed/fail as a whole.
 * Caller to validate registration condition.
 * @param {number} familyNumber
 * @param {Array.<{name: string, code: string}>} data
 * @return {string}
 */
ECDB.prototype.register = function(familyNumber, data) {
  if (!data.length) {
    return 'FAIL: empty data';
  }

  if (!this.regDb_) {
    this.regDb_ = Db.getInstance(this.regDbName_);
  }
  
  var students = this.regDb_.getStudent().get(familyNumber, false);
  for (var i = 0; i < data.length; ++i) {
    var item = data[i];
    // Student names are partial, need to fill.
    var student = students.filter(function(pupil) {
      return pupil.first_name == item.name;
    })[0];
    if (student === undefined) {
      return 'FAIL: cannot find: ' + familyNumber + ' ' + item.name;
    }
    item.name = student.first_name + ' ' + student.last_name;
  }
  
  var count = {};
  for (var i = 0; i < data.length; ++i) {
    var item = data[i];
    if (count[item.code]) {
      ++count[item.code];
    } else {
      count[item.code] = 1;
    }
    
    if (this.enrollment_.has(familyNumber, item.name)) {
      return 'FAIL: already registered: ' + familyNumber + ' ' + item.name;
    }
  }
  
  for (var item in count) {
    var class = this.classes_.map[item];
    if (!class) {
      return 'FAIL: invalid class ' + item;
    }
    // We do not check class size here. When this is called, customer already paid.
  }
  
  // Now we can really register
  var sheet = this.spreadsheet_.getSheetByName('Enrollment');
  for (var i = 0; i < data.length; ++i) {
    var item = data[i];
    var rowContents = [familyNumber, item.name, item.code];
    sheet.appendRow(rowContents);
    this.enrollment_.add(rowContents);
  }
  this.updateStats_();
  return 'OK';
};


/**
 * Lookup available EC classes for returning families.
 * @param {number} familyNumber
 * @param {string=} opt_db optional db name
 * @return {string} JSON string of object
 *     [{stu: string, class: [{code: string, desc: string}]}]
 */
function lookupEC(familyNumber, opt_db) {
  var ec = new ECDB();
  var students = getStudentInfo(familyNumber, opt_db).filter(function(item) {
    return item.active_prev;
  });
  
  var now = new Date().getTime() / 1000;
  var filterClass = function(bd) {
    var age = (SCHOOL_START_DATE - bd) / 31536000000; // 1000ms * 60s * 60m * 24hr * 365d;
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
    };
  });
  
  return result;
}

function registerEC(familyNumber, data) {
  var ec = new ECDB();
  return ec.register(familyNumber, data);
}

// Return all EC classes for new students.
function getECClasses() {
  var ec = new ECDB();
  return ec.getClasses().filter(function(cls) {
    return cls.current_size <= cls.max_size;
  }).map(function(cls) {
    return {code: cls.code, desc: cls.name, min_age: cls.min_age};
  });
}

function testGetECClasses() {
  doLog('testGetECClasses', getECClasses());
}

/**
 * Test will create one dummy entry in EC2017 Enrollment.
 */
function testRegister() {
  var ec = new ECDB(undefined, 'RegDBTest2017');
  var message = ec.register(8766, []);
  assertEquals('FAIL: empty data', message);
  message = ec.register(8766, [{name: 'Lily', code: 'foo'}]);
  assertEquals('FAIL: invalid class foo', message);
  message = ec.register(8766, [{name: 'Lily', code: 'wes'}]);
  assertEquals('OK', message);
  message = ec.register(8766, [{name: 'Lily', code: 'pai'}]);
  assertEquals('FAIL: already registered: 8766 Lily Lee', message);
  doLog('testRegister', 'ALL PASSED');
}

function testLookupEC() {
  doLog('testLoookupEC', lookupEC(311));
}
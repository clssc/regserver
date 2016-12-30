/**
 * @fileoverview Data class for 'Student'.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * Read-only data class for 'Student'.
 * @param {Range} data The raw range data.
 * @constructor
 */
Student = function(data) {
  /** @type {Array.<StudentItem>} */
  this.data_ = [];
  
  this.initialize_(data);
};


/**
 * Resets to initial state. Hack for Google Apps Script since the
 * object lifetime management is different. Even use prototype
 * the property is still static.
 */
Student.prototype.clear = function() {
  this.data_ = [];
};


/**
 * Get active Student data by family number.
 * @param {number} family_number
 * @param {boolean=} opt_activeOnly Default to true. 
 * @return {Array.<StudentItem>}
 */
Student.prototype.get = function(family_number, opt_activeOnly) {
  var students = [];
  for (var i = 0; i < this.data_.length; ++i) {
    var item = this.data_[i];
    if (item.family_number == family_number &&
        (item.active || opt_activeOnly === false)) {
      students.push(item);
    }
  }
  return students;
};


/**
 * Get all Student data.
 * @return {Array.<StudentItem>}
 */
Student.prototype.getAll = function() {
  return this.data_;
};


/**
 * Get all enrolled students.
 * @return {Array.<StudentItem>}
 */
Student.prototype.getAllActive = function() {
  var students = [];
  for (var i = 0; i < this.data_.length; ++i) {
    var item = this.data_[i];
    if (item.active) {
      students.push(item);
    }
  }
  return students;
};


/**
 * Detect duplicate records.
 * @param {!Array.<string>} warnings Warning messages.
 */
Student.prototype.detectDupe = function(warnings) {
  var token = function(student) {
    var chineseName = student.chinese_name.trim();
    return student.first_name + ' ' + student.last_name + ' ' + chineseName;
  };
  var comparator = function(a, b) {
    var tokenA = token(a);
    var tokenB = token(b);
    return (tokenA > tokenB) ? 1 :
        (tokenA == tokenB) ? 0 : -1;
  };
  this.data_.sort(comparator);
  for (var i = 0; i < this.data_.length - 1; ++i) {
    if (token(this.data_[i]) == token(this.data_[i + 1])) {
      warnings.push('Detected dupe: student: ' + token(this.data_[i]));
      DebugLog(warnings[warnings.length - 1]);
    }
  }
};


/**
 * Detect error in student.
 * @param {!Array.<string>} warnings Warning messages.
 */
Student.prototype.detectError = function(warnings) {
  for (var i = 0; i < this.data_.length; ++i) {
    this.data_[i].detectError(warnings);
  }
};


/**
 * Initialize object.
 * @param {Range} data The raw range data.
 * @private
 */
Student.prototype.initialize_ = function(data) {
  this.clear();
  if (!data) return;
  var rows = data.getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (typeof(rows[i][0]) != 'number' || !rows[i][0]) continue;
    this.data_.push(new StudentItem(rows[i]));
  }
};



/**
 * Data item of 'Student'.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
StudentItem = function(values) {
  /** @type {number} */
  this.family_number = values[0];
  
  /** @type {string} */
  this.chinese_name = values[1];
  
  /** @type {string} */
  this.last_name = values[2];
  
  /** @type {string} */
  this.first_name = values[3];
  
  /** @type {Date} */
  this.dob = new Date(values[4]);
  
  /** @type {string} */
  this.gender = values[5];
  
  /** @type {string} */
  this.prev_class = values[6];
  
  /** @type {string} */
  this.currClass = values[7];
  
  /** @type {boolean} */
  this.speak_chinese = (values[8].toUpperCase() === 'Y');
  
  /** @type {string} */
  this.text_pref = values[9];
  
  /** @type {boolean} */
  this.active = (values[10].toUpperCase() === 'Y');
  
  /** @type {boolean} */
  this.active_prev = (values[11].toUpperCase() === 'Y');
  
  /** @type {string} */
  this.note = values[12];
};


/**
 * Unit test of Student.
 * @param {!Student} target Student object instantiated from test DB.
 */
function testStudent(target) {
  assertEquals(3, target.getAll().length);
  var students = target.get(8765);
  assertEquals(1, students.length);
  students = target.get(8765, false);
  assertEquals(2, students.length);
  var student1 = students[0];
  assertEquals(8765, student1.family_number);
  assertEquals('李強', student1.chinese_name);
  assertEquals('Lee', student1.last_name);
  assertEquals('John', student1.first_name);
  assertEquals(9 - 1, student1.dob.getMonth());
  assertEquals(11, student1.dob.getDate());
  assertEquals(2007, student1.dob.getFullYear());
  assertEquals('M', student1.gender);
  assertEquals('PA', student1.prev_class);
  assertEquals('1A1', student1.currClass);
  assertTrue(student1.speak_chinese);
  assertEquals('1', student1.text_pref);
  assertEquals(true, student1.active);
  assertEquals(true, student1.active_prev);
  assertEquals('some notes here', student1.note);
  var warnings = [];
  target.detectDupe(warnings);
  assertEquals(1, warnings.length);
  DebugLog('testStudent: PASSED');
}


/**
 * Static function to parse dirty data.
 * @param {!Array.<Object>} values The values to parse. values[0] contains
 *     unique identifier to identify records.
 * @param {number} i The starting index.
 * @param {!Array.<string>} warnings Warnings buffer.
 * @return {StudentItem} Parsed object.
 */
StudentItem.parse = function(values, i, warnings) {
  var student = {};
  
  if (!values[i + 1].length ||
      !values[i + 2].length ||
      !values[i + 3]) {
    return null;
  }
  student.chinese_name = values[i];
  student.last_name = values[i + 1];
  student.first_name = values[i + 2];
  student.dob = new Date(values[i + 3]);
  student.gender = values[i + 4].substring(0, 1).toUpperCase();
  student.prev_class = values[i + 5];
  student.currClass = values[i + 6];
  student.speak_chinese = (values[i + 7].substring(0, 1).toUpperCase() === 'Y');
  student.text_pref = values[i + 8].substring(0, 1);
  student.active = false;
  student.active_prev = false;
  student.note = '';  // The application form does not have this field.
  return student;
};


/**
 * Detect error in student item in real DB (which may be altered manually).
 * @param {!Array.<string>} warnings Warning messages.
 */
StudentItem.prototype.detectError = function(warnings) {
  var familyNumber = this.family_number;
  var studentName = this.first_name + ' ' + this.last_name;
  if (!familyNumber) {
    return;
  }
  if (!this.last_name.trim().length ||
      !this.first_name.trim().length) {
    warnings.push('family: ' + familyNumber + ' has invalid student name ' + studentName);
  }
  if (this.gender != 'M' && this.gender != 'F') {
    warnings.push('family: ' + familyNumber + ' has invalid gender for ' + studentName);
  }
}


/**
 * Static function to serialize title row to table.
 * @param {Sheet} sheet Destination sheet.
 */
StudentItem.createTitleRow = function(sheet, item) {
  sheet.appendRow([
    'family_number',
    'chinese_name',
    'last_name',
    'first_name',
    'dob',
    'gender',
    'prev_class',
    'class',
    'speak_chinese',
    'text_pref',
    'active',
    'active_prev',
    'note'
  ]);
};


/**
 * Static function to serialize parent item to table.
 * @param {Sheet} sheet Destination sheet.
 * @param {Object} item The family item to output.
 * @param {number=} opt_familyNumber Family number to use/override.
 */
StudentItem.serialize = function(sheet, item, opt_familyNumber) {
  var familyNumber = opt_familyNumber || item.family_number;
  sheet.appendRow([
    familyNumber,
    item.chinese_name,
    item.last_name,
    item.first_name,
    item.dob,
    item.gender,
    item.prev_class,
    item.currClass,
    item.speak_chinese ? 'Y' : 'N',
    item.text_pref.toString(),
    item.active ? 'Y' : 'N',
    item.active_prev ? 'Y' : 'N',
    item.note
  ]);
};
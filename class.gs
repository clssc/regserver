/**
 * @fileoverview Data class for 'Class'.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * Read-only data class for 'Class'.
 * @param {Range} data The raw range data.
 * @constructor
 * @struct
 */
var Class = function(data) {
  /** @private {Array.<ClassItem>} */
  this.data_ = [];

  this.initialize_(data);  
};


/** Resets to initial state. */
Class.prototype.clear = function() {
  this.data_ = [];
};


/**
 * Get class data by class name.
 * @param {string} name
 * @return {ClassItem}
 */
Class.prototype.get = function(name) {
  for (var i = 0; i < this.data_.length; ++i) {
    var item = this.data_[i];
    if (item.name.toUpperCase() === name.toUpperCase()) {
      return item;
    }
  }
  return null;
};


/**
 * Get all class data.
 * @return {Array.<ClassItem>}
 */
Class.prototype.getAll = function() {
  return this.data_;
};


/**
 * Detect duplicate records.
 * @param {!Array.<string>} warnings Warning messages.
 */
Class.prototype.detectDupe = function(warnings) {
  var comparator = function(a, b) {
    return (a.name > b.name) ? 1 :
        (a.name == b.name) ? 0 : -1;
  };
  this.data_.sort(comparator);
  for (var i = 0; i < this.data_.length - 1; ++i) {
    if (this.data_[i].name == this.data_[i + 1].name) {
      warnings.push('Detected dupe: class: ' + this.data_[i].name);
      DebugLog('class', warnings[warnings.length - 1]);
    }
  }
};


/**
 * Initialize object.
 * @param {Range} data The raw range data.
 * @private
 */
Class.prototype.initialize_ = function(data) {
  this.clear();
  if (!data) return;
  var rows = data.getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (!rows[i][0].length) continue;
    var classItem = new ClassItem(rows[i]);
    this.data_.push(classItem);
  }
};



/**
 * Data item of 'class'.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
var ClassItem = function(values) {
  /** @type {string} */
  this.name = values[0];
  
  /** @type {string} */
  this.teacher = values[1];
  
  /** @type {string} */
  this.ta = values[2];
  
  /** @type {string} */
  this.location = values[3];
  
  /** @type {string} */
  this.teacher_email = values[4];
  
  /** @type {string} */
  this.ta_email = values[5];
};


/**
 * Unit test of Class.
 * @param {!Class} target Class object instantiated from test DB.
 */
function testClass(target) {
  assertEquals(4, target.getAll().length);
  var class1 = target.get('1A1');
  assertEquals('1A1', class1.name);
  assertEquals('Esther Chyn 宋小真', class1.teacher);
  assertEquals('Sara Chen', class1.ta);
  assertEquals('Room 9', class1.location);
  assertEquals('esther@fakeemail.com', class1.teacher_email);
  assertEquals('sara@fakeemail.com', class1.ta_email);
  var class2 = target.get('pa');
  assertEquals('PA', class2.name);
  assertEquals('Joy Huang 官文玉', class2.teacher);
  assertEquals('', class2.ta);
  assertEquals('Room 5', class2.location);
  var warnings = [];
  target.detectDupe(warnings);
  assertEquals(1, warnings.length);
  doLog('testClass', 'PASSED');
}

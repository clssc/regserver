/**
 * @fileoverview Data class for 'Parent'.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * Read-only data class for 'Parent'.
 * @param {Range} data The raw range data.
 * @constructor
 */
Parent = function(data) {
  /** @private {Array.<ParentItem>} */
  this.data_ = [];
  
  this.initialize_(data);
};


/**
 * Resets to initial state. Hack for Google Apps Script since the
 * object lifetime management is different. Even use prototype
 * the property is still static.
 */
Parent.prototype.clear = function() {
  this.data_ = [];
};


/**
 * Detect duplicate records.
 * @param {!Array.<string>} warnings Warning messages.
 */
Parent.prototype.detectDupe = function(warnings) {
  var token = function(parent) {
    return parent.english_name + ' ' + parent.chinese_name;
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
      warnings.push('Detected dupe: parent: ' + token(this.data_[i]));
      DebugLog(warnings[warnings.length - 1]);
    }
  }
};


/**
 * Detect error in parent.
 * @param {!Array.<string>} warnings Warning messages.
 */
Parent.prototype.detectError = function(warnings) {
  for (var i = 0; i < this.data_.length; ++i) {
    this.data_[i].detectError(warnings);
  }
};


/**
 * Get Parent data by family number.
 * @param {number} family_number 
 * @return {Array.<ParentItem>}
 */
Parent.prototype.get = function(family_number) {
  var parents = [];
  for (var i = 0; i < this.data_.length; ++i) {
    var item = this.data_[i];
    if (item.family_number == family_number) {
      parents.push(item);
    }
  }
  return parents;
};


/**
 * Get all Parent data.
 * @return {Array.<ParentItem>}
 */
Parent.prototype.getAll = function() {
  return this.data_;
};


/**
 * Initialize object.
 * @param {Range} data The raw range data.
 * @private
 */
Parent.prototype.initialize_ = function(data) {
  this.clear();
  if (data) {
    var rows = data.getValues();
    for (var i = 0; i < rows.length; ++i) {
      if (typeof(rows[i][0]) != 'number' || !rows[i][0]) continue;
      this.data_.push(new ParentItem(rows[i]));
    }
  }
};



/**
 * Data item of 'Parent'.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
ParentItem = function(values) {
  /** @type {number} */
  this.family_number = values[0];
  
  /** @type {string} */
  this.english_name = values[1];
  
  /** @type {string} */
  this.chinese_name = values[2];
  
  /** @type {string} */
  this.occupation = values[3];
  
  /** @type {string} */
  this.work_phone = values[4];
  
  /** @type {string} */
  this.cell_phone = values[5];
  
  /** @type {string} */
  this.email = values[6];
  
  /** @type {number} */
  this.chinese_level = values[7];
};


/**
 * Unit test of Parent.
 * @param {!Parent} target Parent object instantiated from test DB.
 */
function testParent(target) {
  assertEquals(5, target.getAll().length);
  var parents = target.get(2345);
  assertEquals(2, parents.length);
  var parent1 = parents[0];
  assertEquals(2345, parent1.family_number);
  assertEquals('John Doe', parent1.english_name);
  assertEquals(-1, parent1.chinese_level);
  var parent2 = parents[1];
  assertEquals(2345, parent2.family_number);
  assertEquals('Catherine Doe', parent2.english_name);
  assertEquals('杜凱琪', parent2.chinese_name);
  assertEquals('Nurse', parent2.occupation);
  assertEquals('310-123-1234', parent2.work_phone);
  assertEquals('424-424-4225', parent2.cell_phone);
  assertEquals('c.doe@health.somewhere.edu', parent2.email);
  assertEquals(1, parent2.chinese_level);
  var warnings = [];
  target.detectDupe(warnings);
  assertEquals(1, warnings.length);
  DebugLog('testParent: PASSED');
}


/**
 * Static function to parse dirty data.
 * @param {!Array.<Object>} values The values to parse. values[0] contains
 *     unique identifier to identify records.
 * @param {number} i The starting index.
 * @param {boolean} relaxed Use relaxed parsing.
 * @param {!Array.<string>} warnings Warnings buffer.
 * @return {ParentItem} Parsed object.
 */
ParentItem.parse = function(values, i, relaxed, warnings) {
  var parent = {};
  
  parent.english_name = values[i];
  if (parent.english_name.length) {
    parent.chinese_name = values[i + 1];
    parent.occupation = values[i + 2];
    parent.work_phone = Validator.phoneNumber(values[i + 3]);
    parent.cell_phone = Validator.phoneNumber(values[i + 4]);
    if (!parent.cell_phone.length && !relaxed) {
      warnings.push(parent.english_name + ' has invalid cell phone');
    }
    parent.email = Validator.email(values[i + 5]);
    if (!parent.email.length && !relaxed) {
      warnings.push(parent.english_name + ' has invalid e-mail');
    }
    if (values[i + 6] != '') {
      parent.chinese_level = values[i + 6];
    }
    return parent;
  }
  return null;
};


/**
 * Detect error in parent item in real DB (which may be altered manually).
 * @param {!Array.<string>} warnings Warning messages.
 */
ParentItem.prototype.detectError = function(warnings) {
  var familyNumber = this.family_number;
  var parentName = this.english_name.trim();
  if (!familyNumber) {
    return;
  }
  if (!parentName.length) {
    warnings.push('family: ' + familyNumber + ' has empty parent English name');
    parentName = 'empty';
  }
  if (this.work_phone.trim().length &&
      !Validator.phoneNumber(this.work_phone).length) {
    warnings.push('family: ' + familyNumber + ' has invalid work phone for ' + parentName);
  }
  if (this.cell_phone.trim().length &&
      !Validator.phoneNumber(this.cell_phone).length) {
    warnings.push('family: ' + familyNumber + ' has invalid cell phone for ' + parentName);
  }
  if (this.email.trim().length &&
      !Validator.email(this.email).length) {
    warnings.push('family: ' + familyNumber + ' has invalid e-mail for ' + parentName);
  }
}


/**
 * Static function to serialize title row to table.
 * @param {Sheet} sheet Destination sheet.
 */
ParentItem.createTitleRow = function(sheet, item) {
  sheet.appendRow([
    'family_number',
    'english_name',
    'chinese_name',
    'occupation',
    'work_phone',
    'cell_phone',
    'email',
    'chinese_level'
  ]);
};


/**
 * Static function to serialize parent item to table.
 * @param {Sheet} sheet Destination sheet.
 * @param {Object} item The family item to output.
 * @param {number=} opt_familyNumber Family number to use/override.
 */
ParentItem.serialize = function(sheet, item, opt_familyNumber) {
  var familyNumber = opt_familyNumber || item.family_number;
  sheet.appendRow([
    familyNumber,
    item.english_name,
    item.chinese_name,
    item.occupation,
    item.work_phone,
    item.cell_phone,
    item.email,
    item.chinese_level
  ]);
};
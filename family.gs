/**
 * @fileoverview Data class for 'Family'.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * Read-only data class for 'Family'.
 * @param {Range} data The raw range data.
 * @constructor
 */
Family = function(data) {
  /** @private {Array.<FamilyItem>} */
  this.data_ = [];
  
  this.initialize_(data);
};


/**
 * Resets to initial state. Hack for Google Apps Script since the
 * object lifetime management is different. Even use prototype
 * the property is still static.
 */
Family.prototype.clear = function() {
  this.data_ = [];
};


/**
 * Get Family data by family number.
 * @param {number} family_number
 * @return {FamilyItem}
 */
Family.prototype.get = function(family_number) {
  for (var i = 0; i < this.data_.length; ++i) {
    var item = this.data_[i];
    if (item.family_number == family_number) {
      return item;
    }
  }
  return null;
};


/**
 * Get all Family data.
 * @return {Array.<FamilyItem>}
 */
Family.prototype.getAll = function() {
  return this.data_;
};


/**
 * Initialize object.
 * @param {Range} data The raw range data.
 * @private
 */
Family.prototype.initialize_ = function(data) {
  this.clear();
  if (!data) return;
  var rows = data.getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (typeof(rows[i][0]) != 'number' || !rows[i][0]) continue;
    this.data_.push(new FamilyItem(rows[i]));
  }
};


/**
 * Data item of 'Family'.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
FamilyItem = function(values) {
  /** @type {number} */
  this.family_number = values[0];
  
  /** @type {string} */
  this.street_address = values[1];
  
  /** @type {string} */
  this.city = values[2];
  
  /** @type {string} */
  this.state = values[3];
  
  /** @type {string} */
  this.zip = values[4];
  
  /** @type {string} */
  this.home_phone = values[5] || '';
  
  /** @type {string} */
  this.fax = values[6] || '';
  
  /** @type {string} */
  this.doctor_name = values[7];
  
  /** @type {string} */
  this.doctor_phone = values[8];
  
  /** @type {string} */
  this.contact_name = values[9];
  
  /** @type {string} */
  this.contact_phone = values[10];
};


/**
 * Detect duplicate records.
 * @param {!Array.<string>} warnings Warning messages.
 */
Family.prototype.detectDupe = function(warnings) {
  var comparator = function(a, b) {
    return (a.family_number > b.family_number) ? 1 :
        (a.family_number == b.family_number) ? 0 : -1;
  };
  this.data_.sort(comparator);
  for (var i = 0; i < this.data_.length - 1; ++i) {
    if (this.data_[i].family_number == this.data_[i + 1].family_number) {
      warnings.push('Detected dupe: family: ' + this.data_[i].family_number);
      DebugLog('Family', warnings[warnings.length - 1]);
    }
  }
  
  var comparator2 = function(a, b) {
    return (a.home_phone > b.home_phone) ? 1 :
        (a.home_phone == b.home_phone) ? 0 : -1;
  };
  this.data_.sort(comparator2);
  for (var i = 0; i < this.data_.length - 1; ++i) {
    if (this.data_[i].home_phone == this.data_[i + 1].home_phone &&
        this.data_[i].home_phone.trim().length) {
      warnings.push('Detected dupe: family home phone: ' + this.data_[i].home_phone);
      DebugLog('Family', warnings[warnings.length - 1]);
    }
  }
};


/**
 * Detect error in family.
 * @param {!Array.<string>} warnings Warning messages.
 */
Family.prototype.detectError = function(warnings) {
  for (var i = 0; i < this.data_.length; ++i) {
    this.data_[i].detectError(warnings);
  }
};


/**
 * Unit test of Family.
 * @param {!Family} target Family object instantiated from test DB.
 */
function testFamily(target) {
  assertEquals(5, target.getAll().length);
  var family1 = target.get(9999);
  assertEquals('3723 Clarington Ave #100', family1.street_address);
  assertEquals('Los Angeles', family1.city);
  assertEquals('CA', family1.state);
  assertEquals('90034', family1.zip);
  assertEquals('310-123-4567', family1.home_phone);
  assertEquals('310-765-4321', family1.fax);
  assertEquals('Darryl Lum', family1.doctor_name);
  assertEquals('310-111-2222', family1.doctor_phone);
  assertEquals('Joy Fan', family1.contact_name);
  assertEquals('310-888-8888', family1.contact_phone);
  var warnings = [];
  target.detectDupe(warnings);
  assertEquals(2, warnings.length);
  doLog('testFamily', 'PASSED');
}

/**
 * Static function to parse dirty data.
 * @param {!Array.<Object>} values The values to parse. values[0] contains
 *     unique identifier to identify records.
 * @param {number} i The starting index.
 * @param {!Array.<string>} warnings Warnings buffer.
 * @return {FamilyItem} Parsed object.
 */
FamilyItem.parse = function(values, i, warnings) {
  var family = {};
  
  family.street_address = values[i];
  family.city = values[i + 1];
  family.state = Validator.state(values[i + 2]);
  family.zip = Validator.zip(values[i + 3].toString());
  if (!family.street_address.length ||
      !family.city.length ||
      !family.state.length ||
      !family.zip.length) {
    warnings.push('Required address invalid for record:' + values[0]);
    return null;
  }
  family.home_phone = Validator.phoneNumber(values[i + 4]);
  if (!family.home_phone.length) {
    warnings.push('Required home phone invalid for record:' + values[0]);
  }
  family.fax = Validator.phoneNumber(values[i + 5]);
  family.doctor_name = values[i + 6];
  family.doctor_phone = Validator.phoneNumber(values[i + 7]);
  family.contact_name = values[i + 8];
  family.contact_phone = Validator.phoneNumber(values[i + 9]);
  if (!family.contact_name.length || !family.contact_phone.length) {
    warnings.push('Required contact invalid for record:' + values[0]);
  }
  return family;
};


/**
 * Detect error in family item in real DB (which may be altered manually).
 * @param {!Array.<string>} warnings Warning messages.
 */
FamilyItem.prototype.detectError = function(warnings) {
  var familyNumber = this.family_number;
  if (!familyNumber) {
    return;
  }
  if (!this.street_address.trim().length ||
      !this.city.trim().length ||
      !Validator.state(this.state).length ||
      !Validator.zip(this.zip).length) {
    warnings.push('family: ' + familyNumber + ' has invalid address');
  }
  try {
    if (this.home_phone.trim().length &&
        !Validator.phoneNumber(this.home_phone)) {
      warnings.push('family: ' + familyNumber + ' has invalid home phone');
    }
  } catch(e) {
    warnings.push('family: ' + familyNumber + ' has invalid home phone');
  }
  try {
    if (this.contact_phone.trim().length &&
        !Validator.phoneNumber(this.contact_phone).length) {
      warnings.push('family: ' + familyNumber + ' has invalid emergency contact phone');
    }
  } catch(e) {
    warnings.push('family: ' + familyNumber + ' has invalid emergency contact phone');
  }
};


/**
 * Static function to serialize title row to table.
 * @param {Sheet} sheet Destination sheet.
 */
FamilyItem.createTitleRow = function(sheet) {
  sheet.appendRow([
    'family_number',
    'street_address',
    'city',
    'state',
    'zip',
    'home_phone',
    'fax',
    'doctor_name',
    'doctor_phone',
    'contact_name',
    'contact_phone'
  ]);
};
    

/**
 * Static function to serialize family item to table.
 * @param {Sheet} sheet Destination sheet.
 * @param {Object} item The family item to output.
 * @param {number=} opt_familyNumber Family number to use/override.
 */
FamilyItem.serialize = function(sheet, item, opt_familyNumber) {
  var familyNumber = opt_familyNumber || item.family_number;
  sheet.appendRow([
    familyNumber,
    item.street_address,
    item.city,
    item.state,
    item.zip.toString(),
    item.home_phone,
    item.fax,
    item.doctor_name,
    item.doctor_phone,
    item.contact_name,
    item.contact_phone
  ]);
};
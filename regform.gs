/**
 * Early bird tuition per student.
 * @const {number}
 */
var EARLY_BIRD_TUITION = 700;


/**
 * Normal tuition per student.
 * @const {number}
 */
var NORMAL_TUITION = 800;


/**
 * Service points deposit per family.
 * @const {number}
 */
var SERVICE_DEPOSIT = 200;


/**
 * Service fine per point.
 * @const {number}
 */
var SERVICE_FINE = 20;


/**
 * Minimal service points requirements.
 * @const {number}
 */
var MIN_SERVICE_POINTS = 20;


/**
 * New Family non-refundable fee.
 * @const {number}
 */
var NEW_FAMILY_FEE = 100;


/**
 * Mail blast message template HTML file.
 * @const {string}
 */
var MAIL_BLAST_TEMPLATE = 'ReturningStudentInfo2017-en.html';


/**
 * Mail blast data file.
 * @const {string}
 */
var MAIL_BLAST = 'MailBlast';


/**
 * Name of template to use.
 * @const {string}
 */
var REG_FORM_TEMPLATE = 'RegFormTemplate';


/**
 * Blank RegForm Name.
 * @const {string}
 */
var BLANK_REG_FORM = 'BlankRegForm';


/**
 * Blank RegForm Name.
 * @const {string}
 */
var REG_FORM = 'RegForm';


/**
 * RegForm Folder Name.
 * @const {string}
 */
var REG_FORM_FOLDER = 'RegForm';


/**
 * RegForm PDF Folder ID.
 * @const {string}
 */
var REG_FORM_PDF_FOLDER_ID = '0BwvYC6nj697Ma0VCR0dZbjJtSzQ';


/**
 * The registration form generation class.
 * @param {string=} opt_dataFileName Spreadsheet name to open.
 * @constructor
 */
RegForm = function(opt_dataFileName) {
  /** @private {Db} */
  this.db_ = undefined;
  
  /** @private {ServiceDb} */
  this.serviceDb_ = undefined;
  
  /** @private {Body} */
  this.template_ = null;

  this.initialize_(opt_dataFileName);
};


/**
 * Initializes reg form generator.
 * @param {string=} opt_dataFileName Spreadsheet name to open.
 * @param {string=} opt_serviceDbName
 * @private
 */
RegForm.prototype.initialize_ = function(opt_dataFileName, opt_serviceDbName) {
  DebugLog('Regform init');
  this.db_ = Db.getInstance(opt_dataFileName);
  this.serviceDb_ = new ServiceDb(opt_serviceDbName);
};


/**
 * Copies contents from template file.
 * @param {Document} dstDoc Destination document.
 * @return {Body}
 * @private
 */
RegForm.prototype.copyTemplate_ = function(dstDoc) {
  if (this.template_ == null) {
    var year = getSchoolYear();
    this.template_ = readTemplate(REG_FORM_TEMPLATE + year);
  }
  
  return applyTemplate(this.template_, dstDoc);
};


/**
 * Scans and fills element.
 * @param {Element} element
 * @param {Object} data
 * @private
 */
RegForm.prototype.scanElement_ = function(element, data) {
  var type = element.getType();
  if (type == 'TEXT') {
    this.scanText_(element.asText(), data);
  } else if (type == 'TABLE') {
    this.scanTable_(element.asTable(), data);
  } else if (type == 'BODY_SECTION' ||
             type == 'DOCUMENT' ||
             type == 'PARAGRAPH') {
    // Supported ContainerElement
    for (var i = 0; i < element.getNumChildren(); ++i) {
      this.scanElement_(element.getChild(i), data);
    }
  }
};


/**
 * Scans and fills table.
 * @param {Table} table
 * @param {Object} data
 * @private
 */
RegForm.prototype.scanTable_ = function(table, data) {
  for (var i = 0; i < table.getNumChildren(); ++i) {
    var row = table.getChild(i).asTableRow();
    for (var j = 0; j < row.getNumChildren(); ++j) {
      var cell = row.getChild(j).asTableCell();
      var text = cell.editAsText();
      this.scanText_(text, data);
    }
  }
};


/**
 * Scans and fills text.
 * @param {Text} text
 * @param {Object} data
 * @private
 */
RegForm.prototype.scanText_ = function(text, data) {
  scanText(text, data, true);
};


/**
 * Generate form data.
 * @param {Number} familyNumber
 * @return {Object}
 */
RegForm.prototype.getFormData_ = function(familyNumber) {
  var family = this.db_.getFamily().get(familyNumber);
  var parents = this.db_.getParent().get(familyNumber);
  var students = this.db_.getStudent().get(familyNumber);
  if (students.length > 4) {
    DebugLog('FIXME: more than 4 students');
  }
  var data = {};
  data['fam_no'] = familyNumber;
  
  var parentFields = [
    'name',  // 0 english name
    'chn_name',  // 1 chinese name
    'occupation',  // 2 occupation
    'cell_phone',  // 3 cell phone
    'work_phone',  // 4 work phone
    'email',  // 5 email
    'n',  // 6 chinese level 0
    'o',  // 7 chinese level 1
    'g'   // 8 chinese level 2
  ];
  for (var i = 0; i < parents.length; ++i) {
    var fieldNames = [];
    for (var j = 0; j < parentFields.length; ++j) {
      fieldNames.push('p' + (i + 1) + parentFields[j]);
    }
    var p = parents[i];
    data[fieldNames[0]] = p.english_name;
    data[fieldNames[1]] = p.chinese_name;
    data[fieldNames[2]] = p.occupation;
    data[fieldNames[3]] = p.cell_phone;
    data[fieldNames[4]] = p.work_phone || family.home_phone;
    data[fieldNames[5]] = p.email;
    if (p.chinese_level > -1) {
      data[fieldNames[6 + p.chinese_level]] = '  V  ';
    }
  }
  
  data['address'] = family.street_address;
  data['city'] = family.city;
  data['st'] = family.state;
  data['zip'] = family.zip;
  data['home_phone'] = family.home_phone;
  //data['fax'] = family.fax;
  data['doctor_name'] = family.doctor_name;
  data['doctor_phone'] = family.doctor_phone;
  data['contact_name'] = family.contact_name;
  data['contact_phone'] = family.contact_phone;
  var studentFields = [
    'lname',  // 0 last name
    'fname',  // 1 first name
    'cname',  // 2 chinese name
    'dob',  // 3 dob
    'g',  // 4 gender
    'c',  // 5 current class
    'nc',  // 6 class next year
    's',  // 7 speak chinese at home?
    'tp'  // 8 text preference
  ];
  
  var parentNMe = true;
  for (var i = 0; i < students.length; ++i) {
    var fieldNames = [];
    for (var j = 0; j < studentFields.length; ++j) {
      fieldNames.push('s' + (i + 1) + studentFields[j]);
    }
    var s = students[i];
    data[fieldNames[0]] = s.last_name;
    data[fieldNames[1]] = s.first_name;
    data[fieldNames[2]] = s.chinese_name;
    data[fieldNames[3]] = Utilities.formatDate(s.dob, 'GMT', 'MM/dd/yy');
    data[fieldNames[4]] = s.gender;
    data[fieldNames[5]] = s.prev_class;
    if (!(s.prev_class && s.prev_class.substring(0, 6) == 'Parent')) {
      parentNMe = false;
    }
    data[fieldNames[6]] = s.currClass;
    data[fieldNames[7]] = s.speak_chinese ? 'Y' : 'N';
    data[fieldNames[8]] = s.text_pref;
  }
  
  // Money Money Money
  data['num'] = students.length;
  data['subtotal1'] = NORMAL_TUITION * students.length;
  data['subtotal2'] = EARLY_BIRD_TUITION * students.length;
  if (parentNMe) {
    // Upgraded from Parent and Me classes
    data['service'] = SERVICE_DEPOSIT;
    data['newfamily'] = NEW_FAMILY_FEE;
  } else {
    // Returning families
    var servicePoints = this.serviceDb_.lookup(familyNumber);
    data['svc'] = MIN_SERVICE_POINTS - servicePoints;
    data['svcfine'] = SERVICE_FINE * (MIN_SERVICE_POINTS - servicePoints);
  }
  return data;
};


/**
 * Deletes existing doc, creates a new doc, places the doc under
 * folder Reports\<year>, then fill with data.
 * @param {string} fileName
 * @param {Object} data
 * @param {boolean} opt_force Force generate new file, default to false.
 * @return {[string, string]} Generated document id and URL.
 * @private
 */
RegForm.prototype.prepareDoc_ = function(fileName, data, opt_force) {
  var force = opt_force || false;
  if (!force) {
    var doc = lookupAndOpenDoc(fileName);
    if (doc) {
      // File exists, give up.
      DebugLog(fileName + ' existed, give up');
      return [doc.getId(), doc.getUrl()];
    }
  }
  
  var year = getSchoolYear();
  deleteFile(fileName);
  var doc = DocumentApp.create(fileName);
  shareFile(doc, REG_FORM_FOLDER);
  var body = this.copyTemplate_(doc);
  this.scanElement_(body, data);  
  appendToDoc(body, doc);
  doc.saveAndClose();
  return [doc.getId(), doc.getUrl()];
};


/**
 * Generates empty reg form from template. The result is stored under folder
 * Reports\<year>.
 * @param {boolean=} opt_force Force generation, default to false.
 * @param {string=} opt_output Output file name, default to
 *     BLANK_REG_FORM + year.
 * @return {[string, string]} Generated document id and URL.
 */
RegForm.prototype.generateBlankRegForm = function(opt_force, opt_output) {
  var year = getSchoolYear();
  var fileName = opt_output || BLANK_REG_FORM + year;
  return this.prepareDoc_(fileName, {}, opt_force);
};


/**
 * Generates reg form from DB data. The result is stored under folder
 * Reports\<year>.
 * @param {number} familyNumber
 * @param {boolean=} opt_force Force generation, default to false.
 * @param {string=} opt_output Output file name, default to
 *     REG_FORM + year + '-' + familyNumber.
 * @return {[string, string]} Generated document id and URL.
 */
RegForm.prototype.generateRegForm = function(familyNumber, opt_force, opt_output) {
  var year = getSchoolYear();
  var fileName = opt_output || REG_FORM + year + '-' + familyNumber;
  return this.prepareDoc_(fileName, this.getFormData_(familyNumber), opt_force);
};


/**
 * Find unique family numbers from active students.
 * @param {string=} opt_className
 * @return {!Array.<number>}
 * @private
 */
RegForm.prototype.findActiveFamilyNumbers_ = function(opt_className) {
  var families = {};
  var students = this.db_.getStudent().getAllActive();
  for (var i = 0; i < students.length; ++i) {
    if (!opt_className || students[i].prev_class == opt_className) {
      families[students[i].family_number] = true;
    }
  }
  
  var familyNumbers = [];
  for (var key in families) {
    familyNumbers.push(key);
  }
  familyNumbers.sort();
  return familyNumbers;
};


/**
 * Generates reg forms of students of a class. We can not generate forms of
 * all active students because that will yield timeout.
 * The results are stored under folder Reports\<year>.
 * @param {string} className Class of previous year.
 */
RegForm.prototype.generateRegFormsByClass = function(className) {
  var familyNumbers = this.findActiveFamilyNumbers_(className);
  var docIds = familyNumbers.map(function(fid) {
    return this.generateRegForm(fid, false)[0];
  }.bind(this));
  
  // The following code was created to merge all generate docs in one
  // file. However, it seems that Google Apps Script is not reliable
  // enough to concatenate hundreds of files. Bummer.
  var year = getSchoolYear();
  var fileName = REG_FORM + year + '-' + className;
  deleteFile(fileName);
  var doc = DocumentApp.create(fileName);
  shareFile(doc, REG_FORM_FOLDER);  
  this.copyTemplate_(doc);
  var body = doc.getBody();
  
  for (var i = 0; i < docIds.length; ++i) {
    // The reason we openById is because openUrl does not work with
    // the URL returned from getUrl(). Bummer.
    var src = DocumentApp.openById(docIds[i]);
    appendToDoc(src.getBody(), body);
    if (i != docIds.length - 1) {
      body.appendPageBreak();
    }
  }
  doc.saveAndClose();
  return [doc.getId(), doc.getUrl()];
};


/**
 * Generates tuition breakdown for online payments.
 * This function can only be used before data migration.
 */
RegForm.prototype.generateTuitionBreakdown = function() {
  var familyNumbers = this.findActiveFamilyNumbers_();
  var db = this.db_;
  var serviceDb = this.serviceDb_;
  var tuitionBreakdown = new TuitionBreakdownDB();
  
  familyNumbers.forEach(function(familyNumber) {
    var students = db.getStudent().get(familyNumber);
    
    var item = tuitionBreakdown.select(familyNumber);
    var servicePoints = serviceDb.lookup(familyNumber);
    if (item == null) {
      item = new TuitionItem([
        familyNumber,
        students.length,
        servicePoints,
        students.length * EARLY_BIRD_TUITION,
        students.length * NORMAL_TUITION,
        0,
        (MIN_SERVICE_POINTS - servicePoints) * SERVICE_FINE,
        0,
        0,
        '',
        ''
      ]);
    } else {
      // Detect change and mark.
      var isDirty = (item.num_students != students.length) ||
          (item.service_points != servicePoints);
      var isFinal = false;
      if (item.transaction_date) {
        isFinal = true;
      }
      if (isDirty && !isFinal) {
        item.num_students = students.length;
        item.service_points = servicePoints;
        item.early_tuition = students.length * EARLY_BIRD_TUITION;
        item.normal_tuition = students.length * NORMAL_TUITION;
        item.service_fine = (MIN_SERVICE_POINTS - servicePoints) * SERVICE_FINE;
      }
    }
    tuitionBreakdown.insertOrReplace(item);
  });
};


/**
 * Update Tuition Breakdowns.
 * This function can only be used after data migration.
 */
RegForm.prototype.updateTuitionBreakdown = function() {
  var db = this.db_;
  var serviceDb = this.serviceDb_;
  var tuitionBreakdown = new TuitionBreakdownDB();
  var familyNumbers = tuitionBreakdown.getFamilyNumbers();
  
  familyNumbers.forEach(function(familyNumber) {
    var students = db.getStudent().get(familyNumber);
    
    var item = tuitionBreakdown.select(familyNumber);
    var servicePoints = serviceDb.lookup(familyNumber);
    // Detect change and mark.
    var isDirty = (item.num_students != students.length) ||
        (item.service_points != servicePoints);
    var isFinal = false;
    if (item.transaction_date) {
      isFinal = true;
    }
    if (isDirty && !isFinal) {
      item.service_points = servicePoints;
      item.service_fine = (MIN_SERVICE_POINTS - servicePoints) * SERVICE_FINE;
    }
    tuitionBreakdown.insertOrReplace(item);
  });
};

 
function analyzeDoc(body) {
  var dumpElement = function(element, prefix) {
    var type = element.getType();
    if (type == 'TEXT') {
      var text = element.asText().getText();
      if (text.length > 10) {
        text = text.substring(0, 10);
      }
      Logger.log(prefix + 'TEXT:' + text);
    } else if (type == 'TABLE') {
      Logger.log(prefix + 'TABLE:' + element.asTable().getNumRows());
    } else if (type == 'BODY_SECTION' ||
               type == 'DOCUMENT' ||
               type == 'PARAGRAPH') {
      Logger.log(prefix + type);
      // Supported ContainerElement
      for (var i = 0; i < element.getNumChildren(); ++i) {
        dumpElement(element.getChild(i), prefix + '  ');
      }
    } else {
      Logger.log(prefix + type);
    }
  };
  dumpElement(body, '');
}

function analyzeTemplate() {
  var year = getSchoolYear();
  var doc = lookupAndOpenDoc(REG_FORM_TEMPLATE + year);
  var body = doc.getBody();
  analyzeDoc(body);
}

function analyzeBlankForm() {
  var year = getSchoolYear();
  var doc = lookupAndOpenDoc(BLANK_REG_FORM + year);
  var body = doc.getBody();
  analyzeDoc(body);
}

function generateRegForm(familyNumber) {
  var form = new RegForm();
  return form.generateRegForm(familyNumber || 1020, true)[1];
}

function generateBlankRegForm() {
  var form = new RegForm();
  return form.generateBlankRegForm(true)[1];
}

function generateRegFormsByClass(className) {
  var form = new RegForm();
  form.generateRegFormsByClass(className || '3A');
}

function generateTuitionBreakdown() {
  var form = new RegForm();
  return form.generateTuitionBreakdown();
}

function updateTuitionBreakdown() {
  var form = new RegForm();
  return form.updateTuitionBreakdown();
}

/**
 * This function will generate 50 regforms at a given time so it needs to be run several times.
 * Please generate MailBlast form first by running buildMailBlast in db.gs.
 */
function generateRegForms(opt_limit) {
  var LIMIT = opt_limit || 50;  // At most 50 forms to avoid max execution time limit exceeded error.
  
  var dataSource = lookupAndOpenFile(MAIL_BLAST + getSchoolYear().toString());
  var sheet = dataSource.getActiveSheet();
  var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  var rows = range.getValues();
  var form = new RegForm();
  
  for (var i = 0, count = 0; i < rows.length - 1 && count < LIMIT; ++i) {
    if (!rows[i][0]) continue;
    if (rows[i][3]) continue;
    var docId = form.generateRegForm(rows[i][0], true)[0];
    var range = sheet.getRange('D' + (i + 2).toString() + ':D' + (i + 2).toString());
    range.setValue([docId]);
    count++;
  }
}

function mailOne(template, emails, pdfs) {
  if (emails.length <= 0) return;
  
  var toUser = emails[0];
  var ccUser = emails[1] || '';
  var yearFrom = getSchoolYear().toString();
  var yearTo = (getSchoolYear() + 1).toString();
  
  MailApp.sendEmail({
    to: toUser,
    replyTo: 'info@westsidechineseschool.com',
    subject: 'Westside Chinese School ' + yearFrom + '-' + yearTo + ' Registration',
    cc: ccUser,
    bcc: 'arthurhsu@westsidechineseschool.org',
    htmlBody: template,
    attachments: pdfs
  });
}

function testMailOne() {
  var template = DriveApp.getFilesByName(MAIL_BLAST_TEMPLATE).next().getBlob().getDataAsString();
  var pdf = DriveApp.getFilesByName('BlankRegForm' + getSchoolYear().toString()).next().getAs('application/pdf');
  mailOne(template, ['arthur@cchsu.com'], [pdf]);
}

function mailBlast(opt_fileName) {
  var template = DriveApp.getFilesByName(MAIL_BLAST_TEMPLATE).next().getBlob().getDataAsString();
  var fileName = opt_fileName || MAIL_BLAST + getSchoolYear().toString();
  var dataSource = lookupAndOpenFile(fileName);
  var sheet = dataSource.getActiveSheet();
  var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  var rows = range.getValues();
  var count = 0;
  
  // Sent at most 20 emails at a time
  for (var i = 0; i < rows.length && count < 20; ++i) {
    if (!rows[i][0]) continue;
    var docId = rows[i][3];
    if (!docId) continue;
    var sent = rows[i][4];
    if (sent == 'Y') continue;
    
    var emails = [];
    for (var j = 1; j <= 2; ++j) {
      if (rows[i][j] && rows[i][j].length) {
        emails.push(rows[i][j]);
      }
    }
    var pdf = DriveApp.getFileById(docId).getAs('application/pdf');
    // Comment out, uncomment only when you need to send out the email.
    mailOne(template, emails, [pdf]);
    count++;
    rows[i][4] = 'Y';
  }
  range.setValues(rows);
}

function testMailBlast() {
  mailBlast('MailBlastTest');
}

function generatePDF(opt_fileName) {
  var pdfFolder = DriveApp.getFolderById(REG_FORM_PDF_FOLDER_ID);
  var fileName = opt_fileName || MAIL_BLAST + getSchoolYear().toString();
  var dataSource = lookupAndOpenFile(fileName);
  var sheet = dataSource.getActiveSheet();
  var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  var rows = range.getValues();
  var count = 0;
  
  // generate 50 pdf at a time
  for (var i = 0; i < rows.length && count < 50; ++i) {
    if (!rows[i][0]) continue;
    var docId = rows[i][3];
    if (!docId) continue;
    var generated = rows[i][5];
    if (generated == 'Y') continue;
    
    var blob = DriveApp.getFileById(docId).getAs('application/pdf');
    pdfFolder.createFile(blob);
    count++;
    rows[i][5] = 'Y';
  }
  range.setValues(rows);
}
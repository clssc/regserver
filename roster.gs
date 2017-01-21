/**
 * @fileoverview Generate roster.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */


/**
 * File name of school roster.
 * @type {string}
 * @const
 */
var ROSTER_NAME = 'Roster';


/**
 * File name of public roster and template.
 * @type {string}
 * @const
 */
var PUBLIC_ROSTER_NAME = 'PublicRoster'; 


/**
 * Name of template to use.
 * @const {string}
 */
var PUBLIC_ROSTER_TEMPLATE = 'PublicRosterTemplate';


/**
 * File name of public roster and template.
 * @type {string}
 * @const
 */
var CLASS_ROSTER_NAME = 'ClassRoster'; 


/**
 * Name of template to use.
 * @const {string}
 */
var CLASS_ROSTER_TEMPLATE = 'ClassRosterTemplate';


/**
 * Token for CR LF
 * @const {string}
 */
var CRLF = '<br/>';


/**
 * Get stats.
 */
function getStats() {
  var year = getSchoolYear();
  var db = Db.getInstance();
  var activeFamily = {};
  var activeStudentCount = 0;
  
  var students = db.getStudent().getAll();
  
  for (var i = 0; i < students.length; ++i) {
    var student = students[i];
    if (!student.active) {
      continue;
    }
    activeStudentCount++;
    activeFamily[student.family_number] = true;
  }
  
  doLog('getStats', activeStudentCount.toString() + ' ' + Object.keys(activeFamily).length.toString());
}


/**
 * Generate full public school roster.
 * @param {string=} opt_db DB file name.
 * @param {string=} opt_output Output file name.
 * @return {[string, string]} [id, url] of generated file.
 * @throw {GSError}
 */
function generateFullPublicRoster(opt_db, opt_output) {
  var year = getSchoolYear();
  var fileName = opt_output || PUBLIC_ROSTER_NAME + 's' + year;
  var outputFile = lookupAndOpenFile(fileName) ||
      SpreadsheetApp.create(fileName);
  shareFile(outputFile);
  if (outputFile.getNumSheets() < 2) {
    outputFile.insertSheet();
  }
  var sheets = outputFile.getSheets();
  for (var index = 0; index < 2; ++index) {
    var sheet = sheets[index];
    sheet.clear();
  
    // Output title row
    var titleRow = [];
    if (index) {
      titleRow.push('Family#');
    }
    titleRow.push('Last Name');
    titleRow.push('First Name');
    titleRow.push('Chinese Name');
    titleRow.push('Class');
    sheet.appendRow(titleRow);
  
    var db = Db.getInstance(opt_db);
    var students = db.getStudent().getAll();
  
    for (var i = 0; i < students.length; ++i) {
      var student = students[i];
      if (!student.active) {
        continue;
      }
      var dataRow = [];
      if (index) {
        dataRow.push(student.family_number);
      }
      dataRow.push(student.last_name);
      dataRow.push(student.first_name);
      dataRow.push(student.chinese_name);
      dataRow.push(student.currClass);
      sheet.appendRow(dataRow);
    }
  
    // Now sort the sheet by family_number.
    var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
    range.sort(1);
    range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
    range.setFontSize(18);
  }
  return [outputFile.getId(), outputFile.getUrl()];
}


/**
 * Generate full public roster.
 * @param {string=} opt_db DB file name.
 * @param {string=} opt_output Output file name.
 * @return {[string, string]} [id, url] of generated file.
 * @throw {GSError}
 */
function generateFullRoster(opt_db, opt_output) {
  var year = getSchoolYear();
  var fileName = opt_output || ROSTER_NAME + year;
  var outputFile = lookupAndOpenFile(fileName) ||
      SpreadsheetApp.create(fileName);
  shareFile(outputFile);
  var sheet = outputFile.getActiveSheet();
  sheet.clear();
  
  // Output title row
  sheet.appendRow([
    'class',
    'family_number',
    'chinese_name',
    'first_name',
    'last_name',
    'dob',
    'email',
    'phone',
    'text_pref',
    'speak_chinese',
    'note'
  ]);
  
  var db = Db.getInstance(opt_db);
  var students = db.getStudent().getAll();
  var parentTable = db.getParent();
  
  for (var i = 0; i < students.length; ++i) {
    var student = students[i];
    if (!student.active) {
      continue;
    }
    
    var parents = parentTable.get(student.family_number);
    var emails = '';
    var phones = '';
    for (var j = 0; j < parents.length; ++j) {
      var parent = parents[j];
      if (parent.email.trim().length) {
        if (emails.length) {
          emails += '; ' + parent.email;
        } else {
          emails = parent.email;
        }
      }
      if (parent.cell_phone.trim().length) {
        phones += parent.cell_phone + ' ';
      } else if (parent.work_phone.trim().length) {
        phones += parent.work_phone + ' ';
      }
    }
    sheet.appendRow([
      student.currClass,
      student.family_number,
      student.chinese_name,
      student.first_name,
      student.last_name,
      student.dob,
      emails.trim(),
      phones.trim(),
      student.text_pref,
      student.speak_chinese ? 'Y' : 'N',
      student.note
    ]);
  }
  
  // Now sort the sheet by class.
  var range = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  range.sort(1);
  
  return [outputFile.getId(), outputFile.getUrl()];
}


/**
 * Generates data used to fill public roster.
 * @param {string=} opt_db DB file name.
 * @return {!Array.<!Object>}
 */
function generatePublicRosterData(opt_db) {
  var data = [];
  var db = Db.getInstance(opt_db);
  var classes = db.getClass().getAll();
  var students = db.getStudent().getAllActive();
  
  for (var i = 0; i < classes.length; ++i) {
    var datum = {};
    var classItem = classes[i];
    datum['class'] = classItem.name;
    datum['room'] = classItem.location;
    datum['teacher'] = classItem.teacher;
    datum['rows'] = [];
    
    var classStudents = [];
    for (var j = 0; j < students.length; ++j) {
      if (students[j].currClass.toUpperCase() == classItem.name.toUpperCase()) {
        classStudents.push(students[j]);
      }
    }
    classStudents.sort(function(student1, student2) {
      var name1 = student1.first_name + ' ' + student1.last_name;
      var name2 = student2.first_name + ' ' + student2.last_name;
      return name1 > name2 ? 1 : -1;
    });
    
    for (var j = 0; j < classStudents.length; ++j) {
      var student = classStudents[j];
      datum['rows'].push(
          [student.first_name + ' ' + student.last_name, student.chinese_name]);
    }
    data.push(datum);
  }
  return data;
}


/**
 * Scans and fills element.
 * @param {Element} element
 * @param {Object} data
 * @private
 */
function scanElement(element, data) {
  var type = element.getType();
  if (type == 'TEXT') {
    scanText(element.asText(), data, false);
  } else if (type == 'TABLE') {
    scanTable(element.asTable(), data);
  } else if (type == 'BODY_SECTION' ||
             type == 'DOCUMENT' ||
             type == 'PARAGRAPH') {
    // Supported ContainerElement
    for (var i = 0; i < element.getNumChildren(); ++i) {
      scanElement(element.getChild(i), data);
    }
  }
}

/**
 * Scan and fills table with repeated data.
 * @param {Table} table
 * @param {Object} data
 * @private
 */
function scanTable(table, data) {
  if (data['rows'].length <= 0) {
    // No data to fill.
    return;
  }
  
  var templateCell = table.getChild(1).asTableRow().getChild(0).asTableCell();
  var attr = templateCell.getAttributes();
  var cellTemplate = {
    PADDING_TOP: attr['PADDING_TOP'],
    PADDING_RIGHT: attr['PADDING_RIGHT'],
    PADDING_BOTTOM: attr['PADDING_BOTTOM'],
    PADDING_LEFT: attr['PADDING_LEFT'],
    VERTICAL_ALIGNMENT: attr['VERTICAL_ALIGNMENT']
  };
  for (var i = 0; i < data['rows'].length; ++i) {
    var row = table.appendTableRow();
    for (var j = 0; j < data['rows'][i].length; ++j) {
//      doLog('scanTable', data['rows'][i][j]);
      var cell = row.appendTableCell(data['rows'][i][j]);
      cell.setAttributes(cellTemplate);
      var paragraph = cell.getChild(0).asParagraph();
      paragraph.setAttributes({
        LINE_SPACING: 1.0,
        SPACING_AFTER: 0
      });
      if (paragraph.getNumChildren()) {
        paragraph.getChild(0).asText().replaceText(CRLF, '\n');
      }
    }
  }
  table.removeChild(table.getChild(1));
};


/**
 * Generates public roster for posting.
 * @param {string=} opt_db DB file name.
 * @param {string=} opt_output Output file name.
 * @return {string} URL link to generated file.
 * @throw {GSError}
 */
function generatePublicRoster(opt_db, opt_output) {
  var year = getSchoolYear();
  var fileName = opt_output || PUBLIC_ROSTER_NAME + year;
  
  // Google Apps Script has a bug that it can't clear contents inside a doc.
  // See https://code.google.com/p/google-apps-script-issues/issues/detail?id=1489
  // Therefore we need to delete and recreate the file.
  deleteFile(fileName);
  var outputFile = DocumentApp.create(fileName);
  shareFile(outputFile);
  copyTemplate(PUBLIC_ROSTER_TEMPLATE, outputFile);
  var doc = outputFile.getBody();
  var data = generatePublicRosterData(opt_db);
  
  for (var i = 0; i < data.length; ++i) {
    var body = lookupAndOpenDoc(PUBLIC_ROSTER_TEMPLATE).getBody().copy();
    scanElement(body, data[i]);
    appendToDoc(body, doc);
    doc.appendPageBreak();
  }
  
  outputFile.saveAndClose();
  return outputFile.getUrl();
}


/**
 * Generates data used to fill class roster.
 * @return {!Array.<!Object>}
 */
function generateClassRosterData() {
  var data = [];
  var db = Db.getInstance();
  var classes = db.getClass().getAll();
  var students = db.getStudent().getAllActive();
  var parent = db.getParent();
  var year = getSchoolYear();
  var yearRange = year.toString() + '-' + (year + 1).toString().substring(2);
  
  for (var i = 0; i < classes.length; ++i) {
    var datum = {};
    var classItem = classes[i];
    datum['class'] = classItem.name;
    datum['yearrange'] = yearRange;
    datum['tname'] = classItem.teacher;
    datum['taname'] = classItem.ta;
    datum['temail'] = classItem.teacher_email;
    datum['taemail'] = classItem.ta_email;
    datum['rows'] = [];
    
    var classStudents = [];
    for (var j = 0; j < students.length; ++j) {
      if (students[j].currClass.toUpperCase() == classItem.name.toUpperCase()) {
        classStudents.push(students[j]);
      }
    }
    classStudents.sort(function(student1, student2) {
      var name1 = student1.first_name + ' ' + student1.last_name;
      var name2 = student2.first_name + ' ' + student2.last_name;
      return name1 > name2 ? 1 : -1;
    });
    
    for (var j = 0; j < classStudents.length; ++j) {
      var student = classStudents[j];
      var parents = parent.get(student.family_number);
      var parentNames = '';
      var contact = '';
      for (var k = 0; k < parents.length; ++k) {
        if (parentNames.length) {
          parentNames += CRLF;
          contact += CRLF;
        }
        parentNames += parents[k].english_name + ' ' + parents[k].chinese_name;
        contact += parents[k].cell_phone + ' ' + parents[k].email;
      }
      datum['rows'].push([
        student.first_name + ' ' + student.last_name + CRLF + student.chinese_name,
        parentNames,
        contact
      ]);
    }
    data.push(datum);
  }
  return data;
}


/**
 * Generates single class roster.
 * @param {Object} data
 * @return {string} Generated document id.
 * @throw {GSError}
 */
function generateClassRoster(data) {
  var fileName = CLASS_ROSTER_NAME + '-' + data['class'];
  
  // Google Apps Script has a bug that it can't clear contents inside a doc.
  // See https://code.google.com/p/google-apps-script-issues/issues/detail?id=1489
  // Therefore we need to delete and recreate the file.
  deleteFile(fileName);
  var outputFile = DocumentApp.create(fileName);
  shareFile(outputFile);
  copyTemplate(CLASS_ROSTER_TEMPLATE, outputFile);
  var body = lookupAndOpenDoc(CLASS_ROSTER_TEMPLATE).getBody().copy();
  scanElement(body, data);
  appendToDoc(body, outputFile.getBody()); 
  outputFile.saveAndClose();
  return outputFile.getId();
}


/**
 * Generates class rosters for teachers.
 * @throw {GSError}
 */
function generateClassRosters() {
  var data = generateClassRosterData();
  for (var i = 0; i < data.length; ++i) {
    generateClassRoster(data[i]);
  }
}


/**
 * Generates class rosters and mail to the teachers.
 * @throw {GSError}
 */
/*function mailClassRosters() {
  var data = generateClassRosterData();
  
  for (var i = 0; i < data.length; ++i) {
    var docId = generateClassRoster(data[i]);
    var email = data[i]['temail'];
    var pdf = DocumentApp.openById(docId).getAs('application/pdf');
    mailTo(email, 'Class roster', [pdf]);
  }
}*/

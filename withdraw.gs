/**
 * @fileoverview Generate withdraw report and mail to owner.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

loadConfig();


/** @const {number} */
var FAMILY_DEPOSIT = 200;


/** @const {number} */
var SERVICE_DEPOSIT = 200;


/** @const {number} */
var PROCESS_FEE = 50;


/** @const {number} */
var SERVICE_FINE = 20;


/** @const {string} */
var WITHDRAW_TEMPLATE = 'WithdrawTemplate';


/** @const {string} */
var WITHDRAW_PREFIX = 'Withdraw';


/** @const {string} */
var WITHDRAW_FOLDER = 'Withdraw';


/**
 * Withdraw report item class.
 * @constructor
 */
WithdrawItem = function() {
  /** @type {string} */
  this.date;
  
  /** @type {string} */
  this.reason;
  
  /** @type {string} */
  this.applicantName;
  
  /** @type {string} */
  this.applicantEmail;
  
  /** @type {string} */
  this.applicantPhone;
  
  /** @type {string} */
  this.checkPayable;
  
  /** @type {string} */
  this.mailingAddress;
  
  /** @type {number} */
  this.familyNumber;
  
  /** @type {Array<{name: string, class: string>} */
  this.students;
  
  /** @type {string} */
  this.studentsString;
  
  /** @type {number} */
  this.tuition;
  
  /** @type {number} */
  this.familyDeposit;
  
  /** @type {number} */
  this.serviceDeposit;
  
  /** @type {number} */
  this.serviceFine;
  
  /** @type {number} */
  this.processFee;
  
  /** @type {string} */
  this.originalPayment;
  
  /** @type {string} */
  this.memo = '';
};


/**
 * Withdraw logic wrapper class.
 * @constructor
 */
Withdraw = function() {
  /** @private {Sheet} */
  this.responses_;
  
  /** @private {Array<string>} */
  this.emails_ = [];
  
  /** @private {Form} */
  this.form_ = FormApp.openById(WITHDRAW_FORM_DOCID);
  
  // Initialize the withdraw sheet and form before loading RegDB.
  var spreadsheet = SpreadsheetApp.openById(WITHDRAW_SHEET_DOCID);
  this.responses_ = spreadsheet.getSheetByName('Form Responses');
  var sheet = spreadsheet.getSheetByName('Staff');
  var rows = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  rows.map(function(row) {
    if (row[0] && row[0].length) {
      this.emails_.push(row[0]);
    }
  }.bind(this));
  
  /** @private {Db} */
  this.db_ = Db.getInstance();
  
  /** @private {Array<string>} */
  this.badResponses_ = [];
  
  /** @private {Array<WithdrawItem>} */
  this.items_ = [];
  
  /** @private {ServiceDb} */
  this.serviceDb_ = new ServiceDb();
  
  /** @private {Body} */
  this.template_ = readTemplate(WITHDRAW_TEMPLATE);
  
  /** @private {Object} */
  this.payments_ = {};
  
  // Load payment data
  sheet = SpreadsheetApp.openById(PAYMENT_DOCID).getSheetByName('Sheet1');
  rows = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  rows.map(function(row) {
    if (row[1]) {
      this.payments_[row[1]] = {
        ref: row[0],
        email: row[2],
        amount: parseInt(row[5].substring(4), 10),
        cc: row[6],
        type: row[7],
        timestamp: row[9],
        memo: row[10]
      };
    }
  }.bind(this));
};


Withdraw.prototype.payRecordToString = function(rec) {
  var paddedNumber = String(rec.cc);
  while (paddedNumber.length < 4) {
    paddedNumber = '0' + paddedNumber;
  }
  return 'ref:' + rec.ref + ' ' + rec.type + ' ' + paddedNumber + ' ' + rec.timestamp + ' ' + rec.memo;
};


Withdraw.prototype.run = function() {
  var sheet = this.responses_;
  var rows = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (rows[i][0]) {
      this.parseResponse_(rows[i]);
    }
  }
  
  this.generateReports_();
};


/** @private */
Withdraw.prototype.parseResponse_ = function(row) {
  // 0: Timestamp
  // 1: Reason
  // 2: Applicant English Name
  // 3: Applicant E-Mail
  // 4: Family Number
  // 5: Student English Names (One student in a line)
  // 6: Applicant Phone
  // 7: Check Payable to
  // 8: Mailing Address
  
  var badItem = false;
  
  // Blindly assign to item first, in case we need to throw it into bad responses.
  var item = new WithdrawItem();
  item.date = Utilities.formatDate(row[0], 'PST', 'MM-dd-yy')
  item.reason = row[1].trim();
  item.applicantName = row[2].trim();
  item.applicantEmail = row[3].trim();
  item.familyNumber = row[4];
  if (row[5]) {
    item.students = row[5].split('\n').map(function(name) {
      return {name: name};
    });
  } else {
    item.memo += row[5];
    badItem = true;
  }
  item.applicantPhone = row[6];
  item.checkPayable = row[7];
  item.mailingAddress = row[8];
  
  var ec = new ECDB();
  
  while (!badItem) {
    var names = [item.applicantName];
    item.students.forEach(function(student) {
      names.push(student.name);
    });
    var familyNumber = this.db_.lookupFamilyNumber(names);
    if (familyNumber == -1) {
      item.memo += 'Unable to locate family number: ' + item.applicantName;
      break;
    }
    if (item.familyNumber != familyNumber) {
      item.memo += 'Found family#' + familyNumber + ' is different from applicant provided # ' + item.familyNumber;
      item.familyNumber = familyNumber;
    }
    
    // Data validation
    var email = Validator.email(item.applicantEmail);
    if (!email.length) {
      item.memo += 'Bad applicant email';
      break;
    }
    var phone = Validator.phoneNumber(item.applicantPhone);
    if (!phone.length) {
      item.memo += 'Bad applicant phone number';
      break;
    }
    item.applicantPhone = phone;
    var students = this.db_.getStudent().get(familyNumber, true).map(function(stu) {
      return {name: stu.first_name + ' ' + stu.last_name, class: stu.currClass};
    });
    if (students.length == 0) {
      item.memo += 'All students are inactive';
      break;
    }
    item.students = students;
    var ecStudents = ec.getStudents(familyNumber).map(function(name) {
      return name.toLowerCase();
    });
    item.studentsString = students.map(function(stu) {
      var hasEC = (ecStudents.indexOf(stu.name.toLowerCase()) != -1);
      var extraToken = hasEC ? ', EC' : '';
      return stu.name + ' (' + stu.class + extraToken + ')';
    }).join(', ');
    
    // Static logic    
    item.familyDeposit = (item.familyNumber <= 1148) ? FAMILY_DEPOSIT : 0;
    item.serviceDeposit = SERVICE_DEPOSIT;
    if (this.payments_[familyNumber]) {
      var payRecord = this.payments_[familyNumber];
      item.tuition = payRecord.amount;
      item.originalPayment = this.payRecordToString(payRecord);
    } else {
      item.originalPayment = 'manual';
    }
    
    item.processFee = item.students.length * PROCESS_FEE;
    var servicePoints = this.serviceDb_.lookup(familyNumber);
    item.serviceFine = SERVICE_FINE * (20 - servicePoints);
    
    this.items_.push(item);
    return;
  }
  
  this.badResponses_.push(JSON.stringify(item));
};

/**
 * Scans and fills element.
 * @param {Element} element
 * @param {Object} data
 * @private
 */
Withdraw.prototype.scanElement_ = function(element, data) {
  var type = element.getType();
  if (type == 'TEXT') {
    scanText(element.asText(), data, true);
  }else if (type == 'BODY_SECTION' ||
             type == 'DOCUMENT' ||
             type == 'PARAGRAPH') {
    // Supported ContainerElement
    for (var i = 0; i < element.getNumChildren(); ++i) {
      this.scanElement_(element.getChild(i), data);
    }
  }
};

/** @private */
Withdraw.prototype.prepareDoc_ = function(item) {
  var fileName = WITHDRAW_PREFIX + item.familyNumber;
  
  var doc = lookupAndOpenDoc(fileName);
  if (!doc) {
    doc = DocumentApp.create(fileName);
    shareFile(doc, WITHDRAW_FOLDER, true);
    var body = applyTemplate(this.template_, doc);
    this.scanElement_(body, item);
    appendToDoc(body, doc);
    doc.saveAndClose();
    return item.familyNumber;
  }
  return 0;
};


/** @private */
Withdraw.prototype.generateReports_ = function() {
  var changedFamily = [];
  this.items_.forEach(function(item) {
    var familyNumber = this.prepareDoc_(item);
    if (familyNumber != 0) {
      changedFamily.push(familyNumber);
    }
  }.bind(this));
  
  if (changedFamily.length) {
    this.sendMail_(changedFamily);
  }
};


/** @private */
Withdraw.prototype.sendMail_ = function(changedFamily) {
  var body = changedFamily.map(function(familyNumber) {
    return familyNumber.toString();
  }).join('<br/>');
  this.emails_.forEach(function(email) {
    MailApp.sendEmail({
     to: email,
     subject: 'CLSSC Reg System Notification: Withdraw',
     htmlBody: 'AUTO-GENERATED E-MAIL. DO NOT REPLY.<br/><br/>' +
               'New withdraw forms:<br/>' +
               changedFamily +
               '<br/>Please go to Withdraw folder to review.'});
  });      
};


function generateWithdrawReport() {
  var withdraw = new Withdraw();
  withdraw.run();
}
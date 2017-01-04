/**
 * @fileoverview Convert web submitted JSON object to RawDB.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */


/**
 * Generates fail string with reason.
 * @param {string} message 
 * @return {string}
 */
function failImport(message) {
  return 'FAIL: ' + message;
}

/**
 * @param {Object} data Data submitted from Web.
 * @return {string} Status string, start with "SUCCESS:" or "FAIL:".
 */
function importWebData(data) {
  if (!(data.family && data.parents && data.students) ||
      !data.parents.length || !data.students.length) {
    return failImport('Invalid data');
  }
  
  var rawData = new RawData(data);
  if (rawData.errMsg.length) {
    return rawData.errMsg;
  }
  
  var db = Db.getInstance();
  var familyNumber = db.lookupFamilyNumber(rawData.names);
  if (familyNumber == -1) {
    familyNumber = db.nextAvailableFamilyNumber();
    return 'SUCCESS\n' + familyNumber + '\n' + JSON.stringify(rawData.entry);
  }
  
  return failImport('already paid or returning family, family number = ' + familyNumber);
}


/**
 * @param {Object} data Raw data object from Web.
 * @constructor
 */
RawData = function(data) {
  this.entry = {ec: []};
  this.ecClasses = ['nada'];
  getECClasses().forEach(function(cls) {
    this.ecClasses.push(cls.code);
  }.bind(this));
  
  this.names = [];

  this.errMsg = this.validateFamily(data.family);
  if (!this.errMsg.length) {
    this.errMsg = this.validateParents(data.parents);
  }
  if (!this.errMsg.length) {
    this.errMsg = this.validateStudents(data.students, data.family.video_consent);
  }
}

RawData.prototype.validateFamily = function(data) {
  var family = {};
    
  family.street_address = data.address || '';
  family.city = data.city || '';
  family.state = Validator.state(data.state);
  family.zip = Validator.zip(data.zip);
  if (!family.street_address.length ||
      !family.city.length ||
      !family.state.length ||
      !family.zip.length) {
    return failImport('Invalid address');
  }
  family.home_phone = Validator.phoneNumber(data.home_ph);
  if (!family.home_phone.length) {
    return failImport('Invalid home phone');
  }
  family.fax = '';
  family.doctor_name = data.doc_name || '';
  family.doctor_phone = Validator.phoneNumber(data.doc_ph);
  family.contact_name = data.emer_name || '';
  family.contact_phone = Validator.phoneNumber(data.emer_ph);
  
  this.entry.family = family;
  return '';
}

RawData.prototype.validateParents = function(data) {
  if (data.length > 2) {
    return failImport('Forged parent data');
  }
  var parents = [];
  
  for (var i = 0; i < data.length; ++i) {
    var parent = {};
    parent.english_name = data[i].eng_name || '';
    if (!parent.english_name.length) {
      return failImport('Invalid parent ' + i + ': no eng_name');
    }
    this.names.push(parent.english_name);
    parent.chinese_name = data[i].chn_name || '';
    parent.occupation = data[i].spec || '';
    parent.work_phone = Validator.phoneNumber(data[i].work_ph);
    parent.cell_phone = Validator.phoneNumber(data[i].cell_ph);
    if (!parent.cell_phone.length) {
      return failImport('Invalid parent ' + i + ': no primary phone');
    }
    parent.email = Validator.email(data[i].email);
    if (!parent.email.length) {
      return failImport('Invalid parent ' + i + ': no email');
    }
    parent.chinese_level = data[i].chnlv;
    parents.push(parent);
  }
  this.entry.parents = parents;
  return '';
}

function generateNotes(consent, tshirt, learned) {
  var notes = 'Sys: New:' + Utilities.formatDate(new Date(), 'PST', 'MM-dd-yy') + ';';
  if (!consent) {
    notes += 'no video;';
  }
  if (tshirt) {
    notes += 't-shirt:' + tshirt + ';';
  }
  var learnedYear = parseInt(learned, 10);
  switch (learnedYear) {
    case 1: notes += '<1yr exp;'; break;
    case 2: notes += '1-2yr exp;'; break;
    case 3: notes += '2+yr exp;'; break;
    default: break;
  }
  return notes;
}

RawData.prototype.validateStudents = function(data, consent) {
  if (data.length > 4) {
    return failImport('Forged student data');
  }
  var students = [];
  
  for (var i = 0; i < data.length; ++i) {
    var student = {};
    student.last_name = data[i].last_name || '';
    student.first_name = data[i].first_name || '';
    if (!student.last_name.length || !student.first_name.length) {
      return failImport('Invalid student ' + i + ': no name');
    }
    if (this.ecClasses.indexOf(data[i].ec) == -1) {
      return failImport('Invalid student ' + i + ': EC class full');
    }
    
    this.names.push(student.first_name + ' ' + student.last_name);
    if (data[i].ec != 'nada') {
      this.entry.ec.push({'name': student.first_name, 'code': data[i].ec});
    }
    student.chinese_name = data[i].chn_name || '';
    student.dob = data[i].dob;
    student.gender = data[i].gender == 'F' ? 'F' : 'M';
    student.prev_class = '';
    student.currClass = '';
    student.speak_chinese = data[i].sch == 'Y' ? 'Y' : 'N';
    student.text_pref = data[i].pref;
    student.active = true;
    student.active_prev = false;
    student.note = generateNotes(!!consent, data[i].tshirt, data[i].learned);
    students.push(student);
  }
  this.entry.students = students;
  return '';
};


RawData.prototype.setFamilyNumber = function(familyNumber) {
  this.entry.family.family_number = familyNumber;
  for (var i = 0; i < this.entry.parents.length; ++i) {
    this.entry.parents[i].family_number = familyNumber;
  }
  for (var i = 0; i < this.entry.students.length; ++i) {
    this.entry.students[i].family_number = familyNumber;
  }
};

function getTestData() {
  return {
    "family": {
      "address":"123 Sesame St",
      "city":"Los Angeles",
      "state":"CA",
      "zip":"90123",
      "home_ph":"310-222-2222",
      "doc_name":"Noah Dolittle",
      "doc_ph":"310-777-7777",
      "emer_name":"Peter Doe",
      "emer_ph":"310-888-8888",
      "video_consent":false
    },
    "parents":[
      {
        "eng_name":"John Doe",
        "chn_name":"杜強",
        "spec":"Accountant",
        "work_ph":"310-333-3333",
        "cell_ph":"310-111-1111",
        "email":"jdoe@whatevermail.com",
        "chnlv":1
      },
      {
        "eng_name":"Mary Doe",
        "chn_name":"杜美麗",
        "spec":"Nurse",
        "work_ph":"310-444-4444x55555",
        "cell_ph":"310-222-2222",
        "email":"marydoe123@ggmail.com",
        "chnlv":2
      }
    ],
    "students":[
      {
        "last_name":"Doe",
        "first_name":"Daisy",
        "chn_name":"杜愛希",
        "dob":"06-07-2008",
        "gender":"F",
        "sch":"Y",
        "pref":"1",
        "tshirt":"YM",
        "learned":"1",
        "ec":"nada"
      },
      {
        "last_name":"Doe",
        "first_name":"Edward",
        "chn_name":"杜愛德",
        "dob":"01-02-2007",
        "gender":"M",
        "sch":"N",
        "pref":"2",
        "tshirt":"YL",
        "learned":"2",
        "ec":"che"
      },
      {
        "last_name":"Doe",
        "first_name":"George",
        "chn_name":"杜愛池",
        "dob":"10-14-2004",
        "gender":"M",
        "sch":"N",
        "pref":"3",
        "tshirt":"AS",
        "learned":"0",
        "ec":"nada"
      },
      {
        "last_name":"Doe",
        "first_name":"Helen",
        "chn_name":"杜愛倫",
        "dob":"12-25-2005",
        "gender":"F",
        "sch":"Y",
        "pref":"1",
        "tshirt":"YL",
        "learned":"3",
        "ec":"mus"
      }
    ]
  };
}

function testImportParsing() {
  Logger.log(importWebData(getTestData()));
}

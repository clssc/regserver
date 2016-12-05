function doGet() {
  return HtmlService
      .createTemplateFromFile('index')
      .evaluate()
      .setTitle('Report')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function genFullRoster() {
  try {
    var fileLink = Reg.generateFullRoster()[1];
    return fileLink;
  } catch (e) {
    return e;
  }
}

function genPublicRosters() {
  try {
    var fileLink = Reg.generatePublicRoster();
    var fileLink2 = Reg.generateFullPublicRoster()[1];
    return undefined;
  } catch (e) {
    return e;
  }
}

function genClassRosters() {
  try {
    Reg.generateClassRosters()[1];
    return undefined;
  } catch (e) {
    return e;
  }
}
/*
function mailClassRosters() {
  try {
    Reg.mailClassRosters();
    return undefined;
  } catch (e) {
    return e;
  }
}
*/
function genBlankRegForm() {
  try {
    var fileLink = Reg.generateBlankRegForm();
    return fileLink;
  } catch (e) {
    return e;
  }
}

function genRegForm(family) {
  try {
    var number = -1;
    if (family.match(/^\d+$/)) {
      number = parseInt(family);
    } else {
      var db = new Reg.Db();
      number = db.lookupFamilyNumber(family);
    }
    if (number == -1 || number == 0) {
      return 'Family number for ' + family + ' not found';
    } else {
      var fileLink = Reg.generateRegForm(number);
      return fileLink;
    }
  } catch (e) {
    return e;
  }
}

function genRegFormsByClass(className) {
  try {
    Reg.generateRegFormsByClass(className);
    return undefined;
  } catch (e) {
    return e;
  }
}


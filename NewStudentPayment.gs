/**
 * Output debug message to Log and Debug Log file.
 * @param {string} message
 */
function DebugLog(message) {
  Logger.log(message);
  var file = lookupAndOpenFile('DebugLog');
  var sheet = file.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var cell = sheet.getRange('a1').offset(lastRow, 0);
  cell.setValue(message);
}


/**
 * Parses evil data from the client.
 * @param {string} message
 * @return {Object}
 */
function processMessage(message) {
  // Expected data: <span>OK</span><span>1421</span><span>1000</span><span>{"result":"true"}</span>
  // First number is family number
  // Second number is amount
  var s = message.replace(/<span>/g, ' ').replace(/<\/span>/g, '');
  if (s.indexOf('OK') != -1 && s.indexOf('{"result":"true"}') != -1) {
    // seems to be good input
    try {
      var familyNumber = parseInt(s.split(' ')[2], 10);
      var amount = parseInt(s.split(' ')[3], 10);
      if (familyNumber && amount) {
        Reg.reportNewStudentPayment(familyNumber, amount);
      }
    } catch(e) {
      return false;
    }
  }
  return true;
}

function doGet(e) {
  var jsonString = e.parameter.data;
  return processData(jsonString);
}

function doPost(request) {
  var jsonString = request.postData.getDataAsString();
  return processData(jsonString);
}

function processData(jsonString) {
  var result = processMessage(jsonString);
  var payload = {
    'result': result
  };
  return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
}


// WARNING: side effect, do not run when RawDB is live
function testReporting() {
  var samplePayload = '<span>OK</span><span>1421</span><span>1000</span><span>{"result":"true"}</span>';
  Logger.log(processData(samplePayload).getContent());
}

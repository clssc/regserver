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
function parseMessage(message) {
  var parsedObject = null;
  try {
    parsedObject = JSON.parse(message);
  } catch(e) {
    DebugLog('Failed to parse ' + message);
  } finally {
    return parsedObject;
  }
}


/**
 * Processes data from the client.
 * @param {string} message
 * @return {string}
 */
function processMessage(message) {
  var parsedObject = parseMessage(message);
  if (!parsedObject) {
    return "FAIL: invalid data.";
  } else {
    return Reg.importWebData(parsedObject);
  }
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
  var payload = null;
  if (result.substring(0, 7) == 'SUCCESS') {
    var tokens = result.split('\n');
    payload = {
      'result': 'SUCCESS',
      'family_number': tokens[1],
      'payload': JSON.parse(tokens[2])
    }
  } else {
    payload = {
      'result': result
    };
  }
  return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
}

function testRawDBCheck() {
  var samplePayload = '{"family":{"address":"123 sonoma st","city":"los angeles","state":"CA","zip":"90034","home_ph":"310-567-8888","doc_name":"","doc_ph":"","emer_name":"","emer_ph":"","video_consent":true},"parents":[{"eng_name":"a b","chn_name":"","spec":"","work_ph":"","cell_ph":"310-234-5678","email":"a@bbb.com","chnlv":0}],"students":[{"last_name":"b","first_name":"b","chn_name":"","dob":"04-01-2009","gender":"F","sch":"N","pref":"1","tshirt":"YS","learned":"0","ec":"che"}]}';
  Logger.log(processData(samplePayload).getContent());
}

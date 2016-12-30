/**
 * Parses evil data from the client.
 * @param {string} message
 * @return {Object}
 */
function parseMessage(message) {
  var familyNumber = 0;
  try {
    familyNumber = parseInt(message, 10);
  } catch(e) {
    // Ignore to better handle attacks.
  } finally {
    return familyNumber;
  }
}


/**
 * Processes data from the client.
 * @param {string} message
 * @return {number} Amount to pay.
 */
function processMessage(message) {
  var familyNumber = parseMessage(message);
  if (familyNumber == 0) {
    return 0;
  }
  
  return {
    tuition: Reg.lookupTuition(familyNumber),
    ec: Reg.lookupEC(familyNumber)
  };
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
  return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
}

function testLookupTuition() {
  var samplePayload = '1020';
  Logger.log(processData(samplePayload).getContent());
}

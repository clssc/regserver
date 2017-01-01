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
  
  // Optimization: if tuition is already paid, no need to check ec.
  var tuition = Reg.lookupTuition(familyNumber);
  var ec = (tuition > 0) ? Reg.lookupEC(familyNumber) : [];
  
  return {
    tuition: tuition,
    ec: ec
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
  var samplePayload = '311';
  Logger.log(processData(samplePayload).getContent());
}

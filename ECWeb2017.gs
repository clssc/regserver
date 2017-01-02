function doGet(e) {
  return ContentService
      .createTextOutput(JSON.stringify(Reg.getECClasses()))
      .setMimeType(ContentService.MimeType.JSON);
}

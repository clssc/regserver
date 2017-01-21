/**
 * @fileoverview Unit tests controller for all classes.
 * It will open RegDB_test and make sure every sheet is read correctly. 
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

function testDataRead() {
  var db = Db.getInstance('RegDBTest2017');
  testClass(db.getClass());
  testFamily(db.getFamily());
  testParent(db.getParent());
  testStudent(db.getStudent());
  testLookupFamilyNumber(db);
  testNextAvailableFamilyNumber(db);
  
  var warnings = [];
  db.detectError(warnings);
  assertEquals(11, warnings.length);  // 5 dupes + 6 inconsistencies
}

function testValidator() {
  testValidatorPhoneNumber();
  testValidatorEmail();
  testValidatorZip();
}

function testImport() {
  testImportParsing();
}

function detectDbError() {
  var db = Db.getInstance();
  var warnings = [];
  db.detectError(warnings);
  for (var i = 0; i < warnings.length; ++i) {
    DebugLog('detectDbError', warnings[i]);
  }
}
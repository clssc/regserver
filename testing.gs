/**
 * @fileoverview Common testing functions.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * Google Script Error.
 * @param {string} message
 * @param {string=} opt_comment
 * @constructor
 * @struct
 */
var GSError = function(message, opt_comment) { 
  /** @type {string} */
  this.description = message;
  
  /** @type {string} */
  this.comment = opt_comment || '';
  
  /** @type {string} */
  this.stack = (new Error()).stack;
  
  DebugLog('assertion', this.description);
  DebugLog('assertion', this.comment);
  DebugLog('assertion', this.stack);
}

/**
 * Assert a boolean condition.
 * @param {boolean} contidion
 * @param {string} failureMessage Message when fail.
 * @param {string=} opt_comment Comment of this assertion.
 * @private
 */
function assert(condition, failureMessage, opt_comment) {
  if (!condition) {
    throw new GSError(failureMessage, opt_comment);
  }
}

function assertTrue(condition, opt_comment) {
  assert(condition === true, 'Expected to be true', opt_comment);
}

function assertFalse(condition, opt_comment) {
  assert(condition === false, 'Expected to be false', opt_comment);
}

function assertEquals(expectedValue, actualValue, opt_comment) {
  assert(expectedValue === actualValue,
      'Expected:<' + expectedValue + '> Actual:<' + actualValue + '>', opt_comment);
}

function assertNotEquals(expectedValue, actualValue, opt_comment) {
  assert(expectedValue !== actualValue,
      'Expected not <' + actualValue + '>', opt_comment);
}

function assertNull(value, opt_comment) {
  assert(value === null, 'Expected to be null', opt_comment);
}

function assertDefAndNotNull(value, opt_comment) {
  assert(!value, 'Expected not to be undefined or null', opt_comment);
}

/**
 * Fails the unit test.
 * @throws {Error}
 */
function fail(failureMessage) {
  throw new GSError('Call to fail');
}

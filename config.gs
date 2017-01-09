/**
 * @fileoverview Doc id constants.
 * This is used to overcome the performance inefficiency of
 * opening a file because this account currently have several
 * hundred of them. Use openById can lower the doc open time
 * from 3 seconds to 600ms.
 * 
 * Doc id can be found from URL. For example:
 * https://docs.google.com/a/westsidechineseschool.org/spreadsheets/d/1cPxKNHb7UkX-HYX6C92foLGDEUJB8KTkVxbkZwOODKU/edit#gid=0
 * The doc id is the 1cPx...DKU part.
 */

function loadConfig() {
  // Dummy function to make sure this file is loaded in advance
}

var PAYMENT_DOCID = '1jqUeJNGEKLWB8otJMCD9e4gYGYQ67GHG0evv6wHLjIE';
var WITHDRAW_SHEET_DOCID = '1At5Kv3JK9tbTRAn4XCUTjiCnoYiq7fvz5TXY-sTqS0g';
var WITHDRAW_FORM_DOCID = '1hZemgsVVPAbg5_7tbO2NTwiYlkOV4_Wt-x74h4aUeNw';

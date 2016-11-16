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
 *
 * Doc ids are scattered in following files:
 * - db.gs
 * - lookup.gs
 * - rawdata.gs
 *
 * The reason is that we have no control over the order of
 * file loading, therefore defining the var or class here
 * does not work.
 */
#!/usr/bin/env node
'use strict';

(async () => {

  const fs = require('fs');
  const ora = require('ora');

  const DbFile = require('./impl/dbFile');
  const scriptUtils = require('./impl/scriptUtils');

  scriptUtils.printUnhandledRejections();

  await calculateContribs();
  return;

  async function calculateContribs() {
    let spinner;

    const repos = new DbFile('data/repos.json');
    const orgs = new DbFile('data/orgs.json');

    const users = {};
    for (const file of fs.readdirSync('data/users/')) {
      if (file.endsWith('.json')) {
        const user = new DbFile(`data/users/${file}`);
        if (!user.ghuser_deleted_because) {
          users[file] = user;
        }
      }
    }

    const contribs = {};
    for (const file of fs.readdirSync('data/contribs/')) {
      if (file.endsWith('.json')) {
        const contribList = new DbFile(`data/contribs/${file}`);
        contribList._comment = 'DO NOT EDIT MANUALLY - See ../../README.md';
        contribList.repos = contribList.repos || {};
        contribs[file] = contribList;
      }
    }

    stripUnreferencedContribs();

    return;

    function stripUnreferencedContribs() {
      // Deletes contrib files that aren't referenced by any user.

      const toBeDeleted = [];
      for (const contribList in contribs) {
        if (!users[contribList]) {
          toBeDeleted.push(contribList);
        }
      }
      for (const contribList of toBeDeleted) {
        delete contribs[contribList];
        fs.unlinkSync(`data/contribs/${contribList}`);
      }

      repos.write();
    }
  }

})();

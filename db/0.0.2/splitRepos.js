#!/usr/bin/env node
'use strict';

(() => {

  const fs = require('fs');

  const DbFile = require('./impl/dbFile');
  const scriptUtils = require('./impl/scriptUtils');

  scriptUtils.printUnhandledRejections();

  splitRepos();
  return;

  function splitRepos() { //LA_TEMP
    const oldRepos = new DbFile('data/repos.json');
    for (const oldRepo in oldRepos.repos) {
      const newRepo = new DbFile(`data/repos/${oldRepo}.json`);
      newRepo._comment = 'DO NOT EDIT MANUALLY - See ../../../README.md';
      Object.assign(newRepo, oldRepos.repos[oldRepo]);
      newRepo.write();
    }
    fs.unlinkSync('data/repos.json');
  }

})();

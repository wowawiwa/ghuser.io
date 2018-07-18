#!/usr/bin/env node
'use strict';

(() => {

  const DbFile = require('./impl/dbFile');

  const v1 = new DbFile('../db.json');

  for (const userId in v1.users) {
    const user = new DbFile(`data/users/${userId}.json`);
    const contribs = new DbFile(`data/contribs/${userId}.json`);
    user._comment = contribs._comment = 'DO NOT EDIT MANUALLY - See ../../README.md';

    Object.assign(user, v1.users[userId]);

    if (user.contribs) {
      Object.assign(contribs, user.contribs);
      delete contribs.fetched_at;
      contribs.write();

      const contribsWithoutStats = [];
      for (const repo in user.contribs.repos) {
        contribsWithoutStats.push(repo);
      }
      user.contribs.repos = contribsWithoutStats;
      delete user.contribs.organizations;
    }
    user.write();
  }

  const orgs = new DbFile('data/orgs.json');
  orgs._comment = 'DO NOT EDIT MANUALLY - See ../README.md';
  orgs.orgs = v1.orgs;
  orgs.write();

  const repos = new DbFile('data/repos.json');
  repos._comment = 'DO NOT EDIT MANUALLY - See ../README.md';
  repos.repos = v1.repos;
  repos.write();

})();

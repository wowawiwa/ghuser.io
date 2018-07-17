#!/usr/bin/env node
'use strict';

(() => {

  const DbFile = require('./impl/dbFile');

  const v1 = new DbFile('../db.json');

  for (const userId in v1.users) {
    const user = new DbFile(`data/users/${userId}.json`);
    const contribs = new DbFile(`data/contribs/${userId}.json`);
    user._comment = contribs._comment = v1._comment;

    Object.assign(user, v1.users[userId]);

    if (user.contribs) {
      Object.assign(contribs, user.contribs);
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
  orgs._comment = v1._comment;
  orgs.orgs = v1.orgs;
  orgs.write();

  const repos = new DbFile('data/repos.json');
  repos._comment = v1._comment;
  repos.repos = v1.repos;
  repos.write();

})();

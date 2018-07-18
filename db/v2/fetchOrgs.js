#!/usr/bin/env node
'use strict';

(async () => {

  const fs = require('fs');
  const ora = require('ora');

  const DbFile = require('./impl/dbFile');
  const fetchJson = require('./impl/fetchJson');
  const github = require('./impl/github');
  const scriptUtils = require('./impl/scriptUtils');

  scriptUtils.printUnhandledRejections();

  await fetchOrgs();
  return;

  async function fetchOrgs() {
    let spinner;

    const orgs = new DbFile('data/orgs.json');

    const users = [];
    for (const file of fs.readdirSync('data/users/')) {
      if (file.endsWith('.json')) {
        const user = new DbFile(`data/users/${file}`);
        if (!user.ghuser_deleted_because) {
          users.push(user);
        }
      }
    }

    let userOrgs = new Set([]);
    for (const user of users) {
      userOrgs = new Set([...userOrgs, ...user.organizations]);
    }
    await fetchOrgs(userOrgs);

    stripUnreferencedOrgs();

    return;

    async function fetchOrgs(orgSet) {
      for (const org of orgSet) {
        spinner = ora(`Fetching organization ${org}...`).start();
        if (orgs.orgs[org] && orgs.orgs[org].avatar_url) {
          spinner.succeed(`Organization ${org} is already known`);
          continue;
        }

        const orgUrl = `https://api.github.com/orgs/${org}`;
        const orgJson = await fetchJson(github.authify(orgUrl), spinner);
        spinner.succeed(`Fetched organization ${org}`);

        orgs.orgs[orgJson.login] = {...orgs.orgs[orgJson.login], ...orgJson};

        // Keep the DB small:
        delete orgs.orgs[orgJson.login].id;
        delete orgs.orgs[orgJson.login].node_id;
        delete orgs.orgs[orgJson.login].events_url;
        delete orgs.orgs[orgJson.login].hooks_url;
        delete orgs.orgs[orgJson.login].issues_url;
        delete orgs.orgs[orgJson.login].repos_url;
        delete orgs.orgs[orgJson.login].members_url;
        delete orgs.orgs[orgJson.login].public_members_url;
        delete orgs.orgs[orgJson.login].description;
        delete orgs.orgs[orgJson.login].company;
        delete orgs.orgs[orgJson.login].blog;
        delete orgs.orgs[orgJson.login].location;
        delete orgs.orgs[orgJson.login].email;
        delete orgs.orgs[orgJson.login].has_organization_projects;
        delete orgs.orgs[orgJson.login].has_repository_projects;
        delete orgs.orgs[orgJson.login].public_repos;
        delete orgs.orgs[orgJson.login].public_gists;
        delete orgs.orgs[orgJson.login].followers;
        delete orgs.orgs[orgJson.login].following;
      }

      orgs.write();
    }

    function stripUnreferencedOrgs() {
      // Deletes orgs that are not referenced by any user.

      const toBeDeleted = [];
      for (const org in orgs.orgs) {
        if (!userOrgs.has(org)) {
          toBeDeleted.push(org);
        }
      }
      for (const org of toBeDeleted) {
        delete orgs.orgs[org];
      }

      orgs.write();
    }
  }

})();

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

    for (const file of fs.readdirSync('data/users/')) {
      if (file.endsWith('.json')) {
        const user = new DbFile(`data/users/${file}`);
        if (!user.ghuser_deleted_because) {
          await fetchUserOrgs(user);
        }
      }
    };

    return;

    async function fetchUserOrgs(user) {
      for (const org of user.organizations) {
        const orgUrl = `https://api.github.com/orgs/${org}`;
        spinner = ora(`Fetching organization ${org}...`).start();
        if (orgs.orgs[org] && orgs.orgs[org].avatar_url) {
          spinner.succeed(`Organization ${org} is already known`);
          continue;
        }

        const orgJson = await fetchJson(github.authify(orgUrl), spinner);
        spinner.succeed(`Fetched organization ${org}`);

        orgs.orgs[orgJson.login] = {...orgs.orgs[orgJson.login], ...filterOrgInPlace(orgJson)};
      }

      orgs.write();
    }

    function filterOrgInPlace(org) { // to keep the DB small
      delete org.id;
      delete org.node_id;
      delete org.events_url;
      delete org.hooks_url;
      delete org.issues_url;
      delete org.repos_url;
      delete org.members_url;
      delete org.public_members_url;
      delete org.description;
      delete org.company;
      delete org.blog;
      delete org.location;
      delete org.email;
      delete org.has_organization_projects;
      delete org.has_repository_projects;
      delete org.public_repos;
      delete org.public_gists;
      delete org.followers;
      delete org.following;
      return org;
    }
  }

})();

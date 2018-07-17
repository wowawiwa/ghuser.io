#!/usr/bin/env node
'use strict';

(async () => {

  const fetch = require('fetch-retry');
  const fs = require('fs');
  const githubColors = require('github-colors');
  const githubContribs = require('@ghuser/github-contribs');
  const meow = require('meow');
  const ora = require('ora');
  const assert = require('assert');
  const url = require('url');

  const DbFile = require('./impl/dbFile');

  const cli = meow(`
usage:
  $ ./fetchUserDetailsAndContribs.js USER
  $ ./fetchUserDetailsAndContribs.js --help
  $ ./fetchUserDetailsAndContribs.js --version

positional arguments:
  USER        GitHub username, e.g. AurelienLourot
`);

  if (cli.input.length < 1) {
    console.error('Error: USER argument missing. See `./fetchUserDetailsAndContribs.js --help`.');
    process.exit(1);
  }

  if (cli.input.length > 1) {
    console.error('Error: too many positional arguments. See `./fetchUserDetailsAndContribs.js --help`.');
    process.exit(1);
  }

  const user = cli.input[0];

  process.on('unhandledRejection', (e, p) => { // https://stackoverflow.com/a/44752070/1855917
    console.error(p);
    throw e;
  });

  await fetchUserDetailsAndContribs(user);
  return;

  async function fetchUserDetailsAndContribs(user) {
    const authify = (() => {
      let query = '';
      let auth = '';
      if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        console.log('GitHub API key found.');
        query = `client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}`;
      }
      if (process.env.GITHUB_USERNAME && process.env.GITHUB_PASSWORD) {
        console.log('GitHub credentials found.');
        auth = `${process.env.GITHUB_USERNAME}:${process.env.GITHUB_PASSWORD}`;
      }

      return addr => {
        const result = url.parse(addr);
        result.auth = auth;
        if (query) {
          result.search = result.search && `${result.search}&${query}` || `?${query}`;
        }
        return url.format(result);
      };
    })();

    let spinner;

    const userId = user.toLowerCase();
    const userFilePath = `data/users/${userId}.json`;
    const userFile = new DbFile(userFilePath);
    if (!userFile.login) {
      throw `${userFilePath} is malformed. Did you run ./addUser.js ?`;
    }
    if (userFile.ghuser_deleted_because) {
      console.log(`${userFile.login} has been deleted, skipping...`);
      return;
    }

    await fetchDetails();
    await fetchContribs();
    await fetchPopularForks();
    return;

    async function fetchDetails() {
      const userLogin = userFile.login;
      const ghUserUrl = `https://api.github.com/users/${userLogin}`;
      spinner = ora(`Fetching ${ghUserUrl}...`).start();
      const ghDataJson = await fetchJson(authify(ghUserUrl));
      spinner.succeed(`Fetched ${ghUserUrl}`);

      Object.assign(userFile, ghDataJson);

      // Keep the DB small:
      for (const field of ["id", "node_id", "gravatar_id", "followers_url", "following_url",
                           "gists_url", "starred_url", "subscriptions_url", "events_url",
                           "received_events_url", "site_admin", "hireable", "public_repos",
                           "public_gists", "followers", "following", "private_gists",
                           "total_private_repos","owned_private_repos", "disk_usage",
                           "collaborators", "two_factor_authentication", "plan", "url"]) {
        delete userFile[field];
      }

      userFile.write();
    }

    async function fetchContribs() {
      userFile.contribs = userFile.contribs || {
        fetched_at: '2000-01-01T00:00:00.000Z',
        repos: []
      };

      // GitHub users might push today a commit authored for example yesterday, so to be on the safe
      // side we always re-fetch at least the contributions of the last few days before the last
      // time we fetched:
      let since = githubContribs.stringToDate(userFile.contribs.fetched_at);
      for (let i = 0; i < 7; ++i) {
        since = githubContribs.prevDay(since);
      }
      since = githubContribs.dateToString(since);

      const now = new Date;
      const repos = await githubContribs.fetch(userFile.login, since, null, ora);
      for (const repo of repos) {
        if (userFile.contribs.repos.indexOf(repo) === -1) {
          userFile.contribs.repos.push(repo);
        }
      }
      userFile.contribs.fetched_at = now.toISOString();

      userFile.write();
    }

    async function fetchPopularForks() {
      // fetchUserContribs() won't find forks as they are not considered to be contributions. But
      // the user might well have popular forks.

      spinner = ora(`Fetching ${user}'s popular forks...`).start();

      const perPage = 100;
      for (let page = 1; page <= 5; ++page) {
        const ghUrl = `${userFile.repos_url}?page=${page}&per_page=${perPage}`;
        const ghDataJson = await fetchJson(authify(ghUrl));

        for (const repo of ghDataJson) {
          if (repo.fork && repo.stargazers_count >= 1 &&
              userFile.contribs.repos.indexOf(repo.full_name) === -1) {
            userFile.contribs.repos.push(repo.full_name);
          }
        }

        if (ghDataJson.length < perPage) {
          break;
        }
      }

      spinner.succeed(`Fetched ${user}'s popular forks`);
      userFile.write();
    }

    async function fetchJson(url, acceptedErrorCodes=[]) {
      // If the HTTP status code is 2xx, returns the object represented by the fetched json.
      // Else if the HTTP status code is in acceptedErrorCodes, returns it.
      // Else throws the HTTP status code.

      const data = await fetch(url);
      const statusIsOk = Math.floor(data.status / 100) === 2;
      if (!statusIsOk && acceptedErrorCodes.indexOf(data.status) > -1) {
        return data.status;
      }

      try {
        var dataJson = await data.json();
      } catch (e) {}

      if (!statusIsOk) {
        spinner.fail();
        if (dataJson) {
          console.error(dataJson);
        }
        for (const envvar of ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_USERNAME',
                              'GITHUB_PASSWORD']) {
          if (!process.env[envvar]) {
            console.log(`Consider setting the environment variable ${envvar}.`);
            break;
          }
        }
        throw data.status;
      }

      return dataJson;
    }
  }

})();

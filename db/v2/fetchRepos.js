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

  await fetchRepos();
  return;

  async function fetchRepos() {
    let spinner;

    const repos = new DbFile('data/repos.json');

    const users = [];
    for (const file of fs.readdirSync('data/users/')) {
      if (file.endsWith('.json')) {
        const user = new DbFile(`data/users/${file}`);
        if (!user.ghuser_deleted_because) {
          users.push(user);
        }
      }
    };

    let referencedRepos = new Set([]);
    for (const user of users) {
      referencedRepos = new Set([...referencedRepos, ...user.contribs.repos]);
    }

    const now = new Date;
    for (const repo of referencedRepos) {
      if (!repos.repos[repo] || !repos.repos[repo].removed_from_github) {
        await fetchRepo(repo);
        markRepoAsFullyFetched(repo);
      }
    }

    return;

    async function fetchRepo(repo) {
      repos.repos[repo] = repos.repos[repo] || {};

      const ghRepoUrl = `https://api.github.com/repos/${repo}`;
      spinner = ora(`Fetching ${ghRepoUrl}...`).start();

      const maxAgeHours = 6;
      if (repos.repos[repo].fetching_since || repos.repos[repo].fetched_at &&
          now - Date.parse(repos.repos[repo].fetched_at) < maxAgeHours * 60 * 60 * 1000) {
        spinner.succeed(`${repo} is still fresh`);
        return;
      }

      const ghDataJson = await fetchJson(github.authify(ghRepoUrl), [404]);
      if (ghDataJson == 404) {
        repos.repos[repo].removed_from_github = true;
        spinner.succeed(`${repo} was removed from GitHub`);
        repos.write();
        return;
      }
      repos.repos[repo].fetching_since = now.toISOString();;

      spinner.succeed(`Fetched ${ghRepoUrl}`);

      ghDataJson.owner = ghDataJson.owner.login;
      repos.repos[repo] = {...repos.repos[repo], ...ghDataJson};

      // Keep the DB small:
      for (const field of [
        "node_id", "keys_url", "collaborators_url", "teams_url", "hooks_url", "issue_events_url",
        "events_url", "assignees_url", "branches_url", "tags_url", "blobs_url", "git_tags_url",
        "git_refs_url", "trees_url", "statuses_url", "contributors_url", "subscribers_url",
        "subscription_url", "commits_url", "git_commits_url", "comments_url", "issue_comment_url",
        "contents_url", "compare_url", "merges_url", "archive_url", "downloads_url", "issues_url",
        "pulls_url", "milestones_url", "notifications_url", "labels_url", "releases_url",
        "deployments_url", "ssh_url", "git_url", "clone_url", "svn_url", "has_issues",
        "has_projects", "has_downloads", "has_wiki", "has_pages", "id", "forks_url", "permissions",
        "allow_squash_merge", "allow_merge_commit", "allow_rebase_merge", "stargazers_url",
        "watchers_count", "forks_count", "open_issues_count", "forks", "open_issues", "watchers",
        "parent", "source", "network_count", "subscribers_count"]) {
        delete repos.repos[repo][field];
      }

      repos.write();
    }

    function markRepoAsFullyFetched(repo) {
      if (repos.repos[repo].fetching_since) {
        repos.repos[repo].fetched_at = repos.repos[repo].fetching_since;
        delete repos.repos[repo].fetching_since;
        repos.write();
      }
    }
  }

})();

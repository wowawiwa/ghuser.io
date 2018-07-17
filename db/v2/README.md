> Work in progress - [#55](https://github.com/AurelienLourot/ghuser.io/issues/55)

```
[ ./addUser.js myUser ]   [ ./rmUser.js myUser ]
                 │             │
                 v             v
              ┌───────────────────┐
              │ users/myuser.json │<───────────┐
              └────────────────┬──┘ │─┐        │
                └──────────────│────┘ │        │                    ╔════════╗
                  └────┬───────│──────┘        │                    ║ GitHub ║
                       │       │               │                    ╚════╤═══╝
                       │       v               │                         │
                       │   [ ./fetchUserDetailsAndContribs.js myUser ]<──┤
                       │                                                 │
                       ├──────────────────>[ ./fetchOrgs.js ]<───────────┤
                       │                            │                    │
                       │                            v                    │
                       │                      ┌───────────┐              │
                       │                      │ orgs.json │              │
                       │                      └─────┬─────┘              │
                       │                            │                    │
                       ├──>[ ./fetchRepos.js ]<──────────────────────────┘
                       │         │                  │
                       │         v        ┌─────────┘
                       │  ┌────────────┐  │
                       │  │ repos.json │  │
                       │  └──────┬─────┘  │
                       │         │        │
                       v         v        v
                   [ ./calculateContribs.js ]
                                 │
                                 v
                      ┌──────────────────────┐
                      │ contribs/myuser.json │─┐
                      └──────────────────────┘ │─┐
                        └──────────────────────┘ │
                          └──────────────────────┘
```

* `fetchRepos.js`
  * `fetchRepo()`
  * `stripUnreferencedRepos()`
  * `stripUnsuccessfulOrEmptyRepos()`
  * `fetchRepoContributors()`
  * `fetchRepoLanguages()`
  * `fetchRepoSettings()`
  * `markRepoAsFullyFetched()`
* `calculateContribs.js`
  * strip deleted users
  * `calculateUserContribsScores()`
  * `fetchUserContribsOrgs()`
* `fetchOrgs.js`
  * `fetchUserOrgs()`
  * `stripUnreferencedOrgs()`
  * `fetchUserContribsOrgs()`
* get rid of:
  * `stripInsignificantUserContribs()`

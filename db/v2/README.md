> Work in progress - [#55](https://github.com/AurelienLourot/ghuser.io/issues/55)

```
[ ./addUser.js myUser ]   [ ./rmUser.js myUser ]
                 │             │
                 v             v
              ┌───────────────────┐
              │ users/myUser.json │<───────────┐
              └────────────────┬──┘ │─┐        │
                └──────────────│────┘ │        │                    ╔════════╗
                  └────┬───────│──────┘        │                    ║ GitHub ║
                       │       │               │                    ╚════╤═══╝
      ┌──────┬─────────┤       v               │                         │
      │      │         │   [ ./fetchUserDetailsAndContribs.js myUser ]<──┤
      │      │         v                                                 │
      │      │     [ ./fetchRepos.js ]<──────────────────────────────────┤
      │      │         │                                                 │
      │      │         v                                                 │
      │      │   ┌────────────┐                                          │
      │      │   │ repos.json │<─────────────────────────────────────────┤
      │      │   └─────┬──────┘                                          │
      │      │         │                                                 │
      │      v         v                                                 │
      │  [ ./calculateScores.js ]                                        │
      │             │                                                    │
      │             v                                                    │
      │   ┌────────────────────┐                                         │
      │   │ scores/myUser.json │─┐                                       │
      │   └────────────────────┘ │─┐                                     │
      │     └────────────────────┘ │                                     │
      │       └────────────────────┘                                     │
      │                                                                  │
      └─────────────────────>[ ./fetchOrgs.js ]<─────────────────────────┘
                                     │
                                     v
                               ┌───────────┐
                               │ orgs.json │
                               └───────────┘
```

* `fetchUserDetailsAndContribs.js`
  * `fetchUser()`
  * `fetchUserContribs()`
  * `fetchUserPopularForks()`
* `fetchRepos.js`
  * `fetchRepo()`
  * `stripUnreferencedRepos()`
  * `stripUnsuccessfulOrEmptyRepos()`
  * `fetchRepoContributors()`
  * `fetchRepoLanguages()`
  * `fetchRepoSettings()`
  * `markRepoAsFullyFetched()`
* `calculateScores.js`
  * `calculateUserContribsScores()`
* `fetchOrgs.js`
  * `fetchUserOrgs()`
  * `stripUnreferencedOrgs()`
  * `fetchUserContribsOrgs()`
* get rid of:
  * `stripInsignificantUserContribs()`

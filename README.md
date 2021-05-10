<h1 align="center">bans.payload.tf</h1>

<p align="center">The unofficial robust API for RGL</p>

# Description

This serves as the unofficial API for RGL, serving routes for getting a user's profile, ban history, or getting the most recent bans.

The idea behind this project is to give developers a way to interact with the RGL page through an API, since one is not supported. We hope that providing a more open API will give better toolings to developers to create great projects.

This is by far the most efficient, feature-rich and stable API for RGL. Releases will focus on bringing faster response times, easier and more specific routes, as well as improved stability and availability. Our goal is to build a robust API that is highly available, scalable, and efficient in time and memory.

# Gateways

We also serve WebSocket gateways using **socket.io**. These gateways are meant to be used instead of making requests to endpoints on an interval, hopefully making it easier for a developer to know when an event has happened.

Gateways will always have a namespace, and the URL would be `wss://{url}/{namespace}`. Controllers may have a gateway, and those gateways may have several namespaces. Below are listed the controllers and namespaces with their descriptions and return values.

Current active namespaces:

- `/bans`
  - Gateway for real-time ban notifications

Each event will be under its own heading with complete details on return values and optional configuration.

## Bans namespace

**Note**: Connecting to the `/bans` namespace will automatically subscribe to the gateway for ban notifications, no need to send an initial payload.

### Recieve: `bans`

Will respond with all bans in the current scraping period. You will be guarenteed there is at least 1 in the array.

```js
[
    {
        "banId": String,
        "steamId": String,
        "name": String,
        "link": String,
        "expiresAt": Date,
        "teamDetails": null | {
            "div": String,
            "name": String,
            "id": String,
            "link": String
        },
        "reason": String
    }
],
```

# API (v1)

`v1` is a pilot of this API, which will test out how people use this API and bugs that may occur. Expect changes, bugs, and features to be added.

All routes are currently prefixed with `/api/v1/`. You will need to include this or else your request will fail. Also, any relavent data will be returned in the `data` field. An example a response would look like:

```js
{
  "data": {
      // Response data here
  },
  "time": "516 ms"
}
```

The `time` field is the amount of the the server took to respond to your request, useful for debugging or seeing if you're hitting a cache or fresh data. Request's SteamID can be in **any** format and all returned `steamId` fields will be `SteamID64`.

Custom errors will be responded in this format, following other errors. Note that if a profile is not found, we throw a 404. This is to ensure that you can handle unfound profiles better.
Example:

```js
{
    "statusCode": 404,
    "message": "Error message",
    "error": "Error"
}
```

## Bans API

### GET `/bans/latest`

**Query fields:**
| Name | Type | Description |
|--|--|--|
| limit | number | Limit amount of returned bans |
<br />

```js
{
    "data": {
        "bans": [
            "banId": String,
            "steamId": String,
            "name": String,
            "link": String,
            "expiresAt": Date,
            "teamDetails": null | {
                "div": String,
                "name": String,
                "id": String,
                "link": String
            },
            "reason": String
        ],
        "nextScheduled": Date,
        "lastScheduled": Date,
    },
    "time": "0 ms"
}
```

**Note**: Bans will always return an `Array` if the limit is **greater than 1**, otherwise, it will return an `Object`.

<br />

## Profile API

All requests to the Profile API will be cached for **7 days**. Subsequent requests will not refresh that timer. This is to ensure common profiles can be cached and served faster. Average request times vary between 200-400 milliseconds cached and 3-5 seconds uncached. Bulk profiles will be cached for **3 days**, subject to change.

### GET `/profiles/:steamid`

**Query fields:**
| Name | Type | Description |
|--|--|--|
| formats | <a href="#enums">enum</a> | String or comma-separated string of the formats (sixes, highlander, ect) |
| onlyActive | boolean | Only return "active" teams, which the user is currently playing or has not left |
<br/>

```js
{
    "data": {
        "steamId": String,
        "avatar": String,
        "name": String,
        "link": String,
        "status": {
            "banned": Boolean,
            "probation": Boolean,
            "verified": Boolean
        },
        "totalEarnings": Number,
        "trophies": {
            "gold": Number,
            "silver": Number,
            "bronze": Number
        },
        "experience": [{
            "category": String,
            "format": String,
            "season": String,
            "div": String,
            "team": String,
            "endRank": String,
            "recordWith": Date,
            "recordWithout": null | Date,
            "amountWon": Number,
            "joined": Date,
            "left": null | Date,
            "isCurrentTeam": Boolean,
        }],
    },
    "time": "0 ms"
}
```

<br />

### GET `/profiles/:steamid/bans`

**Query fields:**
| Name | Type | Description |
|--|--|--|
| details | boolean | Details of the current ban the user has |
| previous | boolean | Array of details of all past bans the user had |

```js
{
    "data": {
        "steamId": String,
        "banned": Boolean,
        "probation": Boolean,
        "verified": Boolean,

        // Present on "details" query, only presented when a user is currently banned
        "details": {
            "reason": String,
            "date": Date,
            "expires": Date,
            "isCurrentBan": Boolean
        },

        // Present on "previous" query, has all bans including current ban.
        "previous": [{
            "reason": String,
            "date": Date,
            "expires": Date,
            "isCurrentBan": Boolean
        }],
    },
    "time": "0 ms"
}
```

<br />

### GET `/profiles/:steamid/experience`

**Query fields:**
| Name | Type | Description |
|--|--|--|
| details | boolean | Details of the current ban the user has |
| previous | boolean | Array of details of all past bans the user had |

**Note**: This is just a slimmer version of the index route, useful for when working with known profiles and only need relavent experience. Returns empty array if user has no experience.

```js
{
    "data": {
        "steamId": String,
        "name": String,
        "experience": [{
            "category": String,
            "format": String,
            "season": String,
            "div": String,
            "team": String,
            "endRank": String,
            "recordWith": Date,
            "recordWithout": null | Date,
            "amountWon": Number,
            "joined": Date,
            "left": null | Date,
            "isCurrentTeam": Boolean,
        }],
    },
    "time": "0 ms"
}
```

<br />

### POST `/profiles/:steamid/bulk`

**Body fields:**
| Name | Type | Description |
|--|--|--|
| profiles | array | Array of SteamIds (any format) to parse |
| formats? | <a href="#enums">enum</a> | String or comma-separated string of the formats (sixes, highlander, ect) |
| onlyActive? | boolean | Only return "active" teams, which the user is currently playing or has not left |
| slim? | boolean | Return 'slimmed' response, see <a href="#get-profilessteamidexperience">example response</a> |

```js
{
    "data": {
        {
            "steamId": String,
            "avatar": String,
            "name": String,
            "link": String,
            "status": {
                "banned": Boolean,
                "probation": Boolean,
                "verified": Boolean
            },
            "totalEarnings": Number,
            "trophies": {
                "gold": Number,
                "silver": Number,
                "bronze": Number
            },
            "experience": [{
                "category": String,
                "format": String,
                "season": String,
                "div": String,
                "team": String,
                "endRank": String,
                "recordWith": Date,
                "recordWithout": null | Date,
                "amountWon": Number,
                "joined": Date,
                "left": null | Date,
                "isCurrentTeam": Boolean,
            }],
        }
    },
    "time": "0 ms"
}
```

<br />

# Enums

| Name   | Values                                   |
| ------ | ---------------------------------------- |
| formats | `sixes, highlander, prolander, nr6s, nr` |

# Issues, Questions

Any issues or questions should be posted on GitHub issues, where they can be more easily tracked. Feature requests are welcome!

# Support this Project

You may back me on my [Patreon](https://www.patreon.com/c43721). Direct sponsorship of this project can be discussed on Discord (24#7644) or by another medium.

# Contributing

Before contributing, please make sure no one else has stated against your proposal. Otherwise, make a Pull Request detailing your proposal and any relevant code changes. If you are committing code, try to create test cases, as going foward we'd like to have stable tests.

# License

This project is [MIT licensed](LICENSE).

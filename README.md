<p align="center">bans.payload.tf</p>
<p align="center">The unofficial API for RGL.gg</p>

## Description

This serves as the unofficial API for RGL, serving routes for getting a user's profile, ban history, or getting the most recent bans.

The idea behind this project is to give developers a way to interact with the RGL page through an API, since one is not supported. We hope that providing a more open API will give better toolings to developers to create great projects.

## API (v1)

`v1` is a pilot of this API, which will test out how people use this API and bugs that may occur. Expect changes, bugs, and features to be added.

All routes are currently prefixed with `/api/v1/`. You will need to include this or else your request will fail. Also, requests will be cached for 1 day, so after the first request, the next requests will be served via the cache.

All relavent data will be posted in the `data` field. An example a response would look like:

```json
{
  "data": [],
  "time": "516 ms"
}
```

The `time` field is the amount of the the server took to respond to your request, useful for debugging or seeing if you're hitting a cache or fresh data. Request's SteamID can be in **any** format and all returned `steamId` fields will be `SteamID64`.

### Bans API

### `GET /bans/latest`

**Query fields:**
| Name | Type | Description |
|--|--|--|
| limit | number | Limit amount of returned bans |

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

### Profile API

### `GET /profiles/:steamid`

**Query fields:**
| Name | Type | Description |
|--|--|--|
| formats | <a href="#enums">enum</a> | String or comma-separated string of the formats (sixes, highlander, ect) |
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

### `GET /profiles/:steamid/bans`

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

## Enums

|Name| Values |
|--|--|
| format | `sixes, highlander, prolander, nr6s, nr` |


## Issues, Questions

Any issues or questions should be posted on GitHub issues, where they can be more easily tracked. Feature requests are welcome!

## Support this Project

You may back me on my [Patreon](https://www.patreon.com/c43721). Direct sponsorship of this project can be discussed on Discord (24#7644) or by another medium.

## License

This project is [MIT licensed](LICENSE).

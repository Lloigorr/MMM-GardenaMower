# MMM-GardenaMower

A MagicMirror² module to display the current status of a GARDENA smart mower using the official GARDENA smart system API from Husqvarna Group.

The module uses OAuth2 with client credentials, reads the configured GARDENA smart system location, detects the mower automatically, and displays key mower data directly in MagicMirror.

##  Functions

- Authentication via OAuth2 using `client_id` and `client_secret`
- Automatic token renewal before expiry
- Automatic lookup of the first compatible mower in your GARDENA smart system
- Display of:
  - Mower name
  - Current activity
  - Current state
  - Battery charge level
  - Operating hours
  - RF link state
  - RF link level
  - Error code or translated error text (if available)
- Simple configuration via `config.js`

##  API

This module uses the official GARDENA smart system API via the Husqvarna Group developer platform.

Used endpoints:

- OAuth2 token endpoint
- `GET /v1/locations`
- `GET /v1/locations/{locationId}`

The module reads mower data from the `MOWER` and `COMMON` services returned in the location response.

##  Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Lloigorr/MMM-GardenaMower.git
cd MMM-GardenaMower
npm install
```

## Get API 

• Log in to your Husqvarna Group account as shown [here](https://developer.husqvarnagroup.cloud/docs/get-started#1log-in-with-your-husqvarna-group-account-same-as-husqvarna-automower-connect-and-gardena-smart-system-credentials)

• Hit "New Application"

• Get your Application key and Application secret

##  Configuration

Add this to your  config.js :

```js
    {
      module: "MMM-GardenaMower",
      position: "middle_center",
      config: {
          client_id: "Your Client ID form https://developer.husqvarnagroup.cloud/",
          client_secret: "Your client secret from https://developer.husqvarnagroup.cloud/",
          updateInterval: 15 * 60 * 1000, // 15 minutes recommended
          showBattery: true,
          showActivity: true,
          showTime: true,
          showConnection: true,
          showError_as_Text: true
      }
    },
```

##  Rate limit recommendation

Do not poll too often.
A long update interval is strongly recommended. A value of 15 minutes is a good starting point for stable operation and helps avoid unnecessary API usage.

### Displayed data

The module currently uses the following values from the API:
| Value             | Source 
|-------------------|--------------------------------------------------------
| `Name`            | `COMMON.attributes.name.value` 
| `Battery level`   | `COMMON.attributes.batteryLevel.value` 
| `Battery state`   | `COMMON.attributes.batteryState.value` 
| `RF link state`   | `COMMON.attributes.rfLinkState.value` 
| `RF link level`   | `COMMON.attributes.rfLinkLevel.value` 
| `Mower state`     | `MOWER.attributes.state.value` 
| `Activity`        | `MOWER.attributes.activity.value` 
| `Operating hours` | `MOWER.attributes.operatingHours.value` 
| `Error code`      | `MOWER.attributes.lastErrorCode.value`  (if available)

### Options

The following flags can be set to  true  or  false :
| Option              | Description
|---------------------|--------------------------------------------------
| `showBattery`       | Displays the current battery level
| `showActivity`      | Displays the current mower activity
| `showTime`          | Displays total operating hours
| `showConnection`    | Displays RF connection state and link quality
| `showError_as_Text` | Displays the error as text instead of only the numeric error code

 ## Notes
 
•  This module is adapted for GARDENA smart mowers, not Husqvarna Automower Connect.

•  The module currently expects mower data from the  MOWER  and  COMMON  services in the GARDENA location response.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

 ##  Origin
 
Original project based on [MMM-HusqvarnaAutomower](https://github.com/ASteinsdoerfer/MMM-HusqvarnaAutomower)  by [ASteinsdoerfer](https://github.com/ASteinsdoerfer)
    
Big THANK YOU for your ground work and idea!
    
Adapted for GARDENA smart system API.

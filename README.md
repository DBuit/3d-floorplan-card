[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

# 3D floorplan card


<a href="https://www.buymeacoffee.com/ZrUK14i" target="_blank"><img height="41px" width="167px" src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee"></a>

## Installation instructions

**HACS installation:**
Go to the hacs store and use the repo url `https://github.com/DBuit/screensaver-card` and add this as a custom repository under settings.

Add the following to your ui-lovelace.yaml:
```yaml
resources:
  url: /hacsfiles/3d-floorplan-card/3d-floorplan-card.js
  type: module
```

**Manual installation:**
Copy the .js file from the dist directory to your www directory and add the following to your ui-lovelace.yaml file:

```yaml
resources:
  url: /local/3d-floorplan-card.js
  type: module
```

## Configuration

The YAML configuration happens at the root of your Lovelace config under sidebar: at the same level as resources: and views:. Example:

```
resources:
  - url: /local/3d-floorplan-card.js?v=0.0.1
    type: module   
screensaver:
views:
....
```

### Main Options

Under sidebar you can configur the following options

| Name | Type | Default | Supported options | Description |
| -------------- | ----------- | ------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `digitalClock` | boolean | optional | `true` | Show digital clock in sidebar |

### Full example

```

```


### Screenshots


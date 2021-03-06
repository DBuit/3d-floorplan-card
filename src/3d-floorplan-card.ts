import { LitElement, html, css } from 'lit-element';
import { moreInfo } from "card-tools/src/more-info";
import { bindActionHandler } from "card-tools/src/action";
import {
  computeStateDisplay,
  computeDomain,
  domainIcon,
  toggleEntity,
  navigate,
  forwardHaptic
} from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { actionHandler } from './action-handler-directive';

class ThreeDFloorplan extends LitElement {
  config: any;
  hass: any;
  shadowRoot: any;

  static get properties() {
    return {
      hass: {},
      config: {},
      active: {}
    };
  }
  
  constructor() {
    super();
  }
  
  render() {
    let buttonStyles: any[] = [];
    if("buttonStyles" in this.config) {
      for(let buttonStyle of this.config.buttonStyles) {
        buttonStyles[buttonStyle.name] = buttonStyle.style;
      }
    }
    return html`
    <div class="wrapper ${"position" in this.config ? this.config.position : "horizontal"}">
      ${this.config.floorplans.map(floorplan => {
        return html`
          <div class="base">
            <img src="${floorplan.baseImage}" />
            
            ${"buttons" in floorplan ? html`
            ${floorplan.overlays.map(overlay => {
              var offStates = ['off', 'unavailable'];
              if(overlay.offStates) {
                offStates = overlay.offStates;
              }
              const stateObj = this.hass.states[overlay.entity];
              let conditionStyle = "";
              if("conditionStyle" in overlay) {
                conditionStyle = this._getTemplate(undefined, overlay.conditionStyle);
              }
              if(overlay.type == 'state') {
                return html`
                  <div class="overlay ${offStates.includes(stateObj.state) ? '': 'on'}" id="toggle" style="${conditionStyle != "" ? conditionStyle : ''}">
                    <img src="${overlay.image}" />
                  </div>
                `;
              } else if(overlay.type == 'conditional') {
                let image = this._getTemplate(undefined, overlay.condition);
                return html`
                  <div class="overlay on" id="toggle" style="${conditionStyle != "" ? conditionStyle : ''}">
                    <img src="${image}" />
                  </div>
                `;
                return html``;
              } else {
                return html``;
              }            
            })}` : html ``}  

            <div class="buttons">
              
            ${"buttons" in floorplan ? html`
            ${floorplan.buttons.map(button => {
              const stateObj = this.hass.states[button.entity];
              var style = "";
              if("style" in button && buttonStyles[button.style] ) {
                Object.keys(buttonStyles[button.style]).forEach((prop) => {
                  style += prop+":"+buttonStyles[button.style][prop]+";";
                });
              }
              if("position" in button) {
                Object.keys(button.position).forEach((prop) => {
                  style += prop+":"+button.position[prop]+";";
                });
              }
              var offStates = ['off', 'unavailable'];
              if(button.offStates) {
                offStates = button.offStates;
              }

              var label = ""
              if("label" in button) {
                label = this._getTemplate(undefined, button.label);
              }

              return html`
                <div
                  class="button clickable"
                  style="${style}"
                  @action=${(ev) => this._handleAction(ev, button)}
                  .actionHandler=${actionHandler({
                    hasHold: true,
                    hasDoubleTap: true,
                  })}
                >
                  <ha-icon data-state="${offStates.includes(stateObj.state) ? 'off': 'on'}" icon="${button.offIcon ? offStates.includes(stateObj.state) ? button.offIcon : button.icon : button.icon || stateObj.attributes.icon || domainIcon(computeDomain(stateObj.entity_id), stateObj.state)}"></ha-icon>
                  ${label != "" ? html`
                    <span class="label">${label}</span>
                  ` : html``}
                </div>
              `;
            })}` : html ``}
            
            </div>
          </div>
        `
      })}
    </div>
    `;
  }

  _handleAction(ev, button): void {
    if (ev.detail.action && ev.detail.action == "tap" && button.tap_action) {
      this._customAction(button.tap_action, button);
    } else if(ev.detail.action && ev.detail.action == "hold" && button.hold_action) {
      this._customAction(button.hold_action, button);
    }
  }
  
  firstUpdated() { }

  _evalTemplate(state: HassEntity | undefined, func: any): any {
    try {
      return new Function('states', 'entity', 'user', 'hass', 'variables', 'html', `'use strict'; ${func}`).call(
        this,
        this.hass!.states,
        state,
        this.hass!.user,
        this.hass,
        html,
      );
    } catch (e) {
      const funcTrimmed = func.length <= 100 ? func.trim() : `${func.trim().substring(0, 98)}...`;
      e.message = `${e.name}: ${e.message} in '${funcTrimmed}'`;
      e.name = '3DFloorplanCardJSTemplateError';
      throw e;
    }
  }

  _getTemplate(state: HassEntity | undefined, value: any | undefined): any | undefined {
    const trimmed = value.trim();
    if (trimmed.substring(0, 3) === '[[[' && trimmed.slice(-3) === ']]]') {
      return this._evalTemplate(state, trimmed.slice(3, -3));
    }
  }

  async _createPopup(entity_id, button) {
    if(button.popup) {
      var popUpCard = Object.assign({}, button.popup, { entity: entity_id });
      var popUpStyle = {
        '$': ".mdc-dialog .mdc-dialog__container { width: 100%; } .mdc-dialog .mdc-dialog__container .mdc-dialog__surface { width:100%; box-shadow:none; }",
        '.': ":host { --mdc-theme-surface: rgba(0,0,0,0); --secondary-background-color: rgba(0,0,0,0); --ha-card-background: rgba(0,0,0,0); --mdc-dialog-scrim-color: rgba(0,0,0,0.8); --mdc-dialog-min-height: 100%; --mdc-dialog-min-width: 100%; --mdc-dialog-max-width: 100%; } mwc-icon-button { color: #FFF; }"
      }
      var service_data = {
        title: " ",
        style: popUpStyle,
        card: popUpCard,
        deviceID: ['this']
      }
      await this.hass.callService("browser_mod", "popup", service_data);
    } else {
      moreInfo(entity_id)
    }
  }

  _customAction(action, button) {
    switch (action.action) {
      case "popup":
        this._createPopup((action.entity || button.entity), button);
        break;
      case "more-info":
        if (action.entity || button.entity || action.camera_image) {
          moreInfo(action.entity ? action.entity : action.camera_image ? action.camera_image : button.entity);
        }
        break;
      case "navigate":
        if (action.navigation_path) {
          navigate(window, action.navigation_path);
        }
        break;
      case "url":
        if (action.url_path) {
          window.open(action.url_path);
        }
        break;
      case "toggle":
        if (action.entity || button.entity) {
          toggleEntity(this.hass, action.entity || button.entity);
        }
        break;
      case "call-service": {
        const [domain, service] = action.service.split(".", 2);
        this.hass.callService(domain, service, action.service_data);
      }
    }
  }

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 1;
  }
  
  static get styles() {
    return css`
        :host {
          height: calc(100vh - 50px);
        }

        .wrapper {
          display:flex;
          position:relative;
        }
        .wrapper.horizontal {
          flex-direction: row;
        }
        .wrapper.horizontal .base {
          max-width: 50%;
        }
        .wrapper.vertical {
          flex-direction: column;
        }
        .wrapper.vertical .base {
          max-height: 50%;
        }
        .wrapper .base {
          position:relative;
          display:inline-block;
        }
        .wrapper .base img {
          max-height:100%;
          max-width:100%;
        }
        .wrapper .base .overlay {
          position:absolute;
          top:0;
          left:0;
          mix-blend-mode: lighten;
          opacity:0;
        }
        .wrapper .base .overlay.on {
          opacity:1;
        }
        .wrapper .base .overlay img {
          max-height:100%;
          max-width:100%;
        }
        
        .wrapper .base .buttons {
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:100%;
        }
        
        .wrapper .base .buttons .button {
            position:absolute;
            cursor: pointer;
            display:flex;
            flex-direction:column;
            justify-content: center;
            align-items: center;
        }

        ha-icon[data-state="on"] {
          color: var(--paper-item-icon-active-color, #f7d959);
        }
    `;
  }  
  
}

customElements.define('threed-floorplan-card', ThreeDFloorplan);
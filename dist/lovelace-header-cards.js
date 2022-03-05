(()=>{"use strict";function e(e){if(e=(e=e&&e.shadowRoot)&&e.querySelector("hui-root")){var t=e.lovelace;return t.current_view=e.___curView,t}}const t="custom:";class a{constructor(){var t,a;this.addCardsToHeader(e(this.panel)),this.entityWatch(),t=this.main,a=t=>{window.HeaderCards.addCardsToHeader(e(t)),this.toolbar&&!this.toolbarObserver&&this.setupToolbarObserver(),this.panel&&!this.panelObserver&&this.setupPanelObserver()},new MutationObserver((function(e){e.forEach((({addedNodes:e})=>{for(let t of e)"ha-panel-lovelace"==t.localName&&setTimeout((()=>{a(t)}),100)}))})).observe(t.shadowRoot.querySelector("partial-panel-resolver"),{childList:!0}),this.header&&this.setupToolbarObserver(),this.panel&&this.setupPanelObserver()}setupToolbarObserver(){var t,a;this.toolbarObserver=(t=this.header,a=()=>{window.HeaderCards.addCardsToHeader(e(this.panel))},new MutationObserver((function(e){e.forEach((({addedNodes:e})=>{for(let t of e)"app-toolbar"==t.localName&&"edit-mode"!=t.className&&setTimeout((()=>{a()}),100)}))})).observe(t,{childList:!0}))}setupPanelObserver(){var e,t;this.panelObserver=(e=this.panel,t=()=>{this.setupToolbarObserver()},new MutationObserver((function(e){e.forEach((({addedNodes:e})=>{for(let a of e)"hui-root"==a.localName&&setTimeout((()=>{t()}),100)}))})).observe(e.shadowRoot,{childList:!0}))}get main(){let e=document.querySelector("home-assistant");return e=e&&e.shadowRoot,e=e&&e.querySelector("home-assistant-main"),e}get panel(){let e=this.main&&this.main.shadowRoot;return e=e&&e.querySelector("app-drawer-layout partial-panel-resolver"),e=e&&e.shadowRoot||e,e=e&&e.querySelector("ha-panel-lovelace"),e}get header(){let e=this.main&&this.main.shadowRoot;return e=e&&e.querySelector("ha-panel-lovelace"),e=e&&e.shadowRoot,e=e&&e.querySelector("hui-root"),e=e&&e.shadowRoot,e=e&&e.querySelector("app-header"),e}get toolbar(){return this.header&&this.header.querySelector("app-toolbar")}get hass(){return this.main&&this.main.hass}insertAfter(e,t){t.parentNode.insertBefore(e,t.nextSibling)}async entityWatch(){(await window.hassConnection).conn.subscribeMessage((e=>this.entityWatchCallback(e)),{type:"subscribe_events",event_type:"state_changed"})}entityWatchCallback(e){if("state_changed"==e.event_type){let t=e.data.old_state&&e.data.old_state.state;(e.data.new_state&&e.data.new_state.state)!=t&&this.applyHass()}}addCard(e,t){e.type;let a=this.createCardElement(e);a.style.display="inline-block",a.hass=this.hass,t.appendChild(a)}addCardWhenDefined(e,a){let s=e.type;s.startsWith(t)?(s=s.substr(t.length),customElements.whenDefined(s).then((()=>{this.addCard(e,a)}))):this.addCard(e,a)}addBadge(e,t){let a=this.createBadgeElement(e);return a.hass=this.hass,a.style.setProperty("--ha-label-badge-size","2em"),a.style.setProperty("--ha-label-badge-title-font-size","0.6em"),a.style.setProperty("--ha-label-badge-font-size","0.9em"),t.appendChild(a),a}applyHass(){if(this.hass&&this.toolbar){let e=this.toolbar.querySelector("#headerCards"),t=this.toolbar.querySelector("#headerBadges");e&&[...e.children].forEach((e=>{e.hass=this.hass})),t&&[...t.children].forEach((e=>{e.hass=this.hass}))}}addCardsToHeader(e){window.loadCardHelpers().then((({createCardElement:t,createBadgeElement:a})=>{this.createCardElement=t,this.createBadgeElement=a;let s=e&&e.config;s=e.config||{};let r=s.header_cards||{},o=r.cards||[],i=r.badges||[],l=this.toolbar&&this.toolbar.querySelector("ha-tabs"),h=this.toolbar.querySelector("#headerCards");h&&h.remove();let n=this.toolbar.querySelector("#headerBadges");if(n&&n.remove(),o.length>0||i.length>0){if(o.length>0){let e=document.createElement("div");e.id="headerCards",e.style.width="auto",e.style.minWidth="max-content",e.style.fontFamily="var(--paper-font-body1_-_font-family)",e.style["-webkit-font-smoothing"]="var(--paper-font-body1_-_-webkit-font-smoothing)",e.style.fontSize="var(--paper-font-body1_-_font-size)",e.style.fontWeight="var(--paper-font-body1_-_font-weight)",e.style.lineHeight="var(--paper-font-body1_-_line-height)",o.forEach((t=>{this.addCardWhenDefined(t,e)})),e.style.marginRight="auto",this.insertAfter(e,l)}if(i.length>0){let e=document.createElement("div");e.id="headerBadges",e.style.width="auto",e.style.minWidth="max-content",i.forEach((t=>{this.addBadge(t,e)})),0==o.length&&(e.style.marginRight="auto"),this.insertAfter(e,l)}}}))}}Promise.resolve(customElements.whenDefined("hui-view")).then((()=>{window.HeaderCards=new a}))})();
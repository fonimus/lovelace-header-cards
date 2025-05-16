import * as pjson from '../package.json';

function getLovelace(root) {
    root = root && root.shadowRoot;
    root = root && root.querySelector("hui-root")
    if (root) {
        const ll = root.lovelace;
        ll.current_view = root.___curView;
        return ll;
    }
}

function dashboardObserver(main, callback): MutationObserver {
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(({addedNodes}) => {
            for (const node of addedNodes) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (node.localName === "ha-panel-lovelace") {
                    setTimeout(() => {
                        callback(node);
                    }, 100);
                }
            }
        });
    });
    observer.observe(main.shadowRoot.querySelector("partial-panel-resolver"), {
        childList: true,
    });
    return observer;
}

function toolbarObserver(header, callback): MutationObserver {
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(({addedNodes}) => {
            for (const node of addedNodes) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (node.localName === "app-toolbar" && node.className !== "edit-mode") {
                    setTimeout(() => {
                        callback();
                    }, 100);
                }
            }
        });
    });
    observer.observe(header, {
        childList: true,
    });
    return observer;
}

function panelObserver(panel, callback): MutationObserver {
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(({addedNodes}) => {
            for (const node of addedNodes) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (node.localName === "hui-root") {
                    setTimeout(() => {
                        callback();
                    }, 100);
                }
            }
        });
    });
    observer.observe(panel.shadowRoot, {
        childList: true,
    })
    return observer;
}

const CUSTOM_TYPE_PREFIX = "custom:";

class HeaderCards {

    private toolbarObserver?: MutationObserver;
    private panelObserver?: MutationObserver;
    private createBadgeElement: any
    private createCardElement: any

    constructor() {
        this.addCardsToHeader(getLovelace(this.panel));
        void this.entityWatch();

        dashboardObserver(this.main, (node) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.headerCards.addCardsToHeader(getLovelace(node));

            if (this.toolbar && !this.toolbarObserver) {
                this.setupToolbarObserver();
            }

            if (this.panel && !this.panelObserver) {
                this.setupPanelObserver();
            }
        });

        if (this.header) {
            this.setupToolbarObserver();
        }

        if (this.panel) {
            this.setupPanelObserver();
        }
    }

    setupToolbarObserver() {
        this.toolbarObserver = toolbarObserver(this.header, () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.headerCards.addCardsToHeader(getLovelace(this.panel));
        });
    }

    setupPanelObserver() {
        this.panelObserver = panelObserver(this.panel, () => {
            this.setupToolbarObserver();
        });
    }

    get main(): Element | null {
        let main: Element | ShadowRoot | null = document.querySelector("home-assistant");
        main = main && main.shadowRoot;
        main = main && main.querySelector("home-assistant-main");
        return main;
    }

    get panel(): Element | null {
        let root: Element | ShadowRoot | null = this.main && this.main.shadowRoot;
        root = root && root.querySelector("ha-drawer partial-panel-resolver");
        root = root && root.shadowRoot || root;
        root = root && root.querySelector("ha-panel-lovelace");
        return root;
    }

    get header(): Element | null {
        let header: Element | ShadowRoot | null = this.panel;
        header = header && header.shadowRoot;
        header = header && header.querySelector("hui-root");
        header = header && header.shadowRoot;
        header = header && header.querySelector("div.header");
        return header;
    }

    get toolbar(): Element | null {
        return this.header && this.header.querySelector("div.toolbar");
    }

    get hass() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.main && this.main.hass;
    }

    // Run on entity change.
    async entityWatch() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (await window.hassConnection).conn.subscribeMessage((e) => {
            this.entityWatchCallback(e);
            if (e.data.entity_id.startsWith("input")) {
                this.addCardsToHeader(getLovelace(this.panel));
            }
        }, {
            type: "subscribe_events",
            event_type: "state_changed",
        });
    }

    entityWatchCallback(event) {
        if (event.event_type === "state_changed") {
            const old_state = event.data.old_state && event.data.old_state.state;
            const new_state = event.data.new_state && event.data.new_state.state;
            if (new_state !== old_state) {
                this.applyHass();
            }
        }
    }

    addCard(cardConfig, element) {
        const card = this.createCardElement(cardConfig);
        card.classList.add("header-card");
        card.style.display = "inline-block";
        card.hass = this.hass;
        element.appendChild(card);
    }

    addCardWhenDefined(cardConfig, element) {
        let tag = cardConfig.type;
        if (tag.startsWith(CUSTOM_TYPE_PREFIX)) {
            tag = tag.substring(CUSTOM_TYPE_PREFIX.length);
            customElements.whenDefined(tag).then(() => {
                this.addCard(cardConfig, element);
            });
        } else {
            this.addCard(cardConfig, element);
        }
    }

    addBadge(badgeConfig, element) {
        let visible = true;
        if (badgeConfig.visibility) {
            for (const visibility of badgeConfig.visibility) {
                visible = visible && this.checkStateCondition(visibility, this.hass);
            }
        }
        if (!visible) {
            return;
        }
        const badge = this.createBadgeElement(badgeConfig);
        badge.classList.add("header-badge");
        badge.hass = this.hass;
        badge.style.setProperty("--ha-label-badge-size", "2em");
        badge.style.setProperty("--ha-label-badge-title-font-size", "0.6em");
        badge.style.setProperty("--ha-label-badge-font-size", "0.9em");
        element.appendChild(badge);
        return badge;
    }

    checkStateCondition(
        condition,
        hass
    ) {
        const state =
            condition.entity && hass.states[condition.entity]
                ? hass.states[condition.entity].state
                : "unknown";
        let value = condition.state ?? condition.state_not;

        // Handle entity_id, UI should be updated for conditional card (filters does not have UI for now)
        if (Array.isArray(value)) {
            const entityValues = value
                .map((v) => this.getValueFromEntityId(hass, v))
                .filter((v) => v !== undefined
                )
            ;
            value = [...value, ...entityValues];
        } else if (typeof value === "string") {
            const entityValue = this.getValueFromEntityId(hass, value);
            value = [value];
            if (entityValue) {
                value.push(entityValue);
            }
        }

        return condition.state != null
            ? value.includes(state)
            : !value.includes(state);
    }

    getValueFromEntityId(
        hass,
        value
    ) {
        if (this.isValidEntityId(value) && hass.states[value]) {
            return hass.states[value]?.state;
        }
        return undefined;
    }

    isValidEntityId(entityId) {
        return /^(\w+)\.(\w+)$/.test(entityId);
    }

    applyHass() {
        if (this.hass && this.toolbar) {
            const items = this.toolbar.querySelectorAll("#headerCards div .header-card,.header-badge");

            if (items) {
                items.forEach(item => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    item.hass = this.hass;
                });
            }
        }
    }

    addCardsToHeader(lovelace) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.loadCardHelpers().then(({
                                           createCardElement,
                                           createBadgeElement
                                       }) => {
            this.createCardElement = createCardElement;
            this.createBadgeElement = createBadgeElement;
            const config = lovelace.config || {};

            const headerCardsConfig = config.header_cards || {};

            const cards = headerCardsConfig.cards || [];
            const badges = headerCardsConfig.badges || [];

            const replaceTabs = (headerCardsConfig && headerCardsConfig.replace_tabs) || false;

            const tabs = this.toolbar && this.toolbar.querySelector("ha-tabs") as HTMLDivElement;
            const mainTitle = this.toolbar && this.toolbar.querySelector("div[main-title]") as HTMLDivElement;
            const button = this.toolbar && this.toolbar.querySelector("div.action-items") as HTMLDivElement;

            this.toolbar?.querySelector("#headerCards")?.remove();

            const justify_content = headerCardsConfig.justify_content || "right";

            if (cards.length > 0 || badges.length > 0) {
                const outerDiv = document.createElement("div");
                outerDiv.id = "headerCards";
                outerDiv.style.display = "flex";
                outerDiv.style.visibility = "hidden";
                outerDiv.style["-ms-flex-direction"] = "row";
                outerDiv.style["-webkit-flex-direction"] = "row";
                outerDiv.style["flex-direction"] = "row";

                outerDiv.style["-ms-flex-align"] = "center";
                outerDiv.style["-webkit-align-items"] = "center";
                outerDiv.style["align-items"] = "center";

                outerDiv.style["justify-content"] = justify_content;

                outerDiv.style["flex"] = "1";

                if (badges.length > 0) {
                    const div = document.createElement("div");
                    div.style.width = "auto";
                    div.style.minWidth = "max-content";
                    div.style.display = "flex";
                    div.style.gap = "5px";
                    badges.forEach(badgeConfig => {
                        this.addBadge(badgeConfig, div);
                    });
                    outerDiv.appendChild(div);
                }

                if (cards.length > 0) {
                    cards.forEach(cardConfig => {
                        const div = document.createElement("div");
                        div.style.width = "auto";
                        div.style.minWidth = "max-content";
                        this.addCardWhenDefined(cardConfig, div);
                        outerDiv.appendChild(div);
                    });
                }

                if (button) {
                    this.toolbar?.insertBefore(outerDiv, button);
                } else {
                    this.toolbar?.appendChild(outerDiv);
                }

                if (tabs || mainTitle) {
                    if (replaceTabs) {
                        if (tabs) {
                            tabs.style.display = "none";
                        }
                        if (mainTitle) {
                            mainTitle.style.display = "none";
                        }
                        outerDiv.style.visibility = "visible";
                    } else {
                        setTimeout(function () {
                            if (tabs) {
                                const tabsContent = tabs.shadowRoot && tabs.shadowRoot.querySelector("#tabsContent") as HTMLDivElement;
                                tabsContent?.style.setProperty('width', 'auto', 'important');
                                const width = tabsContent?.offsetWidth;
                                tabs.style.width = `${width}px`;
                                tabs.style.paddingRight = "10px";
                                outerDiv.style.visibility = "visible";
                            } else {
                                if (mainTitle) {
                                    mainTitle.style.flex = "0";
                                    mainTitle.style.paddingRight = "10px";
                                    mainTitle.style.width = "auto";
                                    mainTitle.style.minWidth = "max-content";
                                }
                                outerDiv.style.display = "flex";
                                outerDiv.style.visibility = "visible";
                            }
                        }, 200);
                    }
                } else {
                    outerDiv.style.visibility = "visible";
                }
            }
        });
    }
}

Promise.resolve(customElements.whenDefined("hui-view")).then(() => {
    console.info(
        `%c HEADER-CARD %c v${pjson.version}`,
        'color: red; font-weight: bold; background: black',
        'color: white; font-weight: bold; background: dimgray',
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.headerCards = new HeaderCards();
});

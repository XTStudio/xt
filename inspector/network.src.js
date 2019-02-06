"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const preact_1 = require("preact");
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["Pending"] = 0] = "Pending";
    ConnectionState[ConnectionState["Done"] = 1] = "Done";
    ConnectionState[ConnectionState["Error"] = 2] = "Error";
    ConnectionState[ConnectionState["Cancelled"] = 3] = "Cancelled";
})(ConnectionState || (ConnectionState = {}));
class DataFetcher {
    constructor() {
        this.items = [];
        this.tsTag = undefined;
    }
    fetchList() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const listRequest = new Request("http://127.0.0.1:8090/network/list");
                if (this.tsTag) {
                    listRequest.headers.set("ts-tag", this.tsTag);
                    const response = yield fetch(listRequest);
                    (yield response.json()).forEach(it => {
                        if (it.uuid === "RESET") {
                            this.items = [];
                            return;
                        }
                        let found = false;
                        this.items.forEach(item => {
                            if (item.uuid === it.uuid) {
                                found = true;
                                Object.assign(item, it);
                            }
                        });
                        if (!found) {
                            this.items.push(it);
                        }
                    });
                    this.tsTag = response.headers.get('ts-tag') || undefined;
                }
                else {
                    const response = yield fetch(listRequest);
                    this.items = (yield response.json()).filter((it) => it.uuid !== "RESET");
                    this.tsTag = response.headers.get('ts-tag') || undefined;
                }
                this.app.setState({ items: this.items });
            }
            catch (error) { }
            this.fetchList();
        });
    }
    fetchInfo(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("http://127.0.0.1:8090/network/read/" + item.uuid);
            return yield response.json();
        });
    }
}
class App extends preact_1.Component {
    constructor() {
        super();
        this.dataFetcher = new DataFetcher();
        this.state = {
            itemForInfoView: undefined,
            items: [],
            filterText: undefined
        };
    }
    componentDidMount() {
        this.dataFetcher.app = this;
        this.dataFetcher.fetchList();
    }
    filteredItems() {
        if (this.state.filterText) {
            const filterText = this.state.filterText;
            return this.state.items.filter(it => {
                try {
                    if (it.request) {
                        if (it.request.url && it.request.url.indexOf(filterText) >= 0) {
                            return true;
                        }
                        if (it.request.method && it.request.method.indexOf(filterText) >= 0) {
                            return true;
                        }
                    }
                    if (it.response) {
                        if (it.response.statusCode && it.response.statusCode.toString().indexOf(filterText) >= 0) {
                            return true;
                        }
                    }
                }
                catch (error) { }
                return false;
            });
        }
        else {
            return this.state.items;
        }
    }
    render() {
        return (preact_1.h("div", null,
            preact_1.h("div", { id: "areaRef", style: "height: 100%; width: 100%; position: absolute; display: none" }),
            preact_1.h("div", { class: "container-fluid" },
                preact_1.h(SearchBar, { onChange: (text) => {
                        this.setState({ filterText: text });
                    } }),
                preact_1.h(ListView, { items: this.filteredItems(), onItemSelected: (item) => {
                        this.setState({ itemForInfoView: item });
                    }, selectedItem: this.state.itemForInfoView })),
            this.state.itemForInfoView !== undefined ? preact_1.h(InfoView, { itemForInfoView: this.state.itemForInfoView, onClose: () => { this.setState({ itemForInfoView: undefined }); } }) : null));
    }
}
class SearchBar extends preact_1.Component {
    render() {
        return (preact_1.h("div", { class: "row" },
            preact_1.h("div", { class: "input-group input-group-sm mb-3" },
                preact_1.h("div", { class: "input-group-prepend" },
                    preact_1.h("span", { class: "input-group-text", id: "inputGroup-sizing-sm" }, "Filter")),
                preact_1.h("input", { type: "text", class: "form-control", "aria-label": "Sizing example input", "aria-describedby": "inputGroup-sizing-sm", onChange: (e) => {
                        this.props.onChange(e.target.value);
                    }, onInput: (e) => {
                        this.props.onChange(e.target.value);
                    } }))));
    }
}
class ListView extends preact_1.Component {
    static renderConnectionState(state) {
        if (state === undefined) {
            return "?";
        }
        switch (state) {
            case ConnectionState.Pending:
                return "Pending";
            case ConnectionState.Done:
                return "Done";
            case ConnectionState.Cancelled:
                return "Cancelled";
            case ConnectionState.Error:
                return "Error";
        }
    }
    renderRow(row) {
        let rowClass = "";
        if (this.props.selectedItem && this.props.selectedItem.uuid === row.uuid) {
            rowClass += " bg-info";
        }
        if (row.state === ConnectionState.Error) {
            rowClass += " text-danger";
        }
        let name = (row.request && row.request.url ? new URL(row.request.url).pathname.split("/").pop() : "");
        if (name.length === 0) {
            name = "/";
        }
        return (preact_1.h("tr", { class: rowClass, onClick: () => {
                this.props.onItemSelected(row);
            } },
            preact_1.h("th", { style: "width: 200px", class: "singleLine", scope: "row" }, name),
            preact_1.h("td", { class: "singleLine" }, row.request && row.request.url ? row.request.url : ""),
            preact_1.h("td", { style: "width: 10%" }, "html"),
            preact_1.h("td", { style: "width: 10%" }, row.response && row.response.bodySize !== undefined ? (row.response.bodySize > 1024 ? (row.response.bodySize / 1024).toFixed(2) + " M" : row.response.bodySize.toFixed(4) + " K") : "/"),
            preact_1.h("td", { style: "width: 10%" }, row.request && row.request.ts && row.response && row.response.ts ? (row.response.ts - row.request.ts) + " ms" : "/"),
            preact_1.h("td", { style: "width: 10%" }, ListView.renderConnectionState(row.state))));
    }
    render() {
        return (preact_1.h("div", { id: "listArea", class: "row" },
            preact_1.h("table", { class: "table table-dark table-hover table-sm" },
                preact_1.h("thead", null,
                    preact_1.h("tr", null,
                        preact_1.h("th", { style: "width: 200px", scope: "col" }, "Name"),
                        preact_1.h("th", { scope: "col" }, "URL"),
                        preact_1.h("th", { style: "width: 10%", scope: "col" }, "Type"),
                        preact_1.h("th", { style: "width: 10%", scope: "col" }, "Size"),
                        preact_1.h("th", { style: "width: 10%", scope: "col" }, "Time"),
                        preact_1.h("th", { style: "width: 10%", scope: "col" }, "State"))),
                preact_1.h("tbody", null, this.props.items.map(it => this.renderRow(it))))));
    }
}
class InfoView extends preact_1.Component {
    constructor() {
        super();
        this.dataFetcher = new DataFetcher;
        this.state = {
            feature: 0,
            itemData: undefined,
        };
    }
    fetchData(itemForInfoView = this.props.itemForInfoView) {
        return __awaiter(this, void 0, void 0, function* () {
            const itemData = yield this.dataFetcher.fetchInfo(itemForInfoView);
            this.setState({
                itemData,
            });
        });
    }
    componentDidMount() {
        this.fetchData();
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.itemForInfoView !== undefined) {
            this.fetchData(nextProps.itemForInfoView);
        }
    }
    render() {
        return (preact_1.h("div", { id: "infoArea" },
            preact_1.h("div", { class: "row-fluid" },
                preact_1.h("ul", { class: "nav nav-tabs", style: "border-bottom-color: rgb(50, 56, 62)" },
                    preact_1.h("li", { class: "nav-item", style: "margin-left: 12px; margin-right: 12px; padding-top: 6px;" },
                        preact_1.h("button", { type: "button", class: "close text-white", "aria-label": "Close", onClick: () => {
                                this.props.onClose();
                                this.setState({ itemData: undefined });
                            } },
                            preact_1.h("span", { "aria-hidden": "true" }, "\u00D7"))),
                    preact_1.h("li", { class: "nav-item" },
                        preact_1.h("a", { class: "nav-link" + (this.state.feature === 0 ? " active" : " text-white"), onClick: () => { this.setState({ feature: 0 }); } }, "Headers")),
                    preact_1.h("li", { class: "nav-item" },
                        preact_1.h("a", { class: "nav-link" + (this.state.feature === 1 ? " active" : " text-white"), onClick: () => { this.setState({ feature: 1 }); } }, "Preview")),
                    preact_1.h("li", { class: "nav-item" },
                        preact_1.h("a", { class: "nav-link" + (this.state.feature === 2 ? " active" : " text-white"), onClick: () => { this.setState({ feature: 2 }); } }, "Response")),
                    preact_1.h("li", { class: "nav-item" },
                        preact_1.h("a", { class: "nav-link" + (this.state.feature === 3 ? " active" : " text-white"), onClick: () => { this.setState({ feature: 3 }); } }, "Hack")))),
            preact_1.h("div", { class: "row-fluid", style: "position: absolute;top: 44px; bottom: 0px; width: 100%; overflow-y: scroll" },
                this.state.feature === 0 ? preact_1.h(InfoHeaderView, { itemForInfoView: this.state.itemData }) : null,
                this.state.feature === 1 ? preact_1.h(InfoPreviewView, { itemForInfoView: this.state.itemData }) : null,
                this.state.feature === 2 ? preact_1.h(InfoResponseView, { itemForInfoView: this.state.itemData }) : null,
                this.state.feature === 3 ? preact_1.h(InfoHackView, null) : null)));
    }
}
class InfoHeaderView extends preact_1.Component {
    render() {
        if (this.props.itemForInfoView === undefined) {
            return null;
        }
        return (preact_1.h("div", null,
            preact_1.h("div", { class: "card bg-transparent" },
                preact_1.h("div", { class: "card-body" },
                    preact_1.h("h5", { class: "card-title text-white" }, "General"),
                    preact_1.h("p", { class: "card-text text-white" },
                        "Request URL: ",
                        this.props.itemForInfoView.request ? preact_1.h("a", { class: "text-white", target: "_blank", href: this.props.itemForInfoView.request.url }, this.props.itemForInfoView.request.url) : "",
                        preact_1.h("br", null),
                        "Request Method: ",
                        this.props.itemForInfoView.request ? this.props.itemForInfoView.request.method || "GET" : "GET",
                        preact_1.h("br", null),
                        "Status Code: ",
                        this.props.itemForInfoView.response ? this.props.itemForInfoView.response.statusCode : "/",
                        preact_1.h("br", null),
                        "Time: ",
                        this.props.itemForInfoView.request && this.props.itemForInfoView.request.ts && this.props.itemForInfoView.response && this.props.itemForInfoView.response.ts ? (this.props.itemForInfoView.response.ts - this.props.itemForInfoView.request.ts) + " ms" : "/",
                        preact_1.h("br", null),
                        "State: ",
                        ListView.renderConnectionState(this.props.itemForInfoView.state),
                        preact_1.h("br", null))),
                this.props.itemForInfoView.request && this.props.itemForInfoView.request.headers && Object.keys(this.props.itemForInfoView.request.headers).length > 0 ? (preact_1.h("div", { class: "card-body" },
                    preact_1.h("h5", { class: "card-title text-white" }, "Request Headers"),
                    preact_1.h("p", { class: "card-text text-white" }, Object.keys(this.props.itemForInfoView.request.headers).map(headerKey => {
                        return (preact_1.h("div", null,
                            headerKey,
                            ": ",
                            this.props.itemForInfoView.request.headers[headerKey],
                            preact_1.h("br", null)));
                    })))) : null,
                this.props.itemForInfoView.request && this.props.itemForInfoView.request.body ? (preact_1.h("div", { class: "card-body" },
                    preact_1.h("h5", { class: "card-title text-white" }, "Request Body"),
                    preact_1.h("p", { class: "card-text text-white" }, atob(this.props.itemForInfoView.request.body)))) : null,
                this.props.itemForInfoView.response && this.props.itemForInfoView.response.headers && Object.keys(this.props.itemForInfoView.response.headers).length > 0 ? (preact_1.h("div", { class: "card-body" },
                    preact_1.h("h5", { class: "card-title text-white" }, "Response Headers"),
                    preact_1.h("p", { class: "card-text text-white" }, Object.keys(this.props.itemForInfoView.response.headers).map(headerKey => {
                        return (preact_1.h("div", null,
                            headerKey,
                            ": ",
                            this.props.itemForInfoView.response.headers[headerKey],
                            preact_1.h("br", null)));
                    })))) : null)));
    }
}
class InfoPreviewView extends preact_1.Component {
    render() {
        if (this.props.itemForInfoView === undefined) {
            return (preact_1.h("p", { class: "card-text text-white", style: "margin: 12px 12px 12px 12px;" }, "No Response."));
        }
        if (this.props.itemForInfoView.response && this.props.itemForInfoView.response.body) {
            const body = atob(this.props.itemForInfoView.response.body);
            try {
                let obj = JSON.parse(body);
                return (preact_1.h("pre", { class: "text-white", style: "margin: 12px 12px 12px 12px;" },
                    preact_1.h("code", { class: "json" }, JSON.stringify(obj, undefined, 4))));
            }
            catch (error) { }
            return (preact_1.h("p", { class: "card-text text-white", style: "margin: 12px 12px 12px 12px;" }, body));
        }
        return preact_1.h("div", null);
    }
}
class InfoResponseView extends preact_1.Component {
    render() {
        if (this.props.itemForInfoView === undefined) {
            return (preact_1.h("p", { class: "card-text text-white", style: "margin: 12px 12px 12px 12px;" }, "No Response."));
        }
        if (this.props.itemForInfoView.response && this.props.itemForInfoView.response.body) {
            return (preact_1.h("p", { class: "card-text text-white", style: "margin: 12px 12px 12px 12px;" }, atob(this.props.itemForInfoView.response.body)));
        }
        return null;
    }
}
class InfoHackView extends preact_1.Component {
    render() {
        return preact_1.h("div", null);
    }
}
preact_1.render(preact_1.h(App, null), document.body);

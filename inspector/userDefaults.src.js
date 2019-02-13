"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preact_1 = require("preact");
class DataFetcher {
    fetch() {
        clearInterval(this.fetchTimeoutHandler);
        return new Promise((res) => {
            this.fetchTimeoutHandler = setInterval(() => {
                rpcClient.emitToClients("com.xt.userdefaults.list", this.suiteName);
            }, 1000);
            rpcClient.once("com.xt.userdefaults.list.result", (message) => {
                clearInterval(this.fetchTimeoutHandler);
                const data = message.args[0].data;
                res(Object.keys(data).map(it => {
                    return {
                        dataKey: it,
                        dataValue: data[it],
                        dataType: typeof data[it]
                    };
                }));
            });
            rpcClient.emitToClients("com.xt.userdefaults.list", this.suiteName);
        });
    }
    deleteItem(item) {
        rpcClient.emitToClients("com.xt.userdefaults.write", undefined, item.dataKey, this.suiteName || undefined);
    }
    editItem(item) {
        rpcClient.emitToClients("com.xt.userdefaults.write", item.dataValue, item.dataKey, this.suiteName);
    }
}
class App extends preact_1.Component {
    constructor() {
        super();
        this.dataFetcher = new DataFetcher();
        this.state = {
            items: [],
            isLoading: false,
        };
    }
    componentDidMount() {
        this.reloadData();
    }
    reloadData() {
        this.setState({ isLoading: true });
        this.dataFetcher.fetch().then(items => {
            this.setState({ items, isLoading: false });
        }).catch(() => {
            this.setState({ isLoading: false });
        });
    }
    render() {
        return (preact_1.h("div", null,
            preact_1.h("div", { id: "areaRef", style: "height: 100%; width: 100%; position: absolute; display: none" }),
            preact_1.h("div", { class: "container-fluid" },
                preact_1.h(SuiteBar, { onChange: (text) => {
                        this.dataFetcher.suiteName = text;
                        this.reloadData();
                    }, onRefresh: () => {
                        this.reloadData();
                    }, isLoading: this.state.isLoading }),
                preact_1.h(ListView, { items: this.state.items, onDeleteItem: (it) => {
                        this.dataFetcher.deleteItem(it);
                        this.setState({ items: this.state.items.filter(stateData => stateData.dataKey !== it.dataKey) });
                    }, onEditItem: (it, isNewRow) => {
                        if (it.dataKey.length === 0 || it.dataValue.length === 0 || it.dataType.length === 0) {
                            return;
                        }
                        const trimedIt = Object.assign({}, it, { dataValue: (() => {
                                if (it.dataType === "string") {
                                    return it.dataValue;
                                }
                                else if (it.dataType === "number") {
                                    return parseFloat(it.dataValue);
                                }
                                else if (it.dataType === "boolean") {
                                    return it.dataValue === "true";
                                }
                                else if (it.dataType === "object") {
                                    try {
                                        return JSON.parse(it.dataValue);
                                    }
                                    catch (error) { }
                                    return {};
                                }
                            })() });
                        this.dataFetcher.editItem(trimedIt);
                        if (isNewRow) {
                            const items = this.state.items.slice();
                            items.push(it);
                            this.setState({
                                items,
                            });
                        }
                        else {
                            this.setState({
                                items: this.state.items.map(stateData => {
                                    if (stateData.dataKey === it.dataKey) {
                                        stateData.dataValue = it.dataValue;
                                    }
                                    return stateData;
                                })
                            });
                        }
                    } }))));
    }
}
class SuiteBar extends preact_1.Component {
    render() {
        return (preact_1.h("div", { class: "row" },
            preact_1.h("div", { class: "input-group input-group-sm mb-3" },
                preact_1.h("div", { class: "input-group-prepend" },
                    preact_1.h("span", { class: "input-group-text", id: "inputGroup-sizing-sm" }, "Suite Name")),
                preact_1.h("input", { type: "text", class: "form-control", "aria-label": "Sizing example input", "aria-describedby": "inputGroup-sizing-sm", placeholder: "standard", onChange: (e) => {
                        this.props.onChange(e.target.value);
                    } }),
                preact_1.h("div", { class: "input-group-append", style: "cursor: pointer" },
                    preact_1.h("span", { onClick: () => {
                            this.props.onRefresh();
                            this.setState({ isLoading: true });
                        }, class: "input-group-text", id: "basic-addon2" },
                        this.props.isLoading === true ? preact_1.h("span", { dangerouslySetInnerHTML: { __html: `<svg width="18px" height="18px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling" style="background-image: none; background-position: initial initial; background-repeat: initial initial;"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="#1d3f72" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>` } }) : "Refresh",
                        " ")))));
    }
}
class ListView extends preact_1.Component {
    renderRow(row) {
        return (preact_1.h("tr", null,
            preact_1.h("th", { style: "width: 25%; line-height: 30px", scope: "row" }, row.dataKey),
            preact_1.h("td", { style: "width: 25%; line-height: 30px" }, typeof row.dataValue === "object" ? JSON.stringify(row.dataValue) : String(row.dataValue)),
            preact_1.h("td", { style: "width: 25%; line-height: 30px" }, row.dataType),
            preact_1.h("td", { style: "width: 25%" },
                preact_1.h("button", { type: "button", class: "btn btn-secondary btn-sm", style: "transform: scale(0.8,0.8);", onClick: () => {
                        this.setState({
                            editingItem: row,
                            isNewRowWhileEditing: false,
                        });
                        $('#rowEditor').modal('show');
                    } }, "Edit"),
                preact_1.h("button", { type: "button", class: "btn btn-warning btn-sm", style: "transform: scale(0.8,0.8);", onClick: () => {
                        this.props.onDeleteItem(row);
                    } }, "Delete"))));
    }
    render() {
        return (preact_1.h("div", { id: "listArea", class: "row" },
            preact_1.h("table", { class: "table table-dark table-hover table-sm" },
                preact_1.h("thead", null,
                    preact_1.h("tr", null,
                        preact_1.h("th", { style: "width: 25%", scope: "col" }, "Key"),
                        preact_1.h("th", { style: "width: 25%", scope: "col" }, "Value"),
                        preact_1.h("th", { style: "width: 25%", scope: "col" }, "Type"),
                        preact_1.h("th", { style: "width: 25%", scope: "col" }, "Operation"))),
                preact_1.h("tbody", null,
                    this.props.items.map(it => this.renderRow(it)),
                    preact_1.h("tr", null,
                        preact_1.h("th", { colSpan: 4, style: "text-align: center" },
                            preact_1.h("button", { type: "button", class: "btn btn-success btn-sm", style: "transform: scale(0.8,0.8);", onClick: () => {
                                    this.setState({
                                        editingItem: undefined,
                                        isNewRowWhileEditing: true,
                                    });
                                    $('#rowEditor').modal('show');
                                } }, "New Row"))))),
            preact_1.h(RowEditor, { isNewRow: this.state.isNewRowWhileEditing, dataItem: this.state.editingItem, onSave: (it) => {
                    this.props.onEditItem(it, this.state.isNewRowWhileEditing);
                    $('#rowEditor').modal('hide');
                } })));
    }
}
class RowEditor extends preact_1.Component {
    render() {
        return (preact_1.h("div", { class: "modal fade", id: "rowEditor", role: "dialog", "aria-labelledby": "exampleModalLabel", "aria-hidden": "true" },
            preact_1.h("div", { class: "modal-dialog", role: "document" },
                preact_1.h("div", { class: "modal-content" },
                    preact_1.h("div", { class: "modal-header" },
                        preact_1.h("h5", { class: "modal-title", id: "exampleModalLabel" }, this.props.isNewRow ? "New" : "Edit"),
                        preact_1.h("button", { type: "button", class: "close", "data-dismiss": "modal", "aria-label": "Close" },
                            preact_1.h("span", { "aria-hidden": "true" }, "\u00D7"))),
                    preact_1.h("div", { class: "modal-body" },
                        preact_1.h("form", null,
                            preact_1.h("div", { class: "form-group row" },
                                preact_1.h("label", { for: "inputEmail3", class: "col-sm-2 col-form-label" }, "Key"),
                                preact_1.h("div", { class: "col-sm-10" },
                                    preact_1.h("input", { class: "form-control", id: "editorDataKey", placeholder: "", value: this.props.dataItem ? this.props.dataItem.dataKey : '', readOnly: this.props.isNewRow ? false : true }))),
                            preact_1.h("div", { class: "form-group row" },
                                preact_1.h("label", { for: "inputEmail3", class: "col-sm-2 col-form-label" }, "Value"),
                                preact_1.h("div", { class: "col-sm-10" },
                                    preact_1.h("input", { class: "form-control", id: "editorDataValue", placeholder: "", value: this.props.dataItem ? this.props.dataItem.dataValue : '', onKeyPress: (e) => {
                                            if (e.keyCode === 13) {
                                                this.props.onSave({
                                                    dataKey: $('#editorDataKey').val(),
                                                    dataValue: $('#editorDataValue').val(),
                                                    dataType: $('input[name=inlineRadioOptions]:checked').val(),
                                                });
                                            }
                                        } }))),
                            preact_1.h("div", { class: "form-group row" },
                                preact_1.h("label", { for: "inputEmail3", class: "col-sm-2 col-form-label" }, "Type"),
                                preact_1.h("div", { class: "col-sm-10", style: "padding-top: 7px;" },
                                    preact_1.h("div", { class: "form-check form-check-inline" },
                                        preact_1.h("input", { class: "form-check-input", type: "radio", name: "inlineRadioOptions", id: "typeString", value: "string", checked: (this.props.dataItem && this.props.dataItem.dataType === "string") || this.props.isNewRow }),
                                        preact_1.h("label", { class: "form-check-label", for: "typeString" }, "String")),
                                    preact_1.h("div", { class: "form-check form-check-inline" },
                                        preact_1.h("input", { class: "form-check-input", type: "radio", name: "inlineRadioOptions", id: "typeNumber", value: "number", checked: this.props.dataItem && this.props.dataItem.dataType === "number" }),
                                        preact_1.h("label", { class: "form-check-label", for: "typeNumber" }, "Number")),
                                    preact_1.h("div", { class: "form-check form-check-inline" },
                                        preact_1.h("input", { class: "form-check-input", type: "radio", name: "inlineRadioOptions", id: "typeBoolean", value: "boolean", checked: this.props.dataItem && this.props.dataItem.dataType === "boolean" }),
                                        preact_1.h("label", { class: "form-check-label", for: "typeBoolean" }, "Boolean")),
                                    preact_1.h("div", { class: "form-check form-check-inline" },
                                        preact_1.h("input", { class: "form-check-input", type: "radio", name: "inlineRadioOptions", id: "typeObject", value: "object", checked: this.props.dataItem && this.props.dataItem.dataType === "object" }),
                                        preact_1.h("label", { class: "form-check-label", for: "typeObject" }, "Object")))))),
                    preact_1.h("div", { class: "modal-footer" },
                        preact_1.h("button", { type: "button", class: "btn btn-secondary", "data-dismiss": "modal" }, "Close"),
                        preact_1.h("button", { type: "button", class: "btn btn-primary", onClick: () => {
                                this.props.onSave({
                                    dataKey: $('#editorDataKey').val(),
                                    dataValue: $('#editorDataValue').val(),
                                    dataType: $('input[name=inlineRadioOptions]:checked').val(),
                                });
                            } }, "Save"))))));
    }
}
preact_1.render(preact_1.h(App, null), document.body);

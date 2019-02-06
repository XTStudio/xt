require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"preact":"preact"}],"preact":[function(require,module,exports){
!function() {
    'use strict';
    function h(nodeName, attributes) {
        var lastSimple, child, simple, i, children = EMPTY_CHILDREN;
        for (i = arguments.length; i-- > 2; ) stack.push(arguments[i]);
        if (attributes && null != attributes.children) {
            if (!stack.length) stack.push(attributes.children);
            delete attributes.children;
        }
        while (stack.length) if ((child = stack.pop()) && void 0 !== child.pop) for (i = child.length; i--; ) stack.push(child[i]); else {
            if ('boolean' == typeof child) child = null;
            if (simple = 'function' != typeof nodeName) if (null == child) child = ''; else if ('number' == typeof child) child = String(child); else if ('string' != typeof child) simple = !1;
            if (simple && lastSimple) children[children.length - 1] += child; else if (children === EMPTY_CHILDREN) children = [ child ]; else children.push(child);
            lastSimple = simple;
        }
        var p = new VNode();
        p.nodeName = nodeName;
        p.children = children;
        p.attributes = null == attributes ? void 0 : attributes;
        p.key = null == attributes ? void 0 : attributes.key;
        if (void 0 !== options.vnode) options.vnode(p);
        return p;
    }
    function extend(obj, props) {
        for (var i in props) obj[i] = props[i];
        return obj;
    }
    function applyRef(ref, value) {
        if (null != ref) if ('function' == typeof ref) ref(value); else ref.current = value;
    }
    function cloneElement(vnode, props) {
        return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
    }
    function enqueueRender(component) {
        if (!component.__d && (component.__d = !0) && 1 == items.push(component)) (options.debounceRendering || defer)(rerender);
    }
    function rerender() {
        var p;
        while (p = items.pop()) if (p.__d) renderComponent(p);
    }
    function isSameNodeType(node, vnode, hydrating) {
        if ('string' == typeof vnode || 'number' == typeof vnode) return void 0 !== node.splitText;
        if ('string' == typeof vnode.nodeName) return !node._componentConstructor && isNamedNode(node, vnode.nodeName); else return hydrating || node._componentConstructor === vnode.nodeName;
    }
    function isNamedNode(node, nodeName) {
        return node.__n === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
    }
    function getNodeProps(vnode) {
        var props = extend({}, vnode.attributes);
        props.children = vnode.children;
        var defaultProps = vnode.nodeName.defaultProps;
        if (void 0 !== defaultProps) for (var i in defaultProps) if (void 0 === props[i]) props[i] = defaultProps[i];
        return props;
    }
    function createNode(nodeName, isSvg) {
        var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
        node.__n = nodeName;
        return node;
    }
    function removeNode(node) {
        var parentNode = node.parentNode;
        if (parentNode) parentNode.removeChild(node);
    }
    function setAccessor(node, name, old, value, isSvg) {
        if ('className' === name) name = 'class';
        if ('key' === name) ; else if ('ref' === name) {
            applyRef(old, null);
            applyRef(value, node);
        } else if ('class' === name && !isSvg) node.className = value || ''; else if ('style' === name) {
            if (!value || 'string' == typeof value || 'string' == typeof old) node.style.cssText = value || '';
            if (value && 'object' == typeof value) {
                if ('string' != typeof old) for (var i in old) if (!(i in value)) node.style[i] = '';
                for (var i in value) node.style[i] = 'number' == typeof value[i] && !1 === IS_NON_DIMENSIONAL.test(i) ? value[i] + 'px' : value[i];
            }
        } else if ('dangerouslySetInnerHTML' === name) {
            if (value) node.innerHTML = value.__html || '';
        } else if ('o' == name[0] && 'n' == name[1]) {
            var useCapture = name !== (name = name.replace(/Capture$/, ''));
            name = name.toLowerCase().substring(2);
            if (value) {
                if (!old) node.addEventListener(name, eventProxy, useCapture);
            } else node.removeEventListener(name, eventProxy, useCapture);
            (node.__l || (node.__l = {}))[name] = value;
        } else if ('list' !== name && 'type' !== name && !isSvg && name in node) {
            try {
                node[name] = null == value ? '' : value;
            } catch (e) {}
            if ((null == value || !1 === value) && 'spellcheck' != name) node.removeAttribute(name);
        } else {
            var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
            if (null == value || !1 === value) if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); else node.removeAttribute(name); else if ('function' != typeof value) if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); else node.setAttribute(name, value);
        }
    }
    function eventProxy(e) {
        return this.__l[e.type](options.event && options.event(e) || e);
    }
    function flushMounts() {
        var c;
        while (c = mounts.shift()) {
            if (options.afterMount) options.afterMount(c);
            if (c.componentDidMount) c.componentDidMount();
        }
    }
    function diff(dom, vnode, context, mountAll, parent, componentRoot) {
        if (!diffLevel++) {
            isSvgMode = null != parent && void 0 !== parent.ownerSVGElement;
            hydrating = null != dom && !('__preactattr_' in dom);
        }
        var ret = idiff(dom, vnode, context, mountAll, componentRoot);
        if (parent && ret.parentNode !== parent) parent.appendChild(ret);
        if (!--diffLevel) {
            hydrating = !1;
            if (!componentRoot) flushMounts();
        }
        return ret;
    }
    function idiff(dom, vnode, context, mountAll, componentRoot) {
        var out = dom, prevSvgMode = isSvgMode;
        if (null == vnode || 'boolean' == typeof vnode) vnode = '';
        if ('string' == typeof vnode || 'number' == typeof vnode) {
            if (dom && void 0 !== dom.splitText && dom.parentNode && (!dom._component || componentRoot)) {
                if (dom.nodeValue != vnode) dom.nodeValue = vnode;
            } else {
                out = document.createTextNode(vnode);
                if (dom) {
                    if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                    recollectNodeTree(dom, !0);
                }
            }
            out.__preactattr_ = !0;
            return out;
        }
        var vnodeName = vnode.nodeName;
        if ('function' == typeof vnodeName) return buildComponentFromVNode(dom, vnode, context, mountAll);
        isSvgMode = 'svg' === vnodeName ? !0 : 'foreignObject' === vnodeName ? !1 : isSvgMode;
        vnodeName = String(vnodeName);
        if (!dom || !isNamedNode(dom, vnodeName)) {
            out = createNode(vnodeName, isSvgMode);
            if (dom) {
                while (dom.firstChild) out.appendChild(dom.firstChild);
                if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                recollectNodeTree(dom, !0);
            }
        }
        var fc = out.firstChild, props = out.__preactattr_, vchildren = vnode.children;
        if (null == props) {
            props = out.__preactattr_ = {};
            for (var a = out.attributes, i = a.length; i--; ) props[a[i].name] = a[i].value;
        }
        if (!hydrating && vchildren && 1 === vchildren.length && 'string' == typeof vchildren[0] && null != fc && void 0 !== fc.splitText && null == fc.nextSibling) {
            if (fc.nodeValue != vchildren[0]) fc.nodeValue = vchildren[0];
        } else if (vchildren && vchildren.length || null != fc) innerDiffNode(out, vchildren, context, mountAll, hydrating || null != props.dangerouslySetInnerHTML);
        diffAttributes(out, vnode.attributes, props);
        isSvgMode = prevSvgMode;
        return out;
    }
    function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
        var j, c, f, vchild, child, originalChildren = dom.childNodes, children = [], keyed = {}, keyedLen = 0, min = 0, len = originalChildren.length, childrenLen = 0, vlen = vchildren ? vchildren.length : 0;
        if (0 !== len) for (var i = 0; i < len; i++) {
            var _child = originalChildren[i], props = _child.__preactattr_, key = vlen && props ? _child._component ? _child._component.__k : props.key : null;
            if (null != key) {
                keyedLen++;
                keyed[key] = _child;
            } else if (props || (void 0 !== _child.splitText ? isHydrating ? _child.nodeValue.trim() : !0 : isHydrating)) children[childrenLen++] = _child;
        }
        if (0 !== vlen) for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            var key = vchild.key;
            if (null != key) {
                if (keyedLen && void 0 !== keyed[key]) {
                    child = keyed[key];
                    keyed[key] = void 0;
                    keyedLen--;
                }
            } else if (min < childrenLen) for (j = min; j < childrenLen; j++) if (void 0 !== children[j] && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = void 0;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
            }
            child = idiff(child, vchild, context, mountAll);
            f = originalChildren[i];
            if (child && child !== dom && child !== f) if (null == f) dom.appendChild(child); else if (child === f.nextSibling) removeNode(f); else dom.insertBefore(child, f);
        }
        if (keyedLen) for (var i in keyed) if (void 0 !== keyed[i]) recollectNodeTree(keyed[i], !1);
        while (min <= childrenLen) if (void 0 !== (child = children[childrenLen--])) recollectNodeTree(child, !1);
    }
    function recollectNodeTree(node, unmountOnly) {
        var component = node._component;
        if (component) unmountComponent(component); else {
            if (null != node.__preactattr_) applyRef(node.__preactattr_.ref, null);
            if (!1 === unmountOnly || null == node.__preactattr_) removeNode(node);
            removeChildren(node);
        }
    }
    function removeChildren(node) {
        node = node.lastChild;
        while (node) {
            var next = node.previousSibling;
            recollectNodeTree(node, !0);
            node = next;
        }
    }
    function diffAttributes(dom, attrs, old) {
        var name;
        for (name in old) if ((!attrs || null == attrs[name]) && null != old[name]) setAccessor(dom, name, old[name], old[name] = void 0, isSvgMode);
        for (name in attrs) if (!('children' === name || 'innerHTML' === name || name in old && attrs[name] === ('value' === name || 'checked' === name ? dom[name] : old[name]))) setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
    function createComponent(Ctor, props, context) {
        var inst, i = recyclerComponents.length;
        if (Ctor.prototype && Ctor.prototype.render) {
            inst = new Ctor(props, context);
            Component.call(inst, props, context);
        } else {
            inst = new Component(props, context);
            inst.constructor = Ctor;
            inst.render = doRender;
        }
        while (i--) if (recyclerComponents[i].constructor === Ctor) {
            inst.__b = recyclerComponents[i].__b;
            recyclerComponents.splice(i, 1);
            return inst;
        }
        return inst;
    }
    function doRender(props, state, context) {
        return this.constructor(props, context);
    }
    function setComponentProps(component, props, renderMode, context, mountAll) {
        if (!component.__x) {
            component.__x = !0;
            component.__r = props.ref;
            component.__k = props.key;
            delete props.ref;
            delete props.key;
            if (void 0 === component.constructor.getDerivedStateFromProps) if (!component.base || mountAll) {
                if (component.componentWillMount) component.componentWillMount();
            } else if (component.componentWillReceiveProps) component.componentWillReceiveProps(props, context);
            if (context && context !== component.context) {
                if (!component.__c) component.__c = component.context;
                component.context = context;
            }
            if (!component.__p) component.__p = component.props;
            component.props = props;
            component.__x = !1;
            if (0 !== renderMode) if (1 === renderMode || !1 !== options.syncComponentUpdates || !component.base) renderComponent(component, 1, mountAll); else enqueueRender(component);
            applyRef(component.__r, component);
        }
    }
    function renderComponent(component, renderMode, mountAll, isChild) {
        if (!component.__x) {
            var rendered, inst, cbase, props = component.props, state = component.state, context = component.context, previousProps = component.__p || props, previousState = component.__s || state, previousContext = component.__c || context, isUpdate = component.base, nextBase = component.__b, initialBase = isUpdate || nextBase, initialChildComponent = component._component, skip = !1, snapshot = previousContext;
            if (component.constructor.getDerivedStateFromProps) {
                state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
                component.state = state;
            }
            if (isUpdate) {
                component.props = previousProps;
                component.state = previousState;
                component.context = previousContext;
                if (2 !== renderMode && component.shouldComponentUpdate && !1 === component.shouldComponentUpdate(props, state, context)) skip = !0; else if (component.componentWillUpdate) component.componentWillUpdate(props, state, context);
                component.props = props;
                component.state = state;
                component.context = context;
            }
            component.__p = component.__s = component.__c = component.__b = null;
            component.__d = !1;
            if (!skip) {
                rendered = component.render(props, state, context);
                if (component.getChildContext) context = extend(extend({}, context), component.getChildContext());
                if (isUpdate && component.getSnapshotBeforeUpdate) snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
                var toUnmount, base, childComponent = rendered && rendered.nodeName;
                if ('function' == typeof childComponent) {
                    var childProps = getNodeProps(rendered);
                    inst = initialChildComponent;
                    if (inst && inst.constructor === childComponent && childProps.key == inst.__k) setComponentProps(inst, childProps, 1, context, !1); else {
                        toUnmount = inst;
                        component._component = inst = createComponent(childComponent, childProps, context);
                        inst.__b = inst.__b || nextBase;
                        inst.__u = component;
                        setComponentProps(inst, childProps, 0, context, !1);
                        renderComponent(inst, 1, mountAll, !0);
                    }
                    base = inst.base;
                } else {
                    cbase = initialBase;
                    toUnmount = initialChildComponent;
                    if (toUnmount) cbase = component._component = null;
                    if (initialBase || 1 === renderMode) {
                        if (cbase) cbase._component = null;
                        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, !0);
                    }
                }
                if (initialBase && base !== initialBase && inst !== initialChildComponent) {
                    var baseParent = initialBase.parentNode;
                    if (baseParent && base !== baseParent) {
                        baseParent.replaceChild(base, initialBase);
                        if (!toUnmount) {
                            initialBase._component = null;
                            recollectNodeTree(initialBase, !1);
                        }
                    }
                }
                if (toUnmount) unmountComponent(toUnmount);
                component.base = base;
                if (base && !isChild) {
                    var componentRef = component, t = component;
                    while (t = t.__u) (componentRef = t).base = base;
                    base._component = componentRef;
                    base._componentConstructor = componentRef.constructor;
                }
            }
            if (!isUpdate || mountAll) mounts.push(component); else if (!skip) {
                if (component.componentDidUpdate) component.componentDidUpdate(previousProps, previousState, snapshot);
                if (options.afterUpdate) options.afterUpdate(component);
            }
            while (component.__h.length) component.__h.pop().call(component);
            if (!diffLevel && !isChild) flushMounts();
        }
    }
    function buildComponentFromVNode(dom, vnode, context, mountAll) {
        var c = dom && dom._component, originalComponent = c, oldDom = dom, isDirectOwner = c && dom._componentConstructor === vnode.nodeName, isOwner = isDirectOwner, props = getNodeProps(vnode);
        while (c && !isOwner && (c = c.__u)) isOwner = c.constructor === vnode.nodeName;
        if (c && isOwner && (!mountAll || c._component)) {
            setComponentProps(c, props, 3, context, mountAll);
            dom = c.base;
        } else {
            if (originalComponent && !isDirectOwner) {
                unmountComponent(originalComponent);
                dom = oldDom = null;
            }
            c = createComponent(vnode.nodeName, props, context);
            if (dom && !c.__b) {
                c.__b = dom;
                oldDom = null;
            }
            setComponentProps(c, props, 1, context, mountAll);
            dom = c.base;
            if (oldDom && dom !== oldDom) {
                oldDom._component = null;
                recollectNodeTree(oldDom, !1);
            }
        }
        return dom;
    }
    function unmountComponent(component) {
        if (options.beforeUnmount) options.beforeUnmount(component);
        var base = component.base;
        component.__x = !0;
        if (component.componentWillUnmount) component.componentWillUnmount();
        component.base = null;
        var inner = component._component;
        if (inner) unmountComponent(inner); else if (base) {
            if (null != base.__preactattr_) applyRef(base.__preactattr_.ref, null);
            component.__b = base;
            removeNode(base);
            recyclerComponents.push(component);
            removeChildren(base);
        }
        applyRef(component.__r, null);
    }
    function Component(props, context) {
        this.__d = !0;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
        this.__h = [];
    }
    function render(vnode, parent, merge) {
        return diff(merge, vnode, {}, !1, parent, !1);
    }
    function createRef() {
        return {};
    }
    var VNode = function() {};
    var options = {};
    var stack = [];
    var EMPTY_CHILDREN = [];
    var defer = 'function' == typeof Promise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var items = [];
    var mounts = [];
    var diffLevel = 0;
    var isSvgMode = !1;
    var hydrating = !1;
    var recyclerComponents = [];
    extend(Component.prototype, {
        setState: function(state, callback) {
            if (!this.__s) this.__s = this.state;
            this.state = extend(extend({}, this.state), 'function' == typeof state ? state(this.state, this.props) : state);
            if (callback) this.__h.push(callback);
            enqueueRender(this);
        },
        forceUpdate: function(callback) {
            if (callback) this.__h.push(callback);
            renderComponent(this, 2);
        },
        render: function() {}
    });
    var preact = {
        h: h,
        createElement: h,
        cloneElement: cloneElement,
        createRef: createRef,
        Component: Component,
        render: render,
        rerender: rerender,
        options: options
    };
    if ('undefined' != typeof module) module.exports = preact; else self.preact = preact;
}();

},{}]},{},[1]);

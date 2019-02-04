import { h, render, Component } from "preact";

enum ConnectionState {
    Pending = 0,
    Done = 1,
    Error = 2,
    Cancelled = 3,
}

interface ConnectionItem {

    uuid: string

    request?: {
        method?: string,
        url?: string,
        headers?: { [key: string]: string },
        ts: number,
    }

    response?: {
        statusCode: number,
        headers: { [key: string]: string },
        body?: string,
        bodySize: number,
        ts: number,
    }

    state: number,

}

class DataFetcher {

    //@ts-ignore
    app: App
    items: ConnectionItem[] = []
    tsTag: string | undefined = undefined

    async fetchList() {
        try {
            const listRequest = new Request("http://127.0.0.1:8090/network/list")
            if (this.tsTag) {
                listRequest.headers.set("ts-tag", this.tsTag)
                const response = await fetch(listRequest);
                (await response.json() as ConnectionItem[]).forEach(it => {
                    if (it.uuid === "RESET") { this.items = []; return; }
                    let found = false
                    this.items.forEach(item => {
                        if (item.uuid === it.uuid) {
                            found = true
                            Object.assign(item, it)
                        }
                    })
                    if (!found) {
                        this.items.push(it)
                    }
                })
                this.tsTag = response.headers.get('ts-tag') || undefined
            }
            else {
                const response = await fetch(listRequest)
                this.items = (await response.json()).filter((it: any) => it.uuid !== "RESET")
                this.tsTag = response.headers.get('ts-tag') || undefined
            }
            this.app.setState({ items: this.items })
        } catch (error) { }
        this.fetchList()
    }

    async fetchInfo(item: ConnectionItem): Promise<ConnectionItem> {
        const response = await fetch("http://127.0.0.1:8090/network/read/" + item.uuid)
        return await response.json()
    }

}

class App extends Component<any, { itemForInfoView?: ConnectionItem, items: ConnectionItem[], filterText: string | undefined }> {

    dataFetcher = new DataFetcher()

    constructor() {
        super()
        this.state = {
            itemForInfoView: undefined,
            items: [],
            filterText: undefined
        }
    }

    componentDidMount() {
        this.dataFetcher.app = this
        this.dataFetcher.fetchList()
    }

    filteredItems(): ConnectionItem[] {
        if (this.state.filterText) {
            const filterText = this.state.filterText
            return this.state.items.filter(it => {
                try {
                    if (it.request) {
                        if (it.request.url && it.request.url.indexOf(filterText) >= 0) {
                            return true
                        }
                        if (it.request.method && it.request.method.indexOf(filterText) >= 0) {
                            return true
                        }
                    }
                    if (it.response) {
                        if (it.response.statusCode && it.response.statusCode.toString().indexOf(filterText) >= 0) {
                            return true
                        }
                    }
                } catch (error) { }
                return false
            })
        }
        else {
            return this.state.items
        }
    }

    render() {
        return (
            <div>
                <div id="areaRef" style="height: 100%; width: 100%; position: absolute; display: none"></div>
                <div class="container-fluid">
                    <SearchBar onChange={(text) => {
                        this.setState({ filterText: text })
                    }} />
                    <ListView items={this.filteredItems()} onItemSelected={(item) => {
                        this.setState({ itemForInfoView: item })
                    }} selectedItem={this.state.itemForInfoView} />
                </div>
                {this.state.itemForInfoView !== undefined ? <InfoView itemForInfoView={this.state.itemForInfoView} onClose={() => { this.setState({ itemForInfoView: undefined }) }} /> : null}
            </div>
        )
    }

}

class SearchBar extends Component<{ onChange: (text: string) => void }> {

    render() {
        return (
            <div class="row">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Filter</span>
                    </div>
                    <input type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" onChange={(e: any) => {
                        this.props.onChange(e.target.value)
                    }} onInput={(e: any) => {
                        this.props.onChange(e.target.value)
                    }} />
                </div>
            </div>
        )
    }

}

class ListView extends Component<{ items: ConnectionItem[], selectedItem: ConnectionItem | undefined, onItemSelected: (item: ConnectionItem) => void }> {

    static renderConnectionState(state: ConnectionState | undefined) {
        if (state === undefined) { return "?" }
        switch (state) {
            case ConnectionState.Pending:
                return "Pending"
            case ConnectionState.Done:
                return "Done"
            case ConnectionState.Cancelled:
                return "Cancelled"
            case ConnectionState.Error:
                return "Error"
        }
    }

    renderRow(row: ConnectionItem) {
        let rowClass = ""
        if (this.props.selectedItem && this.props.selectedItem.uuid === row.uuid) {
            rowClass += " bg-info"
        }
        if (row.state === ConnectionState.Error) {
            rowClass += " text-danger"
        }
        let name = (row.request && row.request.url ? new URL(row.request.url).pathname.split("/").pop() : "") as string
        if (name.length === 0) {
            name = "/"
        }
        return (
            <tr class={rowClass} onClick={() => {
                this.props.onItemSelected(row)
            }}>
                <th style="width: 200px" class="singleLine" scope="row">{name}</th>
                <td class="singleLine">{row.request && row.request.url ? row.request.url : ""}</td>
                <td style="width: 10%">html</td>
                <td style="width: 10%">{row.response && row.response.bodySize !== undefined ? (row.response.bodySize > 1024 ? (row.response.bodySize / 1024).toFixed(2) + " M" : row.response.bodySize.toFixed(4) + " K") : "/"}</td>
                <td style="width: 10%">{row.request && row.request.ts && row.response && row.response.ts ? (row.response.ts - row.request.ts) + " ms" : "/"}</td>
                <td style="width: 10%">{ListView.renderConnectionState(row.state)}</td>
            </tr>
        )
    }

    render() {
        return (
            <div id="listArea" class="row">
                <table class="table table-dark table-hover table-sm">
                    <thead>
                        <tr>
                            <th style="width: 200px" scope="col">Name</th>
                            <th scope="col">URL</th>
                            <th style="width: 10%" scope="col">Type</th>
                            <th style="width: 10%" scope="col">Size</th>
                            <th style="width: 10%" scope="col">Time</th>
                            <th style="width: 10%" scope="col">State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.items.map(it => this.renderRow(it))}
                    </tbody>
                </table>
            </div>
        )
    }

}

class InfoView extends Component<{ itemForInfoView: ConnectionItem, onClose: () => void }, { feature: number, itemData: ConnectionItem | undefined }> {

    dataFetcher = new DataFetcher

    constructor() {
        super()
        this.state = {
            feature: 0,
            itemData: undefined,
        }
    }

    async fetchData(itemForInfoView: ConnectionItem = this.props.itemForInfoView) {
        const itemData = await this.dataFetcher.fetchInfo(itemForInfoView)
        this.setState({
            itemData,
        })
    }

    componentDidMount() {
        this.fetchData()
    }

    componentWillReceiveProps(nextProps: { itemForInfoView: ConnectionItem | undefined }) {
        if (nextProps.itemForInfoView !== undefined) {
            this.fetchData(nextProps.itemForInfoView)
        }
    }

    render() {
        return (
            <div id="infoArea">
                <div class="row-fluid">
                    <ul class="nav nav-tabs" style="border-bottom-color: rgb(50, 56, 62)">
                        <li class="nav-item" style="margin-left: 12px; margin-right: 12px; padding-top: 6px;">
                            <button type="button" class="close text-white" aria-label="Close" onClick={() => {
                                this.props.onClose();
                                this.setState({ itemData: undefined })
                            }}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </li>
                        <li class="nav-item">
                            <a class={"nav-link" + (this.state.feature === 0 ? " active" : " text-white")} onClick={() => { this.setState({ feature: 0 }) }}>Headers</a>
                        </li>
                        <li class="nav-item">
                            <a class={"nav-link" + (this.state.feature === 1 ? " active" : " text-white")} onClick={() => { this.setState({ feature: 1 }) }}>Preview</a>
                        </li>
                        <li class="nav-item">
                            <a class={"nav-link" + (this.state.feature === 2 ? " active" : " text-white")} onClick={() => { this.setState({ feature: 2 }) }}>Response</a>
                        </li>
                        <li class="nav-item">
                            <a class={"nav-link" + (this.state.feature === 3 ? " active" : " text-white")} onClick={() => { this.setState({ feature: 3 }) }}>Hack</a>
                        </li>
                    </ul>
                </div>
                <div class="row-fluid" style="position: absolute;top: 44px; bottom: 0px; width: 100%; overflow-y: scroll">
                    {this.state.feature === 0 ? <InfoHeaderView itemForInfoView={this.state.itemData} /> : null}
                    {this.state.feature === 1 ? <InfoPreviewView itemForInfoView={this.state.itemData} /> : null}
                    {this.state.feature === 2 ? <InfoResponseView itemForInfoView={this.state.itemData} /> : null}
                    {this.state.feature === 3 ? <InfoHackView /> : null}
                </div>
            </div>
        )
    }

}

class InfoHeaderView extends Component<{ itemForInfoView: ConnectionItem | undefined }> {

    render() {
        if (this.props.itemForInfoView === undefined) { return null }
        return (
            <div>
                <div class="card bg-transparent">
                    <div class="card-body">
                        <h5 class="card-title text-white">General</h5>
                        <p class="card-text text-white">
                            Request URL: {this.props.itemForInfoView.request ? <a class="text-white" target="_blank" href={this.props.itemForInfoView.request.url}>{this.props.itemForInfoView.request.url}</a> : ""}<br />
                            Request Method: {this.props.itemForInfoView.request ? this.props.itemForInfoView.request.method || "GET" : "GET"}<br />
                            Status Code: {this.props.itemForInfoView.response ? this.props.itemForInfoView.response.statusCode : "/"}<br />
                            Time: {this.props.itemForInfoView.request && this.props.itemForInfoView.request.ts && this.props.itemForInfoView.response && this.props.itemForInfoView.response.ts ? (this.props.itemForInfoView.response.ts - this.props.itemForInfoView.request.ts) + " ms" : "/"}<br />
                            State: {ListView.renderConnectionState(this.props.itemForInfoView.state)}<br />
                        </p>
                    </div>
                    {this.props.itemForInfoView.request && this.props.itemForInfoView.request.headers ? (
                        <div class="card-body">
                            <h5 class="card-title text-white">Request Headers</h5>
                            <p class="card-text text-white">
                                {Object.keys(this.props.itemForInfoView.request.headers).map(headerKey => {
                                    return `${headerKey}: ${this.props.itemForInfoView!!.request!!.headers!![headerKey]}`
                                })}
                            </p>
                        </div>
                    ) : null}
                    {this.props.itemForInfoView.response && this.props.itemForInfoView.response.headers ? (
                        <div class="card-body">
                            <h5 class="card-title xtext-white">Response Headers</h5>
                            <p class="card-text text-white">
                                {Object.keys(this.props.itemForInfoView.response.headers).map(headerKey => {
                                    return `${headerKey}: ${this.props.itemForInfoView!!.response!!.headers!![headerKey]}`
                                })}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }

}

class InfoPreviewView extends Component<{ itemForInfoView: ConnectionItem | undefined }> {

    render() {
        if (this.props.itemForInfoView === undefined) {
            return (
                <p class="card-text text-white" style="margin: 12px 12px 12px 12px;">
                    No Response.
                </p>
            )
        }
        if (this.props.itemForInfoView.response && this.props.itemForInfoView.response.body) {
            const body = atob(this.props.itemForInfoView.response.body)
            try {
                let obj = JSON.parse(body)
                return (<pre class="text-white" style="margin: 12px 12px 12px 12px;"><code class="json">{JSON.stringify(obj, undefined, 4)}</code></pre>)
            } catch (error) { }
            return (
                <p class="card-text text-white" style="margin: 12px 12px 12px 12px;">
                    {body}
                </p>
            )
        }
        return <div />
    }

}

class InfoResponseView extends Component<{ itemForInfoView: ConnectionItem | undefined }> {

    render() {
        if (this.props.itemForInfoView === undefined) {
            return (
                <p class="card-text text-white" style="margin: 12px 12px 12px 12px;">
                    No Response.
                </p>
            )
        }
        if (this.props.itemForInfoView.response && this.props.itemForInfoView.response.body) {
            return (
                <p class="card-text text-white" style="margin: 12px 12px 12px 12px;">
                    {atob(this.props.itemForInfoView.response.body)}
                </p>
            )
        }
        return null
    }

}

class InfoHackView extends Component {

    render() {
        return <div />
    }

}

render(<App />, document.body)
import { h, render, Component } from "preact";

interface DataItem {
    dataKey: string
    dataValue: any
    dataType: string
}

class DataFetcher {

    suiteName: string | undefined
    fetchTimeoutHandler: any

    fetch(): Promise<DataItem[]> {
        clearInterval(this.fetchTimeoutHandler)
        return new Promise((res) => {
            this.fetchTimeoutHandler = setInterval(() => {
                rpcClient.emitToClients("com.xt.userdefaults.list", this.suiteName)
            }, 1000)
            rpcClient.once("com.xt.userdefaults.list.result", (message: RPCMessage) => {
                clearInterval(this.fetchTimeoutHandler)
                const data = message.args[0].data
                res(Object.keys(data).map(it => {
                    return {
                        dataKey: it,
                        dataValue: data[it],
                        dataType: typeof data[it]
                    }
                }))
            })
            rpcClient.emitToClients("com.xt.userdefaults.list", this.suiteName)
        })
    }

    deleteItem(item: DataItem) {
        rpcClient.emitToClients("com.xt.userdefaults.write", undefined, item.dataKey, this.suiteName || undefined)
    }

    editItem(item: DataItem) {
        rpcClient.emitToClients("com.xt.userdefaults.write", (() => {
            if (item.dataType === "string") {
                return item.dataValue
            }
            else if (item.dataType === "number") {
                return parseFloat(item.dataValue)
            }
            else if (item.dataType === "boolean") {
                return item.dataValue === "true"
            }
            else if (item.dataType === "object") {
                try {
                    return JSON.parse(item.dataValue)
                } catch (error) { }
                return {}
            }
        })(), item.dataKey, this.suiteName)
    }

}

class App extends Component<any, { items: DataItem[], isLoading: boolean }> {

    dataFetcher = new DataFetcher()

    constructor() {
        super()
        this.state = {
            items: [],
            isLoading: false,
        }
    }

    componentDidMount() {
        this.reloadData()
    }

    reloadData() {
        this.setState({ isLoading: true })
        this.dataFetcher.fetch().then(items => {
            this.setState({ items, isLoading: false })
        }).catch(() => {
            this.setState({ isLoading: false })
        })
    }

    render() {
        return (
            <div>
                <div id="areaRef" style="height: 100%; width: 100%; position: absolute; display: none"></div>
                <div class="container-fluid">
                    <SuiteBar onChange={(text) => {
                        this.dataFetcher.suiteName = text
                        this.reloadData()
                    }} onRefresh={() => {
                        this.reloadData()
                    }} isLoading={this.state.isLoading} />
                    <ListView items={this.state.items} onDeleteItem={(it) => {
                        this.dataFetcher.deleteItem(it)
                        this.setState({ items: this.state.items.filter(stateData => stateData.dataKey !== it.dataKey) })
                    }} onEditItem={(it, isNewRow) => {
                        this.dataFetcher.editItem(it)
                        if (isNewRow) {
                            const items = this.state.items.slice()
                            items.push(it)
                            this.setState({
                                items,
                            })
                        }
                        else {
                            this.setState({
                                items: this.state.items.map(stateData => {
                                    if (stateData.dataKey === it.dataKey) {
                                        stateData.dataValue = it.dataValue
                                    }
                                    return stateData
                                })
                            })
                        }
                    }} />
                </div>
            </div>
        )
    }

}

class SuiteBar extends Component<{ onChange: (text: string) => void, onRefresh: () => void, isLoading: boolean }> {

    render() {
        return (
            <div class="row">
                <div class="input-group input-group-sm mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Suite Name</span>
                    </div>
                    <input type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm" placeholder="standard" onChange={(e: any) => {
                        this.props.onChange(e.target.value)
                    }} />
                    <div class="input-group-append" style="cursor: pointer">
                        <span onClick={() => {
                            this.props.onRefresh()
                            this.setState({ isLoading: true })
                        }} class="input-group-text" id="basic-addon2">{this.props.isLoading === true ? <span dangerouslySetInnerHTML={{ __html: `<svg width="18px" height="18px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling" style="background-image: none; background-position: initial initial; background-repeat: initial initial;"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="#1d3f72" stroke-width="10" r="35" stroke-dasharray="164.93361431346415 56.97787143782138"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>` }}></span> : "Refresh"} </span>
                    </div>
                </div>
            </div>
        )
    }

}

class ListView extends Component<{ items: DataItem[], onDeleteItem: (item: DataItem) => void, onEditItem: (item: DataItem, isNewRow: boolean) => void }, any> {

    renderRow(row: DataItem) {
        return (
            <tr>
                <th style="width: 25%; line-height: 30px" scope="row">{row.dataKey}</th>
                <td style="width: 25%; line-height: 30px">{typeof row.dataValue === "object" ? JSON.stringify(row.dataValue) : String(row.dataValue)}</td>
                <td style="width: 25%; line-height: 30px">{row.dataType}</td>
                <td style="width: 25%">
                    <button type="button" class="btn btn-secondary btn-sm" style="transform: scale(0.8,0.8);" onClick={() => {
                        const newValue = prompt(row.dataKey, typeof row.dataValue === "object" ? JSON.stringify(row.dataValue) : String(row.dataValue))
                        if (typeof newValue === "string") {
                            row.dataValue = newValue
                            this.props.onEditItem(row, false)
                        }
                    }}>Edit</button>
                    <button type="button" class="btn btn-warning btn-sm" style="transform: scale(0.8,0.8);" onClick={() => {
                        this.props.onDeleteItem(row)
                    }}>Delete</button>
                </td>
            </tr>
        )
    }

    render() {
        return (
            <div id="listArea" class="row">
                <table class="table table-dark table-hover table-sm">
                    <thead>
                        <tr>
                            <th style="width: 25%" scope="col">Key</th>
                            <th style="width: 25%" scope="col">Value</th>
                            <th style="width: 25%" scope="col">Type</th>
                            <th style="width: 25%" scope="col">Operation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.items.map(it => this.renderRow(it))}
                        <tr>
                            <th colSpan={4} style="text-align: center">
                                <button type="button" class="btn btn-success btn-sm" style="transform: scale(0.8,0.8);" onClick={() => {
                                    const rowKey = prompt("Key", "")
                                    if (rowKey === null) { return }
                                    const rowValue = prompt("Value", "")
                                    if (rowValue === null) { return }
                                    const rowType = prompt("Type, one of [string, number, boolean, object]", "string")
                                    if (rowType === null) { return }
                                    if (typeof rowKey === "string" && typeof rowValue === "string" && typeof rowType === "string") {
                                        this.props.onEditItem({
                                            dataKey: rowKey,
                                            dataValue: rowValue,
                                            dataType: rowType,
                                        }, true)
                                    }
                                }}>New Row</button>
                            </th>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }

}

render(<App />, document.body)
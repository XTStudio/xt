import { h, render, Component } from "preact";
declare var $: any

interface DataItem {
    dataKey: string
    dataValue: any
    dataType: string
}

const ignoringKeys = ["AddingEmojiKeybordHandled", "Apple", "PK", "NS", "AK"]

class DataFetcher {

    suiteName: string | undefined
    fetchTimeoutHandler: any

    fetch(): Promise<DataItem[]> {
        clearInterval(this.fetchTimeoutHandler)
        return new Promise((res) => {
            if (this.suiteName !== undefined && this.suiteName.length === 0) { this.suiteName = undefined }
            this.fetchTimeoutHandler = setInterval(() => {
                rpcClient.emitToClients("com.xt.userdefaults.list", this.suiteName)
            }, 1000)
            rpcClient.once("com.xt.userdefaults.list.result", (message: RPCMessage) => {
                clearInterval(this.fetchTimeoutHandler)
                const data = message.args[0].data
                res(Object.keys(data).filter(it => {
                    return ignoringKeys.every(ik => !(it === ik || it.startsWith(ik)))
                }).map(it => {
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
        rpcClient.emitToClients("com.xt.userdefaults.write", item.dataValue, item.dataKey, this.suiteName)
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
                        if (it.dataKey.length === 0 || it.dataValue.length === 0 || it.dataType.length === 0) { return }
                        const trimedIt = {
                            ...it, dataValue: (() => {
                                if (it.dataType === "string") {
                                    return it.dataValue
                                }
                                else if (it.dataType === "number") {
                                    return parseFloat(it.dataValue)
                                }
                                else if (it.dataType === "boolean") {
                                    return it.dataValue === "true"
                                }
                                else if (it.dataType === "object") {
                                    try {
                                        return JSON.parse(it.dataValue)
                                    } catch (error) { }
                                    return {}
                                }
                            })()
                        }
                        this.dataFetcher.editItem(trimedIt)
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

class ListView extends Component<{ items: DataItem[], onDeleteItem: (item: DataItem) => void, onEditItem: (item: DataItem, isNewRow: boolean) => void }, { editingItem: DataItem | undefined, isNewRowWhileEditing: boolean }> {

    renderRow(row: DataItem) {
        return (
            <tr>
                <th style="width: 25%; line-height: 30px; max-width: 200px; overflow: hidden" scope="row">{row.dataKey}</th>
                <td style="width: 25%; line-height: 30px; max-width: 200px; overflow: hidden">{typeof row.dataValue === "object" ? JSON.stringify(row.dataValue) : String(row.dataValue)}</td>
                <td style="width: 25%; line-height: 30px">{row.dataType}</td>
                <td style="width: 25%">
                    <button type="button" class="btn btn-secondary btn-sm" style="transform: scale(0.8,0.8);" onClick={() => {
                        this.setState({
                            editingItem: row,
                            isNewRowWhileEditing: false,
                        })
                        $('#rowEditor').modal('show')
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
                                    this.setState({
                                        editingItem: undefined,
                                        isNewRowWhileEditing: true,
                                    })
                                    $('#rowEditor').modal('show')
                                }}>New Row</button>
                            </th>
                        </tr>
                    </tbody>
                </table>
                <RowEditor isNewRow={this.state.isNewRowWhileEditing} dataItem={this.state.editingItem} onSave={(it) => {
                    this.props.onEditItem(it, this.state.isNewRowWhileEditing)
                    $('#rowEditor').modal('hide')
                }} />
            </div>
        )
    }

}

class RowEditor extends Component<{ isNewRow: boolean, dataItem: DataItem | undefined, onSave: (newItem: DataItem) => void }> {

    render() {
        return (
            <div class="modal fade" id="rowEditor" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">{this.props.isNewRow ? "New" : "Edit"}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form>
                                <div class="form-group row">
                                    <label for="inputEmail3" class="col-sm-2 col-form-label">Key</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="editorDataKey" placeholder="" value={this.props.dataItem ? this.props.dataItem.dataKey : ''} readOnly={this.props.isNewRow ? false : true} />
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="inputEmail3" class="col-sm-2 col-form-label">Value</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="editorDataValue" placeholder="" value={this.props.dataItem ? (typeof this.props.dataItem.dataValue === "object" ? JSON.stringify(this.props.dataItem.dataValue) : String(this.props.dataItem.dataValue)) : ''} onKeyPress={(e) => {
                                            if (e.keyCode === 13) {
                                                this.props.onSave({
                                                    dataKey: $('#editorDataKey').val(),
                                                    dataValue: $('#editorDataValue').val(),
                                                    dataType: $('input[name=inlineRadioOptions]:checked').val(),
                                                })
                                            }
                                        }} />
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="inputEmail3" class="col-sm-2 col-form-label">Type</label>
                                    <div class="col-sm-10" style="padding-top: 7px;">
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="typeString" value="string" checked={(this.props.dataItem && this.props.dataItem.dataType === "string") || this.props.isNewRow} />
                                            <label class="form-check-label" for="typeString">String</label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="typeNumber" value="number" checked={this.props.dataItem && this.props.dataItem.dataType === "number"} />
                                            <label class="form-check-label" for="typeNumber">Number</label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="typeBoolean" value="boolean" checked={this.props.dataItem && this.props.dataItem.dataType === "boolean"} />
                                            <label class="form-check-label" for="typeBoolean">Boolean</label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="typeObject" value="object" checked={this.props.dataItem && this.props.dataItem.dataType === "object"} />
                                            <label class="form-check-label" for="typeObject">Object</label>
                                        </div>
                                    </div>
                                </div>
                            </form>

                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onClick={() => {
                                this.props.onSave({
                                    dataKey: $('#editorDataKey').val(),
                                    dataValue: $('#editorDataValue').val(),
                                    dataType: $('input[name=inlineRadioOptions]:checked').val(),
                                })
                            }}>Save</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

render(<App />, document.body)
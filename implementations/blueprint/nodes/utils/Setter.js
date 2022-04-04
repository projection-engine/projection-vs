import Node from "../../../../flow/Node";
import {TYPES} from "../../../../flow/TYPES";
import NODE_TYPES from "../../../../flow/NODE_TYPES";

export const startKey = 'start'
export default class Setter extends Node {

    constructor(id, name, type) {
        super(
            [
                {label: 'Start', key: startKey, accept: [TYPES.EXECUTION]},
                {label: 'Value', key: 'value', accept: [type]}
            ],
            [
                {label: 'Execute', key: 'EXECUTION', type: TYPES.EXECUTION},
                {label: 'Value', key: 'newValue', type: type}
            ]);
        this.id = id
        this.size = 1
        this.name = name
    }

    get type() {
        return NODE_TYPES.SETTER
    }

    static compile(tick, {value}, entities, attributes, nodeID, executors, setExecutors) {

        setExecutors({
            ...executors,
            [nodeID.split('/')[0]]: {
                value
            }
        })
        attributes[nodeID] = {}
        attributes[nodeID].newValue = value
        return attributes
    }
}
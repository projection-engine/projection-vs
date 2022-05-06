import Node from "../../../components/Node";
import {DATA_TYPES} from "../../../../../engine/templates/DATA_TYPES";
import NODE_TYPES from "../../../components/NODE_TYPES";


export default class Branch extends Node {

    constructor() {
        super(
            [
                {label: 'A', key: 'line', accept: [DATA_TYPES.EXECUTION]},
                {label: 'Condition', key: 'condition', accept: [DATA_TYPES.BOOL]}
            ],
            [
                {label: 'True', key: 'trueLine', type: DATA_TYPES.EXECUTION, showTitle: true},
                {label: 'False', key: 'falseLine', type: DATA_TYPES.EXECUTION, showTitle: true},
            ],
        );
        this.name = 'Branch'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.BRANCH
    }

    static compile({
                       inputs,
                       object
                   }) {
        return inputs.condition ? object.trueLine : object.falseLine
    }
}
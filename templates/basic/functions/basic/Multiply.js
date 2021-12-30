import Function from "../Function";


export default class Multiply extends Function {
    response

    constructor(constA, constB) {
        super([
            {label: 'A', key: 'constA', accept: ['Constant', 'Multiply', 'Divide', 'Add', 'Subtract', 'Power']},
            {label: 'B', key: 'constB', accept: ['Constant', 'Multiply', 'Divide', 'Add', 'Subtract', 'Power']}
        ],[{label: 'Result', key: 'response'}]);
        this.constA = constA
        this.constB = constB
        this.name = 'Multiply'
    }

    execute() {
        this.response = this.constA * this.constB
    }
}
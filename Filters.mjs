import AndFilter from './AndFilter.mjs'
import OrFilter from './OrFilter.mjs'
export default class FilterManager{
    constructor(){
        this.operations = {}
        this.filtered = []
        this.operations[AndFilter.getOperator()] = new AndFilter()
        this.operations[OrFilter.getOperator()] = new OrFilter();
    }
    applyOperator(operator, rooms, options){
        let selected_operator;
        console.log(operator)
        if(operator){
            selected_operator = this.operations[operator]
        }else{
            selected_operator = this.operations[OrFilter.getOperator()]
        }
        delete options.operator
        console.log(selected_operator)
        for(let room in rooms){
            selected_operator.eval.call(this, rooms[room],options)
        }
        
    }
    getFiltered(){
        return this.filtered;
    }
}
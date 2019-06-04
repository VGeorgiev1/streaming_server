
export default class OrFilter{
    constructor(){
    }
    eval(room, options){
        for(let option in options){
            if(room[option] == options[option]){
                this.filtered.push(room)
                break;
            }
        }
    }
    static getOperator(){
        return 'or'
    }
}

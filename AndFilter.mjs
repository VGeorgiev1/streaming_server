export default class AndFilter{
    constructor(){
    }
    eval(room,options){
        for(let option in options){
            if(room[option] != options[option]){
                return;
            }
        }
        this.filtered.push(room)
    }
    static getOperator(){
        return 'and'
    }
}
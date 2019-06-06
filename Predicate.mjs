
export default class Predicate{
    constructor(collect){
        this.predicate = null;
        this.on_collect = collect
        this._or = (p1, p2)=> {
            return function(x) {
                return p1(x) || p2(x);
            }
        }
        this._and = (p1, p2) => {
            return function(x) {
                return p1(x) && p2(x);
            }
        }
        this._equals = (p) => {
            return function(x) {
                return p(x);
            }
        }
        this.__equals = (a,b) =>{
            return function(x){
                if(x[a]){
                    if(Array.isArray(x[a])){
                        
                        return x[a].includes(b)
                    }
                    return x[a] == b
                }
                return false;
            }
        }
    }
    initialize(val,prop){
        this.predicate = this.__equals(prop,val)
    }
    collect(){
        return this.on_collect(this.predicate)
    }
    or(options) {
        for(let option in options){
            this.predicate = this._or(this.predicate, this.__equals(option,options[option]))
        }
        return this
    }
    and(options){
        for(let option in options){

            this.predicate =  this._and(this.predicate, this.__equals(option,options[option]))
        }
        return this
    }
    getPredicate(){
        return this.predicate
    }
}

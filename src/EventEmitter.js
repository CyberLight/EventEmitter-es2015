
class EventEmitter {
    constructor (){
        this._events = new Map();
    }

    getListeners (evt) {
        let response;

        if( evt instanceof RegExp ){
            response = new Map();
            for(let {key, value} of this._events){
                if(evt.test(key)){
                    response.set(key, value);
                }
            }
        } else {
            response = this._events.get(evt) || (this._events.set(evt, []) && this._events.get(evt));
        }

        return response;
    }
}
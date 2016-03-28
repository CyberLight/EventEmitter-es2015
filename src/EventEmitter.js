
class EventEmitter {
    constructor (){
        this._events = new Map();
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    getListeners (evt) {
        let response;

        if( evt instanceof RegExp ){
            response = new Map();
            for(let [key, value] of this._events){
                if(evt.test(key)){
                    response.set(key, value);
                }
            }
        } else {
            response = this._events.get(evt) || (this._events.set(evt, []) && this._events.get(evt));
        }

        return response;
    }

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    addListener (evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        let listenerIsWrapped = typeof listener == "object";
        
        for( var [key, eventListeners] of listeners ) {
            if(this.indexOfListener(eventListeners, listener) === -1){
                this._events.get(key).push(listenerIsWrapped ? listener : new Map([
                    ['listener', listener],
                    ['once', false]
                ]));
            }
        }

        return this;
    }

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    getListenersAsObject (evt) {
        let listeners = this.getListeners(evt);
        let response;

        if(Array.isArray(listeners)){
            response = new Map();
            response.set(evt, listeners);
        }

        return response || listeners;
    }

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    indexOfListener (listeners, listener) {
        let i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }
}
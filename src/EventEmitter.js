/*!
 * ES2015 version author:
 * Alexander Vishnyakov - git.io/vV0Fm
 * ES2015 version of EventEmitter v4.2.11 - git.io/vV0FR
 *
 * From original author:
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

;(function () {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    class EventEmitter {
        constructor() {
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
        getListeners(evt) {
            let response;

            if (evt instanceof RegExp) {
                response = new Map();
                for (let [key, value] of this._events) {
                    if (evt.test(key)) {
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
        addListener(evt, listener) {
            var listeners = this.getListenersAsObject(evt);
            let listenerIsWrapped = typeof listener == "object";

            for (var [key, eventListeners] of listeners) {
                if (this.indexOfListener(eventListeners, listener) === -1) {
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
        getListenersAsObject(evt) {
            let listeners = this.getListeners(evt);
            let response;

            if (Array.isArray(listeners)) {
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
        indexOfListener(listeners, listener) {
            return listeners.findIndex(map => map.get('listener') === listener);
        }

        /**
         * Takes a list of listener objects and flattens it into a list of listener functions.
         *
         * @param {Object[]} listeners Raw listener objects.
         * @return {Function[]} Just the listener functions.
         */
        flattenListeners(listeners) {
            return listeners.map(map => map.get('listener'));
        }

        /**
         * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
         * You need to tell it what event names should be matched by a regex.
         *
         * @param {String} evt Name of the event to create.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        defineEvent(evt) {
            this.getListeners(evt);
            return this;
        }

        /**
         * Uses defineEvent to define multiple events.
         *
         * @param {String[]} evts An array of event names to define.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        defineEvents(evts) {
            evts.forEach(e => this.defineEvent(e));
            return this;
        }

        /**
         * Emits an event of your choice.
         * When emitted, every listener attached to that event will be executed.
         * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
         * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
         * So they will not arrive within the array on the other side, they will be separate.
         * You can also pass a regular expression to emit to all events that match it.
         *
         * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
         * @param {Array} [args] Optional array of arguments to be passed to each listener.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        emitEvent(evt, args) {
            var listenersMap = this.getListenersAsObject(evt);
            for (let [event, listeners] of listenersMap) {
                let copyOfListeners = listeners.slice();
                for (var listenerMap of copyOfListeners) {
                    let [listener, once] = listenerMap.values();
                    if (once) {
                        this.removeListener(event, listener);
                    }
                    let response = listener.call(this, ...args || []);
                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener);
                    }
                }
            }
            return this;
        }

        /**
         * Removes a listener function from the specified event.
         * When passed a regular expression as the event name, it will remove the listener from all events that match it.
         *
         * @param {String|RegExp} evt Name of the event to remove the listener from.
         * @param {Function} listener Method to remove from the event.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        removeListener(evt, listener) {
            var listeners = this.getListenersAsObject(evt);
            for (var [event, eventListeners] of listeners) {
                var index = this.indexOfListener(eventListeners, listener);
                if (index !== -1) {
                    this._events.get(event).splice(index, 1);
                }
            }
            return this;
        }

        /**
         * Sets the current value to check against when executing listeners. If a
         * listeners return value matches the one set here then it will be removed
         * after execution. This value defaults to true.
         *
         * @param {*} value The new value to check for when executing listeners.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        setOnceReturnValue(value) {
            this._onceReturnValue = value;
            return this;
        }

        /**
         * Fetches the current value to check against when executing listeners. If
         * the listeners return value matches this one then it should be removed
         * automatically. It will return true by default.
         *
         * @return {*|Boolean} The current value to check for or the default, true.
         * @api private
         */
        _getOnceReturnValue() {
            if (this.hasOwnProperty('_onceReturnValue')) {
                return this._onceReturnValue;
            }
            else {
                return true;
            }
        }

        /**
         * Semi-alias of addListener. It will add a listener that will be
         * automatically removed after its first execution.
         *
         * @param {String|RegExp} evt Name of the event to attach the listener to.
         * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        addOnceListener(evt, listener) {
            return this.addListener(evt, new Map([
                ['listener', listener],
                ['once', true]
            ]));
        }

        /**
         * Removes all listeners from a specified event.
         * If you do not specify an event then all listeners will be removed.
         * That means every event will be emptied.
         * You can also pass a regex to remove all events that match it.
         *
         * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        removeEvent(evt) {
            var type = typeof evt;
            // Remove different things depending on the state of evt
            if (type === 'string') {
                // Remove all listeners for the specified event
                this._events.delete(evt);
            } else if (evt instanceof RegExp) {
                let eventsToDelete = Array.from(this._events.keys()).filter(e => evt.test());
                eventsToDelete.forEach(en => this._events.delete(en));
            } else {
                // Remove all listeners in all events
                this._events.clear();
            }
            return this;
        }

        /**
         * Adds listeners in bulk using the manipulateListeners method.
         * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
         * You can also pass it a regular expression to add the array of listeners to all events that match it.
         * Yeah, this function does quite a bit. That's probably a bad thing.
         *
         * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
         * @param {Function[]} [listeners] An optional array of listener functions to add.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        addListeners(evt, listeners) {
            // Pass through to manipulateListeners
            return this.manipulateListeners(false, evt, listeners);
        };

        /**
         * Removes listeners in bulk using the manipulateListeners method.
         * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
         * You can also pass it an event name and an array of listeners to be removed.
         * You can also pass it a regular expression to remove the listeners from all events that match it.
         *
         * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
         * @param {Function[]} [listeners] An optional array of listener functions to remove.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        removeListeners(evt, listeners) {
            // Pass through to manipulateListeners
            return this.manipulateListeners(true, evt, listeners);
        };

        /**
         * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
         * The first argument will determine if the listeners are removed (true) or added (false).
         * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
         * You can also pass it an event name and an array of listeners to be added/removed.
         * You can also pass it a regular expression to manipulate the listeners of all events that match it.
         *
         * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
         * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
         * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        manipulateListeners(remove, evt, listeners) {
            var single = remove ? this.removeListener : this.addListener;
            var multiple = remove ? this.removeListeners : this.addListeners;
            // If evt is an object then pass each of its properties to this method
            if (typeof evt == 'object' && evt.toString() == "[object Map]") {
                for (var [event, listener] of evt) {
                    if (typeof listener === 'function') {
                        single.call(this, event, listener);
                    } else if (Array.isArray(listener)) {
                        multiple.call(this, event, listener);
                    }
                }
            } else if (Array.isArray(listeners)) {
                listeners.forEach(listener => single.call(this, evt, listener));
            }
            return this;
        }

        /**
         * Alias of removeEvent.
         *
         * Added to mirror the node API.
         */
        removeAllListeners() {
            return this.removeEvent(...arguments);
        }

        /**
         * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
         * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
         *
         * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
         * @param {...*} Optional additional arguments to be passed to each listener.
         * @return {Object} Current instance of EventEmitter for chaining.
         */
        emit() {
            let [evt, ...args] = arguments;
            return this.emitEvent(evt, args);
        };

        /**
         * Alias of addListener
         */
        on() {
            return this.addListener(...arguments);
        }

        /**
         * Alias of emitEvent
         */
        trigger() {
            return this.emitEvent(...arguments);
        }

        /**
         * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
         *
         * @return {Function} Non conflicting EventEmitter class.
         */
        static noConflict() {
            exports.EventEmitter = originalGlobalValue;
            return EventEmitter;
        };
    }

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}.call(this));
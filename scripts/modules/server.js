import { world, system } from "@minecraft/server";
import { insertToArray } from "./helpers/array.js";

/**
 * @description - Class with helper functions that relate to scheduling or backend functioning of the server.
 */
class Server {
    constructor(initialTick = 0) {
        this.#tick = initialTick;
        const tickEvent = () => {
            system.run(tickEvent);
            //Property 'tick'
            this.#tick++;
            //Property 'playersLoaded'
            if (this.#playersLoaded === false && [...world.getPlayers()].length) {
                this.#playersLoaded = true;
            }
            //Timeout functionality
            for (let index = 0; index < this.#timeouts.length; index++) {
                const item = this.#timeouts[index];
                if (item && this.#tick === item[1]) {
                    item[0]();
                    delete this.#timeouts[index];
                }
            }
            //Interval functionality
            for (let index = 0; index < this.#intervals.length; index++) {
                const item = this.#intervals[index];
                if (item && this.#tick === item[1]) {
                    item[0]();
                    item[1] += item[2];
                }
            }
        }

        system.run(tickEvent);

        system.events.beforeWatchdogTerminate.subscribe(eventData => {
            eventData.cancel = this.#watchdogTerminate;
        });
    }

    #tick = 0
    #playersLoaded = false
    #watchdogTerminate = false
    #timeouts = []
    #intervals = []

    /**
     * @param {boolean} value - Set to `true` to cancel watchdog server termination.
     */
    set cancelTerminations(value) {
        this.#watchdogTerminate = value;
        return this.#watchdogTerminate;
    }

    get tick() {
        return this.#tick;
    }

    get playersLoaded() {
        return this.#playersLoaded;
    }

    setTimeout(callback, ticks,) {
        return insertToArray(this.#timeouts,[callback, this.#tick + ticks]);
    }
    
    clearTimeout(index) {
        delete this.#timeouts[index];
    }
    
    setInterval(callback, ticks) {
        return insertToArray(this.#intervals,[callback, this.#tick + ticks, ticks]);
    }
    
    clearInterval(index) {
        delete this.#intervals[index];
    }

    /**
     * @param {string} eventName Name of the event function is waiting for.
     * @param {object} callback Callback that gets passed event data, it must return object that will be pushed into an array that gets resolved later to count the event as successful or number to modify the `tries` variable.
     * @param {number} tries A variable that changes everytime the event fires depending on the condition return value if it is a number. Getting `tires` to/below 0 results in rejection of the promise.
     * @param {number} timeout Number of ticks before rejecting the promise. Enter 0 for infinite timeout (not recommended).
     * @param {number} amount Number of events to wait for before resolving the promise, it mjust get there or else the promise times out. 0 will wait until the timeout and resolve evrything that met the condition. Negative values will resolve the promise even if it doesn't get to the requested amount.
     */
     async asyncWaitForEvent(eventName,callback,tries = 10,timeout = 200,amount = 1) {
        return new Promise((resolve, reject) => {
            let savedEvents = [];
            let timeoutIndex;
            const event = world.events[eventName].subscribe((data) => {
                const result = callback(data);
                if (Number.isFinite(result)) {
                    tries += result;
                    if (tries <= 0) {
                        if (timeout > 0) this.clearTimeout(timeoutIndex);
                        world.events[eventName].unsubscribe(event);
                        reject({timeout:false,tries:true});
                    }
                } else if (result instanceof Object) {
                    savedEvents.push(result);
                    if ((amount > 0 && savedEvents.length === amount) || (amount < 0 && savedEvents.length + amount === 0)) {
                        if (timeout > 0) this.clearTimeout(timeoutIndex);
                        world.events[eventName].unsubscribe(event);
                        resolve(savedEvents);
                    }
                } else console.warn('[Script] Invalid condition return value!');
            });

            if (timeout > 0) {
                if (amount > 0) {
                    timeoutIndex = this.setTimeout(() => {
                        world.events[eventName].unsubscribe(event);
                        reject({timeout:true,tries:false});
                    },timeout)
                } else {
                    timeoutIndex = this.setTimeout(() => {
                        world.events[eventName].unsubscribe(event);
                        resolve(savedEvents);
                    },timeout)
                }
            }
        });
    }
}

export { Server }
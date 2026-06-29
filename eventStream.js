class SseEventStreamer {
    /** @type {SseEventStreamer?} */
    static instance = null;
    static subscriptions = new Map();
    static retryConfig = {
        maxRetries: 5,
        retryDelay: 1000,
        currentRetries: 0
    };

    /**
     * @param {Object} options
     * @param {string} [options.sseEndpoint="http://localhost:9000/_specmatic/studio/sse"]
     * @returns {SseEventStreamer}
     */
    static getInstance(options = {}) {
        if (!SseEventStreamer.instance) SseEventStreamer.instance = new SseEventStreamer(options);
        return SseEventStreamer.instance;
    }

    /**
     * @param {Object} options
     * @param {string} [options.sseEndpoint="http://localhost:9000/_specmatic/studio/sse"]
     */
    constructor(options = {}) {
        const protocol = window.location.protocol.replace(':', '');
        const { sseEndpoint = protocol + "://" + window.location.host + "/_specmatic/studio/sse" } = options;
        this.sseEndpoint = sseEndpoint;
        this.eventSource = null;
        this.initializeConnection();
    }

    initializeConnection() {
        if (this.eventSource) this.eventSource.close();
        this.eventSource = new EventSource(this.sseEndpoint);

        const handler = (eventType) => (event) => this.handleIncomingEvent({ eventType, id: event.lastEventId, rawData: event.data });
        this.eventSource.onmessage = handler('data');
        this.eventSource.addEventListener("data", handler('data'));
        this.eventSource.addEventListener("end", handler('end'));
        this.eventSource.addEventListener("error", handler('error'));

        this.eventSource.onerror = (e) => {
            const readyState = this.eventSource?.readyState;
            if (readyState === EventSource.CLOSED) {
                if (!document.hidden && !navigator.onLine) {
                    console.warn('Network offline, skipping retry.');
                    return;
                }

                if (SseEventStreamer.retryConfig.currentRetries < SseEventStreamer.retryConfig.maxRetries) {
                    SseEventStreamer.retryConfig.currentRetries++;
                    console.log(`Retrying connection (attempt ${SseEventStreamer.retryConfig.currentRetries})...`);
                    setTimeout(() => { this.initializeConnection() }, SseEventStreamer.retryConfig.retryDelay);
                } else {
                    console.error('Max retry attempts reached');
                    this.notifySubscribers({ eventType: 'error', payload: { error: 'Connection failed after retries' } });
                }
            }
        };

        this.eventSource.onopen = () => {
            SseEventStreamer.retryConfig.currentRetries = 0;
            console.log('SSE connection established');
        };
    }

    handleIncomingEvent({ eventType, id, rawData }) {
        const key = `${id}-${eventType}`;
        const callbacks = SseEventStreamer.subscriptions.get(key) || [];
        if (callbacks.length === 0) return;

        let payload;
        try {
            payload = JSON.parse(rawData);
        } catch (_) {
            payload = rawData;
        }

        for (const callback of callbacks) {
            try { callback(payload); }
            catch (err) { console.error(`Error in ${key} handler`, err); }
        }

        if (eventType === "end" || eventType === "error") {
            this.removeListener({ eventId: id, eventType });
        }
    }

    /**
     * @param {Object} options
     * @param {string} options.eventType
     * @param {Object} options.payload
     */
    notifySubscribers(options) {
        const { eventType, payload } = options;
        const subscribers = SseEventStreamer.subscriptions.get(eventType) || [];
        for (const callback of subscribers) {
            try {
                callback(payload);
            } catch (err) {
                console.error(`Error in ${eventType} subscriber:`, err);
            }
        }
    }

    /**
     * @param {Object} options
     * @param {string} options.eventId
     * @param {Object} [options.callbacks]
     * @param {function(Object): void} [options.callbacks.onData]
     * @param {function(Object): void} [options.callbacks.onEnd]
     * @param {function(Object): void} [options.callbacks.onError]
     * @returns {function(): void}
     */
    static subscribe(options) {
        const { eventId, callbacks = {} } = options;
        const instance = SseEventStreamer.getInstance();

        if (callbacks.onData) {
            instance.addListener({ eventId, eventType: 'data', callback: callbacks.onData });
        }

        if (callbacks.onEnd) {
            instance.addListener({ eventId, eventType: 'end', callback: callbacks.onEnd });
        }

        if (callbacks.onError) {
            instance.addListener({ eventId, eventType: 'error', callback: callbacks.onError });
        }

        return () => {
            instance.removeListener({ eventId, eventType: 'data', callback: callbacks.onData });
            instance.removeListener({ eventId, eventType: 'end', callback: callbacks.onEnd });
            instance.removeListener({ eventId, eventType: 'error', callback: callbacks.onError });
        };
    }

    static subscribeChannel(eventId, callbacks) {
        return SseEventStreamer.subscribe({ eventId, callbacks });
    }

    /**
     * @param {Object} options
     * @param {string} options.eventId
     * @param {string} options.eventType
     * @param {Function} options.callback
     */
    addListener({ eventId, eventType, callback }) {
        const key = `${eventId}-${eventType}`;
         if (!SseEventStreamer.subscriptions.has(key)) SseEventStreamer.subscriptions.set(key, []);
         SseEventStreamer.subscriptions.get(key).push(callback);
    }

    /**
     * @param {Object} options
     * @param {string} options.eventId
     * @param {string} options.eventType
     * @param {Function?} options.callback
     */
    removeListener({ eventId, eventType, callback }) {
        const key = `${eventId}-${eventType}`;
        if (!callback) {
            SseEventStreamer.subscriptions.delete(key);
            return;
        }

        const arr = SseEventStreamer.subscriptions.get(key) || [];
        SseEventStreamer.subscriptions.set(key,arr.filter(cb => cb !== callback));
    }

    static close() {
        if (SseEventStreamer.instance?.eventSource) {
            SseEventStreamer.instance.eventSource.close();
            SseEventStreamer.instance = null;
            SseEventStreamer.subscriptions.clear();
        }
    }
}

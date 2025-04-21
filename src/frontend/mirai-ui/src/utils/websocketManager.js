export class WebSocketManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.socket = null;
    this.messageHandlers = [];
    this.endpoint = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Start with 2 seconds
  }

  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - The endpoint to connect to (e.g. 'global' or 'conversation/abc123')
   */
  connect(endpoint) {
    if (this.socket && this.isConnected && this.endpoint === endpoint) {
      console.log("Already connected to this endpoint, skipping");
      return;
    }

    // Close existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    this.endpoint = endpoint;
    const url = `${this.baseUrl}/${endpoint}`;

    console.log(`Connecting to WebSocket at ${url}`);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(`WebSocket connected to ${url}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        // Notify all handlers
        this.messageHandlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error("Error in message handler:", error);
          }
        });
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this.isConnected = false;

      // Attempt to reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay =
          this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
        console.log(`Attempting to reconnect in ${delay}ms...`);

        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(this.endpoint);
        }, delay);
      } else {
        console.error("Maximum reconnection attempts reached. Giving up.");
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.endpoint = null;
      console.log("WebSocket disconnected");
    }
  }

  /**
   * Add a message handler function
   * @param {Function} handler - Function to call when a message is received
   * @returns {Function} - Function to remove the handler
   */
  addMessageHandler(handler) {
    this.messageHandlers.push(handler);

    // Return a function to remove this handler
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index !== -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }
}

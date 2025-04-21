import { WebSocketManager } from "../utils/audioUtils";

/**
 * WebSocket service for managing real-time connections
 */
class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.messageHandlers = new Map();
  }

  /**
   * Get the WebSocket URL based on the current protocol and hostname
   * @returns {string} The WebSocket URL
   */
  getWebSocketUrl() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = "8005"; // Hardcoded port for the backend server

    return `${protocol}//${hostname}:${port}/mirai/api/ws`;
  }

  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - The WebSocket endpoint to connect to
   * @param {Function} messageHandler - Optional callback for handling messages
   * @returns {WebSocketManager} The WebSocket manager instance
   */
  connect(endpoint, messageHandler = null) {
    // Check if we already have a connection for this endpoint
    if (this.connections.has(endpoint)) {
      const wsManager = this.connections.get(endpoint);

      // If a message handler is provided, add it
      if (messageHandler) {
        wsManager.addMessageHandler(messageHandler);
      }

      return wsManager;
    }

    // Create a new WebSocket connection
    const wsUrl = this.getWebSocketUrl();
    console.log(`Creating WebSocket manager with base URL: ${wsUrl}`);

    const wsManager = new WebSocketManager(wsUrl);
    wsManager.connect(endpoint);

    // Store the connection
    this.connections.set(endpoint, wsManager);

    // If a message handler is provided, add it
    if (messageHandler) {
      wsManager.addMessageHandler(messageHandler);
    }

    return wsManager;
  }

  /**
   * Disconnect from a WebSocket endpoint
   * @param {string} endpoint - The WebSocket endpoint to disconnect from
   */
  disconnect(endpoint) {
    if (this.connections.has(endpoint)) {
      const wsManager = this.connections.get(endpoint);
      wsManager.disconnect();
      this.connections.delete(endpoint);
    }
  }

  /**
   * Disconnect from all WebSocket endpoints
   */
  disconnectAll() {
    for (const [endpoint, wsManager] of this.connections.entries()) {
      wsManager.disconnect();
      this.connections.delete(endpoint);
    }
  }

  /**
   * Add a message handler to a WebSocket connection
   * @param {string} endpoint - The WebSocket endpoint
   * @param {Function} handler - The message handler function
   */
  addMessageHandler(endpoint, handler) {
    if (this.connections.has(endpoint)) {
      const wsManager = this.connections.get(endpoint);
      wsManager.addMessageHandler(handler);
    } else {
      console.warn(
        `Cannot add message handler: No connection for endpoint ${endpoint}`
      );
    }
  }

  /**
   * Remove a message handler from a WebSocket connection
   * @param {string} endpoint - The WebSocket endpoint
   * @param {Function} handler - The message handler function to remove
   */
  removeMessageHandler(endpoint, handler) {
    if (this.connections.has(endpoint)) {
      const wsManager = this.connections.get(endpoint);
      wsManager.removeMessageHandler(handler);
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;

export class WebSocketManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.socket = null;
    this.messageHandlers = [];
    this.endpoint = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  connect(endpoint) {
    if (!endpoint) {
      console.warn(
        "WebSocketManager: endpoint is null or undefined, not connecting."
      );
      return;
    }

    if (this.socket && this.isConnected && this.endpoint === endpoint) {
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.endpoint = endpoint;
    const url = `${this.baseUrl}/${endpoint}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(error);
          }
        });
      } catch (error) {
        console.error(error);
      }
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay =
          this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(this.endpoint);
        }, delay);
      }
    };

    this.socket.onerror = (error) => {
      console.error(error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.endpoint = null;
    }
  }

  addMessageHandler(handler) {
    this.messageHandlers.push(handler);

    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index !== -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }
}

/**
 * WebSocket Client Utility
 * 
 * This module provides a consistent way to connect to the server's WebSocket
 * using the correct path and configuration.
 */

// Create and export WebSocket singleton
let socket: WebSocket | null = null;

// Initialize WebSocket connection
export function initWebSocket(): WebSocket {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  // Get the correct WebSocket URL
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/ws`;
  
  // Create new WebSocket
  socket = new WebSocket(wsUrl);
  
  // Setup event handlers
  socket.addEventListener("open", () => {
    console.log("WebSocket connection established");
  });
  
  socket.addEventListener("error", (event) => {
    console.error("WebSocket error:", event);
  });
  
  socket.addEventListener("close", () => {
    console.log("WebSocket connection closed");
    // Attempt to reconnect after delay
    setTimeout(() => {
      socket = null;
      initWebSocket();
    }, 5000);
  });
  
  return socket;
}

// Send message through WebSocket if connected
export function sendMessage(type: string, data: any): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not connected, cannot send message");
    return false;
  }
  
  socket.send(JSON.stringify({ type, data }));
  return true;
}

// Add message listener
export function addMessageListener(callback: (event: MessageEvent) => void): void {
  if (!socket) {
    socket = initWebSocket();
  }
  
  socket.addEventListener("message", callback);
}

// Remove message listener
export function removeMessageListener(callback: (event: MessageEvent) => void): void {
  if (socket) {
    socket.removeEventListener("message", callback);
  }
}

// Close the connection
export function closeWebSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}
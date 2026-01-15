/**
 * WebSocket Manager for Realtime Notifications
 * Handles WebSocket connections and broadcasting messages to connected clients
 */

import type { ServerWebSocket } from "bun";

interface WebSocketData {
  userId: string;
  businessId: string;
}

// Store active WebSocket connections by userId
const connections = new Map<string, Set<ServerWebSocket<WebSocketData>>>();

// Store connections by businessId for business-wide broadcasts
const businessConnections = new Map<string, Set<ServerWebSocket<WebSocketData>>>();

/**
 * Register a new WebSocket connection
 */
export function registerConnection(ws: ServerWebSocket<WebSocketData>): void {
  const { userId, businessId } = ws.data;

  // Add to user connections
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(ws);

  // Add to business connections
  if (!businessConnections.has(businessId)) {
    businessConnections.set(businessId, new Set());
  }
  businessConnections.get(businessId)!.add(ws);

  console.log(`[WS] User ${userId} connected (Business: ${businessId})`);
}

/**
 * Remove a WebSocket connection
 */
export function removeConnection(ws: ServerWebSocket<WebSocketData>): void {
  const { userId, businessId } = ws.data;

  // Remove from user connections
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.delete(ws);
    if (userConns.size === 0) {
      connections.delete(userId);
    }
  }

  // Remove from business connections
  const bizConns = businessConnections.get(businessId);
  if (bizConns) {
    bizConns.delete(ws);
    if (bizConns.size === 0) {
      businessConnections.delete(businessId);
    }
  }

  console.log(`[WS] User ${userId} disconnected`);
}

/**
 * Send a message to a specific user
 */
export function sendToUser(userId: string, message: WebSocketMessage): void {
  const userConns = connections.get(userId);
  if (userConns) {
    const payload = JSON.stringify(message);
    userConns.forEach((ws) => {
      try {
        ws.send(payload);
      } catch (error) {
        console.error(`[WS] Failed to send to user ${userId}:`, error);
      }
    });
  }
}

/**
 * Send a message to all users in a business
 */
export function sendToBusiness(businessId: string, message: WebSocketMessage): void {
  const bizConns = businessConnections.get(businessId);
  if (bizConns) {
    const payload = JSON.stringify(message);
    bizConns.forEach((ws) => {
      try {
        ws.send(payload);
      } catch (error) {
        console.error(`[WS] Failed to send to business ${businessId}:`, error);
      }
    });
  }
}

/**
 * Broadcast a message to all connected users
 */
export function broadcast(message: WebSocketMessage): void {
  const payload = JSON.stringify(message);
  connections.forEach((userConns) => {
    userConns.forEach((ws) => {
      try {
        ws.send(payload);
      } catch (error) {
        console.error("[WS] Failed to broadcast:", error);
      }
    });
  });
}

/**
 * Check if a user is currently connected
 */
export function isUserConnected(userId: string): boolean {
  const userConns = connections.get(userId);
  return userConns !== undefined && userConns.size > 0;
}

/**
 * Get the count of connected users for a business
 */
export function getBusinessConnectionCount(businessId: string): number {
  const bizConns = businessConnections.get(businessId);
  return bizConns?.size ?? 0;
}

/**
 * Get total connection count
 */
export function getTotalConnectionCount(): number {
  let count = 0;
  connections.forEach((userConns) => {
    count += userConns.size;
  });
  return count;
}

// Message types for WebSocket communication
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
}

export type WebSocketMessageType =
  | "notification"
  | "notification_read"
  | "notification_deleted"
  | "stock_update"
  | "sale_completed"
  | "customer_created"
  | "ping"
  | "pong"
  | "error";

/**
 * Create a WebSocket message
 */
export function createMessage(
  type: WebSocketMessageType,
  payload: any
): WebSocketMessage {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}

export {
  connections,
  businessConnections,
  type WebSocketData,
};

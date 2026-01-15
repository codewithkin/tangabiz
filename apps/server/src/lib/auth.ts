/**
 * Christus Veritas Technologies (CVT) Authentication
 * 
 * This module handles authentication using CVT API keys.
 * Users sign in with their CVT API key, which is verified against
 * the CVT backend to check service access for Tangabiz.
 */

const CVT_BACKEND = process.env.CHRISTUSVERITAS_BACKEND || "https://api.cvt.co.zw";
const CVT_SERVICE_ID = process.env.CVT_SERVICE_ID || "ultimate-service";
const APP_AUTH_SECRET = process.env.APP_AUTH_SECRET || "tangabiz-secret-key";

export interface CVTServiceVerification {
  valid: boolean;
  hasService: boolean;
  paid: boolean;
  message: string;
  service: {
    id: string;
    name: string;
    description: string;
    units: number;
    status: string;
    paid: boolean;
    nextBillingDate: string;
  } | null;
}

export interface CVTUserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
}

/**
 * Verify a CVT API key and check Tangabiz service access
 */
export async function verifyCVTApiKey(apiKey: string): Promise<{
  success: boolean;
  verification: CVTServiceVerification | null;
  error?: string;
}> {
  try {
    const response = await fetch(`${CVT_BACKEND}/api/api-keys/verify-service`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        serviceId: CVT_SERVICE_ID,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          verification: null,
          error: "Invalid or expired API key",
        };
      }
      return {
        success: false,
        verification: null,
        error: "Failed to verify API key",
      };
    }

    const data: CVTServiceVerification = await response.json();

    if (!data.valid) {
      return {
        success: false,
        verification: data,
        error: data.message || "Invalid API key",
      };
    }

    if (!data.hasService) {
      return {
        success: false,
        verification: data,
        error: "You don't have access to Tangabiz. Please subscribe to the service.",
      };
    }

    if (!data.paid) {
      return {
        success: false,
        verification: data,
        error: "Your Tangabiz subscription payment is due. Please update your payment.",
      };
    }

    return {
      success: true,
      verification: data,
    };
  } catch (error) {
    console.error("CVT API verification error:", error);
    return {
      success: false,
      verification: null,
      error: "Network error. Please check your connection and try again.",
    };
  }
}

/**
 * Get user profile from CVT API key
 */
export async function getCVTUserProfile(apiKey: string): Promise<{
  success: boolean;
  user: CVTUserProfile | null;
  error?: string;
}> {
  try {
    const response = await fetch(`${CVT_BACKEND}/api/api-keys/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    if (!response.ok) {
      return {
        success: false,
        user: null,
        error: "Failed to get user profile",
      };
    }

    const data = await response.json();

    if (!data.valid || !data.user) {
      return {
        success: false,
        user: null,
        error: "Invalid API key",
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
      },
    };
  } catch (error) {
    console.error("CVT user profile error:", error);
    return {
      success: false,
      user: null,
      error: "Network error",
    };
  }
}

/**
 * Simple JWT-like token generation for session management
 */
export function generateSessionToken(userId: string, apiKey: string): string {
  const payload = {
    userId,
    apiKeyHash: hashApiKey(apiKey),
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createSignature(encoded);
  
  return `${encoded}.${signature}`;
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  payload?: { userId: string; apiKeyHash: string; iat: number; exp: number };
} {
  try {
    const [encoded, signature] = token.split(".");
    
    if (!encoded || !signature) {
      return { valid: false };
    }
    
    // Verify signature
    if (createSignature(encoded) !== signature) {
      return { valid: false };
    }
    
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    
    // Check expiration
    if (payload.exp < Date.now()) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Hash API key for storage (don't store raw API keys)
 */
function hashApiKey(apiKey: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(apiKey + APP_AUTH_SECRET).digest("hex").slice(0, 32);
}

/**
 * Create signature for token
 */
function createSignature(data: string): string {
  const crypto = require("crypto");
  return crypto.createHmac("sha256", APP_AUTH_SECRET).update(data).digest("base64url");
}

/**
 * Get CVT frontend URLs
 */
export function getCVTUrls() {
  const frontend = process.env.CHRISTUSVERITAS_FRONTEND || "https://cvt.co.zw";
  return {
    signUp: `${frontend}/sign-up`,
    signIn: `${frontend}/sign-in`,
    dashboard: `${frontend}/dashboard`,
    billing: `${frontend}/billing`,
  };
}

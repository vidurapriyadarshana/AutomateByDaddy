/**
 * WhatsApp Client Configuration (Scaffolded)
 *
 * Integration Options:
 * 1. whatsapp-web.js (browser automation) - QR code based linking
 * 2. Twilio API - Official, supports sandbox/production numbers
 * 3. 360dialog - WhatsApp Business Cloud API wrapper
 *
 * For now, we scaffold the interface with mock implementation.
 * The actual client implementation depends on your chosen provider.
 */

import qrcode from "qrcode";
import { logger } from "./logger.config";

// ============================================================================
// STATE & TYPES
// ============================================================================

export interface WhatsAppClientState {
  qrCode: string | null;
  isReady: boolean;
  isInitializing: boolean;
  authError: string | null;
  provider: "whatsapp-web" | "twilio" | "360dialog" | "mock";
}

export interface InboundMessage {
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  mediaUrl?: string;
}

type InboundMessageHandler = (message: InboundMessage) => Promise<void>;

// ============================================================================
// GLOBALS
// ============================================================================

let clientState: WhatsAppClientState = {
  qrCode: null,
  isReady: false,
  isInitializing: false,
  authError: null,
  provider: "mock",
};

const inboundHandlers: InboundMessageHandler[] = [];
const PORT = parseInt(process.env.PORT || "4000", 10);

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize WhatsApp client
 *
 * Scaﬀolded for different providers. Mock mode by default for MVP.
 */
export async function initializeWhatsAppClient(): Promise<void> {
  if (clientState.isReady || clientState.isInitializing) {
    return;
  }

  try {
    clientState.isInitializing = true;
    logger.info("Initializing WhatsApp client (mock mode)...");

    // ====== OPTION 1: whatsapp-web.js (Browser Automation) ======
    // Uncomment when ready to integrate:
    /*
    waClient.on(Events.QR_RECEIVED, async (qr: string) => {
      await displayQRInTerminal(qr);
      clientState.qrCode = await qrcode.toDataURL(qr);
    });
    */

    // ====== OPTION 2: Twilio ======
    // Uncomment when ready:
    /*
    clientState.isReady = true;
    clientState.provider = "twilio";
    */

    // ====== OPTION 3: Mock (MVP) ======
    await displayMockQRInTerminal();

    clientState.provider = "mock";
    clientState.isInitializing = false;
    clientState.isReady = false;
    clientState.qrCode = generateMockQRCode();

    logger.info("WhatsApp client initialized (mock mode - ready for integration)");
  } catch (error) {
    logger.error("Failed to initialize WhatsApp client", { error: String(error) });
    clientState.isInitializing = false;
    clientState.authError = String(error);
  }
}

// ============================================================================
// QR DISPLAY (Terminal)
// ============================================================================

/**
 * Print a QR code to terminal using ASCII blocks.
 * Uses console.log to avoid Winston's timestamp prefix mangling the art.
 * Works with both real (whatsapp-web.js) and mock QR data.
 */
export async function displayQRInTerminal(qrData: string): Promise<void> {
  try {
    const terminalQr = await qrcode.toString(qrData, {
      type: "terminal",
      small: true,
    });

    console.log("");
    console.log("┌──────────────────────────────────────────┐");
    console.log("│          SCAN QR CODE BELOW              │");
    console.log("│  Open WhatsApp → Linked Devices → Scan   │");
    console.log("└──────────────────────────────────────────┘");

    const lines = terminalQr.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.log(line);
      }
    }

    console.log("┌──────────────────────────────────────────┐");
    console.log(`│   QR also available at:                    │`);
    console.log(`│   http://localhost:${PORT}/webhooks/whatsapp/qr  │`);
    console.log("└──────────────────────────────────────────┘");
    console.log("");
  } catch (error) {
    logger.error("Failed to display QR code in terminal", { error: String(error) });
  }
}

/**
 * Display a mock QR code in terminal during MVP
 */
async function displayMockQRInTerminal(): Promise<void> {
  // Encode the API endpoint URL so scanning the QR opens the linking page
  const mockData = `http://localhost:${PORT}/webhooks/whatsapp/qr`;

  try {
    const terminalQr = await qrcode.toString(mockData, {
      type: "terminal",
      small: true,
    });

    console.log("");
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║       WHATSAPP QR CODE (MOCK MODE)          ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log("║  Scan this QR or visit the URL below         ║");
    console.log("║  to link your WhatsApp account               ║");
    console.log("╚══════════════════════════════════════════════╝");
    console.log("");

    const lines = terminalQr.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.log(line);
      }
    }

    console.log("");
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  Endpoint: /webhooks/whatsapp/qr            ║");
    console.log(`║  URL:      http://localhost:${PORT}/webhooks/whatsapp/qr  ║`);
    console.log("╚══════════════════════════════════════════════╝");
    console.log("");
  } catch (error) {
    logger.error("Failed to display mock QR in terminal", { error: String(error) });
  }
}

/**
 * Generate mock QR code data URL for API responses
 */
function generateMockQRCode(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get current client state
 */
export function getWhatsAppClientState(): WhatsAppClientState {
  return { ...clientState };
}

/**
 * Get QR code for account linking
 */
export function getQRCode(): string | null {
  return clientState.qrCode;
}

/**
 * Check if WhatsApp client is ready
 */
export function isWhatsAppReady(): boolean {
  return clientState.isReady;
}

/**
 * Check if WhatsApp client is initializing
 */
export function isWhatsAppInitializing(): boolean {
  return clientState.isInitializing;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<string> {
  if (!isWhatsAppReady()) {
    throw new Error("WhatsApp client not ready");
  }

  const messageSid = `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.info(`[Mock] WhatsApp message to ${to}: ${messageSid}`);

  // Real implementation: client.sendMessage(to, message) / Twilio API
  return messageSid;
}

/**
 * Send WhatsApp media
 */
export async function sendWhatsAppMedia(
  to: string,
  mediaPath: string,
  caption?: string
): Promise<string> {
  if (!isWhatsAppReady()) {
    throw new Error("WhatsApp client not ready");
  }

  const messageSid = `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.info(`[Mock] WhatsApp media to ${to}: ${messageSid}`);
  return messageSid;
}

/**
 * Register inbound message handler
 */
export function onInboundMessage(handler: InboundMessageHandler): void {
  inboundHandlers.push(handler);
}

/**
 * Logout from WhatsApp
 */
export async function logoutWhatsApp(): Promise<void> {
  clientState.isReady = false;
  clientState.qrCode = null;
  logger.info("WhatsApp logged out");
}

/**
 * Destroy WhatsApp client
 */
export async function destroyWhatsAppClient(): Promise<void> {
  clientState.isReady = false;
  clientState.isInitializing = false;
  logger.info("WhatsApp client destroyed");
}

export default null;

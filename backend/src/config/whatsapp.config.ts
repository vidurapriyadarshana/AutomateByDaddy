/**
 * WhatsApp Client Configuration
 *
 * Uses whatsapp-web.js (Puppeteer-based browser automation).
 * QR-code-based linking — scan with WhatsApp → Linked Devices.
 */

import qrcode from "qrcode";
import { logger } from "./logger.config";
import WAWebJS from "whatsapp-web.js";

const { Client, LocalAuth, Events, MessageMedia } = WAWebJS;

// ============================================================================
// STATE & TYPES
// ============================================================================

export interface WhatsAppClientState {
  qrCode: string | null;
  isReady: boolean;
  isInitializing: boolean;
  authError: string | null;
  provider: "whatsapp-web";
}

export interface InboundMessage {
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  mediaUrl?: string;
  providerMessageId?: string;
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
  provider: "whatsapp-web",
};

let client: WAWebJS.Client | null = null;
const inboundHandlers: InboundMessageHandler[] = [];
const PORT = parseInt(process.env.PORT || "4000", 10);

// ============================================================================
// PHONE / WHATSAPP ID HELPERS
// ============================================================================

function toWhatsAppId(phone: string): string {
  const cleaned = phone.replace(/[+\s\-()]/g, "");
  return cleaned.includes("@") ? cleaned : `${cleaned}@c.us`;
}

function parsePhone(rawId: string): string {
  return rawId.replace(/@c\.us$/, "").replace(/@g\.us$/, "");
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeWhatsAppClient(): Promise<void> {
  if (clientState.isReady || clientState.isInitializing) return;

  try {
    clientState.isInitializing = true;
    logger.info("Initializing WhatsApp client (whatsapp-web.js)...");

    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      },
      webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1019210295.html",
      },
      takeoverOnConflict: true,
      qrMaxRetries: 3,
    });

    client.on(Events.QR_RECEIVED, async (qr: string) => {
      clientState.qrCode = await qrcode.toDataURL(qr);
      await displayQRInTerminal(qr);
    });

    client.on(Events.READY, () => {
      clientState.isReady = true;
      clientState.isInitializing = false;
      logger.info("WhatsApp client is ready — connected and linked");
    });

    client.on(Events.AUTHENTICATED, () => {
      logger.info("WhatsApp client authenticated");
    });

    client.on(Events.AUTHENTICATION_FAILURE, (msg: string) => {
      clientState.authError = msg;
      logger.error("WhatsApp authentication failed", { error: msg });
    });

    client.on(Events.MESSAGE_RECEIVED, async (message) => {
      if (message.fromMe) return;

      const media = message.hasMedia
        ? await message.downloadMedia().catch(() => null)
        : null;

      const mediaUrl = media?.data
        ? `data:${media.mimetype};base64,${media.data}`
        : undefined;
      const providerMessageId: string | undefined =
        typeof message.id === "object" && message.id !== null
          ? `${message.id.id}_${message.id.remote}`
          : String(message.id);

      const inbound: InboundMessage = {
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: message.timestamp,
        hasMedia: message.hasMedia,
        ...(mediaUrl ? { mediaUrl } : {}),
        ...(providerMessageId ? { providerMessageId } : {}),
      };

      for (const handler of inboundHandlers) {
        try {
          await handler(inbound);
        } catch (e) {
          logger.error("Inbound WhatsApp handler error", { error: String(e) });
        }
      }
    });

    client.on(Events.DISCONNECTED, (reason: string) => {
      clientState.isReady = false;
      logger.warn("WhatsApp client disconnected", { reason });
    });

    await client.initialize();
  } catch (error) {
    logger.error("Failed to initialize WhatsApp client", { error: String(error) });
    clientState.isInitializing = false;
    clientState.authError = String(error);
  }
}

// ============================================================================
// QR DISPLAY (Terminal)
// ============================================================================

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
    console.log("│   QR also available at:                  │");
    console.log(`│   http://localhost:${PORT}/webhooks/whatsapp/qr  │`);
    console.log("└──────────────────────────────────────────┘");
    console.log("");
  } catch (error) {
    logger.error("Failed to display QR code in terminal", { error: String(error) });
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function getWhatsAppClientState(): WhatsAppClientState {
  return { ...clientState };
}

export function getQRCode(): string | null {
  return clientState.qrCode;
}

export function isWhatsAppReady(): boolean {
  return clientState.isReady;
}

export function isWhatsAppInitializing(): boolean {
  return clientState.isInitializing;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<string> {
  if (!client || !clientState.isReady) {
    throw new Error("WhatsApp client not ready");
  }

  const chatId = toWhatsAppId(to);
  const sent = await client.sendMessage(chatId, message);
  const msgId =
    typeof sent.id === "object" && sent.id !== null
      ? `${sent.id.id}_${sent.id.remote}`
      : String(sent.id);
  logger.info(`WhatsApp message sent to ${chatId}: ${msgId}`);
  return msgId;
}

export async function sendWhatsAppMedia(
  to: string,
  mediaPath: string,
  caption?: string,
): Promise<string> {
  if (!client || !clientState.isReady) {
    throw new Error("WhatsApp client not ready");
  }

  const chatId = toWhatsAppId(to);
  const media = MessageMedia.fromFilePath(mediaPath);
  const sent = await client.sendMessage(chatId, media, {
    caption: caption || "",
  });
  const msgId =
    typeof sent.id === "object" && sent.id !== null
      ? `${sent.id.id}_${sent.id.remote}`
      : String(sent.id);
  logger.info(`WhatsApp media sent to ${chatId}: ${msgId}`);
  return msgId;
}

export function onInboundMessage(handler: InboundMessageHandler): void {
  inboundHandlers.push(handler);
}

export async function logoutWhatsApp(): Promise<void> {
  if (!client) return;
  try {
    await client.logout();
  } catch {
    // Ignore errors during logout
  }
  clientState.isReady = false;
  clientState.qrCode = null;
  logger.info("WhatsApp logged out");
}

export async function destroyWhatsAppClient(): Promise<void> {
  if (!client) return;
  try {
    await client.destroy();
  } catch {
    // Ignore errors during destroy
  }
  clientState.isReady = false;
  clientState.isInitializing = false;
  logger.info("WhatsApp client destroyed");
}

export default null;

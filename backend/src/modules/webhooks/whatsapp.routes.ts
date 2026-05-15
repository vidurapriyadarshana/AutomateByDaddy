/**
 * WhatsApp Webhook Routes
 * 
 * Endpoints for:
 * - Getting QR code for account linking
 * - Checking WhatsApp client status
 * - Logging out from WhatsApp
 */

import { Router, Request, Response, NextFunction } from "express";
import {
  getWhatsAppClientState,
  getQRCode,
  isWhatsAppReady,
  isWhatsAppInitializing,
  sendWhatsAppMessage,
  logoutWhatsApp,
  initializeWhatsAppClient,
} from "../../config/whatsapp.config";

const router = Router();

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /webhooks/whatsapp/qr
 * 
 * Returns QR code for scanning to link WhatsApp account
 * Response: Base64 data URL of QR code image
 */
router.get("/qr", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = getWhatsAppClientState();

    // If not initializing yet, start initialization
    if (!isWhatsAppInitializing() && !isWhatsAppReady()) {
      await initializeWhatsAppClient();
    }

    const qrCode = getQRCode();

    if (!qrCode) {
      // Wait a bit and try again (QR takes a moment to generate)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryQr = getQRCode();

      if (!retryQr) {
        return res.status(202).json({
          success: false,
          status: "initializing",
          message: "WhatsApp client is initializing. Please try again in a few seconds.",
          state,
        });
      }

      return res.json({
        success: true,
        qrCode: retryQr,
        status: "pending",
        message: "Scan this QR code with your WhatsApp device to link your account",
        state,
      });
    }

    return res.json({
      success: true,
      qrCode,
      status: "pending",
      message: "Scan this QR code with your WhatsApp device to link your account",
      state,
    });
  } catch (error) {
    console.error(`Error in GET /webhooks/whatsapp/qr: ${error}`);
    next(error);
  }
});

/**
 * GET /webhooks/whatsapp/status
 * 
 * Returns current WhatsApp client status
 * Response: { ready, initializing, state, authError }
 */
router.get("/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = getWhatsAppClientState();

    return res.json({
      success: true,
      ready: state.isReady,
      initializing: state.isInitializing,
      hasQR: !!state.qrCode,
      authError: state.authError,
      message: state.isReady
        ? "WhatsApp client is ready and connected"
        : state.isInitializing
        ? "WhatsApp client is initializing"
        : state.qrCode
        ? "Please scan the QR code to authenticate"
        : "WhatsApp client not initialized",
    });
  } catch (error) {
    console.error(`Error in GET /webhooks/whatsapp/status: ${error}`);
    next(error);
  }
});

/**
 * POST /webhooks/whatsapp/send-test
 *
 * Send a test WhatsApp message (dev-only, no auth required)
 * Body: { to: string, message: string }
 */
router.post(
  "/send-test",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isWhatsAppReady()) {
        return res.status(400).json({
          success: false,
          error: "WhatsApp client is not ready. Scan QR code first.",
        });
      }

      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: to, message",
        });
      }

      const msgId = await sendWhatsAppMessage(to, message);
      return res.json({
        success: true,
        messageId: msgId,
        to,
      });
    } catch (error) {
      console.error(`Error in POST /webhooks/whatsapp/send-test: ${error}`);
      next(error);
    }
  }
);

/**
 * POST /webhooks/whatsapp/logout
 * 
 * Logout from WhatsApp (disconnects the account)
 * Requires QR scan again to reconnect
 */
router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isWhatsAppReady()) {
        return res.status(400).json({
          success: false,
          error: "WhatsApp client is not connected",
        });
      }

      await logoutWhatsApp();

      return res.json({
        success: true,
        message: "Logged out from WhatsApp. Scan the QR code again to reconnect.",
      });
    } catch (error) {
      console.error(`Error in POST /webhooks/whatsapp/logout: ${error}`);
      next(error);
    }
  }
);

/**
 * POST /webhooks/whatsapp/reinit
 * 
 * Reinitialize WhatsApp client (useful for recovery)
 */
router.post(
  "/reinit",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Reinitializing WhatsApp client...");
      await initializeWhatsAppClient();

      return res.json({
        success: true,
        message: "WhatsApp client reinitialization started",
        state: getWhatsAppClientState(),
      });
    } catch (error) {
      console.error(`Error in POST /webhooks/whatsapp/reinit: ${error}`);
      next(error);
    }
  }
);

export default router;

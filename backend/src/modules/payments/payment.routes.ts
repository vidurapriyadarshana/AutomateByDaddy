import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  uploadSlip,
  getPaymentDetails,
  verifyPaymentHandler,
  rejectPaymentHandler,
  upload,
} from "./payment.controller";

const router = Router();

// ============ PUBLIC ROUTES ============

/**
 * POST /payments/slip
 * Upload payment slip (file upload)
 */
router.post("/slip", upload.single("slip"), uploadSlip);

// ============ ADMIN ROUTES ============

/**
 * GET /admin/payments/:id
 * Get payment details
 */
router.get("/admin/payments/:id", requireAuth("admin"), getPaymentDetails);

/**
 * POST /admin/payments/:id/verify
 * Verify payment slip
 */
router.post("/admin/payments/:id/verify", requireAuth("admin"), verifyPaymentHandler);

/**
 * POST /admin/payments/:id/reject
 * Reject payment slip
 */
router.post("/admin/payments/:id/reject", requireAuth("admin"), rejectPaymentHandler);

export default router;

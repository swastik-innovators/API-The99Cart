// ─── Admin Management Routes ───────────────────────────────────────────────
// Exposes CRUD routes for managing users (profiles) and sellers/stores.
// Protected by master admin role.

import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware";

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(authorize("admin"));

// ── User Management ────────────────────────────────────────────────────────
router.get("/stats", adminController.getGlobalStats);
router.get("/users", adminController.listUsers);
router.post("/users", adminController.createUser);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// ── Seller Management ──────────────────────────────────────────────────────
router.get("/sellers", adminController.listSellers);
router.post("/sellers", adminController.createSeller);
router.get("/sellers/:id/details", adminController.getSellerDetails);
router.patch("/sellers/:id", adminController.updateSeller);
router.delete("/sellers/:id", adminController.deleteSeller);

export default router;

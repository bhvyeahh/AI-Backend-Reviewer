import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  editUser,
  removeUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", editUser);
router.delete("/:id", removeUser);

export default router;

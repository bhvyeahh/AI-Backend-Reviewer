import express from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  deletePost,
} from "../controllers/post.controller.js";

const router = express.Router();

// GET all posts
router.get("/", getAllPosts);

// GET single post by ID
router.get("/:id", getPostById);

// CREATE a new post
router.post("/", createPost);

// DELETE post by ID
router.delete("/:id", deletePost);

export default router;

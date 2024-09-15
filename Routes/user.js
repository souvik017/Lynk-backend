import express from "express";
import { createUser, loginUser, getAllUsers, getUserById, updateUser, deleteUser } from "../Controllers/user.js";

const router = express.Router();

// Route to create a user
router.post("/register", createUser);

router.post("/login", loginUser);

// Route to get all users
router.get("/", getAllUsers);

// Route to get a user by ID
router.get("/:id", getUserById);

// Route to update a user
router.put("/:id", updateUser);

// Route to delete a user
router.delete("/:id", deleteUser);

export default router;

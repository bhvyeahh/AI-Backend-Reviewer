import {
  getAllUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
} from "../models/userModel.js";

export const getUsers = (req, res) => {
  const users = getAllUsers();
  res.status(200).json(users);
};

export const getUser = (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(user);
};

export const createUser = (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }
  const newUser = addUser({ name, email });
  res.status(201).json(newUser);
};

export const editUser = (req, res) => {
  const updated = updateUser(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(updated);
};

export const removeUser = (req, res) => {
  const deleted = deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ message: "User deleted successfully" });
};

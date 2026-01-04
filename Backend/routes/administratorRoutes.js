import express from 'express';
import administratorController, { adminLogin } from '../controllers/administratorController.js';

const administratorRoutes = express.Router();

// Define routes for all services used in the controller
administratorRoutes.post("", administratorController.createAdmin);
administratorRoutes.put("/update/:adminId", administratorController.updateAdmin);
// Admin login
administratorRoutes.post("/login", adminLogin);

export default administratorRoutes;
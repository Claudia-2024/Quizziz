import express from 'express';
import responseSheetController from '../services/responseSheetService.js';
import { authenticateToken } from '../middleware/auth.js';

const responseSheetRoutes = express.Router();

// Define routes for all services used in the controller
// Get connected student's scores by course (completed evaluations only)
responseSheetRoutes.get("/course/:courseCode", authenticateToken, responseSheetController.getStudentScoresByCourse);

responseSheetRoutes.get("", responseSheetController.getAllResponseSheets);

responseSheetRoutes.get("/:matricule/:evaluationId", responseSheetController.findResponseSheetByMatriculeAndEvaluationId);

responseSheetRoutes.post("", responseSheetController.createResponseSheet);
// responseSheetRoutes.post("/:id", responseSheetController.findResponseSheetById);
responseSheetRoutes.put("/update/:responseSheetId", responseSheetController.updateResponseSheet);
// responseSheetRoutes.delete("/delete/:id", responseSheetController.deleteResponseSheet);

export default responseSheetRoutes;
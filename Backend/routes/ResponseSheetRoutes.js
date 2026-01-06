import express from 'express';
import responseSheetController from '../services/responseSheetService.js';
import responseSheetCtrl from '../controllers/responseSheetController.js';
import { authenticateToken } from '../middleware/auth.js';

const responseSheetRoutes = express.Router();

// Define routes for all services used in the controller
// Get connected student's scores by course (completed evaluations only)
responseSheetRoutes.get("/course/:courseCode", authenticateToken, responseSheetController.getStudentScoresByCourse);

responseSheetRoutes.get("", responseSheetController.getAllResponseSheets);

responseSheetRoutes.get("/:matricule/:evaluationId", responseSheetController.findResponseSheetByMatriculeAndEvaluationId);

responseSheetRoutes.post("", responseSheetController.createResponseSheet);

// POST - Soumettre les réponses (support offline)
responseSheetRoutes.post("/:responseSheetId/submit", authenticateToken, responseSheetCtrl.submitAnswersOffline);

responseSheetRoutes.put("/update/:responseSheetId", responseSheetController.updateResponseSheet);

export default responseSheetRoutes;
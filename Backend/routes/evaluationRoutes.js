import express from 'express';
import evaluationController from '../controllers/evaluationController.js';

const evaluationRoutes = express.Router();

// Define routes for all services used in the controller
evaluationRoutes.get("", evaluationController.getAllEvaluationSessions);

//students route to get all not draft evaluations
evaluationRoutes.get("/student", evaluationController.getAllPublishedEvaluationSessions);
evaluationRoutes.get("/student/revision", evaluationController.getRevisionQuestions)
evaluationRoutes.post("", evaluationController.createEvaluationSession);

//route to start an evaluation
evaluationRoutes.post("/:evaluationId/start", evaluationController.startEvaluation);

//route to send answers
evaluationRoutes.post("/response/:id/answers", evaluationController.saveAnswers);

//route to submit answers
evaluationRoutes.post("/response/:id/submit", evaluationController.submitAnswers);

evaluationRoutes.get("/course/:courseCode", evaluationController.getEvaluationByCourseCode);


evaluationRoutes.put("/update/:evaluationId", evaluationController.updateEvaluationSession);
evaluationRoutes.delete("/delete/:evaluationId", evaluationController.deleteEvaluationSession);

export default evaluationRoutes;
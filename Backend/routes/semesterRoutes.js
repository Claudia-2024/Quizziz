import express from 'express';
import semesterController from '../controllers/semesterController.js';

const semesterRoutes = express.Router();

//routes for semesters
semesterRoutes.get("", semesterController.getAllSemesters);

semesterRoutes.get("/usable", semesterController.getCurrentYearSemesters);

//requires no parameters
semesterRoutes.get("/current", semesterController.getCurrentSemester);

//requires request body
semesterRoutes.post("", semesterController.createSemester);

//requires semestrerId as path parameter and request body
semesterRoutes.put("/update/:semesterId", semesterController.updateSemester);

export default semesterRoutes;
import express from 'express';
import courseController from '../controllers/courseController.js';
import { authenticateToken } from '../middleware/auth.js';

const courseRoutes = express.Router();

// Define routes for all services used in the controller
courseRoutes.get("", courseController.getAllCourses);

//requires courseCode as path parameter
courseRoutes.get("/:courseCode", courseController.getCourseByCode);

//requires course as request body
courseRoutes.post("/:classId", courseController.createCourse);

// Get courses for connected student (by matricule from JWT)
courseRoutes.get("/student", authenticateToken, courseController.getCoursesForConnectedStudent);

//requires courseCode as path parameter and updated course in request body
courseRoutes.put("/update/:courseCode", courseController.updateCourse);

//requires courseCode as path parameter
courseRoutes.delete("/delete/:courseCode", courseController.deleteCourse);

export default courseRoutes;
import express from 'express';
import classController from '../controllers/classController.js';

const classRoutes = express.Router();

// Define routes for class services here
classRoutes.get("", classController.getAllClasses);

//Requires classId in params
classRoutes.get("/:classId", classController.getClass);

//Requires nothing in params but has a request body
classRoutes.post("", classController.createClass);

//Requires classId in params and request body
classRoutes.put("/update/:classId", classController.updateClass);

classRoutes.delete("/activate/:classId", classController.activateClass);

//Requires just the classId in params
classRoutes.delete("/delete/:classId", classController.deleteClass);

export default classRoutes;
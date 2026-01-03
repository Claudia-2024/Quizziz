import sequelize from './config/database.js'
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import studentRoutes from './routes/studentRoutes.js';
import nodeCron from 'node-cron';
import academicYearController from './controllers/academicYearController.js';
import semesterController from './controllers/semesterController.js';
import './models/association.js';
import './cron/evaluationScheduler.js'
import academicYearRoutes from './routes/academicYearRoutes.js';
import answerRoutes from './routes/answerRoutes.js';
import choiceRoutes from './routes/choiceRoutes.js';
import classRoutes from './routes/classRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import ResponseSheetRoutes from './routes/responseSheetRoutes.js';
import semesterRoutes from './routes/semesterRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import administratorRoutes from './routes/administratorRoutes.js';
import deviceTokenRoutes from './routes/deviceTokenRoutes.js';
import excelImportRoutes from './routes/excelImportRoutes.js';
import { initializeFirebase } from './services/pushNotificationService.js';

sequelize.sync().then(() => {
    console.log("All tables synchronised.");
}).catch(err => {
    console.error("Error synchronising tables: ", err);
});

const app = express();
app.use(cors({
  origin: 'http://localhost:4200'
}));

app.use(bodyParser.json());

nodeCron.schedule('0 0 * * *', academicYearController.updateCurrentAcademicYear);
nodeCron.schedule('0 0 * * *', semesterController.updateCurrentSemester);

app.use("/student", studentRoutes); //done
app.use("/year", academicYearRoutes); //done
app.use("/answer", answerRoutes); //done
app.use("/choice", choiceRoutes); //done
app.use("/class", classRoutes); //done
app.use("/course", courseRoutes); //done
app.use("/evaluation", evaluationRoutes); //done
app.use("/notification", notificationRoutes);
app.use("/question", questionRoutes); //done
app.use("/responseSheet", ResponseSheetRoutes); //done
app.use("/semester", semesterRoutes); //done
app.use("/teacher", teacherRoutes); //done
app.use("/admin", administratorRoutes); //done
app.use("/device-token", deviceTokenRoutes); //done
app.use("/excel", excelImportRoutes); //done

// Initialiser Firebase pour les push notifications
initializeFirebase();

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    sequelize.authenticate()
  .then(() => {
    console.log('Connected to DB:', sequelize.config.database);
  });

    // sequelize.sync({ alter: true }).then(() => {
    //     console.log("All tables synchronised.");
    // }).catch(err => {
    //     console.error("Error synchronising tables: ", err);
    // });
    // academicYearController.updateCurrentAcademicYear();
    // semesterController.updateCurrentSemester();
});

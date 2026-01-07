import Student from "../models/student.js";
import Class from "../models/class.js";
import AcademicYear from "../models/academicYear.js";
import { hashPassword, comparePassword, generateToken } from "../services/authService.js";
import {
    isInstitutionalEmail,
    generateVerificationToken,
    sendVerificationEmail
} from "../services/emailService.js";

// Register a new student
async function registerStudent(req, res) {
    try {
        const {
            matricule,
            email,
            firstName,
            lastName,
            phoneNumber,
            password,
            classId,
            studentCardId
        } = req.body;

        // Check required fields
        if (!matricule || !email || !firstName || !lastName || !phoneNumber || !password || !classId) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        if (!isInstitutionalEmail(email)) {
            return res.status(400).json({
                error: "This is not a valid institutional email address."
            });
        }

        const existingStudent = await Student.findByPk(matricule, { paranoid: false });
        if (existingStudent && !existingStudent.deletedAt) {
            return res.status(409).json({
                error: "A student with this matricule already exists"
            });
        }

        const existingEmail = await Student.findOne({
            where: { email },
            paranoid: false
        });
        if (existingEmail && !existingEmail.deletedAt) {
            return res.status(409).json({
                error: "This email is already in use"
            });
        }

        if (studentCardId) {
            const existingCard = await Student.findOne({
                where: { studentCardId },
                paranoid: false
            });
            if (existingCard && !existingCard.deletedAt) {
                return res.status(409).json({
                    error: "This student card is already in use"
                });
            }
        }

        const classExists = await Class.findByPk(classId);
        if (!classExists) {
            return res.status(404).json({ error: "Class not found" });
        }

        const hashedPassword = await hashPassword(password);
        const verificationToken = generateVerificationToken();

        let student;
        if (existingStudent) {
            await Student.restore({ where: { matricule } });
            student = await Student.findByPk(matricule);

            student.email = email;
            student.firstName = firstName;
            student.lastName = lastName;
            student.phoneNumber = phoneNumber;
            student.password = hashedPassword;
            student.classId = classId;
            student.emailVerified = false;
            student.emailVerificationToken = verificationToken;
            if (studentCardId) student.studentCardId = studentCardId;

            await student.save();
        } else {
            student = await Student.create({
                matricule,
                email,
                firstName,
                lastName,
                phoneNumber,
                password: hashedPassword,
                classId,
                emailVerified: false,
                emailVerificationToken: verificationToken,
                studentCardId: studentCardId || null,
                role: "student"
            });
        }

        const emailSent = await sendVerificationEmail(email, verificationToken, firstName);
        if (!emailSent) {
            console.warn(`Failed to send verification email to ${email}, but student was created`);
        }

        const studentResponse = {
            matricule: student.matricule,
            email: student.email,
            firstName: student.firstName,
            lastName: student.lastName,
            emailVerified: student.emailVerified,
            classId: student.classId
        };

        res.status(201).json({
            message: "Registration successful. Please verify your email.",
            student: studentResponse
        });

    } catch (error) {
        console.error("Error registering student:", error);
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                error: "Matricule, card, or email already in use"
            });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}

async function loginStudent(req, res) {
    try {
        const { matricule, password } = req.body;

        if (!matricule || !password) {
            return res.status(400).json({
                error: "Matricule and password are required"
            });
        }

        const student = await Student.findByPk(matricule, {
            include: [{
                model: Class,
                attributes: ["classId", "level", "department"]
            }]
        });

        if (!student) {
            return res.status(401).json({
                error: "Invalid matricule or password"
            });
        }

        const isPasswordValid = await comparePassword(password, student.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid matricule or password"
            });
        }

        const token = generateToken(student.matricule, student.email, student.role);

        res.status(200).json({
            message: "Login successful",
            token,
            student: {
                matricule: student.matricule,
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                emailVerified: student.emailVerified,
                classId: student.classId,
                class: student.Class
            }
        });

    } catch (error) {
        console.error("Error logging in student:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function loginWithCard(req, res) {
    try {
        const { studentCardId, password } = req.body;

        if (!studentCardId || !password) {
            return res.status(400).json({
                error: "Student card number and password are required"
            });
        }

        const student = await Student.findOne({
            where: { studentCardId },
            include: [{
                model: Class,
                attributes: ["classId", "level", "department"]
            }]
        });

        if (!student) {
            return res.status(401).json({
                error: "Invalid student card or password"
            });
        }

        const isPasswordValid = await comparePassword(password, student.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid student card or password"
            });
        }

        const token = generateToken(student.matricule, student.email, student.role);

        res.status(200).json({
            message: "Login successful",
            token,
            student: {
                matricule: student.matricule,
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                emailVerified: student.emailVerified,
                classId: student.classId,
                class: student.Class
            }
        });

    } catch (error) {
        console.error("Error logging in with card:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Verify email token
async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                error: "Verification token is required"
            });
        }

        const student = await Student.findOne({
            where: { emailVerificationToken: token }
        });

        if (!student) {
            return res.status(404).json({
                error: "Invalid or expired verification token"
            });
        }

        if (student.emailVerified) {
            return res.status(200).json({
                message: "Email already verified"
            });
        }

        student.emailVerified = true;
        student.emailVerificationToken = null;
        await student.save();

        res.status(200).json({
            message: "Email successfully verified"
        });

    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Change class for the next academic year
async function changeClassForNextYear(req, res) {
    try {
        const { matricule } = req.student; // From authentication middleware
        const { newClassId, academicYearId } = req.body;

        if (!newClassId) {
            return res.status(400).json({
                error: "New class is required"
            });
        }

        const student = await Student.findByPk(matricule);
        if (!student) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        const newClass = await Class.findByPk(newClassId);
        if (!newClass) {
            return res.status(404).json({
                error: "New class not found"
            });
        }

        if (academicYearId) {
            const currentYear = await AcademicYear.findOne({
                where: { isPresent: true }
            });

            if (!currentYear) {
                return res.status(400).json({
                    error: "No active academic year found"
                });
            }

            const targetYear = await AcademicYear.findByPk(academicYearId);
            if (!targetYear) {
                return res.status(404).json({
                    error: "Academic year not found"
                });
            }

            const yearDiff =
                new Date(targetYear.startDate).getFullYear() -
                new Date(currentYear.startDate).getFullYear();

            if (yearDiff !== 1) {
                return res.status(400).json({
                    error: "You can only change class for the next academic year (N+1)"
                });
            }
        }

        student.classId = newClassId;
        await student.save();

        res.status(200).json({
            message: "Class successfully updated for the next academic year",
            student: {
                matricule: student.matricule,
                classId: student.classId,
                class: newClass
            }
        });

    } catch (error) {
        console.error("Error changing class:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Create a new student (alias)
async function createStudent(req, res) {
    return registerStudent(req, res);
}

// Get all students
async function getAllStudents(req, res) {
    try {
        const students = await Student.findAll({
            include: [{
                model: Class,
                attributes: ["classId", "level", "department"]
            }]
        });

        const studentDTOs = students.map(student => ({
            matricule: student.matricule,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            phoneNumber: student.phoneNumber,
            emailVerified: student.emailVerified,
            classId: student.Class?.classId || null,
            level: student.Class?.level || null,
            department: student.Class?.department || null
        }));

        res.status(200).json(studentDTOs);

    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function findStudentByMatricule(req, res) {
    try {
        const student = await Student.findByPk(req.params.matricule);
        if (!student) {
            return res.status(404).json("Student not found");
        }
        res.status(200).json(student);
    } catch (error) {
        console.error(`Error fetching student ${req.params.matricule}:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function updateStudent(req, res) {
    try {
        const student = await Student.findByPk(req.params.matricule);
        if (!student) {
            return res.status(404).json("Student not found");
        }

        student.matricule = req.body.matricule || student.matricule;
        student.email = req.body.email || student.email;
        student.firstName = req.body.firstName || student.firstName;
        student.lastName = req.body.lastName || student.lastName;
        student.phoneNumber = req.body.phoneNumber || student.phoneNumber;
        student.password = req.body.password || student.password;

        await student.save();
        res.status(200).json(student);

    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function deleteStudent(req, res) {
    try {
        const affectedRows = await Student.destroy({
            where: { matricule: req.params.matricule }
        });

        if (affectedRows > 0) {
            return res.status(200).json("Student successfully soft deleted");
        } else {
            return res.status(404).json("Student not found");
        }

    } catch (error) {
        console.error("Unable to delete student:", error);
        res.status(500).json({ error: "Could not delete student" });
    }
}

export default {
    createStudent,
    registerStudent,
    loginStudent,
    loginWithCard,
    verifyEmail,
    changeClassForNextYear,
    getAllStudents,
    findStudentByMatricule,
    updateStudent,
    deleteStudent
};

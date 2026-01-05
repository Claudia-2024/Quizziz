import Student from "../models/student.js";
import Class from "../models/class.js";
import AcademicYear from "../models/academicYear.js";
import { hashPassword, comparePassword, generateToken } from "../services/authService.js";
import { isInstitutionalEmail, generateVerificationToken, sendVerificationEmail } from "../services/emailService.js";

// Register a new student (avec vérification email institutionnel)
async function registerStudent(req, res) {
    try {
        const { matricule, email, firstName, lastName, phoneNumber, password, classId, studentCardId } = req.body;

        // Vérifier que tous les champs requis sont présents
        if (!matricule || !email || !firstName || !lastName || !phoneNumber || !password || !classId) {
            return res.status(400).json({ error: 'Tous les champs sont requis (matricule, email, firstName, lastName, phoneNumber, password, classId)' });
        }

        // Vérifier que l'email est une adresse institutionnelle
        if (!isInstitutionalEmail(email)) {
            return res.status(400).json({
                error: 'Adresse email non institutionnelle. Veuillez utiliser votre adresse email institutionnelle.'
            });
        }

        // Vérifier si l'étudiant existe déjà
        const existingStudent = await Student.findByPk(matricule, { paranoid: false });
        if (existingStudent && !existingStudent.deletedAt) {
            return res.status(409).json({ error: 'Un étudiant avec ce matricule existe déjà. Veuillez vous connecter.' });
        }

        // Vérifier si l'email est déjà utilisé
        const existingEmail = await Student.findOne({
            where: { email },
            paranoid: false
        });
        if (existingEmail && !existingEmail.deletedAt) {
            return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
        }

        // Vérifier si la carte étudiante est déjà utilisée (si fournie)
        if (studentCardId) {
            const existingCard = await Student.findOne({
                where: { studentCardId },
                paranoid: false
            });
            if (existingCard && !existingCard.deletedAt) {
                return res.status(409).json({ error: 'Cette carte étudiante est déjà enregistrée.' });
            }
        }

        // Vérifier que la classe existe
        const classExists = await Class.findByPk(classId);
        if (!classExists) {
            return res.status(404).json({ error: 'Classe non trouvée' });
        }

        // Hasher le mot de passe
        const hashedPassword = await hashPassword(password);

        // Générer un token de vérification
        const verificationToken = generateVerificationToken();

        // Restaurer ou créer l'étudiant
        let student;
        if (existingStudent) {
            // Restaurer l'étudiant supprimé
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
            // Créer un nouvel étudiant
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
                role: 'student'
            });
        }

        // Envoyer l'email de vérification
        const emailSent = await sendVerificationEmail(email, verificationToken, firstName);
        if (!emailSent) {
            console.warn(`Failed to send verification email to ${email}, but student was created`);
        }

        // Ne pas renvoyer le mot de passe et le token
        const studentResponse = {
            matricule: student.matricule,
            email: student.email,
            firstName: student.firstName,
            lastName: student.lastName,
            emailVerified: student.emailVerified,
            classId: student.classId
        };

        res.status(201).json({
            message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
            student: studentResponse
        });

    } catch (error) {
        console.error("Error registering student: ", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Matricule, email ou carte étudiante déjà utilisés' });
        }
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}

// Login avec matricule et mot de passe
async function loginStudent(req, res) {
    try {
        const { matricule, password } = req.body;

        if (!matricule || !password) {
            return res.status(400).json({ error: 'Matricule et mot de passe requis' });
        }

        const student = await Student.findByPk(matricule, {
            include: [{
                model: Class,
                attributes: ['classId', 'level', 'department']
            }]
        });

        if (!student) {
            return res.status(401).json({ error: 'Matricule ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await comparePassword(password, student.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Matricule ou mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = generateToken(student.matricule, student.email, student.role);

        // Ne pas renvoyer le mot de passe
        const studentResponse = {
            matricule: student.matricule,
            email: student.email,
            firstName: student.firstName,
            lastName: student.lastName,
            emailVerified: student.emailVerified,
            classId: student.classId,
            class: student.Class
        };

        res.status(200).json({
            message: 'Connexion réussie',
            token,
            student: studentResponse
        });

    } catch (error) {
        console.error("Error logging in student: ", error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}

// Login avec carte étudiante
async function loginWithCard(req, res) {
    try {
        const { studentCardId, password } = req.body;

        if (!studentCardId || !password) {
            return res.status(400).json({ error: 'Numéro de carte étudiante et mot de passe requis' });
        }

        const student = await Student.findOne({
            where: { studentCardId },
            include: [{
                model: Class,
                attributes: ['classId', 'level', 'department']
            }]
        });

        if (!student) {
            return res.status(401).json({ error: 'Carte étudiante ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await comparePassword(password, student.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Carte étudiante ou mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = generateToken(student.matricule, student.email, student.role);

        const studentResponse = {
            matricule: student.matricule,
            email: student.email,
            firstName: student.firstName,
            lastName: student.lastName,
            emailVerified: student.emailVerified,
            classId: student.classId,
            class: student.Class
        };

        res.status(200).json({
            message: 'Connexion réussie',
            token,
            student: studentResponse
        });

    } catch (error) {
        console.error("Error logging in with card: ", error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}

// Vérifier l'email avec le token
async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token de vérification requis' });
        }

        const student = await Student.findOne({
            where: { emailVerificationToken: token }
        });

        if (!student) {
            return res.status(404).json({ error: 'Token de vérification invalide ou expiré' });
        }

        if (student.emailVerified) {
            return res.status(200).json({ message: 'Email déjà vérifié' });
        }

        // Marquer l'email comme vérifié et supprimer le token
        student.emailVerified = true;
        student.emailVerificationToken = null;
        await student.save();

        res.status(200).json({ message: 'Email vérifié avec succès' });

    } catch (error) {
        console.error("Error verifying email: ", error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}

// Changer de classe pour l'année académique N+1
async function changeClassForNextYear(req, res) {
    try {
        const { matricule } = req.student; // Depuis le middleware d'authentification
        const { newClassId, academicYearId } = req.body;

        if (!newClassId) {
            return res.status(400).json({ error: 'Nouvelle classe requise' });
        }

        const student = await Student.findByPk(matricule);
        if (!student) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }

        // Vérifier que la nouvelle classe existe
        const newClass = await Class.findByPk(newClassId);
        if (!newClass) {
            return res.status(404).json({ error: 'Nouvelle classe non trouvée' });
        }

        // Vérifier que l'année académique est bien N+1 (année suivante)
        if (academicYearId) {
            const currentYear = await AcademicYear.findOne({ where: { isPresent: true } });
            if (!currentYear) {
                return res.status(400).json({ error: 'Aucune année académique active trouvée' });
            }

            const targetYear = await AcademicYear.findByPk(academicYearId);
            if (!targetYear) {
                return res.status(404).json({ error: 'Année académique non trouvée' });
            }

            // Vérifier que l'année cible est bien l'année suivante
            const currentYearStart = new Date(currentYear.startDate);
            const targetYearStart = new Date(targetYear.startDate);
            const yearDiff = targetYearStart.getFullYear() - currentYearStart.getFullYear();

            if (yearDiff !== 1) {
                return res.status(400).json({
                    error: 'Vous ne pouvez changer de classe que pour l\'année académique suivante (N+1)'
                });
            }
        }

        // Mettre à jour la classe de l'étudiant
        student.classId = newClassId;
        await student.save();

        res.status(200).json({
            message: 'Classe mise à jour avec succès pour l\'année académique suivante',
            student: {
                matricule: student.matricule,
                classId: student.classId,
                class: newClass
            }
        });

    } catch (error) {
        console.error("Error changing class: ", error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}

//Create a new student (fonction originale conservée pour compatibilité)
async function createStudent(req, res) {
    // Rediriger vers registerStudent
    return registerStudent(req, res);
}

//Get all users
async function getAllStudents(req, res) {
    try {
        const students = await Student.findAll({
            include: [
                {
                    model: Class,
                    attributes: ['level', 'department'], // Only fetch the fields needed for the DTO
                }
            ]
        });

        const studentDTOs = students.map(student => {
            return {
                matricule: student.matricule,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phoneNumber: student.phoneNumber,
                emailVerified: student.emailVerified,
                // Accessing the nested Class object properties
                level: student.Class ? student.Class.level : null,
                department: student.Class ? student.Class.department : null
            };
        });

        res.status(200).json(studentDTOs);
    } catch (error) {
        console.error("Error fetching students: ", error);
        res.status(500).json({ error: "Internal Server Error" });
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
        console.error(`Error getting the student with matricule ${req.params.matricule}`, error);
        res.status(500).json({ error: "Internal Server Error" });
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
        console.error(`Could not update student with matricule ${req.body.matricule}: `, error);
        res.status(500).json({ error: "Internal Server Error" })
    }

}

async function deleteStudent(req, res) {
    try {
        const affectedRows = await Student.destroy({
            where: {
                matricule: req.params.matricule
            }
        });

        if (affectedRows > 0) {
            console.log(`Successfully soft deleted student with matricule ${req.params.matricule}.`);
            return res.status(200).json("Successfully soft deleted student");
        } else {
            console.log(`No student found with ID ${req.params.matricule} to delete.`);
            return res.status(404).json("No student found");
        }
    } catch (error) {
        console.error("Unable to delete student: ", error);
        res.status(500).json({ error: "Could not Delete Student" });
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
    deleteStudent,
};
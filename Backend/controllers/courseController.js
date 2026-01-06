import Course from "../models/course.js";
import Class from "../models/class.js";
import ClassCourse from "../models/classCourse.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Semester from "../models/semester.js";
import CourseDto from "../dto/courseDto.js";

function mapCourseToDTO(course) {
    return course.Classes.map(cls => {
        const credit = cls.ClassCourse.credit;

        const teacherNames = course.Teachers
            .map(t => `${t.firstName} ${t.lastName}`)
            .join(', ');
        const className = `${cls.level} ${cls.department}`;

        return {
            courseCode: course.courseCode,
            courseName: course.courseName,
            credit,
            teacher: teacherNames,
            className,
            semesterId: course.semesterId
        };
    });
}

async function getAllCourses(req, res) {
    try {
        const courses = await Course.findAll({
            attributes: ['courseCode', 'courseName', 'semesterId'],
            include: [
                {
                    model: Class,
                    attributes: ['level', 'department'],
                    through: {
                        attributes: ['credit']
                    },
                    // required: true
                },
                {
                    model: Teacher,
                    attributes: ['firstName', 'lastName'],
                    through: {
                        attributes: []
                    },
                }
            ]
        });
        const courseDtos = courses.flatMap(mapCourseToDTO)
        for(let dto of courseDtos) {
            const semester = await Semester.findByPk(dto.semesterId);
            dto.number = semester ? semester.number : null;
        }
        return res.status(200).json(courseDtos);
    } catch (error) {
        console.error("Error Fetching Courses: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getCourse(req, res) {
    try {
        const course = await Course.findByPk(req.body.courseCode);

        if (course) {
            return res.status(200).json(course);
        } else {
            return res.status(200).json("Course not Found");
        }

    } catch (error) {
        console.error("Error Finding Course: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

}

async function getCourseByCode(req, res) {
    try {
        const course = await Course.findByPk(req.params.courseCode);
        if (course) {
            return res.status(200).json(course);
        } else {
            return res.status(404).json("Course not Found");
        }
    } catch (error) {
        console.error("Error Finding Course: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getCoursesForConnectedStudent(req, res) {
    try {
        // matricule and student are provided by authenticateToken middleware
        const student = req.student;
        if (!student) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!student.classId) {
            // No class assigned -> no courses
            return res.status(200).json([]);
        }

        const courses = await Course.findAll({
            include: [
                {
                    model: Class,
                    where: { classId: student.classId },
                    attributes: [],
                    through: { attributes: ["credit"] },
                    required: true,
                },
            ],
        });

        const courseDtos = courses.map((c) => new CourseDto(c));
        return res.status(200).json(courseDtos);
    } catch (error) {
        console.error("Error Fetching Courses for Student: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function createCourse(req, res) {
    try {
        const aClass = await Class.findByPk(req.params.classId);
        const teacher = await Teacher.findByPk(req.body.teacherId);

        console.log("Teacher: ", teacher);

        if (!aClass) {
            return res.status(404).json("Specified Class not found!")
        }

        if (!teacher) {
            return res.status(404).json("Specified Teacher not found!")
        }

        const course = await Course.findOne({
            where: {
                courseCode: req.body.courseCode
            },
            include: [{
                model: Class,
                where: { classId: req.params.classId },
                required: true // Ensures an INNER JOIN so only courses linked to this specific class are returned
            }],
            paranoid: false
        });

        if (course) {
            const affectedRows = await Course.restore({
                where: {
                    courseCode: req.body.courseCode
                }
            });

            if (affectedRows > 0) {

                await course.addClass(aClass, { through: { credit: req.body.credit } });
                await course.setTeachers([teacher]);
                // await ClassCourse.create({
                //     CourseCourseCode: req.body.courseCode,
                //     ClassClassId: aClass.classId,
                //     credit: req.body.credit

                // });

                return res.status(200).json(course);
            } else {
                return res.status(200).json("Course Already Exists");
            }
        } else {

            const existingCourse = await Course.findByPk(req.body.courseCode, { paranoid: false });

            if (existingCourse) {
                await ClassCourse.create({
                    CourseCourseCode: existingCourse.courseCode,
                    ClassClassId: aClass.classId,
                    credit: req.body.credit

                });
                await existingCourse.setTeachers([teacher]);
                return res.status(201).json(existingCourse);
            } else {
                const newCourse = Course.build({
                    courseCode: req.body.courseCode,
                    courseName: req.body.courseName,
                    semesterId: req.body.semesterId
                });

                await newCourse.save();

                await ClassCourse.create({
                    CourseCourseCode: req.body.courseCode,
                    ClassClassId: aClass.classId,
                    credit: req.body.credit

                });

                await newCourse.setTeachers([teacher]);

                return res.status(201).json(newCourse);
            }

        }
    } catch (error) {
        console.error("Could not Create Course: ", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function updateCourse(req, res) {
    try {
        const course = await Course.findByPk(req.params.courseCode);

        course.courseCode = req.params.courseCode || course.courseCode;
        course.courseName = req.body.courseName || course.courseName;
        course.semesterId = req.body.semesterId || course.semesterId;

        await ClassCourse.update({
            credit: req.body.credit || course.credit
        }, {
            where: {
                CourseCourseCode: req.params.courseCode,
                ClassClassId: req.params.classId
            }
        });

        // await course.setClasses([req.params.classId]);
        // await course.setTeachers([req.body.teacherId]);

        await course.save();
        return res.status(200).json(course);
    } catch (error) {
        console.error("Error Updating Course: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function deleteCourse(req, res) {
    try {
        const affectedRows = await Course.destroy({
            where: {
                courseCode: req.params.courseCode
            }
        });

        if (affectedRows > 0) {
            console.log(`Successfully soft deleted course with course code ${req.params.courseCode}.`);
            return res.status(200).json("Successfully soft deleted course");
        } else {
            console.log(`No course found with course code ${req.params.courseCode} to delete.`);
            return res.status(404).json("No course found");
        }
    } catch (error) {
        console.error("Unable to delete course: ", error);
        res.status(500).json({ error: "Could not Delete Course" });
    }
}


// Get courses by classId (public or can be protected upstream)
async function getCoursesByClassId(req, res) {
    try {
        const classIdParam = req.params.classId;
        const classId = Number(classIdParam);
        if (!Number.isFinite(classId)) {
            return res.status(400).json({ error: 'Invalid classId' });
        }

        const courses = await Course.findAll({
            include: [
                {
                    model: Class,
                    where: { classId },
                    attributes: [],
                    through: { attributes: ["credit"] },
                    required: true,
                },
            ],
        });

        const courseDtos = courses.map((c) => new CourseDto(c));
        return res.status(200).json(courseDtos);
    } catch (error) {
        console.error("Error Fetching Courses by Class: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export default {getAllCourses, createCourse, getCourse, updateCourse, deleteCourse, getCourseByCode, getCoursesForConnectedStudent, getCoursesByClassId};
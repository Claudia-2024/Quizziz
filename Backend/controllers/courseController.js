import Course from "../models/course.js";
import Class from "../models/class.js";
import ClassCourse from "../models/classCourse.js";
import CourseDto from "../dto/courseDto.js";
import Student from "../models/student.js";

async function getAllCourses(req, res) {
    try {
        const courses = await Course.findAll({
            include: [
                {
                    model: Class,
                    attributes: [],
                    through: {
                        attributes: ["credit"]
                    },
                    // required: true
                }
            ]
        });

        // console.log(courses)
        courses.forEach(course => {
            console.log(course.courseCode);

            if (course.classes && course.classes.length > 0) {
                console.log(course.classes[0].classCourse.credit);
            } else {
                console.log('No class linked');
            }
        });


        const courseDtos = courses.map(course => new CourseDto(course));
        return res.status(200).json(courseDtos);
    } catch (error) {
        console.error("Error Fetching Courses: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function getCourse(req, res) {
    try{
        const course = await Course.findByPk(req.body.courseCode);

        if(course){
            return res.status(200).json(course);
        }else{
            return res.status(200).json("Course not Found");
        }

    } catch (error){
        console.error("Error Finding Course: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }

}

async function getCourseByCode(req, res) {
    try{
        const course = await Course.findByPk(req.params.courseCode);
        if(course){
            return res.status(200).json(course);
        }else{
            return res.status(404).json("Course not Found");
        }
    } catch (error){
        console.error("Error Finding Course: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function getCoursesForConnectedStudent(req, res) {
    try {
        const matricule = req.params.matricule;
        console.log("reached here")

        const courses = await Course.findAll({
            include: [
                {
                    model: Student,
                    where: { matricule: matricule },
                    attributes: [],
                    required: true
                }
            ]
        });
        if (courses){
            return res.status(200).json(courses);
        }else{
            return res.status(404).json("No Courses Found for the Student");
        }

    }catch (error) {
        console.error("Error Fetching Courses for Student: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function createCourse(req, res){
    try{
        const course = await Course.findByPk(req.body.courseCode, { paranoid: false });
        const aClass = await Class.findByPk(req.params.classId);

        if (!aClass) {
            return res.status(404).json("Specified Class not found!")
        }

        if(course){
            const affectedRows = await Course.restore({
                where: {
                    courseCode: req.body.courseCode
                }
            });

            if (affectedRows > 0) {

                await ClassCourse.create({
                    CourseCourseCode: req.body.courseCode,
                    ClassClassId: aClass.classId,
                    credit: req.body.credit

                });
                return res.status(200).json(course);
            }else{
                return res.status(200).json("Course Already Exists");
            }
        } else{
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

            return res.status(201).json(newCourse);
        }
    } catch (error){
        console.error("Could not Create Course: ", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function updateCourse(req, res) {
    try{
        const course = await Course.findByPk(req.body.courseCode);

        course.courseCode = req.body.courseCode || course.courseCode;
        course.courseName = req.body.courseName || course.courseName;

        await course.save();
        return res.status(200).json(course);
    } catch (error){
        console.error("Error Updating Course: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function deleteCourse(req, res) {
    try{
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


export default {getAllCourses, createCourse, getCourse, updateCourse, deleteCourse, getCourseByCode, getCoursesForConnectedStudent};
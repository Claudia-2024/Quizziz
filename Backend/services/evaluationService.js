import Choice from "../models/choice.js";
import Class from "../models/class.js";
import Course from "../models/course.js";
import Evaluation from "../models/evaluation.js";
import Question from "../models/question.js";
import Student from "../models/student.js";

async function getAllEvaluations() {
    try {
        const evaluations = await Evaluation.findAll({
            include: [
                {
                    model: Question,
                    through: {
                        attributes: ["points"]
                    },
                    include: [
                        {
                            model: Choice
                        }
                    ]
                }
            ]
        });

        // if (evaluations.length === 0) {
        //     return res.status(404).json("No Evaluations Found");
        // }

        return evaluations;
    } catch (error) {
        console.log("Error Fetching Evaluations: ", error);
        throw new Error("Could not get all Evaluations");
    }
}

async function getAllPublishedEvaluations() {
    try {
        const evaluations = await Evaluation.findAll({
            where: {
                status: ['Published', 'Completed']
            },
            include: [
                {
                    model: Course,
                    attributes: ['courseCode', 'courseName'] // 👈 include courseName
                },
                {
                    model: Question,
                    through: {
                        attributes: ['points']
                    },
                    include: [
                        {
                            model: Choice
                        }
                    ]
                }
            ]
        });

        return evaluations;
    } catch (error) {
        console.log("Error Fetching Published Evaluations: ", error);
        throw new Error("Could not get all Published Evaluations")
    }

}
async function getPublishedEvaluationsForStudent(matricule) {
    try {
        const evaluations = await Evaluation.findAll({
            where: {
                status: ['Published', 'Completed']
            },
            include: [
                {
                    model: Course,
                    attributes: ['courseCode', 'courseName'],
                    required: true,
                    include: [
                        {
                            model: Class,
                            attributes: [],
                            required: true,
                            include: [
                                {
                                    model: Student,
                                    attributes: [],
                                    where: {
                                        matricule: matricule
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Question,
                    through: {
                        attributes: ['points']
                    },
                    include: [
                        {
                            model: Choice
                        }
                    ]
                }
            ]
        });

        return evaluations;
    } catch (error) {
        console.log("Error Fetching Published Evaluations for Student: ", error);
        throw new Error("Could not get published evaluations for student");
    }
}


async function getEvaluationByCourseCode(courseCode) {
    try {
        const evaluations = await Evaluation.findAll({
            where: {
                courseCode: courseCode
            },
            include: {
                model: Question,
                through: {
                    attributes: ["marks"],
                },
            },
        });
        if (evaluations) {
            return evaluations;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Unable to get Evaluations: ", error);
        throw error;
    }

}

async function createEvaluation(publishedDate, type, startTime, endTime, courseCode) {
    try {
        const evaluation = await Evaluation.findOne({
            where: {
                courseCode,
                type,
            }, paranoid: false
        });
        if (evaluation) {
            if (evaluation.deletedAt !== null) {
                await evaluation.restore();

                updateEvaluation(evaluation.evaluationId, publishedDate, type, startTime, endTime);

                return {
                    status: 'RESTORED',
                    evaluation: evaluation
                };
            }

            return {
                status: 'EXISTS',
                message: 'Evaluation already exists for this course and type'
            };
        } else {

            const newEvaluation = Evaluation.build({
                publishedDate,
                uploadDate: new Date(),
                type,
                startTime,
                endTime,
                courseCode,
                status: "Draft",
            });
            await newEvaluation.save();
            return {
                status: 'CREATED',
                evaluation: newEvaluation
            };
        }
    } catch (error) {
        console.error("Error Creating Evaluation: ", error);
        // res.status(500).json("Internal Server Error");
        throw error;
    }
}

async function updateEvaluation(evaluationId, publishedDate, type, startTime, endTime) {
    try {
        const evaluation = await Evaluation.findByPk(evaluationId);

        if (evaluation) {
            if (evaluation.status !== "Draft") {
                return { status: "PUBLISHED", evaluation: [] }
            }
            evaluation.publishedDate = publishedDate || evaluation.publishedDate;
            evaluation.type = type || evaluation.type;
            evaluation.startTime = startTime || evaluation.startTime;
            evaluation.endTime = endTime || evaluation.endTime;

            await evaluation.save();
            return { status: "UPDATED", evaluation: evaluation };
        } else {
            return { status: "NOT FOUND", evaluation: [] };
        }
    } catch (error) {
        console.error("Error Updating Evaluation: ", error);
        throw new Error("Could not update Evaluation");
    }
}

async function deleteEvaluation(evaluationId) {
    try {
        const evaluation = await Evaluation.findByPk(evaluationId);

        if (evaluation.status === "Draft") {
            const deletedEvaluation = await Evaluation.destroy({
                where: {
                    evaluationId: evaluationId
                }
            });
            if (deletedEvaluation > 0) {
                return { status: "DELETED" };
            } else {
                // res.status(404).json("Evaluation Not Found");
                return { status: "NOT FOUND" };
            }
        } else {
            return { status: "PUBLISHED" };
        }

    } catch (error) {
        console.error("Error Deleting Evaluation: ", error);
        // res.status(500).json("Internal Server Error");
        throw new Error("Could not delete Evaluation");
    }
}

export default {
    getAllEvaluations,
    getEvaluationByCourseCode,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getAllPublishedEvaluations,
    getPublishedEvaluationsForStudent
};
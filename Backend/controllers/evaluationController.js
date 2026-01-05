import EvaluationQuestion from "../models/evaluationQuestion.js";
import questionService from "../services/questionService.js";
import evaluationService from "../services/evaluationService.js";
import choiceService from "../services/choiceService.js";
import EvaluationDto from "../dto/evaluationDto.js";
import Evaluation from "../models/evaluation.js";
import responseSheetService from "../services/responseSheetService.js";
import ResponseSheet from "../models/responseSheet.js";
import Answer from "../models/answer.js";
import Question from "../models/question.js";
import studentEvaluationDto from "../dto/studentEvaluationDto.js";
import studentQuestionDto from "../dto/studentQuestionDto.js";
import Choice from "../models/choice.js";
import AIGradingService from "../services/AIGradingService.js";

function combineDateAndTime(date, time) {
    const [hours, minutes, seconds] = time.split(':');
    const d = new Date(date);
    d.setHours(hours, minutes, seconds || 0, 0);
    return d;
}
async function autoSubmitResponseSheet(responseSheet) {
    responseSheet.submittedAt = new Date();
    responseSheet.serverSubmitTime = new Date();
    await responseSheet.save();

    return await autoGrade(responseSheet.responseSheetId);
}
async function autoGrade(responseSheetId) {
    const answers = await Answer.findAll({
        where: { id: responseSheetId },
        include: [
            {
                model: Question,
                include: [
                    {
                        model: Evaluation,
                        attributes: ["evaluationId"],
                        through: {
                            model: EvaluationQuestion,
                            attributes: ["points"]
                        },
                        required: true
                    },
                    {
                        model: Choice,
                        required: false
                    }
                ]
            }
        ]
    });

    const responseSheet = await ResponseSheet.findByPk(responseSheetId);

    if(!responseSheet){
        throw new Error("Response Sheet not found");
    }

    const evaluationId = responseSheet.evaluationId;

    let totalScore = 0;

    for (const answer of answers) {
        const question = answer.Question;

        const evaluationEntry = question.Evaluations.find(
            e => e.evaluationId === evaluationId
        );

        const points = evaluationEntry?.EvaluationQuestion?.points || 0;

        let score = 0;

        if (question.type === 'MCQ' || question.type === "Close") {
            const selected = question.Choices.find(
                c => c.choiceId === answer.selectedOption
            );

            if (selected && selected.isCorrect) {
                score = points;
            }
        }

        answer.score = score;
        await answer.save();

        totalScore += score;
    }

    responseSheet.score = totalScore;
    // responseSheet.gradingStatus = "AUTO";

    await responseSheet.save();

    return responseSheet;
}

async function gradeResponseSheet(responseSheetId) {

    //correct it
  const answers = await Answer.findAll({
    where: { responseSheetId },
    include: [Question]
  });

  let totalScore = 0;

  for (const answer of answers) {
    const question = answer.Question;

    const evalQ = await EvaluationQuestion.findOne({
      where: {
        questionId: question.questionId
      }
    });

    const maxScore = evalQ.points;

    // OPEN QUESTION → AI grading
    if (question.type === "OPEN") {
      const aiResult = await AIGradingService.gradeOpenAnswer({
        questionText: question.text,
        studentAnswer: answer.textValue,
        maxScore
      });

      answer.score = aiResult.score;
      answer.feedback = aiResult.feedback;
      answer.gradingConfidence = aiResult.confidence;
      answer.gradingSource = aiResult.gradingSource;

      totalScore += aiResult.score;
    }

    // MCQ / CLOSED grading handled elsewhere
    await answer.save();
  }

  return totalScore;
}

async function createEvaluationSession(req, res) {
    try {
        const { questions } = req.body;

        let newEvaluation;
        let count = 0;

        const result = await evaluationService.createEvaluation(
            req.body.publishedDate,
            req.body.type,
            req.body.startTime,
            req.body.endTime,
            req.body.courseCode
        );
        if (result.status === 'RESTORED') {
            newEvaluation = result.evaluation;
        }
        else if (result.status === 'CREATED') {
            newEvaluation = result.evaluation;
        }
        else if (result.status === 'EXISTS') {
            return res.status(200).json("Evaluation Already Exists for this Course and Type");
        } else {
            return res.status(409).json(result.message);
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: "Questions array is required and cannot be empty." });
        }
        for (const q of questions) {
            const newQuestion = await questionService.createQuestion(
                q.text,
                q.type,
                q.order,
            );

            if (newQuestion.type === "MCQ" || newQuestion.type === "Close") {
                if (!q.choices || q.choices.length < 2) {
                    throw new Error('MCQ must have at least 2 choices');
                }
                for (const c of q.choices) {
                    await choiceService.createChoice(
                        c.text,
                        c.order,
                        c.isCorrect,
                        newQuestion.questionId,
                    )
                }
            }

            await EvaluationQuestion.create({
                EvaluationEvaluationId: newEvaluation.evaluationId,
                QuestionQuestionId: newQuestion.questionId,
                points: q.points
            });
            count += 1;
        }
        if (count == questions.length) {
            return res.status(201).json("Evaluation created successfully");
        }

    } catch (error) {
        console.error("Error creating evaluation session: ", error);
        res.status(500).json("Failed to create Evaluation");
    }
}

async function updateEvaluationSession(req, res) {
    try {
        const { questions } = req.body;

        const result = await evaluationService.updateEvaluation(
            req.params.evaluationId,
            req.body.publishedDate,
            req.body.type,
            req.body.startTime,
            req.body.endTime,
            req.body.courseCode
        );

        if (result.status === "NOT FOUND") {
            return res.status(404).json("Evaluation Not Found")
        }

        if (result.status === "PUBLISHED"){
            return res.status(403).json("Evaluation Already Published And Cannot be Updated");
        }

        for (const q of questions) {
            await questionService.updateQuestion(
                q.questionId,
                q.text,
                q.type,
                q.order,
            );

            if (q.type === "MCQ" || q.type === "Close") {
                if (!q.choices || q.choices.length < 2) {
                    throw new Error('Multiple choice questions must have at least 2 choices');
                }
                for (const c of q.choices) {
                    await choiceService.updateChoice(
                        c.choiceId,
                        c.text,
                        c.order,
                        c.isCorrect,
                        q.questionId
                    );
                }
            }

        }
        return res.status(200).json("Evaluation Updated Successfully");
    } catch (error) {
        console.error("Error Updating Evaluation: ", error);
        return res.status(500).json("Failed to Update Evaluation");
    }

}

async function deleteEvaluationSession(req, res) {
    try{
        const result = await evaluationService.deleteEvaluation(req.params.evaluationId);

        if (result.status === "NOT FOUND"){
            return res.status(404).json("Evaluation Not Found");
        }
        if (result.status === "DELETED"){
            return res.status(200).json("Evaluation Deleted Successfully");
        }
        if (result.status === "PUBLISHED"){
            return res.status(403).json("Evaluation Published Already");
        }
    }catch (error){
        console.error("Error Deleting Evaluation: ", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function getAllEvaluationSessions(req, res) {
    try {
        const evaluations = await evaluationService.getAllEvaluations();

        const evaluationDtos = evaluations.map(evaluation => new EvaluationDto(evaluation));

        return res.status(200).json(evaluationDtos);
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        res.status(500).json({
            message: "Failed to fetch evaluations"
        });
    }
}

async function getEvaluationByCourseCode(req, res) {
    try {
        const courseCode = req.params.courseCode;
        const evaluation = await evaluationService.getEvaluationByCourseCode(courseCode);
        if (evaluation) {
            const evaluationDto = new EvaluationDto(evaluation);
            return res.status(200).json(evaluationDto);
        } else {
            return res.status(404).json("Evaluation Not Found for the given Course Code");
        }
    } catch (error) {
        console.error("Error fetching evaluation by course code:", error);
        res.status(500).json({
            message: "Failed to fetch evaluation by course code"
        });
    }
}

async function getRevisionQuestions(req, res) {
    try{
        const evaluations = await evaluationService.getAllPublishedEvaluations();

        const evaluationDtos = evaluations.map(evaluation => new EvaluationDto(evaluation));

        return res.status(200).json(evaluationDtos);
    }catch (error) {
        console.error("Error Fetching Evaluations Questions:", error);
        res.status(500).json({
            message: "Failed to Fetch Evaluations Questions"
        });
    }
}

async function getAllPublishedEvaluationSessions(req, res) {
    try {
        const evaluations = await evaluationService.getAllPublishedEvaluations();

        const evaluationDtos = evaluations.map(evaluation => new studentEvaluationDto(evaluation));
        return res.status(200).json(evaluationDtos);
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        res.status(500).json({
            message: "Failed to fetch evaluations"
        });
    }
}

async function startEvaluation(req, res) {
    try {
        //gotten from parameter
        const { evaluationId } = req.params;
        //gotten after authentication
        const matricule = req.body.matricule;
        //gotten from the student's device
        const clientStartTime = req.body.clientStartTime;

        const evaluation = await Evaluation.findByPk(evaluationId);

        if (!evaluation || evaluation.status !== "Published") {
            return res.status(403).json("Evaluation not available");
        }

        const now = new Date();

        const endDateTime = combineDateAndTime(evaluation.publishedDate, evaluation.endTime);

        if (now > endDateTime) {
            return res.status(403).json("Evaluation is Over");
        }

        let responseSheet = await responseSheetService.createResponseSheet(evaluationId, matricule, now, clientStartTime, null, 0);

        const questions = await questionService.getQuestionsByEvaluationId(evaluationId);

        const questionDtos = questions.map(question => new studentQuestionDto(question));

        return res.status(200).json({ responsheetId: responseSheet.responseSheetId, questionDtos });

    } catch (error) {
        console.error("Start Evaluation error: ", error);
        return res.status(500).json("Failed to Start Evaluation");
    }
}

async function saveAnswers(req, res) {
    try {
        const { id: responseSheetId } = req.params;
        const { answers } = req.body;

        const responseSheet = await ResponseSheet.findByPk(responseSheetId);

        if (!responseSheet || responseSheet.submittedAt) {
            return res.status(403).json("ResponseSheet Submitted Already");
        }

        for (const ans of answers) {
            const [answer, created] = await Answer.findOrCreate({
                where: {
                    id: responseSheetId,
                    questionId: ans.questionId
                },
                defaults: {
                    id: responseSheetId,
                    questionId: ans.questionId
                }
            });

            answer.selectedOption = null;
            answer.textAnswer = null;

            if (ans.type === "MCQ" || ans.type === "Close") {
                answer.selectedOption = ans.selectedOption;
            }

            if (ans.type === "Open") {
                answer.openTextResponse = ans.openTextResponse;
            }

            await answer.save();
        }

        return res.status(200).json("Answers Saved!");

    } catch (error) {
        console.error("Save Answers Error: ", error);
        return res.status(500).json("Failed to Save Answers")
    }
}

async function submitAnswers(req, res) {
    try {
        const { id: responseSheetId } = req.params;
        const { answers } = req.body;

        const responseSheet = await ResponseSheet.findByPk(responseSheetId);

        if (!responseSheet || responseSheet.submittedAt) {
            return res.status(403).json("ResponseSheet Submitted Already");
        }

        for (const ans of answers) {
            const [answer, created] = await Answer.findOrCreate({
                where: {
                    id: responseSheetId,
                    questionId: ans.questionId
                },
                defaults: {
                    id: responseSheetId,
                    questionId: ans.questionId
                }
            });

            answer.selectedOption = null;
            answer.textAnswer = null;

            if (ans.type === "MCQ" || ans.type === "Close") {
                answer.selectedOption = ans.selectedOption;
            }

            if (ans.type === "Open") {
                answer.openTextResponse = ans.openTextResponse;
            }

            await answer.save();
        }

        const submittedResponseSheet = await autoSubmitResponseSheet(responseSheet);

        if(submittedResponseSheet){
            return res.status(200).json("Answers Submitted Successfully");
        }else{
            return res.status(404).json("Answers Not Submitted")
        }

    }catch (error) {
        console.error("Error Submitting Responsheet: ", error);
        return res.status(500).json("Failed to Submit Answers")
    }
}

export default {
    createEvaluationSession,
    updateEvaluationSession,
    getAllEvaluationSessions,
    getAllPublishedEvaluationSessions,
    startEvaluation,
    saveAnswers,
    submitAnswers,
    deleteEvaluationSession,
    getRevisionQuestions,
    getEvaluationByCourseCode
}
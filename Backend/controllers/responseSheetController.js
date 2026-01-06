import ResponseSheet from "../models/responseSheet.js";
import Answer from "../models/answer.js";
import sequelize from "../config/database.js";

async function getAllResponseSheets(req, res){
    try{
        const responseSheets = await ResponseSheet.findAll();
        return res.status(200).json(responseSheets);
    }catch(error){
        console.log("Error Fetching Response Sheets: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function getResponseSheetsByEvaluationId(req, res){
    try{
        const responseSheets = await ResponseSheet.findAll({
        include: [{
            model: Evaluation,
            attributes: [],
            where: { id: req.params.evaluationId },
        }]
     });
        if (responseSheets) {
            return res.status(200).json(responseSheets);
        } else {
            return res.status(404).json({ error: "No Response Sheets Found" });
        }
    }catch(error){
        console.log("Error Fetching Response Sheets by Evaluation: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function getScoreByEvaluation(req, res){
    try{
        const responseSheets = await ResponseSheet.findAll({
            where: {
                matricule: req.student.matricule,
            },
            include: [{
                model: Evaluation,
            }]
        });

        if (responseSheets) {
            const dto = responseSheets.map(rs => new ScoreDto(rs));
            return res.status(200).json(dto);
        } else {
            return res.status(404).json({ error: "No Response Sheets Found" });
        }
    }catch(error){
        console.log("Error Fetching Response Sheets by Matricule", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function findResponseSheetByMatriculeAndEvaluationId(req, res){
    try{
        const responseSheet = await ResponseSheet.findOne({
            where: {
                evaluationId: req.params.evaluationId,
                matricule: req.params.matricule
            }
        });
        if (!responseSheet) {
            return res.status(404).json("Response Sheet not found");
        }
        res.status(200).json(responseSheet);
    } catch (error){
        console.error(`Error getting the response sheet for matricule ${req.params.matricule} and evaluation ${req.params.evaluationId}`, error);
        res.status(500).json({error: "Internal Server Error" });
    }
}

async function createResponseSheet(req, res){
    try{
        const responseSheet = await ResponseSheet.findOne({
            where: {
                evaluationId: req.body.evaluationId,
                matricule: req.body.matricule
            }
        });
        if (responseSheet) {
            return res.status(400).json("Response Sheet Already Exists for this Student and Evaluation");
        }else{
        const newResponseSheet = await ResponseSheet.create({
            evaluationId: req.body.evaluationId,
            matricule: req.body.matricule,
            submittedAt: req.body.submittedAt || null,
            serverStartTime: req.body.serverStartTime,
            serverSubmitTime: req.body.serverSubmitTime || null,
            clientStartTime: req.body.clientStartTime || null,
            clientSubmitTime: req.body.clientSubmitTime || null,
            score: req.body.score || 0,
        });
        return res.status(201).json(newResponseSheet);
        }
    }catch(error){
        console.log("Error Creating Response Sheet: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function updateResponseSheet(req, res){
    try{
        const responseSheet = await ResponseSheet.findByPk(req.params.responseSheetId);
        if(responseSheet){
            responseSheet.submittedAt = req.body.submittedAt !== undefined ? req.body.submittedAt : responseSheet.submittedAt;
            responseSheet.serverStartTime = req.body.serverStartTime !== undefined ? req.body.serverStartTime : responseSheet.serverStartTime;
            responseSheet.serverSubmitTime = req.body.serverSubmitTime !== undefined ? req.body.serverSubmitTime : responseSheet.serverSubmitTime;
            responseSheet.clientStartTime = req.body.clientStartTime !== undefined ? req.body.clientStartTime : responseSheet.clientStartTime;
            responseSheet.clientSubmitTime = req.body.clientSubmitTime !== undefined ? req.body.clientSubmitTime : responseSheet.clientSubmitTime;
            responseSheet.score = req.body.score !== undefined ? req.body.score : responseSheet.score;

            await responseSheet.save();
            return res.status(200).json(responseSheet);
        }else{
            return res.status(404).json({ error: "Response Sheet Not Found" });
        }
    }catch(error){
        console.log("Error Updating Response Sheet: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function submitAnswersOffline(req, res) {
    const transaction = await sequelize.transaction();
    try {
        const { responseSheetId } = req.params;
        const { answers, attemptLocalId, submittedAt, isOfflineSubmission } = req.body;

        // Valider que la feuille de réponses existe
        const responseSheet = await ResponseSheet.findByPk(responseSheetId, { transaction });
        if (!responseSheet) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Response sheet not found' });
        }

        // Valider les réponses
        if (!Array.isArray(answers) || answers.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Answers array is required and cannot be empty' });
        }

        // Vérifier pour les doublons (même attemptLocalId)
        let isDuplicate = false;
        if (attemptLocalId) {
            const existingSubmission = await ResponseSheet.findOne({
                where: { attemptLocalId: attemptLocalId },
                transaction
            });
            if (existingSubmission && existingSubmission.responseSheetId !== parseInt(responseSheetId)) {
                isDuplicate = true;
                // Doublon détecté - retourner succès (idempotent)
                await transaction.rollback();

                // Log le doublon
                logOfflineSubmission({
                    responseSheetId: existingSubmission.responseSheetId,
                    attemptLocalId: attemptLocalId,
                    matricule: responseSheet.matricule,
                    evaluationId: responseSheet.evaluationId,
                    answerCount: answers.length,
                    isOfflineSubmission: isOfflineSubmission === true,
                    clientSubmittedAt: submittedAt,
                    status: 'duplicate',
                    isDuplicate: true
                });

                return res.status(200).json({
                    responseSheetId: existingSubmission.responseSheetId,
                    success: true,
                    message: 'Duplicate submission detected - already processed',
                    submittedAt: existingSubmission.submittedAt
                });
            }
        }

        // Sauvegarder chaque réponse
        for (const answer of answers) {
            const { questionId, type, selectedOption, textAnswer } = answer;

            if (!questionId) {
                await transaction.rollback();
                return res.status(400).json({ error: `Question ID is required for answer` });
            }

            await Answer.create({
                responseSheetId: responseSheetId,
                questionId: questionId,
                selectedOption: selectedOption || null,
                openTextResponse: textAnswer || null,
                type: type || 'mcq',
                isCorrect: false // À déterminer lors du grading
            }, { transaction });
        }

        // Mettre à jour la feuille de réponses
        const now = new Date();
        responseSheet.status = 'submitted';
        responseSheet.attemptLocalId = attemptLocalId || null;
        responseSheet.isOfflineSubmission = isOfflineSubmission === true;
        responseSheet.offlineSubmittedAt = submittedAt ? new Date(submittedAt) : null;
        responseSheet.syncedAt = now;
        responseSheet.submittedAt = now;

        await responseSheet.save({ transaction });
        await transaction.commit();

        // Log la soumission
        logOfflineSubmission({
            responseSheetId: responseSheet.responseSheetId,
            attemptLocalId: attemptLocalId,
            matricule: responseSheet.matricule,
            evaluationId: responseSheet.evaluationId,
            answerCount: answers.length,
            isOfflineSubmission: isOfflineSubmission === true,
            clientSubmittedAt: submittedAt,
            status: 'submitted',
            isDuplicate: isDuplicate
        });

        return res.status(200).json({
            responseSheetId: responseSheet.responseSheetId,
            success: true,
            submittedAt: responseSheet.submittedAt,
            message: isOfflineSubmission ? 'Offline answers submitted successfully' : 'Answers submitted successfully'
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error submitting answers:', error);
        return res.status(500).json({ error: 'Failed to submit answers' });
    }
}

export default{
    getAllResponseSheets,
    getResponseSheetsByEvaluationId,
    createResponseSheet,
    updateResponseSheet,
    findResponseSheetByMatriculeAndEvaluationId,
    getScoreByEvaluation,
    submitAnswersOffline
};
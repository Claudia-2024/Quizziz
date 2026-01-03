import ResponseSheet from "../models/responseSheet.js";

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

export default{
    getAllResponseSheets,
    getResponseSheetsByEvaluationId,
    createResponseSheet,
    updateResponseSheet,
    findResponseSheetByMatriculeAndEvaluationId,
    getScoreByEvaluation
};
import Class from "../models/class.js";

async function getAllClasses(req, res) {
    try{
        const classes = await Class.findAll();

        return res.status(200).json(classes);
    } catch (error){
        console.error("Error Fetching Classes: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function getClass(req, res){
    try{
        const aClass = await Class.findByPk(req.params.classId);

        return res.status(200).json(aClass);
    } catch (error){
        console.error("Error Fetching Class: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

async function createClass(req, res){
    try{
        const sameClass = await Class.findOne({
            where: {
                level: req.body.level,
                department: req.body.department
            },
            paranoid: false
        });

        if (sameClass){
            const affectedRows = await Class.restore({
                where: {
                    level: req.body.level,
                    department: req.body.department
                }
            });

            if(affectedRows){
                sameClass.totalStudents = req.body.totalStudents || sameClass.totalStudents;
                await sameClass.save();
                return res.status(200).json("Class Restored Successfully");
            }else{
                return res.status(200).json("Class Already Exist");
            }

        }else {
            const newClass = Class.build({
                level: req.body.level,
                department: req.body.department,
                totalStudents: req.body.totalStudents || 0,
                isActive: true
            });

            await newClass.save();
            return res.status(201).json(newClass);
        }
    } catch (error){
        console.error("Error Creating Class: ", error);
        return res.status(500).json({error: "Internal Server Error"});
    }

}

async function updateClass(req, res){
    try{
        const updatedClass = await Class.findByPk(req.params.classId);

        if (!updatedClass) {
            return res.status(404).json("Class not found");
        }
        updatedClass.level = req.body.level || updatedClass.level;
        updatedClass.department = req.body.department || updatedClass.department;
        updatedClass.totalStudents = req.body.totalStudents || updatedClass.totalStudents;

         await updatedClass.save();
            res.status(200).json(updatedClass);
    } catch (error){
        console.error(`Could not update class with id ${req.params.classId}: `, error);
        if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json("A class with the same level and department already exists. Please choose a different combination.",
      );
    }
        res.status(500).json("Internal Server Error")
    }

}

async function activateClass(req, res) {
    try{
        const aClass = await Class.findByPk(req.params.classId);

        if (aClass){
            aClass.isActive = !aClass.isActive;
            await aClass.save();
            return res.status(200).json(`Class has been ${aClass.isActive ? 'activated' : 'deactivated'} successfully.`);
        }else{
            return res.status(404).json("Class not found.");
        }
    } catch (error){
        console.error("Unable to Activate/Deactivate class: ", error);
        res.status(500).json({ error: "Could not Activate/Deactivate Class" });
    }
}

async function deleteClass(req, res) {
    try {
        const deleteClass = await Class.findByPk(req.params.classId);

        if (deleteClass) {
            if (deleteClass.deletedAt) {
                const affectedRows = await Class.restore({
                    where: {
                        classId: deleteClass.classId,
                    }
                });

                if (affectedRows > 0) {
                    return res.status(200).json("Successfully Activated Class");
                } else {
                    return res.status(400).json("No Class Found");
                }
            } else {
                const affectedRows = await Class.destroy({
                    where: {
                        classId: req.params.classId
                    }
                });

                if (affectedRows > 0) {
                    return res.status(200).json("Successfully Deactivated Class");
                } else {
                    return res.status(404).json("No Class Found");
                }
            }
        }else{
            return res.status(404).json("No Class Found");
        }

    } catch (error) {
        console.error("Unable to Activate/Deactivate class: ", error);
        res.status(500).json({ error: "Could not Activate/Deactivate Class" });
    }
}

export default {getAllClasses, getClass, createClass, deleteClass, updateClass, activateClass};
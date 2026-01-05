import Semester from "../models/semester.js";
import AcademicYear from "../models/academicYear.js";
import { Op } from "sequelize";

async function getAllSemesters(req, res) {
    try {
        const semesters = await Semester.findAll();
        return res.status(200).json(semesters);
    } catch (error) {
        console.error("Error Fetching Semesters: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

async function getAllUsableSemesters(req, res) {
    try {
        const years = await AcademicYear.findAll({
            where: {
                endDate: {
                    [Op.lte]: new Date(),
                }
            }
        });
        const semesters = await Semester.findAll();
        let usableSemesters = [];

        if (years) {
            for (const year of years) {
                for (const semester of semesters) {
                    if (semester.startDate >= year.startDate) {
                        usableSemesters.push(semester);
                    }
                }
            }

            return res.status(200).json(usableSemesters);
        }else {
            return res.status(200).json("No Academic Years Available, Please create an Academic Year first");
        }
    }catch (error) {
        console.error("Error Fetching Usable Semesters: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getCurrentYearSemesters(req, res) {
    try {
        const currentYear = await AcademicYear.findOne({
            where: {
                isPresent: true,
            },
        });
        if (currentYear) {
            const semesters = await Semester.findAll({
                where: {
                    yearId: currentYear.yearId,
                },
            });
            return res.status(200).json(semesters);
        } else {
            return res.status(200).json("No Active Academic Year");
        }
    }
    catch (error) {
        console.error("Error Fetching Current Year Semesters: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getCurrentSemester(req, res) {
    try {
        const semesters = await Semester.findAll();

        const currentSemester = semesters.find(semester => semester.isActive == true);

        if (currentSemester) {
            return res.status(200).json(currentSemester);
        } else {
            return res.status(200).json("No Active Semester")
        }
    } catch (error) {
        console.error("Error Fetching Semester: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }


};

async function createSemester(req, res) {
    try {
        const year = await AcademicYear.findByPk(req.body.yearId);

        //Verify that the academic year is either current or future
        if (year.isPresent == false && new Date(year.startDate) < new Date()) {
            return res.status(400).json("Cannot create semester for a past academic year");
        }
        //Verify that the semester dates are within the academic year dates
        if (new Date(req.body.startDate) < new Date(year.startDate) || new Date(req.body.endDate) > new Date(year.endDate)) {
            return res.status(400).json("Semester dates must be within the academic year dates");
        }

        //Verify that there is no other semester with the same number for the academic year
        const semester = await Semester.findOne({
            where: {
                number: req.body.number,
                yearId: req.body.yearId,
            }
        });

        if (semester) {
            return res.status(400).json("Semester with the same number already exists for this academic year");
        }

        //Verify that there is no other semester with the same start date
        const existingSemester = await Semester.findOne({
            where: {
                startDate: req.body.startDate,
            }
        });

        if (existingSemester) {
            return res.status(400).json("Semester with the same start date already exists");
        } else {
            const newSemester = Semester.build({
                number: req.body.number,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                yearId: req.body.yearId,
                isActive: false,
            });

            await newSemester.save();
            return res.status(201).json(newSemester);
        }
    } catch (error) {
        console.error("Error Creating Semester: ", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function updateSemester(req, res) {
    try {
        const semester = await Semester.findByPk(req.params.semesterId);

        if (semester) {

            semester.startDate = req.body.startDate || semester.startDate;
            semester.endDate = req.body.endDate || semester.endDate;

            await semester.save();
            return res.status(200).json(semester);
        } else {
            return res.status(404).json("Semester not found");
        }
    } catch (error) {
        console.error("Error Updating Semester: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function updateCurrentSemester() {
    console.log('Running scheduled task: updateCurrentSemester');
    const today = new Date();

    try {
        // 1. Find the semester that contains today's date
        const currentSemesterRecord = await Semester.findOne({
            where: {
                startDate: {
                    [Op.lte]: today, // Start date is less than or equal to today
                },
                endDate: {
                    [Op.gte]: today, // End date is greater than or equal to today
                },
            },
        });

        if (currentSemesterRecord) {
            // 2. Set the found semester's isActive to true (if not already)
            if (!currentSemesterRecord.isActive) {
                currentSemesterRecord.isActive = true;
                await currentSemesterRecord.save();
                console.log(`Semester ID ${currentSemesterRecord.semesterId} set to isActive: true`);
            }

            // 3. Set all other semester' isActive to false
            // Find all semester EXCEPT the current one and update them
            await Semester.update(
                { isActive: false },
                {
                    where: {
                        semesterId: {
                            [Op.ne]: currentSemesterRecord.semesterId, // ID is NOT equal to the current one
                        },
                        isActive: true, // Only update those that are currently true
                    },
                }
            );
            console.log('All other semesters set to isActive: false');

        } else {
            console.warn('No semester found for the current date.');
            // Optionally set all to false if no match is found for the current date
            await Semester.update({ isActive: false }, { where: { isActive: true } });
        }

    } catch (error) {
        console.error('Error in updateCurrentSemester scheduled task:', error);
    }
}

export default { createSemester, updateCurrentSemester, updateSemester, getCurrentSemester, getAllSemesters, getAllUsableSemesters, getCurrentYearSemesters };
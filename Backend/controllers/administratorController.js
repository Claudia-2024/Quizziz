import Administrator from "../models/administrator.js";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

async function createAdmin(req, res) {
    try{
        const admin = await Administrator.findByPk(req.body.email);

        if (admin) {
            const affectedRows = await Administrator.restore({
                where: {
                    email: req.body.email,
                }
            });

            if (affectedRows > 0){
                res.status(200).json("Admin Successfully Restored");
            }else{
                res.status(200).json("Admin Already Exists");
            }
        }else{
            const newAdmin = Administrator.build({
                email: req.body.email,
                password: req.body.password,
                role: 'admin',
            })
            await newAdmin.save();
            res.status(201).json(newAdmin);
        }
    }catch(error){
        console.error("Unable to create admin: ", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

async function updateAdmin(req, res){
    try{
        const admin = await Administrator.findByPk(req.params.adminId);
        if(admin){
            admin.password = req.body.password || admin.password;
            await admin.save();
            res.status(200).json(admin);
        }else{
            res.status(404).json("Admin Not Found");
        }
    }catch(error){
        console.error("Error updating admin: ", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export default {createAdmin, updateAdmin};
 
// Add admin login handler
export async function adminLogin(req, res) {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const admin = await Administrator.findOne({ where: { email } });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // NOTE: For production, compare hashed password (e.g., bcrypt.compare).
        if (admin.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { email: admin.email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                adminId: admin.adminId,
                email: admin.email,
                role: admin.role,
            },
            expiresIn: 7 * 24 * 60 * 60, // seconds
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
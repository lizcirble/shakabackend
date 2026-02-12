import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authController.loginOrRegister);

// Example of a protected route
// import { authMiddleware } from '../middleware/authMiddleware.js';
// router.get('/me', authMiddleware, (req, res) => {
//     res.status(200).json({ success: true, user: req.user });
// });

export default router;

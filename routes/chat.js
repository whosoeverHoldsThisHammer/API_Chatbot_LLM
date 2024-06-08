import express from 'express'
import { generateAnswer } from '../controllers/chat.js'

const router = express.Router()

router.get("/", generateAnswer)


export default router
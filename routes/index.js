import { Router } from 'express'
import chatRoutes from './chat.js'

const routerMaster = Router()  

routerMaster.use('/test', chatRoutes)

export default routerMaster

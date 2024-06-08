import express from 'express'
import routerMaster from './routes/index.js' 
import * as dotenv from "dotenv";

dotenv.config();

const app = express()
app.use(express.json())
app.use(routerMaster)

const PORT = process.env.PORT

app.listen(PORT, ()=> 
    console.log('Server express levantado')

)
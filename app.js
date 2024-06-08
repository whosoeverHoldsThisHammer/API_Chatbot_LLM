import express from 'express'
import routerMaster from './routes/index.js' 
import * as dotenv from "dotenv";
import cors from 'cors'

dotenv.config();

const app = express()

app.use(cors());
app.use(express.json())
app.use(routerMaster)

const PORT = 3000 //process.env.PORT

app.listen(PORT, ()=> 
    console.log('Server express levantado')

)
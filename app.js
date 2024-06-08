import express from 'express'
import routerMaster from './routes/index.js' 

const PORT = 3000
const app = express()

app.use(express.json())
app.use(routerMaster)

const chat = [
    {human: "Hola, soy Simón"},
    {system: "Hola Simón, ¿en qué puedo ayudarte"},
    {human: "¿Cómo configuro un almacén?"},
    {system: ""}
]


app.listen(PORT, ()=> console.log('Server express levantado'))

// app.get('/api/history', (req, res)=> res.json(chat))

/*app.post('/api/chat', (req, res)=> {
    console.log("estoy vivo")
    const human_message = req.body.human_message

    res.json(human_message)
})*/
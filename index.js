import express from 'express'

const PORT = 3000
const app = express()
app.use(express.json())

const chat = [
    {human: "Hola, soy Simón"},
    {system: "Hola Simón, ¿en qué puedo ayudarte"},
    {human: "¿Cómo configuro un almacén?"},
    {system: ""}
]


app.listen(PORT, ()=> console.log('Server express levantado'))

app.get('/', (req, res)=> res.send("Hola mundo desde express"))


app.get('/api/history', (req, res)=> res.json(chat))

app.post('/api/chat', (req, res)=> {
    console.log("estoy vivo")
    const human_message = req.body.human_message
    
    //const history = req.body.history

    res.json(human_message)
})
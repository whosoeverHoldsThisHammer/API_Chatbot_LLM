
// GET
const generateAnswer = async (req, res) => {
    try {
        // const data = req.body
        console.log("Estoy acá")
        res.json("Hola")
        //res.send({data})
    } catch (error) {
        
    }
  
}

export { generateAnswer }
import askModel from '../openai.js'

// GET
const generateAnswer = async (req, res) => {
    try {

        let answer = askModel

        res.json(answer)
        
    } catch (error) {
        
    }
  
}

export { generateAnswer }
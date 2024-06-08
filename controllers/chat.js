import answer from '../openai.js'

const generateAnswer = async (req, res) => {
    try {

        const response = await answer(req.body.human_message);
        res.json(response)

    } catch (error) {
        console.log("Error!")
    }
  
}

export { generateAnswer }
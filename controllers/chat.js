import answer from '../openai.js'

const generateAnswer = async (req, res) => {
    try {

        // console.log(req.body)

        const response = await answer(req.body.content, req.body.history);
        res.json(response)

    } catch (error) {
        console.log("Error!")
    }
  
}

export { generateAnswer }
import answer from '../openai.js'

const generateAnswer = async (req, res) => {
    try {

        // console.log(req.boy.history)

        const response = await answer(req.body.content);
        res.json(response)

    } catch (error) {
        console.log("Error!")
    }
  
}

export { generateAnswer }
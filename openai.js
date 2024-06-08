import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser, CommaSeparatedListOutputParser } from "@langchain/core/output_parsers" 

import * as dotenv from "dotenv";

dotenv.config();

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0
});

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "Generá un chiste a partir de la palabra que te pase el usuario"],
    ["human", "{input}"]
])

const parser = new StringOutputParser();
const chain = prompt.pipe(model).pipe(parser)

const answer = async (query)=> {
    
    let result = await chain.invoke({
        input: query
    })

    return result
}


export default answer
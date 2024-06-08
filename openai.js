/* import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser, CommaSeparatedListOutputParser } from "@langchain/core/output_parsers" */ 

import { ChatOpenAI } from "@langchain/openai" 
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";


import * as dotenv from "dotenv";

dotenv.config();

/* const model = new ChatOpenAI({
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


export default answer */



// Instancia el modelo. Temperatura 0 para que sea lo menos creativo posible
const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });


// Carga los documentos (Llevarlo a otro módulo)
const loader = new DirectoryLoader(
  "data",
  {
    ".txt": (path) => new TextLoader(path),
  }
);

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1024,
  chunkOverlap: 200,
});

const slited = await splitter.splitDocuments(docs);
const embeddings = new OpenAIEmbeddings();


// Crea el vector de incrustaciones
const vectorStore = await FaissStore.fromDocuments(
    slited,
    embeddings
  );
  
  
const retriever = vectorStore.asRetriever({ k: 3 });


// Instrucciones para que reformule la pregunta teniendo en cuenta el historial
const retrieverPrompt = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
    [
      "user",
      "A partir de la conversación de arriba, generá una nueva pregunta que pueda ser entendida sin el historial de la conversación",
    ],
]);


// Si no recibe un historial, le pasa la consulta directamente al retriever
const retrieverChain = await createHistoryAwareRetriever({
    llm: model,
    retriever,
    rephrasePrompt: retrieverPrompt,
});


const system_prompt = `
1. Eres un asistente que contesta preguntas de nuestra base de conocimiento.
2. Responde la pregunta del usuario a partir del siguiente contexto: {context}.
3. No contestes preguntas sobre temas que no estén en el contexto: {context}
5. Cuando no encuentres información en el contexto {context} contesta "No encontré ese tema en mi base de conocimiento, por favor cargá un ticket en Jira"""
`

// Instrucciones generales para el bot
const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      system_prompt,
    ],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
]);
  
  
const chain = await createStuffDocumentsChain({
    llm: model,
    prompt: prompt,
});
  
  
const conversationChain = await createRetrievalChain({
    combineDocsChain: chain,
    retriever: retrieverChain,
});


// Está simulando el historial
const historial = [
    new HumanMessage("Me llamo Juan"),
    new AIMessage("Hola Juan, ¿en qué puedo ayudarte?"),
];


const answer = async (query)=> {
    
    // TODO agregar historial

    let result = await conversationChain.invoke({
        chat_history: historial,
        input: query,
    });
    
    return result
}


export default answer
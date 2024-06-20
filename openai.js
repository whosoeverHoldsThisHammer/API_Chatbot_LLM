import { ChatOpenAI } from "@langchain/openai" 
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Pinecone } from "@pinecone-database/pinecone"
import { PineconeStore } from "@langchain/pinecone";

import * as dotenv from "dotenv";

dotenv.config();

// Instancia el modelo. Temperatura 0 para que sea lo menos creativo posible
const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  })

const pc = new Pinecone(
  { apiKey:  process.env.PINECONE_API_KEY }
)

const name = "cn-arg-index"
const dimension = 1536 // La dimensión depende de la API que usemos de embeddings. Con OpenAI es 1536


// Revisa que exista el índice
const indices = await pc.listIndexes()
console.log(indices)

const existe = indices.indexes.some(index => index.name === name);
let pineconeIndex


if(!existe){
  console.log(`El indice ${name} no existe`)
  console.log("Creando índice...")

  pineconeIndex = await pc.createIndex({
    name: name,
    dimension: dimension,
    metric: 'cosine',
    spec: { 
        serverless: { 
            cloud: process.env.PINECONE_CLOUD, 
            region: process.env.PINECONE_REGION 
        }
    } 
  })

  // Carga los documentos (la primera vez)
  const loader = new DirectoryLoader("./data",
    {
      ".txt": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path, { splitPages: false }),
      ".docx": (path) => new DocxLoader(path)
    }
  )

  const docs = await loader.load();
  console.log({ docs })


  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 200,
  });

  const splited = await splitter.splitDocuments(docs);
  const embeddings = new OpenAIEmbeddings();

  // Crea el vector de incrustaciones en Pinecone (la primera vez)
  const vectorStore = await PineconeStore.fromDocuments(splited, embeddings, {
    pineconeIndex,
    maxConcurrency: 5, // Cantidad de batches que puede mandar al mismo tiempo. 1 batch = 1000 vectores
  });

} else {
  console.log(`El indice ${name} ya existe`)

  pineconeIndex = pc.Index(name)
  console.log(pineconeIndex)

}


// Cargar los documentos que fueron vectorizados y guardados en Pinecone
const vectorStore = await PineconeStore.fromExistingIndex(
  new OpenAIEmbeddings(),
  { pineconeIndex }
)


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
2. Responde la pregunta a partir de la información obtenida del contexto.
3. Si no sabes la respuesta contesta "No encontré ese tema en mi base de conocimiento, por favor cargá un ticket en Jira"

{context}
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


// Recibe en el body la consulta y el historial de mensajes
const answer = async (query, history)=> {
    
    let historial = history.map(item => {
      return item.role === "human" ? new HumanMessage(item.content) : new AIMessage(item.content)
    })

    let result = await conversationChain.invoke({
        chat_history: historial,
        input: query,
    }); 
    
    return result
}


export default answer
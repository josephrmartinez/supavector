import { openai, supabase } from './config.js';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { promises as fs } from 'fs';


const query = "Can you suggest a movie that would appeal to people who enjoy quirky comedies?";
askSupaVector(query);

// Send user query to supabase vector db
async function askSupaVector(input) {
  const embedding = await createEmbedding(input);
  const matches = await findNearestMatches(embedding);
  await getChatCompletion(matches, input);
}

// Create an embedding vector representing the input text
async function createEmbedding(input) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input
  });
  return embeddingResponse.data[0].embedding;
}

// Query Supabase and return a semantically matching text chunk
async function findNearestMatches(embedding) {
  const { data } = await supabase.rpc('match_movies', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 4
  });
  const matches = data.map(obj => obj.content).join('\n');
  
  return matches;
}

// Use OpenAI to make the response conversational
const chatMessages = [{
    role: 'system',
    content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about recently released movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.` 
}];

async function getChatCompletion(context, query) {
  chatMessages.push({
    role: 'user',
    content: `CONTEXT: ${context} \n\n QUESTION: ${query}`
  });
  
  console.log(chatMessages)

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5
  });

  console.log(response.choices[0].message.content);
}



// async function splitDocument(filePath) {
//     const text = await fs.readFile(filePath, 'utf-8');
//     const splitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 800,
//         chunkOverlap: 20,
//       });
      
//     const output = await splitter.createDocuments([text]);
//     return output
// }

// /* Create an embedding from each text chunk.
// Store all embeddings and corresponding text in Supabase. */
// async function createAndStoreEmbeddings(filePath) {
//     // chunk data
    
//     const chunkData = await splitDocument(filePath);
    
//     // create data objs with content and embedding of each chunk
//     const data = await Promise.all(
//         chunkData.map( async (chunk) => {
//             const embeddingResponse = await openai.embeddings.create({
//                 model: "text-embedding-ada-002",
//                 input: chunk.pageContent
//             });
//             return { 
//               content: chunk.pageContent, 
//               embedding: embeddingResponse.data[0].embedding 
//             }
//         })
//       );
      
//       // Insert content and embeddings into Supabase
//       await supabase.from('movies').insert(data); 
//       console.log('Embedding and storing complete!');

// }

// const filePath = './movies.txt';
// createAndStoreEmbeddings(filePath);
    







//   PODCAST Q and A
  
// import podcasts from './content.js';
// // User query about podcasts
// const query = "An episode Carl Jung would enjoy";
// main(query);

// // Bring all function calls together
// async function main(input) {
//   const embedding = await createEmbedding(input);
//   const match = await findNearestMatch(embedding);
//   await getChatCompletion(match, input);
// }

// // Create an embedding vector representing the input text
// async function createEmbedding(input) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-ada-002",
//     input
//   });
//   return embeddingResponse.data[0].embedding;
// }

// // Query Supabase and return a semantically matching text chunk
// async function findNearestMatch(embedding) {
//   const { data } = await supabase.rpc('match_documents', {
//     query_embedding: embedding,
//     match_threshold: 0.50,
//     match_count: 1
//   });
//   return data[0].content;
// }

// // Use OpenAI to make the response conversational
// const chatMessages = [{
//     role: 'system',
//     content: `You are an enthusiastic podcast expert who loves recommending podcasts to people. You will be given two pieces of information - some context about podcasts episodes and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.` 
// }];

// async function getChatCompletion(text, query) {
//   chatMessages.push({
//     role: 'user',
//     content: `Context: ${text} Question: ${query}`
//   });
  
//   const response = await openai.chat.completions.create({
//     model: 'gpt-4',
//     messages: chatMessages,
//     temperature: 0.5,
//     frequency_penalty: 0.5
//   });

//   console.log(response.choices[0].message.content);
// }

// async function insertData(input) {
//   const data = await Promise.all(
//     input.map( async (textChunk) => {
//         const embeddingResponse = await openai.embeddings.create({
//             model: "text-embedding-ada-002",
//             input: textChunk
//         });
//         return { 
//           content: textChunk, 
//           embedding: embeddingResponse.data[0].embedding 
//         }
//     })
//   );
  
//   // Insert content and embedding into Supabase
//   await supabase.from('documents').insert(data); 
//   console.log('Embedding and storing complete!');
// }

// insertData(podcasts)
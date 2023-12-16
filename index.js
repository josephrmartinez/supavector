const { openai, supabase } = await import('./config.js');

const form = document.querySelector('form');
const input = document.querySelector('input');
const reply = document.querySelector('.reply');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    askSupaVector(input.value);
    input.value = '';
});


// Send user query to supabase vector db
async function askSupaVector(input) {
    try {
        reply.innerHTML = "Thinking..."
        const embedding = await createEmbedding(input);
        const matches = await findNearestMatches(embedding);
        await getChatCompletion(matches, input);
    } catch (error) {
        console.error('Error in main function.', error.message)
        reply.innerHTML = "Sorry, something went wrong. Please try again."
    }
    
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
  const { openai } = await import('./config.js');
  const { choices } = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5
  });

  reply.innerHTML = choices[0].message.content;
}

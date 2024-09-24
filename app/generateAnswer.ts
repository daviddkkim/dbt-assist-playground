'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function getAnswer({ prefix, suffix, selection, promptText }: { prefix: string, suffix: string, selection: string, promptText: string }) {

    const prompt = `
    <prefix>
       ${prefix}
       </prefix>
       <highlight>
       ${selection}
       </highlight>
       <suffix>
       ${suffix}
       </suffix>
       
       <instruction>
       ${promptText}
       </instruction>
   `

    const { text:rawText, finishReason, usage } = await generateText({
        model: openai('gpt-4-turbo'),
        system: `You are a dbt code authoring assistant. Given input source code and a user's instructions, generate new code that does what the user is asking for. Use Snowflake syntax when generating new SQL. The source code will be provided in three parts, a <prefix>, <highlight>, and <suffix>. The user has also provided instructions in the <instruction> tag. Respond with the SQL query that should replace the <highlight> code block when responding to the user's instruction.`,
        prompt: prompt
    });

    const text = rawText.replace(/```sql\s*/g, '') // Remove ```sql and any following whitespace
    .replace(/```/g, '')       // Remove closing ``` 
    return { text, finishReason, usage };
}
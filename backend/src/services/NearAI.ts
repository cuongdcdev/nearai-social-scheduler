import axios from 'axios';
import { log } from 'console';

interface NearAIMessage {
    data: Array<{
        content: Array<{
            text: {
                value: string;
            };
            type: string;
        }>;
    }>;
}

export async function translateWithNearAI1(content: string, customPrompt: string | undefined): Promise<string> {
    
    return Promise.resolve("[TRANSLATED WITH NEAR AI] "  + content);

}

export async function translateWithNearAI(content: string, customPrompt: string | undefined): Promise<string> {

    console.log("auth: " , process.env.NEAR_AI_KEY);
    try {
        const NEAR_AI_API = 'https://api.near.ai/v1';
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': process.env.NEAR_AI_KEY || ''
        };

        const msg = ` ${customPrompt} .Make it more readable by adding new lines when needed. Just give me the processed post and nothing more. Here is the content: ${content}`;

        // Create thread and get thread_id
        const threadResponse = await axios.post(
            `${NEAR_AI_API}/threads/runs`,
            {
                agent_id: "cuongdcdev.near/ironman/0.0.1",
                new_message: msg,
                max_iterations: "1"
            },
            {
                headers,
                timeout: 30000
            }
        );

        const threadId = threadResponse.data;
        
        log("NEARAI requirement prompt msg: ", msg);
        log("NEARAI threadId: ", threadId);
        
        // Wait a bit for the translation to complete
        // await new Promise(resolve => setTimeout(resolve, 2000));

        // Get messages from thread
        const messagesResponse = await axios.get(
            `${NEAR_AI_API}/threads/${threadId}/messages`,
            {
                headers,
                timeout: 30000
            }
        );

        const messagesData = messagesResponse.data as NearAIMessage;
        
        log("messagesData: ", messagesData);

        if (messagesData.data && messagesData.data[0]?.content[0]?.text?.value) {
            return messagesData.data[0].content[0].text.value;
        }

        throw new Error('No translation received from NEAR AI');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('NearAI Translation error:',error, error.response?.data || error.message);
        } else {
            console.error('NearAI Translation error:', error);
        }
        return content; // fallback to original content if translation fails
    }
}
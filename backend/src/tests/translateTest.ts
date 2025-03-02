
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});
import { translateWithNearAI } from "../services/NearAI";

async function testTranslate() {
    const content = "Hello, how are you?";
    const translatedContent = await translateWithNearAI(content, undefined);
    console.log(`Original: ${content}`);
    console.log(`Translated: ${translatedContent}`);
}

console.log("test using nearai service");
testTranslate();

const fs = require('fs');
const axios = require('axios');

// Function to extract quoted text after the first colon on each line
function extractQuotedTextAfterColon(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let textToTest = [];
    
    lines.forEach(line => {
        const match = line.match(/^\s*\w+:\s*(['"])([^'"]*)\1/);
        if (match) {
            let extractedText = match[2]; 
            if (!extractedText.endsWith('.')) {
                extractedText += '.';
            }
            extractedText += '\n';
            //console.log('text: %s', extractedText)

            textToTest.push(extractedText);
        }
    });
    
    return textToTest;
}

// Function to check spelling and grammar using LanguageTool
async function checkGrammar(text) {
    const response = await axios.post('http://localhost:8081/v2/check', new URLSearchParams({
        text: text.join('\n'), // Send extracted text as a single input
        language: 'en-US'
    }));
    return response.data;
}

// Main function to process the JavaScript file
async function processFile(filePath) {
    const extractedText = extractQuotedTextAfterColon(filePath);
    if (extractedText.length === 0) {
        console.log("No text found to check.");
        return;
    }
    
    console.log("Checking grammar and spelling...");
    const result = await checkGrammar(extractedText);
    
    // Output suggestions
    result.matches.forEach(match => {
        console.log(`Error: ${match.message}`);
        console.log(`Suggestion: ${match.replacements.map(r => r.value).join(', ')}`);
        console.log(`Context: ${match.context.text}`);
        console.log('---');
    });
}

// Run the script with the file path argument
const filePath = process.argv[2];
if (!filePath) {
    console.log("Usage: node check_js_strings.js <path-to-js-file>");
    process.exit(1);
}

processFile(filePath);

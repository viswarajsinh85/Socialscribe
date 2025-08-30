from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os

# Project Name: Social Scribe

# For demonstration, you would replace this with a secure method
# for handling your API key, e.g., environment variables.
# os.environ["GEMINI_API_KEY"] = "YOUR_API_KEY"

app = Flask(__name__)
CORS(app)  # Enable CORS to allow the frontend to communicate with this server

# --- IMPORTANT: Gemini API Setup ---
def get_gemini_response(options):
    """
    Calls the Gemini API to generate a social media post with a specific template.
    """
    api_key = "AIzaSyCiNHIeH6dWjVLW_09iLydgTCWtHzd1DWk"  # Replace with your actual API key
    if not api_key:
        return "Error: Gemini API key is not set."

    # Destructure options from the frontend request
    topic = options.get('topic')
    platform = options.get('platform')
    template = options.get('template')
    tone = options.get('tone')
    word_count = options.get('wordCount')
    include_hashtags = options.get('includeHashtags')
    include_emojis = options.get('includeEmojis')

    # Construct a highly detailed prompt based on user inputs
    prompt_parts = [
        f"Act as a social media expert. Your goal is to generate a single, professional post for the platform '{platform}'.",
        f"The post should be about the following topic: '{topic}'.",
    ]

    # Add template-specific instructions
    if template == "rewrite":
        prompt_parts.append("Rewrite the following text to make it more engaging and suitable for social media.")
    elif template == "edit":
        prompt_parts.append("Proofread and edit the following text for grammar, spelling, and clarity.")
    elif template == "summarize":
        prompt_parts.append("Summarize the key points of the following text into a concise social media post.")
    elif template == "promotional":
        prompt_parts.append("The post's style is promotional. It should be compelling, focus on benefits, and include a clear call-to-action.")
    elif template == "company-related":
        prompt_parts.append("The post should be about a company, focusing on its recent news, achievements, or a specific product/service.")
    elif template == "explain":
        prompt_parts.append("The post should be an explanation of a concept, breaking down a complex idea into simple points and providing a clear takeaway.")
    else: # Default or 'suggested'
        prompt_parts.append("The post's style is standard and engaging.")
    
    # Add tone and length controls
    if tone:
        prompt_parts.append(f"The tone of voice should be: '{tone}'.")
    
    if word_count:
        prompt_parts.append(f"The post should be approximately {word_count} words long.")
    
    # Add optional controls
    if include_hashtags:
        prompt_parts.append("Include 3-5 relevant and popular hashtags.")
    else:
        prompt_parts.append("Do not include any hashtags.")
    
    if include_emojis:
        prompt_parts.append("Include relevant emojis to make the post visually appealing.")
    else:
        prompt_parts.append("Do not include any emojis.")
    
    prompt_parts.append("Do not include any introductory or concluding remarks. Just provide the final post.")
    
    # Join all parts to create the final prompt
    final_prompt = " ".join(prompt_parts)

    # Gemini API endpoint
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"

    # Build the request payload
    payload = {
        "contents": [{
            "parts": [{
                "text": final_prompt
            }]
        }]
    }

    try:
        # Make the API call
        response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the JSON response
        result = response.json()
        
        # Extract the generated text
        if 'candidates' in result and len(result['candidates']) > 0:
            generated_text = result['candidates'][0]['content']['parts'][0]['text']
            return generated_text
        else:
            return "Error: Could not retrieve a response from the Gemini API."

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return "Error: Failed to connect to the Gemini API."
    except KeyError:
        return "Error: Unexpected response format from the Gemini API."

@app.route('/generate', methods=['POST'])
def generate_post():
    options = request.get_json()
    
    if not options:
        return jsonify({'error': 'No data provided'}), 400

    # Call the new function to get a response from the Gemini API
    generated_text = get_gemini_response(options)

    # Return the generated text as a JSON response
    return jsonify({'text': generated_text})

if __name__ == '__main__':
    # Run the server on localhost:5000
    app.run(debug=True)

#!/usr/bin/env python3
import requests
import time
import json
import os

# Ollama API URL
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Model to use
MODEL = "llama3.2:1b"

# Generate a prompt with approximately 100000 tokens (400000 characters)
def generate_large_prompt(target_tokens=129000):
    # Base prompt structure
    base_prompt = """You are an AI assistant named Morgan.

# SYSTEM INSTRUCTIONS
Please respond to the user's question about the history of artificial intelligence.
Provide a comprehensive and detailed response covering major milestones, important researchers,
and significant developments in the field.

# USER QUERY
What is the history of artificial intelligence from its inception to the present day?
Please cover all major developments, researchers, and breakthroughs.

"""
    
    # Calculate how many filler sentences we need to reach target token count
    # Estimate 4 characters per token
    base_length = len(base_prompt)
    target_chars = target_tokens * 4
    remaining_chars = target_chars - base_length
    
    # Create a repeating paragraph that we'll duplicate to reach the target size
    filler_paragraph = """
The field of artificial intelligence has seen numerous developments over the decades.
Researchers have made significant breakthroughs in various subfields including machine learning,
natural language processing, computer vision, robotics, and knowledge representation.
These advances have led to practical applications in areas such as healthcare, finance,
transportation, entertainment, and many other domains of human activity.

AI research can be traced back to the 1950s, with early work by pioneers such as Alan Turing,
John McCarthy, Marvin Minsky, and others. The field has evolved substantially since then,
with periods of rapid progress followed by "AI winters" where funding and interest decreased.
The current era of AI has been marked by the success of deep learning approaches, which have
achieved remarkable results in tasks ranging from image recognition to natural language processing.

The development of neural networks, reinforcement learning, and other techniques has enabled
systems that can perform complex tasks that previously required human intelligence. These
advances continue to push the boundaries of what is possible with artificial intelligence.
"""
    
    filler_length = len(filler_paragraph)
    repetitions_needed = remaining_chars // filler_length + 1
    
    print(f"Base prompt length: {base_length} characters")
    print(f"Target length: {target_chars} characters")
    print(f"Filler paragraph length: {filler_length} characters")
    print(f"Repetitions needed: {repetitions_needed}")
    
    # Build the full prompt
    full_prompt = base_prompt
    
    for i in range(repetitions_needed):
        if i % 100 == 0:
            print(f"Adding section {i+1}/{repetitions_needed}")
        full_prompt += f"\n# CONTEXT SECTION {i+1}\n" + filler_paragraph
    
    print(f"Full prompt length before trimming: {len(full_prompt)} characters")
    
    # Trim to target size if we overshot
    if len(full_prompt) > target_chars:
        full_prompt = full_prompt[:target_chars]
    
    # Add final question
    full_prompt += "\n\nPlease provide a comprehensive history of AI based on this context."
    
    return full_prompt

print("Starting prompt generation...")
print(f"Current working directory: {os.getcwd()}")

# Generate a large prompt
large_prompt = generate_large_prompt(100000)

# Print stats
prompt_chars = len(large_prompt)
estimated_tokens = prompt_chars // 4
print(f"Generated prompt with {prompt_chars} characters (approximately {estimated_tokens} tokens)")

# Save prompt to a file for inspection
with open("large_prompt_test.txt", "w") as f:
    f.write(large_prompt)
print(f"Saved prompt to large_prompt_test.txt")

# Ask user if they want to proceed with sending the large prompt
confirmation = input("This will send a very large prompt to Ollama API. Proceed? (y/n): ")
if confirmation.lower() not in ["y", "yes"]:
    print("Operation cancelled.")
    exit(0)

# Prepare the request
request_data = {
    "model": MODEL,
    "prompt": large_prompt,
    "stream": False,
    "options": {
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "num_predict": 1024  # Generate up to 1024 tokens in response
    }
}

# Send the request and measure performance
print(f"Sending request to Ollama API at {OLLAMA_API_URL}")
start_time = time.time()

try:
    response = requests.post(OLLAMA_API_URL, json=request_data)
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Parse the response
    result = response.json()
    
    # Extract and print metrics
    print(f"\nResponse received in {duration:.2f} seconds")
    print(f"Model used: {result.get('model', 'unknown')}")
    print(f"Tokens generated: {result.get('eval_count', 'unknown')}")
    print(f"Prompt tokens: {result.get('prompt_eval_count', 'unknown')}")
    print(f"Total duration: {result.get('total_duration', 'unknown')}")
    
    # Show a sample of the response
    response_text = result.get('response', '')
    print(f"\nResponse sample (first 500 chars):\n{response_text[:500]}...")
    
    # Save full response to file
    with open("large_prompt_response.txt", "w") as f:
        f.write(response_text)
    print(f"Full response saved to large_prompt_response.txt")
    
except requests.exceptions.RequestException as e:
    print(f"Error communicating with Ollama API: {e}")
    if hasattr(e, 'response') and e.response:
        print(f"Response status code: {e.response.status_code}")
        try:
            error_data = e.response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Response text: {e.response.text}") 
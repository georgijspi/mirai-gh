import logging
import spacy
import nltk
import re
from typing import Dict, List, Tuple, Any, Optional

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')
try:
    nltk.data.find('chunkers/maxent_ne_chunker')
except LookupError:
    nltk.download('maxent_ne_chunker')
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("Successfully loaded spaCy en_core_web_sm model")
except OSError:
    logger.warning("spaCy model 'en_core_web_sm' not found. Attempting to download...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
    nlp = spacy.load("en_core_web_sm")
    logger.info("Successfully downloaded and loaded spaCy en_core_web_sm model")

# Define factual patterns targeted to truly factual questions
FACTUAL_PATTERNS = [
    r"^who (is|was|are|were|won)\b",
    r"^what (is|was|are|were)\b.*\b(in|of|at|on|from|by|during|winner|largest|biggest|smallest|fastest|tallest|highest|lowest|oldest|newest|capital|population|distance|temperature|year|date|price)\b", 
    r"^when (did|was|is|were|are)\b",
    r"^where (is|was|are|were)\b",
    r"^which (country|city|team|person|company|organization|player|year|book|movie|song|album)\b",
    r"\b(won|winner|champion|victory|record|discover|invented|created|founded|established|built|born|died|located|capital|largest|tallest|deepest)\b.*\?",
    r"\b(world cup|championship|tournament|competition|match|game|final)\b.*\b(winner|champion|score|result)\b",
    r"\b(fifa|olympics|championship|league|cup)\b.*\b(winner|champion|gold|medal|trophy)\b"
]

# Define personal opinion patterns to exclude
OPINION_PATTERNS = [
    r"\b(favorite|best|worst|like|love|hate|think|feel|believe|opinion|recommend|suggest|advice|prefer|rather|instead)\b",
    r"\byour\b.*(favorite|best|opinion|thought|recommendation|preference)",
    r"\bhow (would|could|do|should)\b.*(you|your)",
    r"\bif (you|your)\b",
    r"\b(imagine|hypothetical|pretend)\b"
]

# Define greeting patterns to clean
GREETING_PATTERNS = [
    r"^(hey|hi|hello|ok|okay|yo|greetings|excuse me|good morning|good afternoon|good evening)\s+\w+\s*,?\s*",
    r"^(jarvis|morgan|pepper|assistant|chatbot|bot|there)\s*,?\s*",
    r"^(could you|can you|please|kindly|i want to|i'd like to|tell me|let me know)\s+",
    r"^(what about|how about|what if|by the way|anyway)\s+"
]

# Define query types
class QueryType:
    GENERAL = "general"
    TRIVIA = "trivia"

async def analyze_query(query: str) -> Dict[str, Any]:
    """
    Analyze a query to determine its type and extract important entities.
    """
    logger.info(f"Analyzing query: {query}")
    
    # Process with spaCy
    doc = nlp(query)
    
    # Extract named entities
    entities = [
        {
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char
        }
        for ent in doc.ents
    ]
    
    # Clean the query by removing greetings first
    clean_query = query.lower()
    for pattern in GREETING_PATTERNS:
        clean_query = re.sub(pattern, "", clean_query, flags=re.IGNORECASE)
    clean_query = clean_query.strip()
    
    logger.debug(f"Query after greeting removal: {clean_query}")
    
    # Check if it's an opinion-based question (exclude from RAG)
    is_opinion = any(re.search(pattern, clean_query) for pattern in OPINION_PATTERNS)
    
    # If it's asking for opinions, we should NOT use RAG
    if is_opinion:
        logger.info(f"Query classified as opinion-based, not using RAG: {clean_query}")
        return {
            "query": query,
            "query_type": QueryType.GENERAL,
            "is_trivia": False,
            "entities": entities,
            "important_nouns": [],
            "noun_chunks": [chunk.text for chunk in doc.noun_chunks]
        }
    
    # Check for factual question patterns on cleaned query
    is_trivia = any(re.search(pattern, clean_query) for pattern in FACTUAL_PATTERNS)
    
    # Extract important nouns for factual entity detection
    important_nouns = []
    important_entity_types = ["PERSON", "ORG", "GPE", "LOC", "EVENT", "WORK_OF_ART", "FAC", "DATE", "PRODUCT"]
    
    # Include important nouns that aren't stopwords
    for token in doc:
        if token.pos_ == "NOUN" and not token.is_stop:
            important_nouns.append(token.text)
    
    # If no pattern match but we have key entities from important categories, it might be a trivia query
    if not is_trivia and entities:
        for entity in entities:
            if entity["label"] in important_entity_types:
                # Check if this entity is in a sentence with a "?"
                sentences = [sent.text for sent in doc.sents]
                for sent in sentences:
                    if entity["text"] in sent and "?" in sent:
                        is_trivia = True
                        break
                if is_trivia:
                    break
    
    # Extract noun chunks
    noun_chunks = [chunk.text for chunk in doc.noun_chunks]
    
    # Determine query type
    query_type = QueryType.TRIVIA if is_trivia else QueryType.GENERAL
    
    result = {
        "query": query,
        "query_type": query_type,
        "is_trivia": is_trivia,
        "entities": entities,
        "important_nouns": important_nouns,
        "noun_chunks": noun_chunks
    }
    
    logger.info(f"Query analysis result: {result['query_type']} with {len(entities)} entities, is_trivia={is_trivia}")
    
    return result

async def extract_search_terms(query: str, prev_search_terms: str = None) -> str:
    """
    Extract the most relevant search terms from a query.
    
    Args:
        query: The user's query text
        prev_search_terms: Previous search terms that provide context for follow-up questions
    """
    analysis = await analyze_query(query)
    
    # If it's not a trivia query, don't waste time on search term extraction
    if analysis["query_type"] != QueryType.TRIVIA:
        logger.info(f"Query is not factual/trivia, skipping search term extraction: {query}")
        return query
    
    # Remove common greetings, agent names, and filler words
    greeting_patterns = [
        r"^(hey|hi|hello|ok|okay|yo|greetings|excuse me|good morning|good afternoon|good evening)\s+\w+\s*,?\s*",
        r"^(jarvis|assistant|chatbot|bot|there)\s*,?\s*",
        r"^(could you|can you|please|kindly|i want to|i'd like to|tell me|let me know)\s+",
        r"^(what about|how about|what if|by the way|anyway)\s+",
    ]
    
    clean_query = query
    for pattern in greeting_patterns:
        clean_query = re.sub(pattern, "", clean_query, flags=re.IGNORECASE)
    
    # Handle follow-up questions with references to previous context
    follow_up_indicators = ["though", "then", "still", "instead", "rather", "actually", "anyway", "btw", "but"]
    previous_context_references = ["it", "that", "this", "those", "these", "they", "them", "their"]
    is_follow_up = any(indicator in clean_query.lower().split() for indicator in follow_up_indicators) or \
                  any(ref in clean_query.lower().split() for ref in previous_context_references)
    
    # Basic query cleaning
    cleaned_query = clean_query.rstrip('?').strip()
    
    # Only remove common question words from the beginning if needed
    question_starters = ["who", "what", "when", "where", "why", "how", "did", "does", "do", "can", "could", "is", "are", "was", "were"]
    for starter in question_starters:
        if cleaned_query.lower().startswith(starter + " "):
            cleaned_query = cleaned_query[len(starter)+1:].strip()
            break
    
    # If the query is a follow-up and we have previous search terms
    if is_follow_up and prev_search_terms:
        # Create a search query that combines previous context with current question
        combined_query = f"{prev_search_terms} {cleaned_query}"
        logger.info(f"Using combined search terms for follow-up question: {combined_query}")
        return combined_query
    
    # If the query is too short after cleaning, try to use entities to enhance it
    if len(cleaned_query.split()) < 2:
        if analysis["entities"]:
            entities_text = " ".join([entity["text"] for entity in analysis["entities"]])
            if len(entities_text.split()) >= 1:
                if cleaned_query:
                    cleaned_query = f"{cleaned_query} {entities_text}"
                else:
                    cleaned_query = entities_text
    
    # If still too short, check if there's an entity in the original query we might have missed
    if len(cleaned_query.split()) < 2:
        potential_entities = re.findall(r'\b[A-Z][a-zA-Z]*\b', query)
        if potential_entities:
            entity_str = " ".join(potential_entities)
            cleaned_query = f"{cleaned_query} {entity_str}".strip()
    
    # If the query is still long enough, use it as is
    if len(cleaned_query.split()) >= 2:
        logger.info(f"Using simplified query as search terms: {cleaned_query}")
        return cleaned_query
    
    # Fall back to original methods
    if analysis["entities"]:
        search_terms = " ".join([entity["text"] for entity in analysis["entities"]])
    elif analysis["noun_chunks"]:
        search_terms = " ".join(analysis["noun_chunks"])
    elif analysis["important_nouns"]:
        search_terms = " ".join(analysis["important_nouns"])
    else:
        search_terms = cleaned_query
    
    logger.info(f"Extracted search terms from query: {search_terms}")
    
    return search_terms 
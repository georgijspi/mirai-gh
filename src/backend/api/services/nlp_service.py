import logging
import spacy
import nltk
import re
from typing import Dict, List, Tuple, Any, Optional

# Download necessary NLTK data
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")
try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords")
try:
    nltk.data.find("taggers/averaged_perceptron_tagger")
except LookupError:
    nltk.download("averaged_perceptron_tagger")
try:
    nltk.data.find("chunkers/maxent_ne_chunker")
except LookupError:
    nltk.download("maxent_ne_chunker")
try:
    nltk.data.find("corpora/words")
except LookupError:
    nltk.download("words")

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


# Define query types
class QueryType:
    GENERAL = "general"
    TRIVIA = "trivia"


# Factual indicators that suggest a query is seeking specific facts
FACTUAL_INDICATORS = {
    "question_starters": [
        "who",
        "what",
        "when",
        "where",
        "which",
        "how many",
        "how much",
    ],
    "verbs": [
        "won",
        "invented",
        "discovered",
        "created",
        "founded",
        "built",
        "died",
        "born",
        "established",
        "located",
        "happened",
        "occurred",
        "began",
        "started",
        "ended",
        "awarded",
        "directed",
        "starred",
        "published",
        "released",
        "launched",
    ],
    "nouns": [
        "year",
        "date",
        "time",
        "place",
        "location",
        "person",
        "name",
        "capital",
        "population",
        "height",
        "depth",
        "width",
        "distance",
        "temperature",
        "winner",
        "champion",
        "inventor",
        "author",
        "director",
        "president",
        "ceo",
        "founder",
        "leader",
        "creator",
        "city",
        "country",
        "record",
        "fact",
        "statistic",
        "percentage",
        "number",
        "amount",
        "score",
        "result",
        "medal",
        "prize",
        "award",
        "title",
        "championship",
        "tournament",
        "event",
    ],
}

# Words that indicate opinion-seeking, personal preference, or hypothetical scenarios
OPINION_INDICATORS = [
    "favorite",
    "best",
    "worst",
    "better",
    "worse",
    "greatest",
    "least",
    "like",
    "love",
    "hate",
    "prefer",
    "recommend",
    "suggest",
    "advise",
    "think",
    "feel",
    "believe",
    "opinion",
    "thought",
    "perspective",
    "view",
    "imagine",
    "hypothetical",
    "pretend",
    "suppose",
    "consider",
    "if",
    "would",
    "should",
    "could",
    "might",
    "may",
    "ideal",
    "perfect",
    "optimal",
    "why do you",
    "how would you",
    "what do you think",
]

# Greeting and filler patterns to clean from queries
GREETING_PATTERNS = [
    r"^(hey|hi|hello|ok|okay|yo|greetings|excuse me|good morning|good afternoon|good evening)\s+\w+\s*,?\s*",
    r"^(jarvis|morgan|pepper|assistant|chatbot|bot|there)\s*,?\s*",
    r"^(could you|can you|please|kindly|i want to|i'd like to|tell me|let me know)\s+",
    r"^(what about|how about|what if|by the way|anyway)\s+",
]


async def analyze_query(query: str) -> Dict[str, Any]:
    """
    Analyzes a query using NLP techniques to determine if it's a trivia or general query.

    Trivia queries seek specific facts or information, while general queries are broader,
    opinion-based, or seek explanations rather than specific facts.
    """
    logger.info(f"Analyzing query: {query}")

    doc = nlp(query)

    entities = [
        {
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
        }
        for ent in doc.ents
    ]

    clean_query = query.lower()
    for pattern in GREETING_PATTERNS:
        clean_query = re.sub(pattern, "", clean_query, flags=re.IGNORECASE)
    clean_query = clean_query.strip()

    logger.debug(f"Query after greeting removal: {clean_query}")

    # Extract linguistic features
    important_nouns = []
    important_verbs = []
    noun_chunks = [chunk.text for chunk in doc.noun_chunks]

    for token in doc:
        if token.pos_ == "NOUN" and not token.is_stop:
            important_nouns.append(token.text.lower())
        elif token.pos_ == "VERB" and not token.is_stop:
            important_verbs.append(token.text.lower())

    important_entity_types = [
        "PERSON",
        "ORG",
        "GPE",
        "LOC",
        "EVENT",
        "WORK_OF_ART",
        "FAC",
        "DATE",
        "PRODUCT",
        "CARDINAL",
        "ORDINAL",
        "MONEY",
        "QUANTITY",
    ]
    factual_entities = [
        entity for entity in entities if entity["label"] in important_entity_types
    ]

    # Calculate scores for classification
    factual_score = 0

    for starter in FACTUAL_INDICATORS["question_starters"]:
        if clean_query.startswith(starter + " "):
            factual_score += 2
            break

    for verb in important_verbs:
        if verb in FACTUAL_INDICATORS["verbs"]:
            factual_score += 1.5

    for noun in important_nouns:
        if noun in FACTUAL_INDICATORS["nouns"]:
            factual_score += 1

    factual_score += len(factual_entities) * 1.5

    if "?" in query:
        factual_score += 1

    # Opinion score calculation
    opinion_score = 0

    for indicator in OPINION_INDICATORS:
        if indicator in clean_query or re.search(
            r"\b" + re.escape(indicator) + r"\b", clean_query
        ):
            opinion_score += 2

    if re.search(r"\byou\b|\byour\b", clean_query):
        opinion_score += 1

    if len(clean_query.split()) < 8 and factual_score > 0:
        factual_score += 1

    if (
        clean_query.startswith("why ")
        or "explain" in clean_query
        or "describe" in clean_query
    ):
        opinion_score += 1.5

    is_trivia = factual_score > opinion_score and factual_score >= 2

    # If there are clear opinion indicators, override
    for strong_opinion in ["your opinion", "you think", "what do you", "would you"]:
        if strong_opinion in clean_query:
            is_trivia = False
            break

    # If there are strong factual elements with specific entities, override
    if (
        len(factual_entities) >= 2
        and "?" in query
        and not any(op in clean_query for op in ["your", "you think"])
    ):
        is_trivia = True

    query_type = QueryType.TRIVIA if is_trivia else QueryType.GENERAL

    logger.info(
        f"Query analysis: factual_score={factual_score}, opinion_score={opinion_score}, is_trivia={is_trivia}"
    )

    result = {
        "query": query,
        "query_type": query_type,
        "is_trivia": is_trivia,
        "entities": entities,
        "important_nouns": important_nouns,
        "noun_chunks": noun_chunks,
        "factual_score": factual_score,
        "opinion_score": opinion_score,
    }

    logger.info(f"Query classified as {query_type} with {len(entities)} entities")

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
        logger.info(
            f"Query is not factual/trivia, skipping search term extraction: {query}"
        )
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
    follow_up_indicators = [
        "though",
        "then",
        "still",
        "instead",
        "rather",
        "actually",
        "anyway",
        "btw",
        "but",
    ]
    previous_context_references = [
        "it",
        "that",
        "this",
        "those",
        "these",
        "they",
        "them",
        "their",
    ]
    is_follow_up = any(
        indicator in clean_query.lower().split() for indicator in follow_up_indicators
    ) or any(ref in clean_query.lower().split() for ref in previous_context_references)

    # Basic query cleaning - just remove the question mark, preserve question words
    cleaned_query = clean_query.rstrip("?").strip()

    # If the query is a follow-up and we have previous search terms
    if is_follow_up and prev_search_terms:
        combined_query = f"{prev_search_terms} {cleaned_query}"
        logger.info(
            f"Using combined search terms for follow-up question: {combined_query}"
        )
        return combined_query

    # If the query is too short after cleaning, try to use entities to enhance it
    if len(cleaned_query.split()) < 2:
        if analysis["entities"]:
            entities_text = " ".join(
                [entity["text"] for entity in analysis["entities"]]
            )
            if len(entities_text.split()) >= 1:
                if cleaned_query:
                    cleaned_query = f"{cleaned_query} {entities_text}"
                else:
                    cleaned_query = entities_text

    # If still too short, check if there's an entity in the original query we might have missed
    if len(cleaned_query.split()) < 2:
        potential_entities = re.findall(r"\b[A-Z][a-zA-Z]*\b", query)
        if potential_entities:
            entity_str = " ".join(potential_entities)
            cleaned_query = f"{cleaned_query} {entity_str}".strip()

    # If the query is still long enough, use it as is
    if len(cleaned_query.split()) >= 2:
        logger.info(f"Using complete query as search terms: {cleaned_query}")
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


async def check_api_module_match(query: str) -> Dict[str, Any]:
    """
    Check if the user query matches any API module trigger phrases.

    Args:
        query: The user's query text

    Returns:
        Dict containing the API module execution result if a match is found,
        or None if no match is found, with additional metadata
    """
    logger.info(f"Checking if query matches any API module: {query}")

    try:
        from .api_module_service import process_api_query

        # Process the query through API modules
        result = await process_api_query(query)

        if result:
            logger.info(f"Query matched API module: {result.module_name}")
            return {
                "matched": True,
                "module_name": result.module_name,
                "matched_trigger": result.matched_trigger,
                "formatted_response": result.formatted_response,
                "raw_response": result.raw_response,
                "execution_time": result.execution_time,
                "success": result.success,
                "error_message": result.error_message,
            }
        else:
            logger.info("Query did not match any API module")
            return {"matched": False}

    except Exception as e:
        logger.error(f"Error checking API module match: {str(e)}")
        return {"matched": False, "error": str(e)}

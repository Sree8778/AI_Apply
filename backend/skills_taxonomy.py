"""
Curated canonical-skill -> alias/variant map used by the local ATS scorer.

Keys are the canonical (lowercase) form of a skill; values are lowercase
aliases, abbreviations, and common spelling variants a candidate might use
instead. This is intentionally hand-curated and scoped to software/tech
roles (matching what this app's users apply for) rather than a full
general-purpose taxonomy like ESCO/O*NET — it's meant to be extended over
time as gaps show up in real scoring results, not to be exhaustive on day one.

Lookups are bidirectional: a JD keyword that happens to BE an alias (e.g.
"k8s") will still resolve to the same variant set as the canonical term.
"""

SKILLS_TAXONOMY = {
    # --- Languages ---
    "javascript": ["js", "ecmascript", "es6", "es2015"],
    "typescript": ["ts"],
    "python": ["python3", "py"],
    "java": [],
    "c++": ["cpp", "c plus plus"],
    "c#": ["csharp", "c sharp", ".net"],
    "go": ["golang"],
    "rust": [],
    "ruby": [],
    "php": [],
    "swift": [],
    "kotlin": [],
    "scala": [],
    "r": ["r language", "r programming"],
    "sql": ["structured query language"],
    "bash": ["shell scripting", "shell script"],
    "matlab": [],

    # --- Frontend ---
    "react": ["react.js", "reactjs"],
    "react native": [],
    "vue": ["vue.js", "vuejs"],
    "angular": ["angular.js", "angularjs"],
    "next.js": ["nextjs", "next js"],
    "svelte": [],
    "redux": [],
    "html": ["html5"],
    "css": ["css3"],
    "tailwind css": ["tailwindcss", "tailwind"],
    "sass": ["scss"],
    "webpack": [],
    "vite": [],

    # --- Backend / frameworks ---
    "node.js": ["nodejs", "node"],
    "express.js": ["express", "expressjs"],
    "django": [],
    "flask": [],
    "fastapi": ["fast api"],
    "spring boot": ["spring"],
    "ruby on rails": ["rails"],
    "graphql": [],
    "rest api": ["restful api", "rest", "restful"],
    "grpc": [],
    "microservices": ["microservice architecture"],

    # --- Databases ---
    "postgresql": ["postgres"],
    "mysql": [],
    "mongodb": ["mongo"],
    "redis": [],
    "elasticsearch": ["elastic search"],
    "dynamodb": [],
    "sqlite": [],
    "cassandra": [],
    "oracle database": ["oracle db"],
    "firestore": ["firebase firestore"],

    # --- Cloud / infra ---
    "aws": ["amazon web services"],
    "azure": ["microsoft azure"],
    "gcp": ["google cloud platform", "google cloud"],
    "docker": ["containerization"],
    "kubernetes": ["k8s", "container orchestration"],
    "terraform": ["infrastructure as code", "iac"],
    "ansible": [],
    "jenkins": [],
    "ci/cd": ["cicd", "continuous integration", "continuous deployment", "continuous delivery"],
    "github actions": [],
    "gitlab ci": [],
    "cloud run": ["google cloud run"],
    "lambda": ["aws lambda", "serverless functions"],
    "serverless": [],
    "nginx": [],
    "linux": ["unix"],

    # --- Data / ML ---
    "machine learning": ["ml"],
    "deep learning": ["dl"],
    "artificial intelligence": ["ai"],
    "natural language processing": ["nlp"],
    "computer vision": ["cv"],
    "pytorch": [],
    "tensorflow": [],
    "scikit-learn": ["sklearn", "scikit learn"],
    "pandas": [],
    "numpy": [],
    "data pipeline": ["etl", "extract transform load"],
    "apache spark": ["spark"],
    "apache kafka": ["kafka"],
    "airflow": ["apache airflow"],
    "power bi": ["powerbi"],
    "tableau": [],
    "large language models": ["llm", "llms", "generative ai", "genai"],
    "prompt engineering": [],
    "rag": ["retrieval augmented generation"],
    "vector database": ["vector db", "embeddings database"],

    # --- Testing / QA ---
    "unit testing": ["unit tests"],
    "test automation": ["automated testing"],
    "selenium": [],
    "playwright": [],
    "cypress": [],
    "jest": [],
    "pytest": [],
    "tdd": ["test driven development", "test-driven development"],

    # --- Methodology / process ---
    "agile": ["agile methodology"],
    "scrum": [],
    "kanban": [],
    "jira": [],
    "confluence": [],
    "product management": [],
    "project management": [],
    "stakeholder management": [],
    "cross-functional collaboration": ["cross functional collaboration", "cross-functional teams"],
    "code review": ["code reviews"],
    "system design": [],
    "distributed systems": [],
    "api design": [],

    # --- Version control / tools ---
    "git": [],
    "github": [],
    "gitlab": [],
    "bitbucket": [],
    "figma": [],
    "postman": [],
    "vs code": ["visual studio code"],

    # --- Security ---
    "oauth": ["oauth2", "oauth 2.0"],
    "penetration testing": ["pen testing", "pentesting"],
    "owasp": [],
    "encryption": [],
    "single sign-on": ["sso"],

    # --- Mobile ---
    "ios development": ["ios"],
    "android development": ["android"],
    "flutter": [],

    # --- Business / soft skills ---
    "salesforce": [],
    "excel": ["microsoft excel"],
    "leadership": ["team leadership"],
    "communication": ["communication skills"],
    "problem solving": ["problem-solving"],
    "mentoring": ["mentorship"],
    "public speaking": [],
    "negotiation": [],
    "budget management": [],
}


def build_alias_index():
    """
    Flatten SKILLS_TAXONOMY into {any-variant: canonical-term} so an
    incoming JD keyword can be looked up regardless of whether it's the
    canonical form or one of its aliases.
    """
    index = {}
    for canonical, aliases in SKILLS_TAXONOMY.items():
        index[canonical] = canonical
        for alias in aliases:
            index[alias] = canonical
    return index


ALIAS_INDEX = build_alias_index()


def variants_for(term):
    """
    Given a raw keyword string (as returned by the JD extraction step),
    return the full set of lowercase variant strings worth searching for
    in a resume: the term itself, plus its canonical form's aliases if
    it matches a taxonomy entry.
    """
    norm = (term or "").strip().lower()
    variants = {norm}
    canonical = ALIAS_INDEX.get(norm)
    if canonical:
        variants.add(canonical)
        variants.update(SKILLS_TAXONOMY.get(canonical, []))
    return variants

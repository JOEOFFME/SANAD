from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.rag.retrieve import hybrid_query
from app.config import GROQ_API_KEY
from groq import Groq

client = Groq(api_key=GROQ_API_KEY)

KEYWORDS = {
    "crible_mf1861": ["crible", "screen", "tamis", "vibrant"],
}

def router(state: AgentState) -> AgentState:
    q = state["query"].lower()
    for asset_id, keywords in KEYWORDS.items():
        if any(k in q for k in keywords):
            state["asset_id"] = asset_id
            return state
    state["asset_id"] = None
    return state

DIAGNOSIS_PROMPT = """Tu es un assistant technique pour opérateurs de plateforme minière.
Un opérateur décrit un problème. Utilise UNIQUEMENT le contexte du manuel ci-dessous.

RÈGLE STRICTE : si aucun passage du contexte ne traite clairement du symptôme décrit,
réponds "Le manuel ne couvre pas directement ce symptôme, contactez un technicien Metso."
Ne devine JAMAIS une cause à partir d'un contexte qui n'en parle pas explicitement.

CONTEXTE MANUEL:
{context}

QUESTION OPÉRATEUR: {query}

RÉPONSE:"""


def translate_to_en(query: str) -> str:
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=100,
        messages=[{"role": "user", "content": f"Translate to English, output only the translation, nothing else:\n{query}"}]
    )
    return resp.choices[0].message.content.strip()

def node_agent(state: AgentState) -> AgentState:
    if not state["asset_id"]:
        state["answer"] = "Aucun nœud ne couvre cette question pour l'instant."
        return state
    search_query = translate_to_en(state["query"])
    chunks = hybrid_query(state["asset_id"], search_query, k=8)
    state["context"] = "\n---\n".join(chunks)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=400,
        messages=[{"role": "user", "content": DIAGNOSIS_PROMPT.format(
            context=state["context"], query=state["query"]
        )}]
    )
    state["answer"] = response.choices[0].message.content
    print("\n=== CONTEXTE INJECTÉ ===")
    print(state["context"])
    print("=== FIN CONTEXTE ===\n")
    return state

def build_graph():
    g = StateGraph(AgentState)
    g.add_node("router", router)
    g.add_node("node_agent", node_agent)
    g.set_entry_point("router")
    g.add_edge("router", "node_agent")
    g.add_edge("node_agent", END)
    return g.compile()

if __name__ == "__main__":
    graph = build_graph()
    result = graph.invoke({
        "query": "les ressorts du crible sont cassés",
        "asset_id": None, "context": None, "answer": None
    })
    print(result["answer"])

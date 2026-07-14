from app.rag.retrieve import rerank_query as query_asset
EVAL_SET= [
    ("screen stops by itself, mechanism overheating", "Overheating of mechanism"),
    ("screen vibrates irregularly", "Unlike Movement of the Screen"),
    ("springs are broken", "Spring Breakage"),
    ("oil loss in the mechanism", "Loss of oil"),
    ("screen loses amplitude", "Loss of Amplitude"),
]

def evaluate(asset_id: str, k: int = 3, show_misses: bool = True):
    hits, reciprocal_ranks = 0, []
    for query, expected_keyword in EVAL_SET:
        chunks = query_asset(asset_id, query, k=k)
        rank = next((i+1 for i, c in enumerate(chunks) if expected_keyword.lower() in c.lower()), None)
        if rank:
            hits += 1
            reciprocal_ranks.append(1/rank)
        else:
            reciprocal_ranks.append(0)
            if show_misses:
                print(f"\n[MISS] {query} (looking for: '{expected_keyword}')")
                for i, c in enumerate(chunks):
                    print(f"  #{i+1}: {c[:150]}...")

    print(f"\nHit Rate@{k}: {hits}/{len(EVAL_SET)} = {hits/len(EVAL_SET):.0%}")
    print(f"MRR: {sum(reciprocal_ranks)/len(reciprocal_ranks):.2f}")
if __name__ == "__main__":
    evaluate("crible_mf1861")

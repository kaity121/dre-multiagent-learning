import argparse, json, pathlib, unicodedata, re, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def normalize(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower().replace('đ','d')) if unicodedata.category(c)!='Mn')

STOPWORDS = {
    'em', 'thay', 'co', 'chua', 'cho', 'nay', 'a', 'oi', 'giup', 'voi', 'bai', 'day',
    'va', 'la', 'thi', 'o', 'cua', 'cac', 'nhung', 'gi', 'sao', 'nao', 'the', 'nhu',
    'minh', 'ban', 'xin', 'hoi', 'lam'
}

ALIASES = {
    'cong do dai vecto': ['length_addition'],
    'cong do dai': ['length_addition'],
    'vi du 3': ['example_3', 'cube'],
    'hinh hop': ['box_rule'],
    'trong tam': ['triangle_centroid', 'tetrahedron_centroid'],
    'vecto khong co goc': ['zero_vector', 'angle_convention'],
    'goc voi vecto khong': ['zero_vector', 'angle_convention'],
    'vecto khong': ['zero_vector'],
    'tich vo huong am': ['negative_dot'],
    'tich vo huong goc tu': ['negative_dot'],
    'tich vo huong goc 120': ['negative_dot'],
    'tich vo huong': ['dot_product', 'scalar_result'],
    'goc 120': ['angle'],
    'goc tu': ['angle'],
    'goc giua hai vecto': ['angle'],
    'goc giua': ['angle'],
    'goc cua hai vecto': ['angle'],
    'goc vecto': ['angle', 'angle_convention'],
    'chung goc': ['common_origin'],
    'cung goc': ['common_origin'],
    'hieu do dai': ['length_subtraction'],
    'do dai hieu': ['length_subtraction'],
    'hieu hai vecto': ['subtraction_order', 'common_origin'],
    'phep tru': ['subtraction_order', 'common_origin'],
    'tru vecto': ['subtraction_order', 'common_origin'],
    'tru hai vecto': ['subtraction_order', 'common_origin'],
    'quy tac tru': ['subtraction_order', 'common_origin'],
    'he so am': ['negative_scale'],
    'binh phuong tong': ['cross_term'],
    'so hang cheo': ['cross_term'],
    'cung phuong': ['parallel', 'opposite'],
    'vecto doi': ['negative_length', 'reverse'],
    'quy tac ba diem': ['triangle_rule', 'endpoint_order'],
    'trong tam tu dien': ['tetrahedron_centroid', 'sign', 'protege'],
}

def get_alias_tags(query):
    q_norm = normalize(query)
    q_lower = query.lower()
    tags = set()
    for key, t_list in ALIASES.items():
        if key in q_norm:
            tags.update(t_list)
    if re.search(r'\bgóc\b', q_lower) and not re.search(r'\bgốc\b', q_lower):
        tags.add('angle')
    if re.search(r'\bgốc\b', q_lower):
        tags.add('common_origin')
    return tags

def get_context(kb, misconception):
    kids=set(misconception['knowledge_ids'])
    eids=set(misconception['exercise_ids'])
    return {'visibility':'agent_internal_not_student_message',
            'misconception':misconception,
            'knowledge':[k for k in kb['knowledge'] if k['id'] in kids],
            'exercises':[e for e in kb['exercises'] if e['id'] in eids],
            'roundtable_policy':kb['roundtable_policy']}

def search(kb, query, limit=3):
    q_lower = str(query or '').lower()
    raw_tokens = re.findall(r'[\w]+', q_lower)
    if not raw_tokens:
        return []

    alias_tags = get_alias_tags(query)
    is_accented = any(unicodedata.category(c) == 'Mn' for c in unicodedata.normalize('NFD', query)) or 'đ' in q_lower
    meaningful = [t for t in raw_tokens if normalize(t) not in STOPWORDS]
    search_terms = meaningful if meaningful else raw_tokens

    e_by_id = {e['id']: e for e in kb.get('exercises', [])}
    scores = []

    for m in kb['misconceptions']:
        ce = m.get('counterexample', {})
        ex_texts = [e_by_id[eid]['problem'] + ' ' + e_by_id[eid]['expected_answer'] for eid in m.get('exercise_ids', []) if eid in e_by_id]
        raw_body = ' '.join([
            m['title'], m['topic'], m['incorrect_claim'], m['correction'],
            ce.get('setup', ''), ce.get('result', ''), ce.get('verification', ''),
            *ex_texts, *m['tags']
        ]).lower()

        raw_set = set(re.findall(r'[\w]+', raw_body))
        norm_set = set(re.findall(r'[\w]+', normalize(raw_body)))

        token_matches = 0
        for t in search_terms:
            if normalize(t) in STOPWORDS:
                continue
            if is_accented:
                if t in raw_set:
                    token_matches += 1
            else:
                if normalize(t) in norm_set:
                    token_matches += 1

        tag_match_count = len(alias_tags & set(m['tags']))
        score = token_matches + 12 * tag_match_count
        if score > 0 and (tag_match_count > 0 or token_matches >= 2):
            scores.append((score, m['id'], m))

    scores.sort(key=lambda x: (-x[0], x[1]))
    return [{'retrieval_score': score, **get_context(kb, m)} for score, _, m in scores[:limit]]

def find_default_kb():
    candidates = [
        pathlib.Path(__file__).with_name('dre_vector_kb.json'),
        pathlib.Path(__file__).parent / '../data/dre_vector_kb.json',
        pathlib.Path(__file__).parent / 'backend/src/data/dre_vector_kb.json',
        pathlib.Path('backend/src/data/dre_vector_kb.json'),
        pathlib.Path('dre_vector_kb.json'),
    ]
    for c in candidates:
        if c.exists():
            return c.resolve()
    return pathlib.Path(__file__).with_name('dre_vector_kb.json')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--kb',type=pathlib.Path,default=find_default_kb())
    g=p.add_mutually_exclusive_group(required=True);g.add_argument('--id');g.add_argument('--query')
    p.add_argument('--limit',type=int,default=3); args=p.parse_args()
    if args.limit<1: p.error('--limit must be positive')
    kb=json.loads(args.kb.read_text(encoding='utf-8'))
    if args.id:
        item=next((m for m in kb['misconceptions'] if m['id']==args.id),None)
        if item is None: p.error('Unknown misconception ID')
        result=get_context(kb,item)
    else: result=search(kb,args.query,args.limit)
    print(json.dumps(result,ensure_ascii=False,indent=2))

import argparse, json, pathlib, unicodedata, re, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def normalize(s):
    return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('đ','d')) if unicodedata.category(c)!='Mn')

def get_context(kb, misconception):
    kids=set(misconception['knowledge_ids'])
    eids=set(misconception['exercise_ids'])
    return {'visibility':'agent_internal_not_student_message',
            'misconception':misconception,
            'knowledge':[k for k in kb['knowledge'] if k['id'] in kids],
            'exercises':[e for e in kb['exercises'] if e['id'] in eids],
            'roundtable_policy':kb['roundtable_policy']}

def search(kb, query, limit=3):
    aliases = {
        'cong do dai vecto': ['length_addition'],
        'vi du 3': ['example_3'],
        'hinh hop': ['box_rule'],
        'trong tam': ['centroid'],
        'vecto khong': ['zero_vector', 'zero_angle'],
        'tich vo huong': ['dot_product', 'negative_dot', 'scalar_result'],
        'goc 120': ['angle', 'negative_dot'],
        '120': ['angle', 'negative_dot'],
        'goc': ['angle', 'angle_convention'],
        'hieu': ['subtraction_order', 'common_origin'],
        'he so am': ['negative_scalar', 'collinear_negative'],
        'binh phuong tong': ['cross_term'],
        'so hang cheo': ['cross_term'],
    }
    q = normalize(query)
    tokens = set(re.findall(r'\w+', q))
    tags = set(t for key, values in aliases.items() if key in q for t in values)
    scores = []
    e_by_id = {e['id']: e for e in kb.get('exercises', [])}
    for m in kb['misconceptions']:
        ce = m.get('counterexample', {})
        ex_texts = [e_by_id[eid]['problem'] + ' ' + e_by_id[eid]['expected_answer'] for eid in m.get('exercise_ids', []) if eid in e_by_id]
        body = normalize(' '.join([
            m['title'], m['topic'], m['incorrect_claim'], m['correction'],
            ce.get('setup', ''), ce.get('result', ''), ce.get('verification', ''),
            *ex_texts, *m['tags']
        ]))
        score = len(tokens & set(re.findall(r'\w+', body))) + 12 * len(tags & set(m['tags']))
        if score:
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

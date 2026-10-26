"""Content integrity and independent arithmetic checks; not pedagogical approval."""
import json, pathlib, math, sys
from query_kb import search, find_default_kb
p=pathlib.Path(__file__).parent
kb_path = find_default_kb()
kb=json.loads(kb_path.read_text(encoding='utf-8'))
checks=[]
def check(label, result):
    if not result: raise AssertionError(label)
    checks.append(label)
K={x['id']:x for x in kb['knowledge']}; M={x['id']:x for x in kb['misconceptions']}; E={x['id']:x for x in kb['exercises']}
check('24 unique knowledge items',len(K)==len(kb['knowledge'])==24)
check('20 unique misconception items',len(M)==len(kb['misconceptions'])==20)
check('20 unique variant exercises',len(E)==len(kb['exercises'])==20)
for m in M.values():
    check(m['id']+' references',all(i in K for i in m['knowledge_ids']) and all(i in E for i in m['exercise_ids']))
    check(m['id']+' full pedagogical payload',bool(m['counterexample']['verification']) and len(m['scaffolding'])==3 and bool(m['resolution_criteria']))
for e in E.values():
    check(e['id']+' references and answer',all(i in M for i in e['misconception_ids']) and all(i in K for i in e['knowledge_ids']) and bool(e['expected_answer']) and bool(e['solution_outline']))
for item in [*K.values(),*M.values(),*E.values()]:
    for r in item['source_refs']:
        check(item['id']+' source page mapping',all(45<=x<=59 for x in r['printed_pages']) and r['pdf_pages_1based']==[x+2 for x in r['printed_pages']])
check('not falsely teacher approved', all(x['review_status']!='approved' for x in [*K.values(),*M.values(),*E.values()]))
check('video timestamp not invented',kb['roundtable_demo']['video_timestamp_s'] is None)
# Independent numeric vector model, for validation only (student text stays geometric).
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def scale(k,a):return tuple(k*x for x in a)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(a):return math.sqrt(dot(a,a))
def near(a,b):return math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10)
u=(1,0,0);v=(0,1,0);zero=(0,0,0)
check('M01 equal lengths not equality',near(norm(u),norm(v)) and u!=v)
P=zero;Q=(2,0,0);S=(0,3,0);R=add(Q,S)
check('M02 translated edge',sub(Q,P)==sub(R,S))
check('M03 negative collinearity',dot(u,scale(-4,u))<0)
check('M04 head to tail',add((1,0,0),(2,0,0))==(3,0,0))
a=2; A=zero;B=(a,0,0);D=(0,a,0);C=(a,a,0);Ap=(0,0,a);Dp=(0,a,a);Bp=(a,0,a)
check('M05 unit counterexample norm',near(norm(add((1,0,0),(0,1,0))),math.sqrt(2)))
check('M05 cube norm',near(norm(add(sub(C,B),sub(Dp,D))),2*math.sqrt(2)))
check('M06 box at B',add(add(sub(A,B),sub(C,B)),sub(Bp,B))==sub(Dp,B))
check('M07 subtraction direction',sub(sub(P,S),sub(Q,S))==sub(P,Q))
check('M08 reverse difference',sub(u,scale(-1,u))==scale(2,u))
check('M09 norm difference',near(norm(sub((3,0,0),(0,4,0))),5))
check('M10 opposite norm',near(norm(scale(-1,(3,0,0))),3))
check('M11 sign and scale',dot(u,scale(-3,u))<0 and near(norm(scale(-3,u)),3))
check('M12 absolute scalar norm',near(norm(scale(-1.5,(4,0,0))),6))
check('M13 zero exception',scale(5,zero)==zero)
check('M14 distribute negative',scale(-2,sub(u,scale(3,v)))==add(scale(-2,u),scale(6,v)))
check('M15 centroid',scale(1/3,scale(6,u))==scale(2,u))
I=(9,0,0);G=(12,0,0)
check('M16 centroid ratio sign',sub(A,I)==scale(-3,sub(G,I)) and near(norm(sub(G,I)),3))
check('M17 supplementary angle',near(math.degrees(math.acos(-math.cos(math.pi/3))),120))
check('M18 zero denominator',dot(zero,v)==0 and norm(zero)*norm(v)==0)
check('M19 negative dot',near(2*3*math.cos(2*math.pi/3),-3))
check('M20 cross term',near(2**2+3**2+2*2*3*math.cos(math.pi/3),19))
check('query length addition',search(kb,'cộng độ dài vectơ',1)[0]['misconception']['id']=='MISC_VEC_005')
check('query textbook example',search(kb,'ví dụ 3',1)[0]['misconception']['id']=='MISC_VEC_005')
check('unknown query empty',search(kb,'zzzzzznotfound',3)==[])
report={'status':'PASS','checks_passed':len(checks),'checks':checks,'limitations':['Không thay thế duyệt sư phạm của giáo viên.','Kiểm tra số học đại diện không chứng minh tổng quát mọi bài toán.','Chưa chạy Roundtable LLM hoặc tool runtime của repository.']}
(p/'validation_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PASS:',len(checks),'checks')

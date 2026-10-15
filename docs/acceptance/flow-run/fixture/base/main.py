import csv,json,math,os,pathlib
cfg=json.loads(pathlib.Path('config.json').read_text()); degree=cfg['polynomialDegree']
data=[(float(r['x']),float(r['y'])) for r in csv.DictReader(open('data.csv'))]
train=data[:180]; test=data[180:]; n=degree+1
a=[[sum(x**(i+j) for x,y in train) for j in range(n)] for i in range(n)]
b=[sum(y*x**i for x,y in train) for i in range(n)]
for i in range(n):
    pivot=max(range(i,n),key=lambda k:abs(a[k][i])); a[i],a[pivot]=a[pivot],a[i]; b[i],b[pivot]=b[pivot],b[i]
    v=a[i][i]; a[i]=[x/v for x in a[i]]; b[i]/=v
    for k in range(n):
        if k==i: continue
        v=a[k][i]; a[k]=[x-v*y for x,y in zip(a[k],a[i])]; b[k]-=v*b[i]
predict=lambda x:sum(v*x**i for i,v in enumerate(b))
mse=lambda rows:sum((predict(x)-y)**2 for x,y in rows)/len(rows)
mean=sum(y for x,y in test)/len(test)
metrics={'mse':mse(test),'train_mse':mse(train),'r2':1-sum((predict(x)-y)**2 for x,y in test)/sum((y-mean)**2 for x,y in test)}
out=pathlib.Path(os.environ['PI_OUTPUT_DIR']); out.mkdir(exist_ok=True)
(out/'metrics.json').write_text(json.dumps(metrics)); (out/'model.json').write_text(json.dumps({'degree':degree,'coefficients':b}))
with (out/'predictions.csv').open('w',newline='') as f:
    w=csv.writer(f); w.writerow(['x','actual','predicted']); w.writerows((x,y,predict(x)) for x,y in test)
print(json.dumps({'degree':degree,'metrics':metrics}),flush=True)

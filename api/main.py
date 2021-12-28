from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware


import yf
from tickers import Tickers
from time import time
from json import dumps

app = FastAPI()
tickers = Tickers("tickers.csv")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# EX: analyze?t=btc-usd,googl,tsla&w=0.1,0.2,0.7&edge=0.1
@app.get("/analyze")
def analyze(t:str,w:str,edge:float):
	start = time()

	portfolio = {}
	weights = w.split(",")
	for index,ticker in enumerate(t.split(",")):
		portfolio[ticker]=float(weights[index])
	response = yf.analyze(portfolio,edge)
	return response

# EX: search?ticker=btc
@app.get("/search")
def search(pattern:str):
	try:
		return tickers.find(pattern)
	except:
		return []


# EX: info?ticker=btc-usd
@app.get("/tickers/{ticker}")
def info(ticker:str):
	response = tickers.find(ticker)
	return {
		"ticker":response.keys()[0],
		"name":response[0]
	}

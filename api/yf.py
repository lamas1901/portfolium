import yfinance as yf
from datetime import datetime
import pandas as pd
import numpy as np
import copy

from pprint import pprint

def is_valid_ticker(t):
	ticker = yf.Ticker(t)
	if ticker.info["regularMarketPrice"] == None:
		return False
	return True

def create_portfolio(tickers,weights):
	if len(tickers)==len(weights):
		res = {}
		for index,ticker in enumerate(tickers):
			res[ticker] = weights[index]
		return res
	else:
		return False

def get_brief(tickers):
	columns = copy.deepcopy(tickers)
	tickers_invalid = []

	data = []
	for ticker in tickers:
		ticker_data = yf.download(
			ticker,
			interval="1mo",
			progress=False
		)["Close"]
		if ticker_data.shape[0]>0:
			data.append(
				ticker_data
			)
		else:
			tickers_invalid.append(ticker)
			columns.remove(ticker)
	data = pd.concat(data,axis=1).dropna()
	date_from = data.index[0].timestamp()
	data.columns = columns

	logReturns = np.log(data/data.shift(1))

	meanLogRet = logReturns.mean().replace(np.nan,-0.01)
	sigma = logReturns.cov().replace(np.nan,0)

	return {
		"meanLogRet":meanLogRet,
		"sigma":sigma,
		"from": date_from,
		"tickers_invalid" : tickers_invalid, 
		"tickers" : columns
	}

def get_expectations(portfolio,brief):

	w = np.array([portfolio[i] for i in brief["tickers"]])

	expectedReturn = np.sum(brief["meanLogRet"]*w)
	expectedVolatility = np.sqrt(np.dot(w.T,np.dot(brief["sigma"],w)))

	year_count = datetime.today().year-datetime.fromtimestamp(brief["from"]).year
	return {
		"volatility":round(expectedVolatility/year_count,4),
		"return":round(expectedReturn/year_count*100,4),
		"from":brief["from"]
	}

def optimize(tickers,edge):

	noOfPortfolios = 10000
	weight = np.zeros((noOfPortfolios,len(tickers)))
	expectedReturn = np.zeros(noOfPortfolios)
	expectedVolatility = np.zeros(noOfPortfolios)
	sharpRatio = np.zeros(noOfPortfolios)

	brief = get_brief(tickers)
	meanLogRet = brief["meanLogRet"]
	sigma = brief["sigma"]

	for k in range(noOfPortfolios):
		w = np.array(np.random.random(len(tickers)))
		w = w/np.sum(w)
		weight[k] = w
		portfolio = {}
		expects = get_expectations(
			create_portfolio(tickers,w),
			brief
		)
		expectedReturn[k] = expects["return"]
		expectedVolatility[k] = expects["volatility"]
		sharpRatio[k] = expectedReturn[k]/expectedVolatility[k]

	maxIndex = sharpRatio.argmax()

	rawWeights = create_portfolio(tickers,weight[maxIndex])
	outWeights = {}
	for weight in rawWeights:
		if rawWeights[weight] >= edge:
			outWeights[weight] = round(
				rawWeights[weight],
				len(str(edge))-2
			)
	return {
		"weights":outWeights,
		"volatility":expectedVolatility[maxIndex],
		"return":expectedReturn[maxIndex]
	}


def analyze(portfolio,edge=0.01):
	brief = get_brief([ticker for ticker in portfolio])
	tickers = [ticker for ticker in brief["tickers"]]
	for ticker in brief["tickers_invalid"]:
		try:
			portfolio.pop(ticker)
		except:
			pass
	return {
		"current":get_expectations(
			portfolio,
			brief
		),
		"optimized":optimize(tickers,edge)
	}

if __name__ == "__main__":

	portfolio = {
		"googl":0.9,
		"aapl":0.1
	}

	print(analyze(portfolio))
	pass

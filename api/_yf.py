import yfinance as yf
import datetime
import pandas as pd
import numpy as np

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
	cury = int(datetime.date.today().strftime("%Y"))
	start = datetime.datetime(cury-1,1,1)

	data = []

	for ticker in tickers:
		data.append(
			yf.download(
				ticker,
				start,
				interval="1d",
				progress=False
			)["Close"]
		)
	data = pd.concat(data,axis=1)
	data.columns = tickers

	logReturns = np.log(data/data.shift(1))

	meanLogRet = logReturns.mean().replace(np.nan,-0.01)
	sigma = logReturns.cov().replace(np.nan,0)

	return {
		"meanLogRet":meanLogRet,
		"sigma":sigma
	}

def get_expectations(portfolio,brief):

	w = np.array([portfolio[i] for i in portfolio])

	expectedReturn = np.sum(brief["meanLogRet"]*w)
	expectedVolatility = np.sqrt(np.dot(w.T,np.dot(brief["sigma"],w)))
	return {
		"volatility":round(expectedVolatility,4),
		"return":round(expectedReturn*100,4)
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
	tickers = [ticker for ticker in portfolio]
	return {
		"current":get_expectations(
			portfolio,
			get_brief(tickers)
		),
		"optimized":optimize(tickers,edge)
	}

if __name__ == "__main__":

	portfolio = {
		"btc-usd":0.9,
		"btc-r.bk":0.1
	}

	print(analyze(portfolio))
	pass

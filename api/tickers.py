''' Этот файл отвечает за часть поиска тикеров по совпадению сначала '''


import pandas as pd
import numpy as np

class Tickers():

	def __init__(self,path):
		self.all = pd.read_csv(path)[["ticker","name"]]
		self.all.columns = ["ticker","name"]

	def add_ticker(self,ticker,data:dict):
		to_add = pd.DataFrame(data,index=[ticker])
		self.all = self.all.append(to_add)

	def find(self,pattern):
		df = self.all
		result = df[
			["ticker","name"]
		][df['ticker'].str.contains(
			pattern, case=False
		) | df['name'].str.contains(
			pattern,case=False)].set_index("ticker").head(5).replace(np.nan,"").to_dict()
		exist = df.set_index("ticker").filter(
			regex=f"^{pattern.upper()}$",
			axis=0
		).shape[0]

		result["tickers"] = result.pop("name")

		result["right_ticker"] = bool(exist)

		return result

	def get(self,ticker):
		result = self.all.set_index("ticker").filter(
			regex=f"^{ticker.upper()}$",
			axis=0
		).to_dict()
		result["ticker"] = result.pop("name")
		return result["ticker"]

	def save(self,filename):
		self.all.to_csv(filename)



if __name__=="__main__":

	tickers = Tickers(input("Название файла:"))
	
	while True:
		pattern = input("Введи паттерн:")
		print(tickers.find(pattern))

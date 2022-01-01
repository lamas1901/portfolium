''' Этот файл отвечает за часть поиска тикеров по совпадению сначала '''


import pandas as pd
import numpy as np

class Tickers():

	def __init__(self,path):
		self.all = pd.read_csv(path)
		self.all.columns = ["index","ticker","name","exchange","type","country"]
		# old
		# self.all.columns = ["ticker","name","exchange","type","country"]		
		# self.all = self.all.set_index("ticker")

	def add_ticker(self,ticker,data:dict):
		to_add = pd.DataFrame(data,index=[ticker])
		self.all = self.all.append(to_add)

	def find(self,pattern):
		df = self.all
		return df[
			["ticker","name"]
		][df['ticker'].str.contains(
			pattern, case=False
		) | df['name'].str.contains(
			pattern,case=False)].set_index("ticker").head(5)["name"].replace(np.nan,"")

		# old		 
		# return self.all.filter(

		# 	regex=f"^{pattern.upper()}",
		# 	axis=0
		# )["name"].sort_index().replace(np.nan,"")[:5]

	def save(self,filename):
		self.all.to_csv(filename)



if __name__=="__main__":

	tickers = Tickers(input("Название файла:"))
	
	while True:
		pattern = input("Введи паттерн:")
		print(tickers.find(pattern).to_dict())

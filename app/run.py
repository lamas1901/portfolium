from portfolium import app
from sys import argv

if __name__=="__main__":

	app.run(debug="debug" in argv)

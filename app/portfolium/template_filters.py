from portfolium import app
from datetime import datetime

@app.template_filter('ctime')
def timectime(num):
    return datetime.fromtimestamp(num).strftime("%m/%d/%Y")

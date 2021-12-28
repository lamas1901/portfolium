from portfolium import app, db 

with app.app_context():
	db.engine.connect().execute("DROP TABLES users,portfolios,confirm_requests,reset_password_requests")

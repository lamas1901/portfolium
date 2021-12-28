from portfolium import app, db
from portfolium.models import User, Portfolio
from time import time

import bcrypt


with app.app_context():
    db.create_all()
    db.session.add(User(
        username = "Test1",
        email = "test1@mail.com",
        password =  bcrypt.hashpw(
            "ilhan2002".encode(),
            bcrypt.gensalt()
        )
    ))
    for i in range(10):
        db.session.add(Portfolio(
            owner = User.query.filter_by(id=1).first(),
            name = f"test{i+1}",
            number = i+1,
            data_current = [
                {
                    'number': 1, 
                    'price': 1, 
                    'ticker': 'A'
                },
                {
                    'number': 2, 
                    'price': 14, 
                    'ticker': 'AAPL'
                }
            ],
            data_optimized = {
                'current': {
                    'return': 0.17, 
                    'volatility': 0.0225
                },
                'optimized': {
                    'return': 0.1537,
                    'volatility': 0.0196,
                    'weights': {'A': 0.41, 'AAPL': 0.59}
                }
            },
            optimize_timestamp = time()
        ))
    db.session.commit()

#db.session.delete(User.query.filter_by(user_id=1).first())


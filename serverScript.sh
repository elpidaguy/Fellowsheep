killall gunicorn
gunicorn -w 3 --bind 0.0.0.0:5128 server:app --timeout 120 --daemon
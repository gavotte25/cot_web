from config import app, ip_config
import api

if __name__ == '__main__': 
    app.run(host=ip_config['host'], port=ip_config['port'])
from flask import Flask, render_template, json
from get_data import manipulate
import time

app = Flask(__name__, static_url_path='/static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/iam')
def iam():
    return render_template('iam.html')

@app.route('/visualize')
def visualize():
    return render_template('visualize.html')

@app.route('/upload')
def upload():
    # start = time.time()
    resp = manipulate() # 5 ~ 6초
    # print(time.time() - start)
    return json.jsonify(resp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
from flask import Flask, render_template, json
from get_data import get_infra, get_iam

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

@app.route('/fetch_infra')
def fetch_infra():
    resp = get_infra()
    return json.jsonify(resp)

@app.route('/fetch_iam')
def fetch_iam():
    resp = get_iam()
    return json.jsonify(resp)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
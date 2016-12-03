from flask import Flask, render_template
from flask import request
import csv

app = Flask(__name__)

@app.route('/')
@app.route('/index')
def home():
	return render_template('index.html')

@app.route('/attractions')
def attractions():
	return render_template('attractions.html')

@app.route('/reviews')
def reviews():
	return render_template('reviews.html')

@app.route('/contactus')
def contactus():
	return render_template('contactus.html')

@app.route('/gallery')
def gallery():
	return render_template('gallery.html')

if __name__ == '__main__':
	app.run(debug = True)

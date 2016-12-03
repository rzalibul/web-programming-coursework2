from flask import Flask, render_template
from flask import request
import csv
import json
from datetime import datetime

# reads a csv file in specified path, map field names and return list of JSON formatted rows
# filePath: specify relative path from this file
# fieldnames: specify field names in form of a list
def readCsvFileToJSON(filePath, fieldnames):
	with open(filePath, 'r') as inFile:
		list = []
		reader = csv.DictReader(inFile, fieldnames = fieldnames)		# map the field names
		for row in reader:
			sublist = []
			for field in row:
				sublist.append(json.JSONEncoder().encode({field: row[field]}))
			list.append(sublist)
	return list
# writes specified list to a csv file in specified path
def writeCsvFile(list, filePath):
	with open(filePath, 'w', newline='') as outFile:
		writer = csv.writer(outFile)
		writer.writerows(list)
	return

app = Flask(__name__)

# double routing so the standard path is index page
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

@app.route('/saveComment', methods=['POST'])
def saveComment():
	commentsPath = "static\\comments.csv"
	name = request.form['author']
	comment = request.form['comment']
	rating = request.form['rating']
	
	# format result is present in the csv file
	date = datetime.utcnow().strftime("%d %b %Y %H:%M:%S %Z %z")
	# to do: proper timezone formatting (use pytz maybe)
	
	list = readCsvFile(commentsPath)
	newEntry = [name, comment, rating, date]
	list.append(newEntry)
	writeCsvFile(list, commentsPath)
	# dump data sent in JSON format
	return json.dumps({'status': 'OK', 'author': name, 'comment': comment, 'rating': rating, 'date': date})

@app.route('/fetchComments', methods=['GET'])
def fetchComments():
	commentsPath = "static\\comments.csv"
	# file format: author, text, rating, date
	fieldNames = ['author', 'comment', 'rating', 'date']
	# dump list of JSON formatted data
	list = readCsvFileToJSON(commentsPath, fieldNames)
	return json.dumps(list)
	
	
if __name__ == '__main__':
	app.run(debug = True)

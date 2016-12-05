from flask import Flask, render_template, session, redirect
from flask import request
import csv
import json
from datetime import datetime

# simple CSV reading
def readCsvFile(filePath):
	with open(filePath, 'r') as inFile:
		reader = csv.reader(inFile)
		aList = [row for row in reader]
	return aList
# find a value in CSV file and return the row; if value is not present, return an empty string
# filePath: specify relative path from this file
# fieldnames: specify field names in form of a list
# field: specify the field for the sought value
# val: specify sought value
def findCsvRow(filePath, fieldnames, field, val):
	with open(filePath, 'r') as inFile:
		reader = csv.DictReader(inFile, fieldnames = fieldnames)		# map the field names
		for row in reader:
			if row[field] == val:
				return row
	# no matches found; return empty string
	# potential error(?); empty list should be returned
	return ""
# reads a csv file in specified path, map field names and return list of JSON formatted rows
# filePath: specify relative path from this file
# fieldnames: specify field names in form of a list
# wrappingword: word used to wrap all the items (default: item)
def readCsvFileToJSON(filePath, fieldnames, wrappingword='item'):
	with open(filePath, 'r') as inFile:
		list = []
		reader = csv.DictReader(inFile, fieldnames = fieldnames)		# map the field names
		for row in reader:
			sublist = {}
			for field in row:
				sublist.update({field: row[field]})
			list.append(sublist)
	return json.JSONEncoder().encode({wrappingword: list})
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

# review page specific
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

@app.route('/register')
def register():
	return render_template('register.html')

@app.route('/login', methods=['POST'])
def login():
	usersPath = "static\\users.csv"
	username = request.form['username']
	password = request.form['pwd']
	fieldNames = ['username', 'password']
	record = findCsvRow(usersPath, fieldNames, 'username', username)
	if record != "":
		if record['password'] == password:
			session['username'] = username
			return redirect('/')
	return redirect('/')

@app.route('/logout', methods=['GET'])
def logout():
	session.clear()
	return redirect('/')
	
if __name__ == '__main__':
	# pseudo RNG key for sessions
	app.secret_key = '\x0e\xdd\xbb\x86j2\xff-\xf3\\S[\xc0\x1a$\xa6t\x04\xd3\x87!\x1f\x9a,'
	app.run(debug = True)

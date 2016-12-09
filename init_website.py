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
	# no matches found; return empty list
	return []

# replace a row with certain value in the 0th index; if delete is present, the function will only look at the first mapped field to find the record and then delete it
# filePath: specify relative path from this file
# rowReplacement: mapped row of a dictionary that should replace a row with certain value
# fieldnames: specify field names in form of a list
# (optional) delete: specify whether the replace should be delete; set to True to use this mode
def replaceCsvRow(filePath, rowReplacement, fieldnames, delete=False):
	aList = readCsvFile(filePath)
	for index, row in enumerate(aList):
		# safely cast into int to enforce one type
		if int(row[0]) == int(rowReplacement[fieldnames[0]]):
			if delete == True:
				aList[index] = []
			else:
				counter = 0
				for field in rowReplacement:
					aList[index][counter] = rowReplacement[fieldnames[counter]]
					counter += 1
				# break out of the loop; IDs are unique
				break
	writeCsvFile(aList, filePath)
	return

# delete first encountered csv row that matches the search by search field
# filePath:	specify relative path from this file
# fieldnames: specify field names in form of a list
# searchField: specify a mapped field which contains 
# def deleteCsvRow(filePath, fieldnames, searchField, val):
	# list = []
	# with open(filePath, 'r') as inFile:
		# reader = csv.DictReader(inFile, fieldnames = fieldnames)
		# for row in reader:
			# dict = {}
			# for field in row:
				# if field == searchField and row[field] == val:
					
				# dict.update({field: row[field]})
			# list.append(aDict)
	
# reads a csv file in specified path, map field names and return list of JSON formatted rows
# filePath: specify relative path from this file
# fieldnames: specify field names in form of a list
# wrappingword: word used to wrap all the items (default: item)
def readCsvFileToJSON(filePath, fieldnames, wrappingword='item'):
	with open(filePath, 'r') as inFile:
		list = []
		reader = csv.DictReader(inFile, fieldnames = fieldnames)		# map the field names
		for row in reader:
			dict = {}
			for field in row:
				dict.update({field: row[field]})
			list.append(dict)
	return json.JSONEncoder().encode({wrappingword: list})
# writes specified list to a csv file in specified path
def writeCsvFile(list, filePath):
	with open(filePath, 'w', newline='') as outFile:
		writer = csv.writer(outFile)
		writer.writerows(list)
	return
	
# checks user permission in regards to specific author of content (e.g. comment)
# only the user who created the content and an admin can manipulate such content
# owner: name of the user who owns the content
def checkPermissions(owner):
	if 'username' in session:
		return session['username'] == owner or session['isAdmin'] == True
	else:
		return False

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
	if 'username' in session:
		name = session['username']
	else:
		name = "Anonymous"
	comment = request.form['comment']
	rating = request.form['rating']
	
	# format result is present in the csv file
	date = datetime.utcnow().strftime("%d %b %Y %H:%M:%S %Z %z")
	# to do: proper timezone formatting (use pytz maybe)
	
	list = readCsvFile(commentsPath)
	maxVal = 0
	# find maximum id value in the list
	for row in list:
		if int(row[0]) > maxVal:
			maxVal = int(row[0])
	# set new entry ID to successor to the maximum value
	id = maxVal + 1
	newEntry = [id, name, comment, rating, date]
	list.append(newEntry)
	writeCsvFile(list, commentsPath)
	# dump data sent in JSON format
	return json.dumps({'status': 'OK', 'id': id, 'author': name, 'comment': comment, 'rating': rating, 'date': date})

@app.route('/fetchComments', methods=['GET'])
def fetchComments():
	commentsPath = "static\\comments.csv"
	# file format: id, author, text, rating, date
	fieldNames = ['id', 'author', 'comment', 'rating', 'date']
	# dump list of JSON formatted data
	list = readCsvFileToJSON(commentsPath, fieldNames)
	return json.dumps(list)

@app.route('/modifyComment', methods=['POST'])
def modifyComment():
	commentsPath = "static\\comments.csv"
	fieldNames = ['id', 'author', 'comment', 'rating', 'date']
	id = request.form['cmt_id']
	row = findCsvRow(commentsPath, fieldNames, 'id', id)
	if checkPermissions(row['author']) == True:
		row['comment'] = request.form['comment']
		row['rating'] = request.form['rating']
		row['date'] = datetime.utcnow().strftime("%d %b %Y %H:%M:%S %Z %z")
		replaceCsvRow(commentsPath, row, fieldNames)
		return json.dumps({'status': 'OK', 'id': row['id'], 'author': row['author'], 'comment': row['comment'], 'rating': row['rating'], 'date': row['date']})
	else:
		return redirect('/reviews', code=401)	# 401 Unauthorised

@app.route('/deleteComment', methods=['POST'])
def deleteComment():
	commentsPath = "static\\comments.csv"
	fieldNames = ['id', 'author', 'comment', 'rating', 'date']
	id = request.form['cmt_id']
	row = findCsvRow(commentsPath, fieldNames, 'id', id)
	if checkPermissions(row['author']) == True:
		replaceCsvRow(commentsPath, {'id': id}, fieldNames, delete=True)
		return json.dumps({'status': 'OK'})
	else:
		return redirect('/reviews', code=401)	# 401 Unauthorised
		
# possible refactoring of deleteComment and modifyComment by putting same code into subroutine

@app.route('/register')
def register():
	return render_template('register.html')

@app.route('/login', methods=['POST'])
def login():
	usersPath = "static\\users.csv"
	username = request.form['username']
	password = request.form['pwd']
	fieldNames = ['username', 'password', 'permission']
	record = findCsvRow(usersPath, fieldNames, 'username', username)
	if record != "":
		if record['password'] == password:
			session['username'] = username
			if record['permission'] == "admin":
				session['isAdmin'] = True
			return redirect('/')
	return redirect('/')

@app.route('/logout', methods=['GET'])
def logout():
	session.clear()
	return redirect('/', code=200)		# send 200 OK response
	
if __name__ == '__main__':
	# pseudo RNG key for sessions
	app.secret_key = '\x0e\xdd\xbb\x86j2\xff-\xf3\\S[\xc0\x1a$\xa6t\x04\xd3\x87!\x1f\x9a,'
	app.run(debug = True)

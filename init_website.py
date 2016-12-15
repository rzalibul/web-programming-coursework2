from flask import Flask, abort, render_template, session, redirect, request
import random, string
import csv
import json
import hashlib
from datetime import date, datetime
from collections import OrderedDict

# simple CSV reading
def readCsvFile(filePath):
	with open(filePath, 'r') as inFile:
		reader = csv.reader(inFile)
		aList = [row for row in reader]
	return aList
# find a value in CSV file by using linear search and return the row which is a dictionary; if value is not present, return an empty list
# filePath: specify relative path from this file
# fieldnames: specify field names in form of a list
# field: specify the field for the sought value
# val: specify sought value
# (optional) iterate: specify whether all values should be returned in a list of dictionaries or just the first encountered row
def findCsvRow(filePath, fieldnames, field, val, iterate=False):
	list = []
	with open(filePath, 'r') as inFile:
		reader = csv.reader(inFile)
		for row in reader:
			counter = 0
			field_position = 0
			dict = OrderedDict()
			for item in row:
				dict.update({fieldnames[counter]: item})				# create another entry
				dict.move_to_end(fieldnames[counter])					# and move to the end as OrderedDict doesn't maintain sorted order after changing the already constructed object
				counter += 1
			if field in dict:
				if dict[field] == val:
					if iterate:
						list.append(dict)
					else:
						return dict
	# return the list; if no values were found, the list will be empty
	return list

# replace a row with certain value in the 0th index; if delete is present, the function will only look at the first mapped field to find the record and then delete it
# filePath: specify relative path from this file
# rowReplacement: mapped row of a dictionary that should replace a row with certain value
# fieldnames: specify field names in form of a list
# (optional) delete: specify whether the replace should be delete; set to True to use this mode
def replaceCsvRow(filePath, rowReplacement, fieldnames, delete=False):
	aList = readCsvFile(filePath)
	for index, row in enumerate(aList):
        # safely cast into int to enforce one type
		if row:
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
	if 'isAdmin' in session:
		if session['isAdmin'] == True:
			return True
	if 'username' in session:
		return owner != 'Anonymous' and session['username'] == owner
	else:
		return False
# checks the first element of the two-dimensional list and returns the max value
# list: a list which contains a castable integral value in the first index
def max(list):
	maxVal = 0
	for row in list:
		# proceed if row is not empty
		if row:
			if int(row[0]) > maxVal:
				maxVal = int(row[0])
	return maxVal
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

@app.route('/booking')
def booking():
	approvedBookings = []
	bookingList = []
	bookingPath = "static\\booking.csv"
	fieldNames = ['id', 'name', 'firstName', 'lastName', 'email', 'telNum', 'arrivalDate', 'departureDate', 'submitDate', 'price', 'status']
	isList = False
	if 'username' in session:
		bookingList = findCsvRow(bookingPath, fieldNames, 'name', session['username'], iterate=True)
		# check whether the bookingList is a list or a dictionary (first would imply more than one row, the second - just one row)
		if isinstance(bookingList, list):
			for dict in bookingList:
				for key, dictValue in dict.items():
					if key == 'status':
						if int(dictValue) == 0:
							dict[key] = 'waiting for approval'
						elif int(dictValue) == 1:
							dict[key] = 'request approved'
						else:
							dict[key] = 'request denied'
			isList = True
		else:
			if 'status' in bookingList:
				if int(bookingList['status']) == 0:
					bookingList['status'] = 'waiting for approval'
				elif int(bookingList['status']) == 1:
					bookingList['status'] = 'request approved'
				else:
					bookingList['status'] = 'request denied'
	approvedBookings = findCsvRow(bookingPath, fieldNames, 'status', '1', iterate=True)
	return render_template('booking.html', approvedBookings = approvedBookings, bookingList = bookingList, isList = isList)
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
	
	# format result is present in the csv file (format can be changed if necessary)
	submitDate = date.today().strftime("%Y-%m-%d")
	
	list = readCsvFile(commentsPath)
	# set new entry ID to successor to the maximum value
	id = max(list) + 1
	newEntry = [id, name, comment, rating, submitDate]
	list.append(newEntry)
	writeCsvFile(list, commentsPath)
	# dump data sent in JSON format
	return json.dumps({'status': 'OK', 'id': id, 'author': name, 'comment': comment, 'rating': rating, 'date': submitDate})

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
		row['date'] = datetime.utcnow().strftime("%d %b %Y %H:%M:%S")
		replaceCsvRow(commentsPath, row, fieldNames)
		return json.dumps({'status': 'OK', 'id': row['id'], 'author': row['author'], 'comment': row['comment'], 'rating': row['rating'], 'date': row['date']})
	else:
		abort(401)		# 401 Unauthorised

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
		abort(401)		# 401 Unauthorised
		
# possible refactoring of deleteComment and modifyComment by putting same code into subroutine

# login and register functionality

@app.route('/register', methods=['POST'])
def register():
	usersPath = "static\\users.csv"
	username = request.form['username']
	password = request.form['pwd']
	fieldNames = ['username', 'password', 'permission', 'salt']
	record = findCsvRow(usersPath, fieldNames, 'username', username)
	if not(record):
		# generate random salt; source: https://stackoverflow.com/questions/2030053/random-strings-in-python
		salt = ''.join(random.choice(string.ascii_lowercase) for i in range(8))
		# concatenate to password
		password = salt + password
		h = hashlib.sha256()
		h.update(password.encode('utf-8'))
		password = h.hexdigest()
		newEntry = [username, password, 'user', salt]
		list = readCsvFile(usersPath)
		list.append(newEntry)
		writeCsvFile(list, usersPath)
	return redirect('/')

@app.route('/login', methods=['POST'])
def login():
	usersPath = "static\\users.csv"
	username = request.form['username']
	password = request.form['pwd']
	fieldNames = ['username', 'password', 'permission', 'salt']
	record = findCsvRow(usersPath, fieldNames, 'username', username)
	if record != "":
		# concatenate user-entered password with salt in the file
		password = record['salt'] + password
		h = hashlib.sha256()
		h.update(password.encode('utf-8'))
		# encode the message and output the hex digest
		password = h.hexdigest()
		# check whether hashed values are the same
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
	
@app.route('/estimateBooking', methods=['GET'])
def estimateBooking():
	dailyRate = 60
	arrival = request.args.get('arrDate').split('-')
	departure = request.args.get('depDate').split('-')

	diff = date(int(departure[0]), int(departure[1]), int(departure[2])) - date(int(arrival[0]), int(arrival[1]), int(arrival[2]))
	if diff.days <= 0:
		return json.dumps({'status': 'INVALID'})
	else:
		estimate = dailyRate * diff.days
		return json.dumps({'status': 'OK', 'estimate': estimate})
	
@app.route('/saveBooking', methods=['POST'])
def saveBooking():
    bookingsPath = "static\\booking.csv"
    bookingsList = readCsvFile(bookingsPath)
    id = max(bookingsList) + 1
    if 'username' in session:
        name = session['username']
    else:
        name = "Anonymous"
    submitDate = date.today()
    # retrieve fields and wrap them into a list
    arrival = request.form['arrival']
    departure = request.form['departure']
    str0 = arrival.split('-')
    str1 = departure.split('-')
    arr = date(int(str0[0]), int(str0[1]), int(str0[2]))
    dep = date(int(str1[0]), int(str1[1]), int(str1[2]))
    if (arr - submitDate).days <= 0:
		# 412 Precondition Failed (arrival date must be later than today)
        abort(412)
    diff = dep - arr
    for row in bookingsList:
        if row[10] == '1':					# 10th index = status field, the last one
            str0 = row[6].split('-')		# arrival date from csv in form of a list
            str1 = row[7].split('-')		# departure date from csv in form of a list
            csvDateArr = date(int(str0[0]), int(str0[1]), int(str0[2]))
            csvDateDep = date(int(str1[0]), int(str1[1]), int(str1[2]))
            range0 = csvDateDep - arr		# "can't arrive when someone hasn't departed yet"
            range1 = csvDateArr - dep		# "should depart when someone has an arrival booked"
            if range0.days <= 0 or range1.days <= 0:
                # 412 Precondition Failed (dates are unavailable)
                abort(412)
    if diff.days < 0:
        # 412 Precondition Failed (departure date must be later than arrival)
        abort(412)
    else:
        dailyRate = 60
        price = dailyRate * diff.days
        newEntry = [id, name, request.form['firstname'], request.form['lastname'], request.form['email'], request.form['tel'], arrival, departure, submitDate, price, 0]
		# last element signals booking status
		# 0 = waiting for approval
		# 1 = approved
		# any other value = booking denied
		
        bookingsList.append(newEntry)
		
        writeCsvFile(bookingsList, bookingsPath)
		
        return redirect('/booking')

@app.route('/deleteBooking', methods=['POST'])
def deleteBooking():
	bookingsPath = "static\\booking.csv"
	fieldNames = ['id', 'name', 'firstName', 'lastName', 'email', 'telNum', 'arrivalDate', 'departureDate', 'submitDate', 'price', 'status']
	id = request.form['booking_id']
	row = findCsvRow(bookingsPath, fieldNames, 'id', id)
	print(row)
	if checkPermissions(row['name']) == True:
		replaceCsvRow(bookingsPath, {'id': id}, fieldNames, delete=True)
		return json.dumps({'status': 'OK'})
	else:
		abort(401)			# 401 Unauthorised

# Error Handling (Miguel Greenberg: Flask Web Development, )
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404
@app.errorhandler(401)
def not_authorised(e):
	return render_template('401.html'), 401
@app.errorhandler(412)
def conditions_not_met(e):
	return render_template('412.html'), 412

if __name__ == '__main__':
	# pseudo RNG key for sessions
	app.secret_key = '\x0e\xdd\xbb\x86j2\xff-\xf3\\S[\xc0\x1a$\xa6t\x04\xd3\x87!\x1f\x9a,'
	app.run(debug = True)

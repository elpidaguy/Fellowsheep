# import datetime
from flask import Flask,render_template,request,redirect,session,jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin
from flask_mail import Mail, Message
from flask_uploads import UploadSet, configure_uploads
from random import randint
import hashlib,os
from openpyxl import *
import requests,time
import time
from bson.objectid import ObjectId
import math
from datetime import timedelta
import base64, os
import urllib2
from datetime import datetime
from datetime import date
from operator import itemgetter
from OpenSSL import SSL
from time import gmtime, strftime

app = Flask("__name__")
CORS(app)
app.config["MONGO_DBNAME"] = "mt"
mongo = PyMongo(app)
cardList=[]
context = SSL.Context(SSL.TLSv1_2_METHOD)
context.use_privatekey_file('server.key')
context.use_certificate_file('cert.pem')
# context = SSL.Context(SSL.TLSv1_2_METHOD)
# context.load_cert_chain('cert.crt','server.key')


# @app.route("/uploadtimetable", methods=["POST"])
# def uploadtimetable():
# 	formdata = request.get_json()['fd']
# 	filename =""
# 	target="/upload/timetables"
# 	#branch_selected =  request.form['branch']
# 	for upload in request.files.getlist("file"):
# 		filename = upload.filename
# 		destination = "/".join([target, filename])		
# 		upload.save(destination)
# 		os.remove(destination)
# 	return jsonify({"success":"true","message":"Successfully Uploaded"})


def sortlist(ar):
	# print "befor"
	# print ar
	for i in range(0,len(ar)):
		for j in range(0,len(ar)-i-1):
			a=datetime.strptime(ar[j+1]["date"], "%d-%m-%Y")
			b=datetime.strptime(ar[j]["date"], "%d-%m-%Y")
			#print a,b
			if(b>a):
				temp=ar[j+1]
				ar[j+1]=ar[j]
				ar[j]=temp
				#print 'swap is ',ar[i],ar[j]
	#ar=list(reversed(ar))	
	# print "after"
	# print ar		
	return ar
@app.route('/addApplyleave',methods=['POST'])
def addApplyleave():
	pass
	parent = {}
	parent['staffid'] = request.get_json()['staffid']
	parent['staffname'] = request.get_json()['staffname']
	parent['staffmobile'] = request.get_json()['staffmobile']
	parent['leaveDate'] = datetime.now().strftime ("%d-%m-%Y")
	parent['fromDate'] = request.get_json()['fromDate']
	parent['toDate'] = request.get_json()['toDate']
	parent['totalDays'] = request.get_json()['totalDays']
	parent['reason'] = request.get_json()['reason']
	parent['action_taken'] = ""
	mongo.db.leaves.insert(parent)
	return jsonify({"success":"true","message":"Successfully Applied For Leave! Now Wait till admin replies!"})

@app.route('/leaveaction',methods=['POST'])
def leaveaction():
	pass
	mongo.db.leaves.update_one({"staffid":request.get_json()['staffid'],"leaveDate":request.get_json()['leavedate']},{"$set":{"action_taken":request.get_json()['action']}},upsert=False)
	if request.get_json()['action'] == 0:
		return jsonify({"success":"true","message":"Approved Successfully!!"})
	else:
		return jsonify({"success":"true","message":"Disapproved Successfully!!"})


@app.route('/getLeavelist',methods=['POST'])
def getLeavelist():
	leaves=mongo.db.leaves.find({'action_taken':''},{"_id":False})	
	res = list(leaves)
	#print res
	if len(res):
		return jsonify({"success":"true","leaves":res})
	else:
		return jsonify({"success":"false","message":"No Leaves Pending for Now Found!"})

@app.route('/uploadquestionpaper',methods=['POST'])
def uploadquestionpaper():
	filename =""
	target="upload/questionpapers"
	destination = ''
	for upload in request.files.getlist("file"):
		if not upload.filename.endswith(".pdf"):
			return jsonify({"success":"false","message":"Only PDF Files"})

		filename = str(time.time()).split(".")[0]+"."+upload.filename.split(".")[-1]
		destination = "/".join([target, filename])	
		upload.save(destination)
		#print destination

	return jsonify({"success":"true","qplink":"http://espl.in.net/"+destination})

@app.route('/uploadTimetableportion',methods=['POST'])
def uploadTimetableportion():
	filename =""
	target="upload/timetables"
	destination = ''
	for upload in request.files.getlist("file"):
		if not upload.filename.endswith(".pdf"):
			return jsonify({"success":"false","message":"Only PDF Files"})

		filename = str(time.time()).split(".")[0]+"."+upload.filename.split(".")[-1]
		destination = "/".join([target, filename])	
		print destination
		upload.save(destination)
		#print destination

	return jsonify({"success":"true","ttportion":"http://espl.in.net/"+destination})


@app.route('/uploadTimetable',methods=['POST'])
def uploadTimetable():
	filename =""
	target="upload/timetables"
	destination = ''
	for upload in request.files.getlist("file"):
		if not upload.filename.endswith(".pdf"):
			return jsonify({"success":"false","message":"Only PDF Files"})

		filename = str(time.time()).split(".")[0]+"."+upload.filename.split(".")[-1]
		destination = "/".join([target, filename])	
		print destination
		upload.save(destination)
		#print destination

	return jsonify({"success":"true","ttlink":"http://espl.in.net/"+destination})

@app.route("/uploadTest", methods=["POST"])
def uploadTest():
	qp=request.get_json()
	qp["isDeleted"]="false"
	mongo.db.questionpapers.insert(qp)
	return jsonify({"success":"true","message":"Successfully inserted Question Paper!"})


@app.route("/uploadTestTimetable", methods=["POST"])
def uploadTestTimetable():
	qp=request.get_json()
	qp["isDeleted"]="false"
	mongo.db.testtimetable.insert(qp)
	return jsonify({"success":"true","message":"Successfully inserted Test Timetable!"})
	

# @app.route('/getteachertimetable',methods=['POST'])
def getttimetable(day,teacherid,cityid):
	teachertimetable=[]
	temp={}
	# timetableid="5a18177946465d507dcb61f2"
	# teacherid="59d09c2e46465d5db8e5dfff"
	timetable=mongo.db.newtimetables.find_one({"city":cityid,"date":day,"isDeleted":"false"},{"_id":False});
	if(timetable):
		for batch in timetable["timetable"]:
			for lec in batch["batchtimetable"]:
				temp={}
				if(lec["teacherid"]==teacherid):
					temp=lec
					temp["batch"]=batch["batchName"]
					temp["timeinsecond"]=getsecond(lec["stime"])
					teachertimetable.append(temp)


		sorted(teachertimetable, key=itemgetter('timeinsecond'))
		return teachertimetable
	else:
		return []

@app.route('/getteachertimetable',methods=['POST'])
def getteachertimetable():
	teacherid=request.get_json()["teacherid"]
	cityid=request.get_json()["cityid"]
	tymtable=[]
	temp={}
	temp["date"]=datetime.now().strftime ("%d-%m-%Y")
	temp["day"]="today"
	# temp["timetable"]=getttimetable(datetime.now().strftime ("%d-%b-%y"),"59d09c2e46465d5db8e5dfff","59803742b5f1e7d11cccc592")
	temp["timetable"]=getttimetable(datetime.now().strftime ("%d-%b-%y"),teacherid,cityid)
	tymtable.append(temp)
	temp={}
	to=(datetime.now() + timedelta(days=1))
	#to=to.strftime ("%d-%b-%y")
	temp["date"]=to.strftime ("%d-%b-%y")
	temp["day"]="tommorow"
	temp["timetable"]=getttimetable(to.strftime ("%d-%b-%y"),teacherid,cityid)
	tymtable.append(temp)
	return jsonify({"success":"true","timetable":tymtable})


@app.route('/gettodaystimetable',methods=['POST'])
def gettodaystimetable():
	#print "timetable function starts"
	parent=[]
	cityid=request.get_json()["cityid"]
	#print cityid
	timetable=mongo.db.newtimetables.find({"date":datetime.now().strftime ("%d-%b-%y"),"isDeleted":"false","city":cityid},{"_id":False});
	#print "before error"
	if timetable:
		pass
		timetable=list(timetable)
		temp={}
		temp["day"]="today"
		if len(timetable):
			for t in timetable[0]['timetable']:
				#print t
				if len(t['batchtimetable']):
					t['status']="true"
				else:
					t['status']="false"
			temp["timetable"]=timetable
		parent.append(temp)
	to=(datetime.now() + timedelta(days=1))
	#to=to.strftime ("%d-%b-%y")
	tommorow=to.strftime ("%d-%b-%y")
	tommorowtimetable=mongo.db.newtimetables.find({"date":tommorow,"city":cityid,"isDeleted":"false"},{"_id":False});
	
	if tommorowtimetable:
		temp={}
		temp["day"]="tommorow"
		tymtable=list(tommorowtimetable)
		if(tymtable):
			for t in tymtable[0]['timetable']:
				#print t
				if len(t['batchtimetable']):
					t['status']="true"
				else:
					t['status']="false"
			temp["timetable"]=tymtable
		parent.append(temp)

	to=(datetime.now() + timedelta(days=2))
	#to=to.strftime ("%d-%b-%y")
	tommorow2=to.strftime ("%d-%b-%y")
	dayatommorowtimetable=mongo.db.newtimetables.find({"date":tommorow2,"city":cityid,"isDeleted":"false"},{"_id":False});
	
	if dayatommorowtimetable:
		temp={}
		temp["day"]="dayatommorow"
		dayatymtable=list(dayatommorowtimetable)
		if(dayatymtable):
			for t in dayatymtable[0]['timetable']:
				#print t
				if len(t['batchtimetable']):
					t['status']="true"
				else:
					t['status']="false"
			temp["timetable"]=dayatymtable
		parent.append(temp)

	if len(temp):
		return jsonify({"success":"true","timetable":parent})
	else:
		return jsonify({"success":"false"})
 

def getsecond(t):
	timeinsecond = time.strptime(t, "%I:%M %p")
	timeinsecond=timedelta(hours=timeinsecond.tm_hour, minutes=timeinsecond.tm_min, seconds=timeinsecond.tm_sec).seconds
	return timeinsecond


@app.route('/rpitest',methods=['POST'])
def rpitest():
	print request.get_json()["time"]
 	tym1=request.get_json()["time"]
 	t=mongo.db.tym.find_one({},{"_id":False})
 	tt=t["time"]
 	tt.append(tym1)
 	result = mongo.db.tym.update_one({},{"$set":{"time":tt}},upsert=False)
 	return jsonify({"success":"true","time":t["time"]})
 	


# @app.route('/checkovellaping',methods=['GET'])



# @app.route("/getstaffattendence",methods=["POST"])
# def getstaffattendence():
# 	staffid="59d09c2e46465d5db8e5dfff"

# 	lectures=mongo.db.find({"staffid":staffid}).sort({date:1},{"_id":False})
# 	lectures=list(lectures)
# 	# pass
# 	# formdata = request.get_json()
# 	# city = formdata['city']
# 	# branchName = formdata['branchName']
# 	# course = formdata['course']
# 	# standard = formdata['standard']
# 	# batchName = formdata['batchName']
# 	# time = formdata['time']
# 	# for batch in batchName:
# 	# 	print batch['value']
# 	# 	mongo.db.batches.insert({'city':city,'branchName':branchName,'course':course,'standard':standard,'time':time,'batchName':batch['value']})
# 	# #print batchName[0]['value']
# 	if len(lectures):
# 		return jsonify({"success":"true","lectures":lectures})
# 	else:
# 		return jsonify({"success":"false"})
@app.route('/newgetTimetable',methods=['POST'])
def newgetTimetable():
	if(request.get_json()):
		timetables = mongo.db.newtimetables.find({"_id":ObjectId(request.get_json()['id']),"isDeleted":"false"})
	else:
		timetables = mongo.db.newtimetables.find({"isDeleted":"false"}).sort('_id',-1).limit(50)
	timetables = list(timetables)	
	for timetable in timetables:
		timetable["_id"]=str(timetable["_id"])
		for t in timetable['timetable']:
			if len(t['batchtimetable']):
				t['status']="true"
			else:
				t['status']="false"


		cityname=mongo.db.cities.find({"_id":ObjectId(timetable["city"])})
		cityname=list(cityname)
		timetable["cityname"]=cityname[0]["cityname"]
	if len(timetables):
		return jsonify({"success":"true","timetables":timetables})
	else:
		return jsonify({"success":"false","message":"No schedule Found. Please add it!"})


@app.route('/newcreatetimetable', methods=['POST'])
def newcreatetimetable():
	if request.get_json():
		cityid = request.get_json()['ttCity']
		timetable_date = request.get_json()['ttDate']
		copyDate = request.get_json()['ttCopy']

		if copyDate == "noCopy":
			pass
			batchresult = mongo.db.coursedetails.find({"cityid":cityid},{"_id":False,"batchname":True})
			batchresult = list(batchresult)
			parent={}
			parent["date"]=timetable_date
			parent["city"]=cityid
			timetable=[]
			for batch in batchresult:
				temp={}
				temp["batchName"]=batch['batchname']
				temp["batchtimetable"]=[]
				timetable.append(temp)
			parent["timetable"]=timetable
			parent["isDeleted"]="false"
			result = mongo.db.newtimetables.insert(json.loads(json.dumps(parent)))
		else:
			pass
			ttresult = mongo.db.newtimetables.find({"city":cityid,"date":copyDate},{"_id":False,"timetable":True})
			ttresult = list(ttresult)
			print ttresult[0]['timetable']
			parent={}
			parent["isDeleted"]="false"
			parent["date"] = timetable_date
			parent['city'] = cityid
			parent['timetable'] = ttresult[0]['timetable']
			#print parent
			result = mongo.db.newtimetables.insert(json.loads(json.dumps(parent)))

	if len(parent):
		return jsonify({"success":"true","timetable":parent})
	else:
		return jsonify({"success":"false","message":"No terms Found. Please add it!"})


@app.route('/createtimetable', methods=['POST'])
def createtimetable():
	if request.get_json():
		cityid = request.get_json()['ttCity']
		timetable_date = request.get_json()['ttDate']

		batchresult = mongo.db.coursedetails.find({"cityid":cityid},{"_id":False,"batchname":True})
		batchresult = list(batchresult)
		parent = {}
		parent['date'] = timetable_date
		parent['city'] = cityid

		timetable = list()

		for batches in batchresult:
			batch = {}
			batch['batchname'] = batches['batchname']
			batch['hours'] = list()
			print batch['batchname']
			for i in range(6):
				batchdata={}
				batchdata["stime"]=""
				batchdata["etime"]=""
				batchdata["teacher"]="N/A"
				batchdata['subject']="N/A"
				batchdata["teacherid"]="N/A"				
				batchdata["teachersubject"]="N/A"
				batch['hours'].append(batchdata)
			timetable.append(batch)
		parent['timetable'] = timetable
		parent["isDeleted"]="false"

		result = mongo.db.timetables.insert(json.loads(json.dumps(parent)))

	if len(parent):
		return jsonify({"success":"true","timetable":parent})
	else:
		return jsonify({"success":"false","message":"No terms Found. Please add it!"})

@app.route('/shiftBatch',methods=['POST'])
def shiftBatch():
	fromBatchName=request.get_json()["fromBatchName"]
	toBranchName=request.get_json()["toBranchName"]
	toBranchId=request.get_json()["toBranchId"]
	result = mongo.db.coursedetails.update_one({"batchname":fromBatchName} ,{"$set":{"branchname":toBranchName,"branchid":toBranchId}},upsert=False)
	return jsonify({"success":"true","message":"Batch Shifted successfully!"})

@app.route('/countDashboard', methods=['POST'])
def countDashboard():
	dashCount = {}
	studentCount = mongo.db.student_info.find({"isDeleted":'false'}).count()
	batch = mongo.db.coursedetails.find({}).distinct("batchname")
	batchCount = len(batch)
	branchCount = mongo.db.branches.find({}).count()
	productCount = mongo.db.feestructure.find({}).count()

	dashCount['studentCount'] = studentCount
	dashCount['batchCount'] = batchCount
	dashCount['branchCount'] = branchCount
	dashCount['productCount'] = productCount
	return jsonify({"success":"true","message":"count generated!","dashCount":dashCount})

@app.route('/deletestudent',methods=['POST'])
def deletestudent():
	studid=request.get_json()["studId"]
	result = mongo.db.student_info.update_one({"_id":ObjectId(studid)} ,{"$set":{"isDeleted":"True"}},upsert=False)
	return jsonify({"success":"true","message":"Student Deleted successfully!"})

@app.route('/shiftBatchStudent',methods=['POST'])
def shiftBatchStudent():
	fromBatchName=request.get_json()["fromBatchName"]
	toBranchName=request.get_json()["toBranchName"]
	print fromBatchName
	print toBranchName
	result = mongo.db.student_info.update({"Batch":fromBatchName} ,{"$set":{"Center":toBranchName}},multi=True,upsert=False)
	return jsonify({"success":"true","message":"Students Shifted successfully!"})

@app.route('/chktimetableexist',methods=['POST'])
def chktimetableexist():
	cityid=request.get_json()["ttCity"]
	tdate=request.get_json()["ttDate"]
	timetables = mongo.db.newtimetables.find({"city":cityid,"date":tdate,"isDeleted":"false"},{"_id":False})
	timetables=list(timetables)
	if len(timetables):
		return jsonify({"success":"false","message":"allready exists"})
	else:
		return jsonify({"success":"true"})

def checkovellaping(s1,e1,s2,e2):
	# slot1=["11:05 AM","12:20 PM"]
	# slot2=["1:19 PM","02:00 PM"]
	# #time=datetime.strptime(slot1[0], '%H:%M %p')
	# time1=datetime.strptime(slot1[0], '%I:%M %p').strftime('%I:%M %p')
	# time2=datetime.strptime(slot1[1], '%I:%M %p').strftime('%I:%M %p')

	delta=min(getsecond(e1),getsecond(e2))-max(getsecond(s1),getsecond(s2))
	
	if delta <=0:
		overlap="false"
	
	else:
		overlap="true"


	return overlap


@app.route('/editDailyTimetable',methods=['POST'])
def editDailyTimetable():
	timetables=request.get_json()["timetables"]
	for timetable in timetables[0]["timetable"]:
		for lec in timetable["batchtimetable"]:
			lec["overlap"]="false"

	res="false"
	for teacher in request.get_json()["teacherData2"]:
		for i in range(0,len(teacher)):
			if(i<len(teacher)-1):
				for j in range(i+1,len(teacher)):
					res=checkovellaping(teacher[i]["stime"],teacher[i]["etime"],teacher[j]["stime"],teacher[j]["etime"])
					if res =="true":
						for timetable in timetables[0]["timetable"]:
							for lec in timetable["batchtimetable"]:
								if(lec["teacherid"]==teacher[i]["teacherid"]):
									lec["overlap"]="true"
								if(lec["teacherid"]==teacher[j]["teacherid"]):
									lec["overlap"]="true"

						return jsonify({"success":"true","overlap":"true","timetables":timetables,"message":"Teacher Lecture Timing overlap"})

	if(res=="false"):
		for timetable in timetables[0]["timetable"]:
			for i in range(0,len(timetable["batchtimetable"])):
				for j in range(i+1,len(timetable["batchtimetable"])):
					res=checkovellaping(timetable["batchtimetable"][i]["stime"],timetable["batchtimetable"][i]["etime"],timetable["batchtimetable"][j]["stime"],timetable["batchtimetable"][i]["etime"])
					if(res=="true"):
						timetable["batchtimetable"][i]["overlap"]="true"
						timetable["batchtimetable"][j]["overlap"]="true"
						return jsonify({"success":"true","overlap":"true","timetables":timetables,"message":"Batch Lecture Timing overlap"})

	
	if(res=="false"):
		return jsonify({"success":"true","overlap":"false","timetables":timetables})



@app.route('/updatetimetable',methods=['POST'])
def updatetimetable():
	tt=request.get_json()['timetables'][0]
	print request.get_json()['timetables'][0]['timetable']
	mongo.db.newtimetables.update_one({"_id":ObjectId(tt['_id'])} ,{"$set":{"timetable":tt['timetable']}},upsert=False)
	return jsonify({"success":"true","message":"Update successfully!"})


@app.route('/getTodaysDate',methods=['POST'])
def getTodaysDate():
	todate = datetime.now().date().strftime("%d-%m-%Y")
	return jsonify({"success":"true","todate":todate})

@app.route('/testUserExistence',methods=['POST'])
def testUserExistence():
	staffname=request.get_json()["staffname"]
	usertype=request.get_json()["usertype"]
	exists = mongo.db.userlogins.find({"staffname":staffname,"usertype":usertype,"statusActive":"1","isDeleted":"false"},{"_id":False})

	exist = list(exists)
	if len(exist):
		return jsonify({"success":"true"})
	else:
		return jsonify({"success":"false"})

@app.route('/getCurrentCityName',methods=['POST'])
def getCurrentCityName():
	cityid=request.get_json()["cityid"]
	print cityid
	currentCity = mongo.db.cities.find({"_id":ObjectId(cityid)},{"_id":False})
	currentCity=list(currentCity)
	return jsonify({"success":"true","currentCity":currentCity})

@app.route('/getTimetable',methods=['POST'])
def getTimetable():
	if(request.get_json()):
		timetables = mongo.db.timetables.find({"_id":ObjectId(request.get_json()['id'])})
	else:
		timetables = mongo.db.timetables.find()
	timetables = list(timetables)	
	for timetable in timetables:
		timetable["_id"]=str(timetable["_id"])
		cityname=mongo.db.cities.find({"_id":ObjectId(timetable["city"])})
		cityname=list(cityname)
		timetable["cityname"]=cityname[0]["cityname"]
	if len(timetables):
		return jsonify({"success":"true","timetables":timetables})
	else:
		return jsonify({"success":"false","message":"No schedule Found. Please add it!"})

@app.route('/registeredMobile',methods=['POST'])
def registeredmobile():
	print "in registeredmobile"
	print request.get_json()["mobile"]
	if(request.get_json()["type"]=="Teacher / Staff"):
		
		mobile = mongo.db.staffdetails.find({"mobile":int(request.get_json()["mobile"])})
		#mobile = mongo.db.staffdetails.find({"mobile":9960136918})
		mobile=list(mobile)
		print mobile
		for mo in mobile:
			mo["_id"]=str(mo["_id"]);
		if len(mobile):
	 		return jsonify({"success":"true","staff":mobile})
		else:
	 		return jsonify({"success":"false","message":"No mobile Found!"})
	else:
		print "hello"
		studentlist=[]
		studmobile = mongo.db.student_info.find({"studentMobile":request.get_json()["mobile"],"isDeleted":"false"})
		studmobile=list(studmobile)
		for mo in studmobile:
			mo["_id"]=str(mo["_id"]);
			if mo not in studentlist:
				studentlist.append(mo)
		mommobile = mongo.db.student_info.find({"motherMobile":request.get_json()["mobile"],"isDeleted":"false"})
		mommobile=list(mommobile)
		for mo in mommobile:
			mo["_id"]=str(mo["_id"]);
			if mo not in studentlist:
				studentlist.append(mo)

		dadmobile = mongo.db.student_info.find({"fatherMobile":request.get_json()["mobile"],"isDeleted":"false"})
		dadmobile=list(dadmobile)
		for mo in dadmobile:			
			mo["_id"]=str(mo["_id"]);
			if mo not in studentlist:
				studentlist.append(mo)
		if len(studentlist):
	 		return jsonify({"success":"true","staff":studentlist})
		else:
	 		return jsonify({"success":"false","message":"No mobile Found!"})



#ObjectId("59fc59db46465d01ed9c30fb")


@app.route('/summarypayment',methods=['POST'])
def summarypayment():
	#staffid="59d09c2e46465d5db8e5dfff"
	staffid=request.get_json()["id"]
	print "staffid"
	print staffid
	mode=""
	lectures=mongo.db.staffattendancedetails.find({"staffid":staffid},{"_id":False})
	lectures=list(lectures)
	staffdetails=mongo.db.staffdetails.find({"_id":ObjectId(staffid)},{"_id":False})
	staffdetails=list(staffdetails)
	monthwise=[]
	
	if(len(staffdetails)):
		if(len(staffdetails[0]["salarydetails"])):
			if(staffdetails[0]["salarydetails"]["mode"]=="Contract"):
				mode="Contract"		
				for lec in lectures:
					templist={}
					currentmonth=lec["date"][3:]
					f=0;
					for month in monthwise:

						if(month["month"]==currentmonth):
							month["totalduration"]+=lec["duration"]

							print "present"
							f=1;
							batch=lec["batch"]
							batchdetail=mongo.db.coursedetails.find({"batchname":batch},{"_id":False})
							batchdetail=list(batchdetail)
							for item in staffdetails[0]["salarydetails"]["contractlist"]:
								if(item["std"]==batchdetail[0]["std"] and item["course"]==batchdetail[0]["coursename"]):
									lec["rate"]=item["rate"]

							month["totalpayment"]=month["totalpayment"]+(float(lec["duration"]/60.0)*float(lec["rate"]))
							month["detail"].append(lec)
							break
							#templist["detail"].append(lec)
					if(f==0):
						templist["month"]=currentmonth
						templist["totalduration"]=lec["duration"]
						templist["detail"]=[]
						batch=lec["batch"]
						batchdetail=mongo.db.coursedetails.find({"batchname":batch},{"_id":False})
						batchdetail=list(batchdetail)
						for item in staffdetails[0]["salarydetails"]["contractlist"]:
							if(item["std"]==batchdetail[0]["std"] and item["course"]==batchdetail[0]["coursename"]):
								lec["rate"]=item["rate"]
						print lec
						templist["totalpayment"]=float(lec["rate"])*float(lec["duration"]/60.0)
						templist["detail"].append(lec)
						monthwise.append(templist)
			if(staffdetails[0]["salarydetails"]["mode"]=="Salary"):
				mode="Salary"	
				for lec in lectures:
					templist={}
					currentmonth=lec["date"][3:]
					f=0;
					for month in monthwise:
						if(month["month"]==currentmonth):								
							f=1;
						
					if(f==0):
						templist["month"]=currentmonth
						templist["salary"]=	staffdetails[0]["salarydetails"]["permonthsalary"]				
						monthwise.append(templist)



	if len(monthwise):
	 	return jsonify({"success":"true","payment":monthwise,"mode":mode})
	else:
	 	return jsonify({"success":"false","message":"No mobile Found!"})
	

# @app.route('/paymentcalculation',methods=['POST'])
# def paymentcalculation():
# 	staffid=request.get_json()["id"]
# 	print "staffid"
# 	print staffid
# 	lectures=mongo.db.staffattendancedetails.find({"staffid":staffid},{"_id":False})
# 	lectures=list(lectures)
# 	staffdetails=mongo.db.staffdetails.find({"_id":ObjectId(staffid)},{"_id":False})
# 	staffdetails=list(staffdetails)
	
# 	if(len(staffdetails)):
# 		if(len(staffdetails[0]["salarydetails"])):
# 			if(staffdetails[0]["salarydetails"]["mode"]=="Contract"):		
# 				for lec in lectures:
# 					batch=lec["batch"]
# 					batchdetail=mongo.db.coursedetails.find({"batchname":batch},{"_id":False})
# 					batchdetail=list(batchdetail)
# 					for item in staffdetails[0]["salarydetails"]["contractlist"]:
# 						if(item["std"]==batchdetail[0]["std"] and item["course"]==batchdetail[0]["coursename"]):
# 							lec["rate"]=item["rate"]
# 					print lec
		



# 	if len(lectures):
# 	 	return jsonify({"success":"true","payment":lectures})
# 	else:
# 	 	return jsonify({"success":"false","message":"No mobile Found!"})

@app.route("/getstaffattendance",methods=["POST"])
def getstaffattendance():
	#staffid="59d09c2e46465d5db8e5dfff"
	staffid=request.get_json()["id"]
	lectures=mongo.db.staffattendancedetails.find({"staffid":staffid,"isDeleted":"false"})
	lectures=list(lectures)
	for l in lectures:
		l["_id"]=str(l["_id"])
	if len(lectures):
		return jsonify({"success":"true","lectures":lectures,"message":"successfully"})
	else:
		return jsonify({"success":"false","message":"Something went wrong"})

@app.route("/getemployeeattendance",methods=["POST"])
def getemployeeattendance():
	staffid=request.get_json()["id"]
	lectures=mongo.db.employeeattendancedetails.find({"staffid":staffid})
	lectures=list(lectures)
	for l in lectures:
		l["_id"]=str(l["_id"])
	
	if len(lectures):
		return jsonify({"success":"true","lectures":lectures})
	else:
		return jsonify({"success":"false"})

@app.route("/setData",methods=["POST"])
def setData():
	print "hdj"
	data = request.get_json()["cardno"]
	print data
	return jsonify({"success":"true"})
	# if data=='32114725':
	# 	mongo.db.rfiddetails.insert({'name':'Shubham','time':str(datetime.now())})
	# 	cardList.append('Shubham')

	# if data=='229111155187':
	# 	mongo.db.rfiddetails.insert({'name':'Ankita','time':str(datetime.now())})
	# 	cardList.append('Ankita')
	
	
	# return data

@app.route("/getCards",methods=["POST"])
def getcardsNo():
	cardlist = mongo.db.rfiddetails.find({})
	cardlist = list(cardlist)
	for card in cardlist:
		card["_id"] = str(card["_id"])
		
	card = list(cardlist)
 
	return jsonify({"success":"true","list":card})
	 
	 
	 
@app.route("/transferStudent",methods=["POST"])
def transferStudent():
	print "inside transferStudent"
	print request.get_json()['RollNo']
	mongo.db.student_info.update_one({"_id":ObjectId(request.get_json()['id'])} ,{"$set":{"Center":request.get_json()['Center'],"Batch":request.get_json()['Batch'],"RollNo":int(request.get_json()['RollNo'])}},upsert=False)
	return jsonify({"success":"true","message":"Student Transfer successfully!"})

@app.route("/getTotalRollNumbers",methods=['POST'])
def getTotalRollNumbers():
	count = mongo.db.student_info.find({"Batch": request.get_json()['Batch']}).count()
	#count = list(count)
	return jsonify({"success":"true","totalcount":count})

@app.route('/createpdf',methods=['POST'])
def createpdf():
	data = request.get_json()["pdfdata"]
	name=request.get_json()["pdfname"]
	folder=request.get_json()["foldername"]
	file_path = "pdf/directory"
	directory = os.path.dirname(file_path)

	try:
		os.mkdir("pdf/"+str(folder))
	except:
		print "allready present"    
	
	print ('pdf/'+str(folder)+"/"+str(name)+'.pdf')
	with open(os.path.expanduser('pdf/'+str(folder)+"/"+str(name)+'.pdf'), 'wb') as fout:
		fout.write(base64.decodestring(data))	
	if 1:
	 	return jsonify({"success":"true"})
	else:
	 	return jsonify({"success":"false","message":"No Batches Found. Please Add Batch!"})

@app.route("/addBatch",methods=["POST"])
def addBatch():
	pass
	formdata = request.get_json()
	city = formdata['city']
	branchName = formdata['branchName']
	course = formdata['course']
	standard = formdata['standard']
	batchName = formdata['batchName']
	time = formdata['time']
	for batch in batchName:
		print batch['value']
		mongo.db.batches.insert({'city':city,'branchName':branchName,'course':course,'standard':standard,'time':time,'batchName':batch['value']})
	#print batchName[0]['value']
	return jsonify({"success":"true","message":"Added Successfully"})

@app.route('/getBatches',methods=['POST'])
def getBatches():
	batches = mongo.db.coursedetails.find({})
	batches = list(batches)
	for batch in batches:
		batch["_id"] = str(batch["_id"])
	batch = list(batches)
	if len(batch):
	 	return jsonify({"success":"true","batches":batch})
	else:
	 	return jsonify({"success":"false","message":"No Batches Found. Please Add Batch!"})
#=================

@app.route('/createSyllabus',methods=['POST'])
def createSyllabus():
	syllabus=request.get_json()
	syllabus["syllabus"]={"subject":[]}
	syllabus["isDeleted"]="false"
	mongo.db.syllabus.insert(syllabus)	
	return jsonify({"success":"true","message":"syllabus created successfully"})

@app.route('/getSyllabus',methods=['POST'])
def getSyllabus():
	if request.get_json():
		syllabus=mongo.db.syllabus.find({"_id":ObjectId(request.get_json()["id"]),"isDeleted":"false"})
	else:
		syllabus=mongo.db.syllabus.find({"isDeleted":"false"})
	syllabus=list(syllabus)
	for s in syllabus:
		s["_id"] = str(s["_id"])
	if len(syllabus):
		return jsonify({"success":"true","syllabus":syllabus})
	else:
		return jsonify({"success":"false","message":"no syllabus found"})

@app.route('/updatesyllabus',methods=['POST'])
def updatesyllabus():
	schedule=request.get_json()['syllabus'][0]
	mongo.db.syllabus.update_one({"_id":ObjectId(schedule['_id'])} ,{"$set":{"syllName":schedule['syllName'],"syllabus":schedule['syllabus'],"syllyear":schedule['syllyear']}},upsert=False)
	return jsonify({"success":"true","message":"Update successfully!"})


@app.route('/getsyllabusname',methods=['POST'])
def getsyllabusname():
	syllabusname= mongo.db.syllabus.find({"isDeleted":"false"},{"syllName":True,"syllyear":True,"_id":False})
	syllabusname=list(syllabusname)    
	if len(syllabusname):
		return jsonify({"success":"true","syllabusname":syllabusname})
	else:
		return jsonify({"success":"false","message":"No syllabus Found. Please Add syllabus!"})


# @app.route('/getsubjectforbatches',methods=['POST'])
# def getsubjectforbatches():
# 	#noty4aws
# 	subjects = mongo.db.dailyreport.find({"batch":request.get_json()["batch"]})
# 	subjects=list(subjects)
# 	subject=[]
# 	if len(subjects):
# 		for s in subjects[0]["syllabusdetails"]["syllabus"]["subject"]:
# 			subject.append(s["subject"])

# 	if len(subjects):
# 	 	return jsonify({"success":"true","subjects": subject})
# 	else:
# 	 	return jsonify({"success":"false","message":"No subjects Found. Please Add subjects!"})
@app.route('/getsubjectforbatches',methods=['POST'])
def getsubjectforbatches():
	syllid = mongo.db.newdailyreport.find_one({"batch":request.get_json()["batch"],"isDeleted":"false"},{"syllid":True})
	subjects = mongo.db.syllabus.find({"_id":ObjectId(syllid["syllid"])},{"_id":False})
	subjects=list(subjects)
	subject=[]
	subject=[]
	if len(subjects):
		for s in subjects[0]["syllabus"]["subject"]:
			subject.append(s["subject"])

	if len(subjects):
	 	return jsonify({"success":"true","subjects": subject})
	else:
	 	return jsonify({"success":"false","message":"No subjects Found. Please Add subjects!"})

@app.route('/gettopicsforsubject',methods=['POST'])
def gettopicsforsubject():
	#noty4aws
	syllid = mongo.db.newdailyreport.find_one({"batch":request.get_json()["batch"],"isDeleted":"false"},{"syllid":True})
	subjects = mongo.db.syllabus.find({"_id":ObjectId(syllid["syllid"])},{"_id":False})
	subjects=list(subjects)
	subject=[]
	subject=[]
	if len(subjects):
		for s in subjects[0]["syllabus"]["subject"]:
			if (s["subject"]==request.get_json()["subject"]):
				#print s["subject"]
				topics=s["topic"]
	if len(subjects):
	 	return jsonify({"success":"true","topics": topics})
	else:
	 	return jsonify({"success":"false","message":"No subjects Found. Please Add subjects!"})

# @app.route('/gettopicsforsubject',methods=['POST'])
# def gettopicsforsubject():
# 	#noty4aws
# 	subjects = mongo.db.dailyreport.find({"batch":request.get_json()["batch"]})
# 	subjects=list(subjects)
# 	topics=[]
# 	if len(subjects):
# 		for s in subjects[0]["syllabusdetails"]["syllabus"]["subject"]:
# 			if (s["subject"]==request.get_json()["subject"]):
# 				#print s["subject"]
# 				topics=s["topic"]
# 	if len(subjects):
# 	 	return jsonify({"success":"true","topics": topics})
# 	else:
# 	 	return jsonify({"success":"false","message":"No subjects Found. Please Add subjects!"})

@app.route('/createdailyreport',methods=['POST'])
def createdailyreport():

	dr={}
	dr["batch"]=request.get_json()["syllBatch"]
	dr["syllabusname"]=request.get_json()["syllName"]
	dr["syllyear"]=request.get_json()["syllyear"]

	syllabus= mongo.db.syllabus.find_one({"syllName":request.get_json()["syllName"],"syllyear":request.get_json()["syllyear"],"isDeleted":"false"})
	syllabus["_id"]=str(syllabus["_id"])
	dr["syllid"]=syllabus["_id"]
	dr["isDeleted"]="false"

	mongo.db.newdailyreport.insert(dr)	
	if len(syllabus):
		return jsonify({"success":"true"})
	else:
		return jsonify({"success":"false","message":"No syllabus Found. Please Add syllabus!"})

# @app.route('/createdailyreport',methods=['POST'])
# def createdailyreport():
# 	# syllabusname="SSC SEMI 10th"
# 	# syllyear="2017-2018"
# 	# batch="Volcano"
# 	syllabusname=request.get_json()["syllName"]
# 	syllyear=request.get_json()["syllyear"]
# 	batch=request.get_json()["syllBatch"]
# 	syllabus= mongo.db.syllabus.find({"syllName":syllabusname,"syllyear":syllyear,})
# 	syllabus=list(syllabus)
# 	for s in syllabus:
# 		s["syllid"] = str(s["_id"]) 
# 		del s["_id"]  
# 	dailyreport={};
# 	dailyreport["batch"]=batch
# 	dailyreport["syllabusdetails"]=syllabus[0]
# 	one_topic_max_lecture=[]
# 	temp={"hours":[],"teacherlist":[],"lecrecord":[]};
# 	for i in xrange(1,36):
# 		pass
# 		one_topic_max_lecture.append("")
# 	for sub in syllabus[0]["syllabus"]['subject']:
# 		for topic in sub["topic"]:
# 			temp["hours"].append("")
# 			temp["teacherlist"].append("")
# 			temp["lecrecord"].append(one_topic_max_lecture)

# 	dailyreport["lecturedetails"]=temp
# 	mongo.db.dailyreport.insert(dailyreport)	
# 	if len(syllabus):
# 		return jsonify({"success":"true"})
# 	else:
# 		return jsonify({"success":"false","message":"No syllabus Found. Please Add syllabus!"})

@app.route('/editdailyreport',methods=['POST'])
def editdailyreport():
	dailyreport=request.get_json()['dailyreport'][0]
	mongo.db.schedules.update_one({"_id":ObjectId(dailyreport['_id'])} ,{"$set":{"lecturedetails":dailyreport['lecturedetails']}},upsert=False)
	return jsonify({"success":"true","message":"Update successfully!"})

@app.route('/getdailyreport',methods=['POST'])
def getdailyreport():
	if(request.get_json()):
		dailyreport=mongo.db.dailyreport.find({"_id":ObjectId(request.get_json()['id'])})
	else:
		dailyreport=mongo.db.dailyreport.find({})
	dailyreport = list(dailyreport)	
	for daily in dailyreport:
		print "hello"
		daily["_id"]=str(daily["_id"])

	if len(dailyreport):
		return jsonify({"success":"true","dailyreport":dailyreport})
	else:
		return jsonify({"success":"false","message":"No dailyreport Found. Please add it!"})

@app.route('/getnewdailyreport',methods=['POST'])
def getnewdailyreport():
	fd=[]
	if(request.get_json()):		
		dr={}
		dailyreport=mongo.db.newdailyreport.find_one({"_id":ObjectId(request.get_json()['id'])},{"_id":False})
		dr["batch"]=dailyreport["batch"]
		dr["syllabusdetails"]=mongo.db.syllabus.find_one({"_id":ObjectId(dailyreport["syllid"])},{"_id":False})
		one_topic_max_lecture=[]
		lectures=mongo.db.staffattendancedetails.find({"batch":dr["batch"]},{"_id":False,"date":True,"staffid":True,"topic":True,"duration":True})
		lectures=list(lectures)
		temp={"teacherlist":[],"lecrecord":[]};		
		idx=0
		for sub in dr["syllabusdetails"]["syllabus"]['subject']:
			subname=sub["subject"]
			tp=[]
			t=[]
			for topic in sub["topic"]:
				temp["lecrecord"].append([])
				temp["teacherlist"].append([])
				topicname=topic["topicname"]
				lec =[]
				for ll in lectures:					
					if(ll["topic"]==topicname):
						lec.append(ll)
				templec={}
				for l in lec:
					if(l['duration']-60>20):
							templec=l
							templec["duration"]=l["duration"]-60
							lec.append(l)
				lec=sortlist(lec)
				staff=[]
				for l in lec:
					if l["staffid"] not in staff:
						staff.append(l["staffid"])

				newlec=lec
				for l in range(len(lec),20):
					newlec.append({"date":"","topic":topicname})

				tp.append(newlec)
				tname=""
				for i in range(0,len(staff)):
					sd=mongo.db.staffdetails.find_one({"_id":ObjectId(staff[i])},{"_id":False,"fname":True,"lname":"True"})
					if(i==0):
						tname=tname+sd["fname"]+" " +sd["lname"]+""
					else:
						tname=tname+","+sd["fname"]+" " +sd["lname"]+""			


				t.append(tname)
			temp["teacherlist"][idx]=t
			temp["lecrecord"][idx]=tp
			idx=idx+1
				
		dr["lecturedetails"]=temp
		fd.append(dr)
	# fd=[]
	# if(request.get_json()):		
	# 	dr={}
	# 	dailyreport=mongo.db.newdailyreport.find_one({"_id":ObjectId(request.get_json()['id'])},{"_id":False})
	# 	dr["batch"]=dailyreport["batch"]
	# 	dr["syllabusdetails"]=mongo.db.syllabus.find_one({"_id":ObjectId(dailyreport["syllid"])},{"_id":False})
	# 	one_topic_max_lecture=[]
	# 	temp={"teacherlist":[],"lecrecord":[]};		
	# 	idx=0
	# 	for sub in dr["syllabusdetails"]["syllabus"]['subject']:
	# 		subname=sub["subject"]
	# 		tp=[]
	# 		t=[]
	# 		for topic in sub["topic"]:
	# 			temp["lecrecord"].append([])
	# 			temp["teacherlist"].append([])
	# 			topicname=topic["topicname"]
	# 			lec =[]
	# 			lec=mongo.db.staffattendancedetails.find({"topic":topicname,"subject":subname,"batch":dr["batch"]},{"_id":False,"date":True,"staffid":True,"topic":True,"duration":True})
	# 			lec=list(lec)
	# 			print lec
	# 			templec={}
	# 			for l in lec:
	# 				if(l['duration']-60>20):
	# 						templec=l
	# 						templec["duration"]=l["duration"]-60
	# 						lec.append(l)
	# 			lec=sortlist(lec)
	# 			staff=[]
	# 			for l in lec:
	# 				if l["staffid"] not in staff:
	# 					staff.append(l["staffid"])

	# 			newlec=lec
	# 			for l in range(len(lec),20):
	# 				newlec.append({"date":"","topic":topicname})

	# 			tp.append(newlec)
	# 			tname=""
	# 			for i in range(0,len(staff)):
	# 				sd=mongo.db.staffdetails.find_one({"_id":ObjectId(staff[i])},{"_id":False,"fname":True,"lname":"True"})
	# 				if(i==0):
	# 					tname=tname+sd["fname"]+" " +sd["lname"]+""
	# 				else:
	# 					tname=tname+","+sd["fname"]+" " +sd["lname"]+""			


	# 			t.append(tname)
	# 		temp["teacherlist"][idx]=t
	# 		temp["lecrecord"][idx]=tp
	# 		idx=idx+1
				
	# 	dr["lecturedetails"]=temp
	# 	fd.append(dr)

	else:

		temp={}
		dailyreport=mongo.db.newdailyreport.find({"isDeleted":"false"})
		dailyreport = list(dailyreport)	
		for daily in dailyreport:

			print "hello"
			temp={}
			daily["_id"]=str(daily["_id"])
			temp["_id"]=daily["_id"]
			temp["batch"]=daily["batch"]
			temp["syllabusdetails"]=mongo.db.syllabus.find_one({"isDeleted":"false","_id":ObjectId(daily['syllid'])},{"syllName":True,"syllyear":True,"_id":False})
			fd.append(temp)

	if len(fd):
		return jsonify({"success":"true","dailyreport":fd})
	else:
		return jsonify({"success":"false","message":"No dailyreport Found. Please add it!"})



@app.route("/addcity",methods=["POST"])
def addcity():
	cityname = request.get_json()["cityname"]
	district = request.get_json()["district"]
	state = request.get_json()["state"]	
	mongo.db.cities.insert({"cityname":cityname,"district":district,"state":state})	
	return jsonify({"success":"true","message":"Added Successfully"})

@app.route('/getcities',methods=['GET'])
def getcities():
	cities = mongo.db.cities.find({})
	cities = list(cities)
	for city in cities:
		city["_id"] = str(city["_id"])
	city = list(cities)
	if len(city):
	 	return jsonify({"success":"true","cities":city})
	else:
	 	return jsonify({"success":"false","message":"No City Found. Please add City!"})



@app.route('/getstaffnames',methods=['POST'])
def getstaffnames():
	staff = mongo.db.staffdetails.find({},{"fname":True,"lname":True,"_id":False})
	staffs = list(staff)
	names=[]
	for staff in staffs:
		names.append(staff['fname']+" "+staff['lname']);
	if len(staffs):
	 	return jsonify({"success":"true","staffs":names})
	else:
	 	return jsonify({"success":"false","message":"No Staff Found!"})	 	


@app.route('/getsubjects',methods=['POST'])
def getsubjects():
	pass
	subjId = request.get_json()["id"]

	subject = mongo.db.staffdetails.find({"_id":ObjectId(subjId)},{"subject":True,"_id":False})
	subjects = list(subject)

	subjectlist = list(subjects)
	if len(subjectlist):
	 	return jsonify({"success":"true","subjectlist":subjectlist})
	else:
	 	return jsonify({"success":"false","message":"No Subject Found!"})

@app.route('/addcityadmin',methods=['POST'])
def addcityadmin():
	pass
	email = request.get_json()["email"]
	mobile = request.get_json()["mobile"]
	username = request.get_json()["username"]	
	cityid=request.get_json()["cityid"]
	mongo.db.cityadmin.insert({"email":email,"mobile":mobile,"username":username,"cityid":cityid})	
	return jsonify({"success":"true","message":"Added Successfully"})

@app.route('/getcityadmin',methods=['POST'])
def getcityadmin():
	cityadmins = mongo.db.cityadmin.find({})
	admins = list(cityadmins)
	for admin in admins:
		admin["_id"] = str(admin["_id"])
		city = mongo.db.cities.find_one({"_id":ObjectId(admin["cityid"])},{"_id":False})
		for k,v in city.items():
			admin[k] = v
	admin = list(admins)
	if len(admin):
	 	return jsonify({"success":"true","admins":admin})
	else:
	 	return jsonify({"success":"false","message":"No admin Found. Please add City admin!"})

@app.route('/addbranch',methods=['POST'])
def addbranch():
	pass
	branchname = request.get_json()["branchname"]
	address = request.get_json()["address"]	
	contact=request.get_json()["contact"]
	cityid=request.get_json()["cityid"]
	mongo.db.branches.insert({"branchname":branchname,"address":address,"contact":contact,"cityid":cityid})	
	return jsonify({"success":"true","message":"Branch Added Successfully"})
#================
@app.route('/getallbranches',methods=['POST'])
def getallbranches():
	
	if request.get_json():
		cityid = request.get_json()["cityid"]
		allbranches = mongo.db.branches.find({"cityid":str(cityid)})
	else:
		allbranches = mongo.db.branches.find({})
	branches = list(allbranches)
	for branch in branches:
		branch["_id"] = str(branch["_id"])
		city = mongo.db.cities.find_one({"_id":ObjectId(branch["cityid"])},{"_id":False})
		for k,v in city.items():
			branch[k] = v
	branch = list(branches)
	if request.get_json():
		return jsonify({"success":"true","branches":branch,"cityid":request.get_json()["cityid"]})
	if len(branch):
		return jsonify({"success":"true","branches":branch})
	else:
		return jsonify({"success":"false","message":"No branch Found. Please add branch!"})

@app.route('/addbranchadmin',methods=['POST'])
def addbranchadmin():
	pass
	email = request.get_json()["email"]
	mobile = request.get_json()["mobile"]
	username = request.get_json()["username"]	
	branchid=request.get_json()["branchid"]
	mongo.db.branchadmin.insert({"email":email,"mobile":mobile,"username":username,"branchid":branchid})	
	return jsonify({"success":"true","message":"Branch Admin Added Successfully"})

@app.route('/getallbranchadmin',methods=['POST'])
def getallbranchadmin():
	allbranchadmins = mongo.db.branchadmin.find({})
	branchadmins = list(allbranchadmins)
	for branchadmin in branchadmins:
		branchadmin["_id"] = str(branchadmin["_id"])
		branch = mongo.db.branches.find_one({"_id":ObjectId(branchadmin["branchid"])},{"_id":False})
		for k,v in branch.items():
			branchadmin[k] = v
		city = mongo.db.cities.find_one({"_id":ObjectId(branchadmin["cityid"])},{"_id":False})
		for k,v in city.items():
			branchadmin[k] = v
	branchadmin = list(branchadmins)
	if len(branchadmin):
	 	return jsonify({"success":"true","branchadmins":branchadmin})
	else:
	 	return jsonify({"success":"false","message":"No branch Admin Found. Please add branch admin!"})



@app.route('/deletecity',methods=['POST'])
def deletecity():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.cities.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":"true","message":"City Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" sorry city not deleted!"})



@app.route('/deletecityadmin',methods=['POST'])
def deletecityadmin():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.cityadmin.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":"true","message":"City Admin Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":"Sorry City Admin Not Deleted"})


@app.route('/deletebranch',methods=['POST'])
def deletebranch():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.branches.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":"true","message":"Branch Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":"Sorry Branch Not deleted!"})

@app.route('/deletebranchadmin',methods=['POST'])
def deletebranchadmin():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.branchadmin.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":"true","message":"Branch Admin Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":"Something is wrong!"})

@app.route('/deletefeestructure',methods=['POST'])
def deletefeestructure():
	id_to_delete = request.get_json()["fee_id"]
	try:
		mongo.db.feestructure.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":"true","message":"Fee Structure Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry Fee Structure not deleted!"})

@app.route('/deleteschedule',methods=['POST'])
def deleteschedule():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.schedules.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":"true","message":"Schedule Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/deletestaff',methods=['POST'])
def deletestaff():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.staffdetails.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)	
		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/deleteattendance',methods=['POST'])
def deleteattendance():
	id_to_delete = request.get_json()["id"]
	try:
		#mongo.db.staffdetails.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)
		mongo.db.staffattendancedetails.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)

		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Something went wrong ! Failed To Delete"})


@app.route('/deletetest',methods=['POST'])
def deletetest():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.questionpapers.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)	
		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/deleteresult',methods=['POST'])
def deleteresult():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.studenttestresult.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)	
		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/deleteenquiry',methods=['POST'])
def deleteenquiry():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.student_info.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)	
		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/deletesyllabus',methods=['POST'])
def deletesyllabus():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.syllabus.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)	
		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/deletetimetable',methods=['POST'])
def deletetimetable():
	id_to_delete = request.get_json()["id"]
	try:
		mongo.db.newtimetables.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)	
		return jsonify({"success":"true","message":"Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":" Sorry ! Failed To Delete"})

@app.route('/updatecity',methods=['POST'])
def updatecity():
	cityname = request.get_json()["cityname"]
	district = request.get_json()["district"]
	state = request.get_json()["state"]	
	cityid = request.get_json()["cityid"]	
	
	mongo.db.cities.update_one({"_id":cityid} ,{"$set":{"cityname":cityname}},upsert=False)
	return jsonify({"success":"true","message":" Updated Successfully "})

@app.route('/getfeestructure',methods=['POST'])
def getfeestructure():
	if len(request.get_json()):
		feeinfo = mongo.db.feestructure.find(request.get_json())

	# if len(request.get_json())>=2:
	# 	print "in getfeestructure"
	# 	print request.get_json()
	# 	feeinfo = mongo.db.feestructure.find(request.get_json())
	# else:
	# 	board = request.get_json()["board"]
	# 	feeinfo = mongo.db.feestructure.find({"board":board})
	
	
	fees = list(feeinfo)
	for fee in fees:
		fee["_id"]=str(fee["_id"])

	
	if len(fees):
	 	return jsonify({"success":"true","fees":fees})
	else:
	 	return jsonify({"success":"false","message":"Fee Structure Not Present"})

@app.route('/getschoolstudlist',methods=['POST'])
def getschoolstudlist():
	if request.get_json():
		schoolName=request.get_json()["schoolname"]
		batchid=request.get_json()['batchid']
		data = mongo.db.student_info.find({"batchid":str(batchid),"schoolName":schoolName,"admitStatus":"1"})
		studedata = list(data)
		for stud in studedata:
			stud["_id"]=str(stud["_id"])

	if studedata:
		return jsonify(
			{"success": "true", "message": "Showing Admitted List!", "studentList": studedata})
	else:
		return jsonify({"success": "false", "message": "School Not Found"})


@app.route('/getfeedata',methods=['POST'])
def getfeedata():
	productid = request.get_json()["id"]
	feeinfo = mongo.db.feestructure.find({"_id":ObjectId(str(productid))})	
	fees = list(feeinfo)
	fees[0]["_id"]=str(fees[0]["_id"])	
	if len(fees):
	 	return jsonify({"success":"true","fees":fees[0]})
	else:
	 	return jsonify({"success":"false","message":"Fee Structure Not Present"})


@app.route('/FeeStructure', methods=["POST"])
def FeeStructure():
	productid=request.get_json()["id"]
	feeStructure = mongo.db.feestructure.find({"_id":ObjectId(str(productid))},{"_id":False})
	feeStructureList = []
	dates=[]
	temp=[]
	for fee in feeStructure:
		feeStructureList.append(fee)
	
	startinfo=feeStructureList[0]['start_date'].split("/")
	

	d=date(int(startinfo[1]),int(startinfo[0]),1)
	curdate=d.strftime("1-%B-%Y")
	temp.append(d.strftime("%B-%Y"))	
	temp.append(int(feeStructureList[0]['discount']))
	temp.append(int(feeStructureList[0]['fees'])-(temp[1]*int(feeStructureList[0]['fees']))/100)
	temp.append((int(feeStructureList[0]['tax'])*temp[2])/100)
	temp.append(temp[2]+temp[3])

	dates.append(temp)
	endinfo=feeStructureList[0]['end_date'].split("/")
	d=date(int(endinfo[1]),int(endinfo[0]),1)
	enddate=d.strftime("1-%B-%Y")
	stardis=int(feeStructureList[0]['discount'])
	while(curdate!=enddate):
		temp=list()
		if stardis<=0:
			stardis=0
		else:

			stardis=stardis-1
		tempdate=datetime.strptime(curdate, '%d-%B-%Y').date()
		month = tempdate.month - 1 + 1
		year = int(tempdate.year + month / 12 )
		month = month % 12 + 1
		curdate=date(year,month,1)
		temp.append(curdate.strftime("%B-%Y"))	
		temp.append(stardis)
		temp.append(int(feeStructureList[0]['fees'])-(temp[1]*int(feeStructureList[0]['fees']))/100)
		temp.append((float(feeStructureList[0]['tax'])*temp[2])/100)
		temp.append(round(temp[2]+temp[3]))
		dates.append(temp)
		curdate=curdate.strftime("1-%B-%Y")
	
	return jsonify({"success":"true","message":"Successfully Fetched","fee_structure":feeStructureList,"date":dates})


@app.route('/updateinfo',methods=['POST'])
def updateinfo():

	xyz=request.get_json()
	return jsonify({"success":"true","result":xyz})


@app.route('/updatefeeinfo',methods=['POST'])
def updatefeeinfo():
	
	idtoupdate =  request.get_json()["_id"]
	del request.get_json()["_id"]
	mongo.db.feestructure.update_one({"_id":ObjectId(idtoupdate)} ,{"$set":request.get_json()},upsert=True)
	return jsonify({"success":"true","message":"Updated Successfully Added"})

@app.route("/demo",methods=["GET"])
def demo():
	return jsonify({"success":"true"})

@app.route('/accountsdoLogin', methods=['POST'])
def accountsdoLogin():
	formdata = request.get_json()
	print formdata
	result = mongo.db.userlogins.find({"username":formdata['username'],"password":formdata['password'],"usertype":"2","statusActive":"1","isDeleted":"false"})
	newResult = list(result)
	print newResult
	for nres in newResult:
		nres["_id"]=str(nres["_id"])
	print newResult
	if len(newResult):
		return jsonify({"success": "true", "message": "Login Successfull!", "data":newResult})
	else:
		return jsonify({"success": "false", "message": "Username/Password is incorrect!"})

@app.route('/doLogin', methods=['POST'])
def doLogin():
	formdata = request.get_json()
	result = mongo.db.userlogins.find({"username":formdata['username'],"password":formdata['password'],"statusActive":"1","isDeleted":"false"})
	newResult = list(result)
	for nres in newResult:
		nres["_id"]=str(nres["_id"])
	if len(newResult):
		return jsonify({"success": "true", "message": "Login Successfull!", "data":newResult})
	else:
		return jsonify({"success": "false", "message": "Username/Password is incorrect!"})


@app.route('/getEnquiryStudentList', methods=['POST'])
def getEnquiryStudentList():
	cityid = request.get_json()["cityid"]
	data = mongo.db.student_info.find({"admitStatus": 0,"cityid":cityid,"isDeleted":"false"})
	studedata = list(data)
	for stud in studedata:
		cityname=[]
		staffname=[]
		stud["_id"]=str(stud["_id"])
		#print datetime.strptime(stud["enqDate"], '%d-%m-%Y').strftime('%b-%Y')
		stud["enqDate_filter"]=datetime.strptime(stud["enqDate"], '%d-%m-%Y').strftime('%b-%Y')
		stud["fullname"]=str(stud["firstName"])+" "+str(stud["middleName"])+" "+str(stud["lastName"])
		
		cityname= mongo.db.cities.find({"_id":ObjectId(str(stud["cityid"]))}).distinct("cityname")
		if len(cityname):
			stud["cityname"]=cityname[0]
		staffname= mongo.db.userlogins.find({"_id":ObjectId(str(stud["enquiredBy"]))}).distinct("staffname")
		if len(staffname):
			stud["enquiryperson"]=staffname[0]

		
   	if len(studedata):
		return jsonify(
			{"success": "true", "message": "Showing Enquiry List!", "enquiryList": studedata})
	else:
		return jsonify({"success": "false", "message": "Students Not Found"})

# @app.route('/getStudentInfo', methods=['POST'])
# def getStudentInfo():
# 	idi = request.get_json()["id"]
# 	data = mongo.db.student_info.find({"_id":ObjectId(str(idi))})
# 	studedata = list(data)
# 	print studedata
# 	studedata[0]["_id"]=str(studedata[0]["_id"])
# 	# print studedata[0]['batchid']
# 	# for stud in studedata:
# 	# 	stud["_id"]=str(stud["_id"])
# 	# 	print stud['batchid']
# 	batchname = mongo.db.batches.find({"_id": ObjectId(studedata[0]['batchid'])})
# 	batchname[0]["_id"]=str(batchname[0]["_id"])
# 	print batchname[0]['batchName']
# 	if studedata:
# 		return jsonify(
# 			{"success": "true", "message": "Showing Student Info!", "studentData": studedata,"batch":batchname[0]['batchName']})
# 	else:
# 		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

@app.route('/getStudentInfo', methods=['POST'])
def getStudentInfo():
	idi = request.get_json()["id"]
	data = mongo.db.student_info.find({"_id":ObjectId(str(idi))})
	#print idi
	studentattendance = mongo.db.studentattendance.find({"attendancemarked._id":idi})
	studentattendance = list(studentattendance)
	studattendance = []
	for att in studentattendance:
		#if att["attendancemarked"]["_id"]== idi:
		for st in att["attendancemarked"]:
			if st["_id"] == idi:
				#print st
				st["topic"] = att["topic"]
				st["batch"] = att["batch"]
				st["staffselected"] = att["staffselected"]
				st["starttime"] = att["starttime"]
				st["endtime"] = att["endtime"]
				st["subject"] = att["subject"]
				st["date"] = att["date"]
				studattendance.append(st)

	
	studedata = list(data)
	#print studedata
	studedata[0]["_id"]=str(studedata[0]["_id"])
	# print studedata[0]['batchid']
	# for stud in studedata:
	# 	stud["_id"]=str(stud["_id"])
	# 	print stud['batchid']
	# batchname = mongo.db.batches.find({"Batch": ObjectId(studedata[0]['Batch'])})
	# batchname[0]["_id"]=str(batchname[0]["_id"])
	# print batchname[0]['batchName']
	if studedata:
		# return jsonify(
		# 	{"success": "true", "message": "Showing Student Info!", "studentData": studedata,"batch":request.get_json()["batchname"],"attendance":studattendance})
		return jsonify(
			{"success": "true", "message": "Showing Student Info!", "studentData": studedata,"attendance":studattendance})
	else:
		return jsonify({"success": "false", "message": "Student Not Found"})

@app.route('/getstudentslistforattendance', methods=['POST'])
def getstudentslistforattendance():
	if request.get_json():
		if request.get_json()["batch"]=="true":
			batchname = request.get_json()["batchname"]
			data = mongo.db.student_info.find({"Batch":str(batchname)},{"firstName":True,
		"middleName":True,
		"lastName":True,
		"RollNo":True,
		"studentMobile":True,
		"_id":True})
		else:
			idi = request.get_json()["id"]
			data = mongo.db.student_info.find({"_id":ObjectId(str(idi))},{"firstName":True,
		"middleName":True,
		"lastName":True,
		"RollNo":True,
		"studentMobile":True,
		"_id":True})
	else:
		data = mongo.db.student_info.find({"admitStatus": 1},{"firstName":True,
		"middleName":True,
		"lastName":True,
		"RollNo":True,
		"studentMobile":True,
		"_id":True})
	studedata = list(data)
	for stud in studedata:
		stud["_id"]=str(stud["_id"])
	print studedata
	if studedata:
		return jsonify(
			{"success": "true", "message": "Showing Admitted List!", "studentList": studedata})
	else:
		return jsonify({"success": "false", "message": "Student Not Found"})







@app.route('/getAdmittedStudentList', methods=['POST'])
def getAdmittedStudentList():
	if request.get_json():
		if request.get_json()["batch"]=="true":
			batchname = request.get_json()["batchname"]
			data = mongo.db.student_info.find({"Batch":str(batchname),"isDeleted":"false"})
		else:
			idi = request.get_json()["id"]
			data = mongo.db.student_info.find({"_id":ObjectId(str(idi))})
	else:
		data = mongo.db.student_info.find({"admitStatus": 1,"isDeleted":"false"})
	studedata = list(data)
	for stud in studedata:
		stud["_id"]=str(stud["_id"])
		if(stud["admitStatus"]==1):
			stud["RollNo"]=int(stud["RollNo"])
	if studedata:
		return jsonify(
			{"success": "true", "message": "Showing Admitted List!", "studentList": studedata})
	else:
		return jsonify({"success": "false", "message": "Student Not Found"})

@app.route('/getStudentListforrfids', methods=['GET'])
def getStudentListforrfids():
	data = mongo.db.student_info.find({"$and":[{"admitStatus":{ "$ne": 0 }},{"rfid": { "$exists": False } }]})
	#data = mongo.db.student_info.find({"$and":[{"admitStatus":1},{"rfid": { "$exists": False } }]})
	studedata = list(data)
	for stud in studedata:
		stud["_id"]=str(stud["_id"])
	
	if studedata:
		return jsonify(
			{"success": "true", "message": "Showing Admitted List!", "studentList": studedata})
	else:
		return jsonify({"success": "false", "message": "Student Not Found"})



@app.route('/addnewstudent', methods=["POST"])
def addnewstudent():
	pass
	data=request.get_json()["studentdata"]
	data["admissiondate"] = datetime.now().date().strftime("%d-%m-%Y")
	count = mongo.db.student_info.find({"Batch": data['Batch']},{"RollNo":True,"_id":False}).sort('RollNo',-1).limit(1)
	count = list(count)
	if len(count):
		data["RollNo"] = count[0]["RollNo"] + 1
		data["isDeleted"]="false"
	else:
		data["RollNo"] = count[0]["RollNo"] + 1
		data["isDeleted"]="false"

	mongo.db.student_info.insert_one(data)
	mongo.db.student_info.delete_one({"_id":ObjectId(request.get_json()["stud_id"])})
	return jsonify({"success": "true", "message": "Student Admitted Successfully!!"})


@app.route('/addstudentdirectly', methods=["POST"])
def addstudentdirectly():
    pass
    data=request.get_json()["studentdata"]
    data["admissiondate"] = datetime.now().date().strftime("%d-%m-%Y")
    data["enqDate"] = datetime.now().date().strftime("%d-%m-%Y")
    #count = mongo.db.student_info.find({"Batch": data['Batch']}).count()
    count = mongo.db.student_info.find({"Batch": data['Batch']},{"RollNo":True,"_id":False}).sort('RollNo',-1).limit(1)
    count = list(count)
    if len(count):
    	data["RollNo"] = count[0]["RollNo"] + 1
    else:
    	data["RollNo"] = 1
    #print type(count["RollNo"])
    #print count[0]["RollNo"] + 1
   
    mongo.db.student_info.insert_one(data)
    return jsonify({"success": "true", "message": "Student Admitted Successfully!!"})
    

@app.route('/editstudentinfo',methods=['POST'])
def editstudentinfo():
	studeid = request.get_json()["id"]
	data = request.get_json()["data"]
	
	mongo.db.student_info.update_one({"_id":ObjectId(studeid)} ,{"$set":data},upsert=False)
	data = mongo.db.student_info.find({"_id":ObjectId(str(studeid))})
	studedata = list(data)
	
	studedata[0]["_id"]=str(studedata[0]["_id"])
	return jsonify({"success":"true","message":" Updated Successfully","studentdata":studedata})

@app.route('/addnewenquirystudent', methods=["POST"])
def addnewenquirystudent():
    pass
    formdata = request.get_json()
    enqDate = datetime.now().date().strftime("%d-%m-%Y")
    formdata["enqDate"] = enqDate
    formdata["admitStatus"] = 0
    formdata["isDeleted"] ="false"
    mongo.db.student_info.insert_one(formdata)
    return jsonify({"success": "true", "message": "Student Admitted Successfully!!"})

@app.route('/getcourse',methods=['POST'])
def getcourse():

	if len(request.get_json())==1:
		
		branchid = request.get_json()["branchid"]
		courses = mongo.db.coursedetails.find({"branchid":branchid}).distinct("coursename")	
		course = list(courses)
	if len(request.get_json())==2:
		
		branchid = request.get_json()["branchid"]
		coursename = request.get_json()["coursename"]
		courses = mongo.db.coursedetails.find({"branchid":branchid,"coursename":coursename})	
	
		course = list(courses)
		for c in course:
			c["_id"] = str(c["_id"])

	objBranchId = ObjectId(branchid)
	branches = mongo.db.branches.find_one({'_id':objBranchId})
	
	branchname = branches['branchname']

	if len(course):
	 	return jsonify({"success":"true","course":course,"branchid":branchid,"branchname":branchname})
	else:
	 	return jsonify({"success":"false","message":"No batch Found. Please add batch!","branchid":branchid,"branchname":branchname})

@app.route('/addstaff',methods=['POST'])
def addstaff():
	data=request.get_json()["staffdata"]
	mongo.db.staffdetails.insert_one(data)
	return jsonify({"success":"true","message":"Staff Added Successfully"})

# @app.route('/editstaffsalaryinfo',methods=['POST'])
# def editstaffsalaryinfo():
# 	jsondata = json.loads(request.get_json())
# 	#jsondata=request.get_json()
# 	staffid = jsondata["id"]
# 	data = jsondata["data"]

	
# 	mongo.db.staffdetails.update_one({"_id":ObjectId(staffid)} ,{"$set":data},upsert=False)
# 	data = mongo.db.staffdetails.find({"_id":ObjectId(str(staffid))})
# 	stafdata = list(data)
# 	print stafdata
# 	stafdata[0]["_id"]=str(stafdata[0]["_id"])
# 	return jsonify({"success":"true","message":" Updated Successfully","staffdata":stafdata})


@app.route('/editstaffinfo',methods=['POST'])
def editstaffinfo():
	jsondata = json.loads(request.get_json())
	#jsondata=request.get_json()
	staffid = jsondata["id"]
	data = jsondata["data"]

	
	mongo.db.staffdetails.update_one({"_id":ObjectId(staffid)} ,{"$set":data},upsert=False)
	data = mongo.db.staffdetails.find({"_id":ObjectId(str(staffid))})
	stafdata = list(data)
	
	stafdata[0]["_id"]=str(stafdata[0]["_id"])
	return jsonify({"success":"true","message":" Updated Successfully","staffdata":stafdata})

# @app.route('/addstaff',methods=['POST'])
# def addstaff():
# 	# pass
# 	print request.get_json()
# 	mongo.db.staffdetails.insert(request.get_json())	
# 	return jsonify({"success":"true","message":"Staff Added Successfully"})

@app.route('/insertuser',methods=['POST'])
def insertuser():
	# pass
	#print request.get_json()
	mongo.db.userlogins.insert(request.get_json())	
	return jsonify({"success":"true","message":"User Added Successfully"})

@app.route('/getterms',methods=['POST'])
def getterms():
	terms = mongo.db.termsandcondition.find({})		
	term = list(terms)
	for c in term:
		c["_id"] = str(c["_id"])	
	
	if len(term):
		return jsonify({"success":"true","terms":term})
	else:
		return jsonify({"success":"false","message":"No terms Found. Please add it!"})

@app.route('/feereportcount',methods=['POST'])
def feereportcount():
	addmissioncount=mongo.db.student_info.find({"admitStatus":1}).count()
	if len(str(addmissioncount)):
		return jsonify({"success":"true","addmissioncount":addmissioncount})
	else:
		return jsonify({"success":"false","message":"feereportcount"})
	# return str(addmissioncount)

@app.route('/getSchoolsList', methods=['POST'])
def getSchoolsList():

	schooldata = mongo.db.student_info.find({"admitStatus":"1"}).distinct("schoolName")
	schooldata=list(schooldata)
	return jsonify({"success":"true","schooldata":schooldata}) 


@app.route('/getBoard',methods=['POST'])
def getBoard():
	if request.get_json():
		boards=mongo.db.coursedetails.find(request.get_json(),{"_id":False}).distinct("coursename")	
	else:
		boards=mongo.db.coursedetails.find({}).distinct("coursename")	
	board = list(boards)		
	if len(board):
		return jsonify({"success":"true","board":board})
	else:
		return jsonify({"success":"false","message":"No terms Found. Please add it!"})

@app.route('/getBatch',methods=['POST'])
def getBatch():
	batches=mongo.db.coursedetails.find(request.get_json(),{"_id":False}).distinct("batchname")	
	batch = list(batches)		
	if len(batch):
		return jsonify({"success":"true","batch":batch})
	else:
		return jsonify({"success":"false","message":"No terms Found. Please add it!"})

@app.route('/getBranchStaffList', methods=['POST'])
def getBranchStaffList():
	staffdata = mongo.db.staffdetails.find({"isDeleted":"false"})
	staffdata=list(staffdata)
	for c in staffdata:
			c["_id"] = str(c["_id"])
			c["fullname"]=str(c["fname"])+" "+str(c["mname"])+" "+str(c["lname"])
	return jsonify({"success":"true","staffdata":staffdata})


@app.route('/getStaffListRfid', methods=['POST'])
def getStaffListRfid():
	staffdata = mongo.db.staffdetails.find({"isDeleted":"false"},{"_id":True,"fname":True,"mname":True,"lname":True})
	staffdata=list(staffdata)
	for c in staffdata:
			c["_id"] = str(c["_id"])
			c["fullname"]=str(c["fname"])+" "+str(c["mname"])+" "+str(c["lname"])
	return jsonify({"success":"true","staffdata":staffdata})

#Assign Rfid for staff
@app.route("/assignrfidforstaff",methods=["POST"])
def assignrfidforstaff():
	staffrfidinfo=request.get_json()
	ispresent=mongo.db.staffRfidlist.find({"staffid":staffrfidinfo["staffid"]},{"_id":False})
	ispresent=list(ispresent)
	if len(ispresent):
		return jsonify({"success":"false","message":" Sorry!!!!!!! Already Assign"})
	else:
		mongo.db.staffRfidlist.insert(staffrfidinfo)
		return jsonify({"success":"true","message":"Rfid Assign successfully"})


@app.route('/getStaffInfo', methods=['POST'])
def getStaffInfo():
	idi = request.get_json()["id"]
	data = mongo.db.staffdetails.find({"_id":ObjectId(str(idi))})
	staffdata = list(data)
	if(len(staffdata)):
		staffdata[0]["_id"]=str(staffdata[0]["_id"])
	if staffdata:
		return jsonify(
			{"success": "true", "message": "Showing Staff Info!", "staffData": staffdata})
	else:
		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

@app.route('/getstafflistall',methods=['POST'])
def getstafflistall():
	staff = mongo.db.staffdetails.find({"isDeleted":"false"})
	staffs = list(staff)

	for staff in staffs:
		staff["_id"] = str(staff["_id"])
	stafflist = list(staffs)
	if len(stafflist):
	 	return jsonify({"success":"true","stafflist":stafflist})
	else:
	 	return jsonify({"success":"false","message":"No Staff Found. Please Add Staff!"})

@app.route('/getstafflist',methods=['POST'])
def getstafflist():
	staff = mongo.db.staffdetails.find({"cityid":str(request.get_json()["cityid"]),"isDeleted":"false"})
	staffs = list(staff)

	for staff in staffs:
		staff["_id"] = str(staff["_id"])
	stafflist = list(staffs)
	if len(stafflist):
	 	return jsonify({"success":"true","stafflist":stafflist})
	else:
	 	return jsonify({"success":"false","message":"No Staff Found. Please Add Staff!"})

@app.route('/getemployeelist',methods=['POST'])
def getemployeelist():
	staff = mongo.db.staffdetails.find({"cityid":str(request.get_json()["cityid"]),"stafftype":"Employee"})
	staffs = list(staff)

	for staff in staffs:
		staff["_id"] = str(staff["_id"])
	stafflist = list(staffs)
	if len(stafflist):
	 	return jsonify({"success":"true","stafflist":stafflist})
	else:
	 	return jsonify({"success":"false","message":"No Staff Found. Please Add Staff!"})

@app.route('/getstd',methods=['POST'])
def getstd():
	std = mongo.db.coursedetails.find(request.get_json()).distinct('std')
	std = list(std)	
	if len(std):
	 	return jsonify({"success":"true","std":std})
	else:
	 	return jsonify({"success":"false","message":"standard found"})

@app.route('/createschedule',methods=['POST'])
def createSchedule():
	#print request.get_json()['batch']
 	startdate=datetime.strptime(request.get_json()['startDate'], '%d-%b-%y').date()
 	curdate=startdate
 	enddate=datetime.strptime(request.get_json()['endDate'], '%d-%b-%y').date() 

 	parent ={}
 	m=list()
 	while(curdate<=enddate):
 		pmonth=curdate.strftime('%b')
 		temp={}
 		month={}
 		day=list()
 		d=list()
 		work=list()
 		
 		while(pmonth==curdate.strftime('%b')):
	 		d.append(curdate.strftime('%d'))
	 		day.append(curdate.strftime('%a'))
	 		work.append("")
	 		curdate=curdate + timedelta(days=1)
		 	temp["date"]=d
		 	temp["day"]=day
		 	temp["work"]=work
	 	month["month"]=pmonth
	 	month["schedule"]=temp
		m.append(month)
	parent["academicyear"]=	str(startdate.strftime('%Y'))+" - "+str(enddate.strftime('%Y'))
 	parent["batch"]=request.get_json()['batch']
 	parent["schedule"]=m
 	parent["isDeleted"]="false"
	result=mongo.db.schedules.insert(json.loads(json.dumps(parent)))		
	if len(parent):
		return jsonify({"success":"true","schedule":parent})
	else:
		return jsonify({"success":"false","message":"No terms Found. Please add it!"})

@app.route('/getSchedules',methods=['POST'])
def getSchedules():
	if(request.get_json()):
		schedules=mongo.db.schedules.find({"_id":ObjectId(request.get_json()['id']),"isDeleted":"false"})
	else:
		schedules=mongo.db.schedules.find()
	schedules = list(schedules)	
	for schedule in schedules:
		schedule["_id"]=str(schedule["_id"])
	if len(schedules):
		return jsonify({"success":"true","schedules":schedules})
	else:
		return jsonify({"success":"false","message":"No schedule Found. Please add it!"})

@app.route('/getdashschedule',methods=['POST'])
def getdashschedule():
	batchname = request.get_json()['batchname']
	schedule = mongo.db.schedules.find({},{"_id":False})
	schedule = list(schedule)
	dashschedule = {}
	for k in schedule:
	 	for q in k['batch']:
	 		if batchname == q:
	 			pass
	 			dashschedule = k
	if len(schedule):
		return jsonify({"success":"true","schedules":dashschedule})
	else:
		return jsonify({"success":"false","message":"No schedule Found. Please add it!"})

@app.route('/editYearlySchedule',methods=['POST'])
def editYearlySchedule():
	schedule=request.get_json()['schedules'][0]
	mongo.db.schedules.update_one({"_id":ObjectId(schedule['_id'])} ,{"$set":{"schedule":schedule['schedule']}},upsert=False)
	return jsonify({"success":"true","message":"Update successfully!"})

@app.route('/editYearlySchedulebatch',methods=['POST'])
def editYearlySchedulebatch():
	schedule=request.get_json()['schedules'][0]
	mongo.db.schedules.update_one({"_id":ObjectId(schedule['_id'])} ,{"$set":{"batch":schedule['batch']}},upsert=False)
	return jsonify({"success":"true","message":"Update successfully!"})

@app.route('/getColors',methods=['POST'])
def getColors():
	result = mongo.db.schedulecolors.find({},{"_id":False})
	result = list(result)
	colors = {}
	for k in result[0]["colors"]:
		#colors.append(k[])
		for k1,v1 in k.items():
			
			colors[k1]=v1
	
	return jsonify({"success":"true","color":colors})


@app.route('/addColor',methods=['POST'])
def addColor():
	mongo.db.schedulecolors.update({},{"$push":{"colors":{request.get_json()['colorfor']:request.get_json()['color']}}})
	# result = list(result)
	# print result
	return jsonify({"success":"true","message":"added"})

@app.route("/insertnewstructure",methods=["POST"])
def newFeeStructure():
	feeinfo = request.get_json()["data"]	
	feeinfo["isDeleted"]="false"
	mongo.db.feestructure.insert(feeinfo)	
	return jsonify({"success":"true","message":"Fee Structure Added Successfully"})

# @app.route('/addstaffattendance',methods=['POST'])
# def addstaffattendance():
# 	# pass
# 	mongo.db.staffattendancedetails.insert(request.get_json())	
# 	staff = mongo.db.staffdetails.find({"_id":ObjectId(request.get_json()["staffid"])},{"_id":False,"mobile":True,"fname":True})
# 	staff = list(staff)
# 	print staff
# 	return jsonify({"success":"true","message":"Staff attendance Added Successfully!","staff":staff[0]})

@app.route('/addemployeeattendance',methods=['POST'])
def addemployeeattendance():
	mongo.db.employeeattendancedetails.insert(request.get_json())	
	return jsonify({"success":"true","message":"Staff attendance Added Successfully!"})

@app.route('/addstaffattendance',methods=['POST'])
def addstaffattendance():
	# pass
	mongo.db.staffattendancedetails.insert(request.get_json())	
	staff = mongo.db.staffdetails.find({"_id":ObjectId(request.get_json()["staffid"])},{"_id":False,"mobile":True,"fname":True,"lname":True})
	staff = list(staff)
	branchdetails=mongo.db.coursedetails.find_one({"batchname":request.get_json()["batch"]},{"branchname":True})
	branchName=branchdetails["branchname"]
	# dailyreport=mongo.db.dailyreport.find({"batch": request.get_json()["batch"]})
	# dailyreport=list(dailyreport)
	# dailyreport=dailyreport[0]
	# syllabus=dailyreport["syllabusdetails"]["syllabus"]
	# idx=0
	# for subject in syllabus["subject"]:
	# 	if subject["subject"]==request.get_json()["subject"]:
	# 		print subject["subject"]
	# 		for topic in subject["topic"]:
	# 			if topic["topicname"]==request.get_json()["topic"]:
	# 				break
	# 			else:
	# 				idx=idx+1

	# 		break
	# 	else:
	# 		idx=idx+len(subject["topic"])
	# lecturedetails=dailyreport["lecturedetails"]
	# for i in xrange(0,len(lecturedetails["lecrecord"][idx])):
	# 	if lecturedetails["lecrecord"][idx][i]== "":
	# 		lecturedetails["lecrecord"][idx][i]=request.get_json()["date"]
	# 		print "yo"
	# 		break

	# print lecturedetails
	# mongo.db.dailyreport.update_one({"_id":dailyreport["_id"]} ,{"$set":{"lecturedetails":lecturedetails}},upsert=False)

	return jsonify({"success":"true","message":"Staff attendance Added Successfully!","staff":staff[0],"branch":branchName})

# @app.route('/addstaffattendance',methods=['POST'])
# def addstaffattendance():
# 	# pass
# 	staff = mongo.db.staffattendancedetails.find({"date":request.get_json()["date"]})
# 	staff=list(staff)
# 	if len(staff):
# 		print "yo"
# 	else:
# 		mongo.db.staffattendancedetails.insert({"date":request.get_json()["date"],"lecturerecord":[{"sjd":"j"}]})
# 	lecturerecord = mongo.db.staffattendancedetails.find({"date":request.get_json()["date"]},{"_id":False,"lecturerecord":True})
# 	lecturerecord=list(lecturerecord)
# 	lecture=lecturerecord[0]["lecturerecord"]
# 	print lecture
# 	lecture.append(request.get_json())
# 	mongo.db.staffattendancedetails.update_one({"date":request.get_json()["date"]} ,{"$set":{"lecturerecord":lecture}},upsert=False)

# 	return jsonify({"success":"true","message":"Staff attendance Added Successfully!"})

#================================================================================================
@app.route('/getdailyreportcolor', methods=['GET'])
def getdailyreportcolor():
	colors = mongo.db.reportcolors.find({},{"_id":False})
	colors=list(colors)

	if len(colors):
		return jsonify(
			{"success": "true", "message": "Showing Student List!","colors":colors[0]["colors"]})
	else:
		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

@app.route('/getlecturedetails', methods=['POST'])
def getlecturedetails():
	#batch="Volcano"
	batch=request.get_json()["batch"]
	lecturedetails=mongo.db.staffattendancedetails.find({"batch":batch}).distinct("date")
	lecturedetails=list(lecturedetails)
	if len(lecturedetails):
		dates = [datetime.strptime(d, "%d-%m-%Y") for d in lecturedetails]
		dates.sort()
		sorteddates = [datetime.strftime(ts, "%d-%m-%Y") for ts in dates]
		startdate=dates[0]
		enddate=dates[len(dates)-1]
		days=list()
		d=list()
		curdate=startdate
		while(curdate<=enddate):
			d.append(curdate.strftime('%d-%m-%Y'))
			days.append(curdate.strftime('%a'))
			curdate=curdate + timedelta(days=1)
		lecturedetails=sorteddates
		perdaylec=[]
		for day in d:
			# temp={}
			# temp["date"]=day
			# temp["day"]=datetime.strptime(day, "%d-%m-%Y").strftime('%a')
			lectures=mongo.db.staffattendancedetails.find({"batch":batch,"date":day},{"_id":False})
			lectures=list(lectures)
			for l in lectures:
				l["date"]=day
				l["day"]=datetime.strptime(day, "%d-%m-%Y").strftime('%a')
				tdetails=mongo.db.staffdetails.find_one({"_id":ObjectId(l["staffid"])},{"fname":True,"lname":True})
				# print "techar id is----------------"
				# print l["staffid"]
				# l["tname"]=""
				l["tname"]=tdetails["fname"]+" "+tdetails["lname"]
							# if len(lectures):
			# 	temp["lectures"]=lectures
			# else:
			# 	temp["lectures"]=[]
			perdaylec.append(lectures)
		return jsonify({"success": "true", "message": "Showing Student List!","lecturedetails":perdaylec,"batch":batch,"day":days,"dates":d})
	else:
		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

@app.route('/getsmsStudentList', methods=['GET'])
def getsmsStudentList():
	studedata = mongo.db.student_info.find({"admitStatus": "1","isDeleted":"false"})
	studedata = list(studedata)
	for stud in studedata:
		stud["_id"]=str(stud["_id"])
		
		stud["fullname"]=str(stud["firstName"])+" "+str(stud["middleName"])+" "+str(stud["lastName"])
	if len(studedata):
		return jsonify(
			{"success": "true", "message": "Showing Student List!", "studentList": studedata})
	else:
		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

@app.route('/getcoursesbycity',methods=['POST'])
def getcoursesbycity():
	courses=mongo.db.coursedetails.find({"cityid":str(request.get_json()["cityid"])}).distinct("coursename")
	if len(courses):
		return jsonify({"success":"true","courses":courses,"cityid":request.get_json()["cityid"]})
	else:
	  	return jsonify({"success":"false","message":"No Courses Found. Please add course!","cityid":request.get_json()["cityid"]})


@app.route('/getcoursesnew',methods=['POST'])
def getcoursesnew():
 
	branchid = request.get_json()["branchid"]
	courses = mongo.db.coursedetails.find({"branchid":branchid})	
	
	course = list(courses)
	for c in course:
		c["_id"] = str(c["_id"])

	if len(course):
	 	return jsonify({"success":"true","courses":course,"branchid":branchid})
	else:
	 	return jsonify({"success":"false","message":"No batch Found. Please add batch!","branchid":branchid})

@app.route('/updatebranch',methods=['POST'])
def updatebranch():
	address = request.get_json()["address"]
	contact = request.get_json()["contact"]	
	branchid = request.get_json()["branchid"]	
	#del request.get_json()["_id"]
	mongo.db.branches.update_one({"_id":ObjectId(branchid)} ,{"$set":{"address":address,"contact":contact}},upsert=False)
	return jsonify({"success":"true","message":" Updated Successfully "}) 	

@app.route('/getsinglebranch',methods=['POST'])
def getsinglebranch():
 
	branchid = request.get_json()["branchid"]
	singlebranch = mongo.db.branches.find({"_id":ObjectId(branchid)})	
	
	singlebranch = list(singlebranch)
	for c in singlebranch:
		c["_id"] = str(c["_id"])

	if len(singlebranch):
	 	return jsonify({"success":"true","singlebranches":singlebranch[0]})
	else:
	 	return jsonify({"success":"false","message":"No batch Found. Please add batch!"})

@app.route('/addbatchnew',methods=['POST'])
def addbatchnew():
	# standard = request.get_json()["standard"]
	# batchname = request.get_json()["batchname"]	
	# coursename=request.get_json()["coursename"]
	# branchid=request.get_json()["branchid"]
	mongo.db.coursedetails.insert(request.get_json())	
	return jsonify({"success":"true","message":"batch Added Successfully"})

@app.route('/getenqiryperson',methods=['POST'])
def getenqiryperson():
	enquiryid=request.get_json()["enquiryid"]
	data = mongo.db.userlogins.find({"_id":ObjectId(str(enquiryid))},{"staffname":True,"_id":False})
	data=list(data)
	
	if data:
		return jsonify(
			{"success": "true", "message": "username", "enquiryperson": data[0]["staffname"]})
	else:
		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

@app.route('/getusertypes',methods=['POST'])
def getusertypes():
	pass
	usertypes = mongo.db.usertypes.find({},{"_id":False})
	utypes = list(usertypes)


	if len(utypes):
	 	return jsonify({"success":"true","usertypes":utypes})
	else:
	 	return jsonify({"success":"false","message":"Unkown Error, Please Contact Support!"})

@app.route('/changepwd', methods=['POST'])
def changepwd():
	pass
	id = request.get_json()['id']
	pwd = request.get_json()['pass']
	mongo.db.userlogins.update_one({"_id":ObjectId(id)} ,{"$set":{"password":pwd}},upsert=False)
	return jsonify({"success":"true","message":" Updated Successfully "})


@app.route('/getbatchesfrombranch', methods=['POST'])
def getbatchesfrombranch():
	pass
	branchid = request.get_json()['id']
	branches = mongo.db.coursedetails.find({"_id":branchid})
	branches=list(branches)
	for b in branches:
		b["_id"] = str(b["_id"])
	if len(branches):
		return jsonify({"success":"true","branches":branches})
	else:
		return jsonify({"success":"false","message":"no batch found"})
# @app.route('/getuserprofiledata', methods=['POST'])
# def getuserprofiledata():
# 	pass
# 	userprofile = mongo.db.userlogins.find({"_id":ObjectId(request.get_json()['id'])})
# 	userprofile = list(userprofile)
	
# 	for c in userprofile:
# 		c["_id"] = str(c["_id"])
	
# 	if len(userprofile):
# 		return jsonify({"success":"true","userprofile":userprofile})
# 	else:
# 	 	return jsonify({"success":"false","message":"Unkown Error, Please Contact Support!"})

# @app.route('/edituserprofile', methods=['POST'])
# def edituserprofile():
# 	pass
# 	formdata = request.get_json()

@app.route('/getusers',methods=['POST'])
def getusers():
    users = mongo.db.userlogins.find({"isDeleted":"false"})
    users = list(users)
    for user in users:
        user["_id"] = str(user["_id"])
        user["cityname"]= mongo.db.cities.find({"_id":ObjectId(str(user["cityid"]))}).distinct("cityname")[0]
        if user["usertype"]=="1":
            user["branchname"]= mongo.db.branches.find({"_id":ObjectId(str(user["branchid"]))}).distinct("branchname")[0]
        user["usertypename"]= mongo.db.usertypes.find({"typeid":(int(user["usertype"]))}).distinct("typename")[0]
    if len(users):
        return jsonify({"success":"true","users":users})
    else:
        return jsonify({"success":"false","message":"No users Found. Please Add user!"})

@app.route('/getTeachers',methods=['POST'])
def getTeachers():
    teachers = mongo.db.staffdetails.find({"stafftype": "Teacher"})
    teachers = list(teachers)
    for teacher in teachers:
        teacher["_id"] = str(teacher["_id"])
        teacher["city"]= mongo.db.cities.find({"_id":ObjectId(str(teacher["cityid"]))}).distinct("cityname")[0]
        teacher["fullname"]=str(teacher["fname"])+" "+str(teacher["mname"])+" "+teacher["lname"]
    if len(teachers):
        return jsonify({"success":"true","teachers":teachers})
    else:
        return jsonify({"success":"false","message":"No users Found. Please Add user!"})

@app.route('/deleteuser',methods=['POST'])
def deleteuser():
	id_to_delete = request.get_json()["userid"]
	try:
		mongo.db.userlogins.update_one({"_id":ObjectId(id_to_delete)},{"$set":{"isDeleted":"true"}},upsert=False)
		return jsonify({"success":"true","message":"User Deleted Successfully!"})
	except:
		return jsonify({"success":"false","message":"Sorry user Not Deleted"})

@app.route('/assignRFID',methods=['POST'])
def assignRFID():
	try:
		mongo.db.student_info.update_one({"_id":ObjectId(request.get_json()["studentid"])},{"$set":{"rfid":request.get_json()["rfidno"]}},upsert=False)
		mongo.db.rfids.delete_one({"rfid":request.get_json()["rfidno"]})	
		return jsonify({"success":"true","message":"RFID Assign Successfully"})
	except:
		return jsonify({"success":"false","message":"Please Retry"})

	# 		studentdata=mongo.db.student_info.find({"_id":ObjectId(request.get_json()["studentid"])})
	# studentdata=list(studentdata)
	# studentdata=studentdata[0]
	# ids=str(studentdata["_id"])
	# # del studentdata["_id"]
	# studentdata["rfid"]=request.get_json()["rfidno"]
	# print studentdata
	# mongo.db.student_info.delete_one({"_id":ObjectId(ids)})
	# mongo.db.student_info.insert(studentdata)
	# mongo.db.rfids.delete_one({"rfid":request.get_json()["rfidno"]})	
	# return jsonify({"success":"true","message":"RFID Assign Successfully"})

@app.route('/deactivateuser',methods=['POST'])
def deactivateuser():
	id_to_deactivate = request.get_json()["userid"]
	try:
		mongo.db.userlogins.update_one({"_id":ObjectId(id_to_deactivate)},{"$set":{"statusActive":"0"}},upsert=False)
		return jsonify({"success":"true","message":"User rights deactivated Successfully!"})
	except:
		return jsonify({"success":"false","message":"Sorry user Not Deleted"})

@app.route('/activateuser',methods=['POST'])
def activateuser():
	id_to_activate = request.get_json()["userid"]
	try:
		mongo.db.userlogins.update_one({"_id":ObjectId(id_to_activate)},{"$set":{"statusActive":"1"}},upsert=False)
		return jsonify({"success":"true","message":"User rights activated Successfully!"})
	except:
		return jsonify({"success":"false","message":"Sorry user Not Deleted"})

@app.route("/updatestaffattendance",methods=["POST"])
def updatestaffattendance():
	mongo.db.staffattendancedetails.update_one({"_id":ObjectId(request.get_json()['Id'])} ,{"$set":{"date":request.get_json()['date'],"batch":request.get_json()['batch'],"subject":request.get_json()['subject'],"topic":request.get_json()['topic'],"startTime":request.get_json()['startTime'],"endTime":request.get_json()['endTime'],"duration":request.get_json()['duration']}},upsert=False)
	return jsonify({"success":"true","message":"Attendance Updated successfully!"})

@app.route("/getteachermobile",methods=["POST"])
def getteachermobile():
	mo=mongo.db.staffdetails.find({"_id":ObjectId(str(request.get_json()['staffid']))}).distinct("mobile")
	if len(mo):
		return jsonify({"success":"true","mobile":mo[0]})
	else:
		return jsonify({"success":"false","message":"Something went wrong"})

@app.route("/createbatchresult",methods=["POST"])
def createbatchresult():
	result={}
	result["batch"]=request.get_json()["batchid"]
	result["testname"]=request.get_json()["testname"]
	result["examdate"]=request.get_json()["examdate"]
	result["totaltestmarks"]=""
	batchname=mongo.db.coursedetails.find({"_id":ObjectId(str(request.get_json()['batchid']))}).distinct("batchname");
	if len(batchname):
		students=mongo.db.student_info.find({"Batch":batchname[0],"admitStatus":"1"},{"_id":True})
		students=list(students)
		if len(students):
			for s in students:
				s["_id"]=str(s["_id"])
			result["studentid"]=students;
			# result["testtotalmarks"]=""
			subject=["ENG","MAR","SCI","MATHS","HISTORY"]
			res=[]
			for sub in subject:
				temp={}
				temp["subject"]=sub
				temp["totalmarks"]=""
				marks=[];
				for i in range(0,len(students)):
					marks.append("")
				temp["submarks"]=marks
				res.append(temp)
			result["subject"]=res;
			result["isDeleted"]="false"
			mongo.db.studenttestresult.insert(result)
	return jsonify({"success":"true"})


@app.route("/gettests",methods=["POST"])
def gettests():
	tests=mongo.db.studenttestresult.find({"isDeleted":"false"},{"_id":True,"batch":True,"testname":True,"examdate":True})
	tests=list(tests)
	for t in tests:
		t["_id"]=str(t["_id"])
		batchname=mongo.db.coursedetails.find({"_id":ObjectId(str(t["batch"]))}).distinct("batchname")
		if len(batchname):
			t["batchname"]=batchname[0]

	if len(tests):
		return jsonify({"success":"true","tests":tests})
	else:
		return jsonify({"success":"false"})

@app.route("/gettestresult",methods=["POST"])
def gettestresult():
	testresult=mongo.db.studenttestresult.find({"_id":ObjectId(str(request.get_json()["id"]))})
	testresult=list(testresult)
	for t in testresult:
		t["_id"]=str(t["_id"])
		batchname=mongo.db.coursedetails.find({"_id":ObjectId(str(t["batch"]))}).distinct("batchname")
		if len(batchname):
			t["batchname"]=batchname[0]
		for stud in t["studentid"]:
			students=mongo.db.student_info.find({"_id":ObjectId(str(stud["_id"]))},{"middleName":True,"firstName":True,"lastName":True})
			students=list(students)
			if len(students):
				stud["studentname"]=students[0]["firstName"]+" "+students[0]["middleName"]+" "+students[0]["lastName"]

		if len(batchname):
			t["batchname"]=batchname[0]

	if len(testresult):
		return jsonify({"success":"true","testresult":testresult})
	else:
		return jsonify({"success":"false"})

@app.route("/updatetestresult",methods=["POST"])
def updatetestresult():
	testresult=request.get_json()['testresult'][0]
	#print request.get_json()['testresult'][0]
	mongo.db.studenttestresult.update_one({"_id":ObjectId(testresult['_id'])} ,{"$set":{"subject":testresult['subject'],"examdate":testresult["examdate"],"testname":testresult["testname"],"totaltestmarks":testresult["totaltestmarks"]}},upsert=False)
	return jsonify({"success":"true","message":"Update successfully!"})


@app.route("/getquestionpaperforstudent",methods=["POST"])
def getquestionpaperforstudent():
	batch=mongo.db.coursedetails.find({"batchname":request.get_json()["batch"]},{"_id":False})
	batch=list(batch)
	qp=mongo.db.questionpapers.find({"standard":batch[0]["std"],"course":batch[0]["coursename"],"isDeleted":"false"},{"_id":False})
	qp=list(qp)
	if len(qp):
		return jsonify({"success":"true","qplist":qp})
	else:
		return jsonify({"success":"false"})


@app.route("/gettestresultforstudent",methods=["POST"])
def gettestresultforstudent():
	batchname="Volcano"
	#batch=mongo.db.coursedetails.find({"batchname":request.get_json()["batch"]})
	batch=mongo.db.coursedetails.find({"batchname":batchname})
	batch=list(batch)
	for b in batch:
		b["_id"]=str(b["_id"])
	testresults=mongo.db.studenttestresult.find({"batch":batch[0]["_id"]})
	testresults=list(testresults)
	for result in testresults:
		result["_id"]=str(result["_id"])
	if len(testresults):
		return jsonify({"success":"true","qplist":testresults})
	else:
		return jsonify({"success":"false"})




# @app.route("/gettests",methods=["POST"])
# def gettests():
# 	tests=mongo.db.studenttestresult.find({},{"_id":True,"batchid":True,"testname":True})
# 	tests=list(tests)
# 	for t in tests:
# 		t["_id"]=str(t["_id"])
# 		batchname=mongo.db.coursedetails.find({"_id":ObjectId(str(request.get_json()['batchid']))}).distinct("batchname")
# 		if len(batchname):
# 			t["batchname"]=batchname[0]
# 	if len(tests):
# 		return jsonify({"success":"true","tests":tests})
# 	else:
# 		return jsonify({"success":"false"})

# qp=mongo.db.questionpapers.find({},{"_id":False})
# qp=list(qp)
# if len(qp):
# return jsonify({"success":"true","qplist":qp})
# else:
# return jsonify({"success":"false"})

@app.route("/gettesttimetable",methods=["POST"])
def gettesttimetable():
	tt=mongo.db.testtimetable.find({"isDeleted":"false"})
	tt=list(tt)
	for t in tt:
		t["_id"]=str(t["_id"])
	if len(tt):
		return jsonify({"success":"true","ttlist":tt})
	else:
		return jsonify({"success":"false"})

@app.route("/getquestionpapers",methods=["POST"])
def getquestionpapers():
	qp=mongo.db.questionpapers.find({"isDeleted":"false"})
	qp=list(qp)
	for q in qp:
		q["_id"]=str(q["_id"])
	if len(qp):
		return jsonify({"success":"true","qplist":qp})
	else:
		return jsonify({"success":"false"})


@app.route("/getresultforstudent",methods=["POST"])
def getresultforstudent():
	res=mongo.db.studenttestresult.find({},{"_id":False})
	res=list(res)
	if len(res):
		return jsonify({"success":"true","resultlist":res})
	else:
		return jsonify({"success":"false"})


'''RFID Attendance'''

#Assign Rfid for Batch
@app.route("/assignrfid",methods=["POST"])
def assignrfid():
	rfidlist=request.get_json()["cardlist"]
	mongo.db.RFIDlist.insert(rfidlist)
	return jsonify({"success":"true","message":"Rfid Assign successfully"})

#Get Assigned Rfid List of Batch
@app.route("/getassignedrfid",methods=["POST"])
def getassignedrfid():
	rfidlist=mongo.db.RFIDlist.find({"batchname":request.get_json()["batch"]});
	rfidlist=list(rfidlist)
	for rfid in rfidlist:
		rfid["_id"]=str(rfid["_id"])	
	return jsonify({"success":"true","rfidlist":rfidlist})

#Update Rfid List Of Batch
@app.route("/updaterfidlist",methods=["POST"])
def updaterfidlist():
	rfidlist=request.get_json()["rfidlist"]
	for rfid in rfidlist:
		result = mongo.db.RFIDlist.update_one({"_id":ObjectId(rfid["_id"])},{"$set":{"cardId":rfid["cardId"]}},upsert=False)
	return jsonify({"success":"true","message":"CardIds Updated Successfully"})

#test connection
@app.route("/testconnection",methods=["POST"])
def testconnection():
	pass	
	return jsonify({"success":"true","message":"connection Tested"})


# Mark Student Attendance
# app.route("/markattendance",methods=["POST"])
# def markattendance():
# 	present["cardId"]=request.get_json()["cardno"]
# 	present["time"]=request.get_json()["time"]
# 	present["date"]=request.get_json()["date"]
# 	print request.get_json()

	
# 	#mongo.db.studattendance.insert(rfidlist)

# 	return jsonify({"success":"true","message":"CardIds Updated Successfully"})

#Test 
@app.route("/markattendance",methods=["POST"])
def markattendance():
	print "device date "+ request.get_json()["date"]
	print "device time "+request.get_json()["time"]
	print "server time "+ strftime("%H:%M")
	
	staffrfidinfo=mongo.db.staffRfidlist.find_one({"cardid":request.get_json()["cardno"]})
	# print "device date "+ request.get_json()["date"]
	# print "device time "+request.get_json()["time"]
	# print "server time "+ strftime("%H:%M")
	

	if staffrfidinfo:
		mongo.db.staffRfidattendance.update({"cardid":request.get_json()["cardno"],"staffid":staffrfidinfo["staffid"],"date":request.get_json()["date"]},{'$push': {'time': request.get_json()["time"],'servertime': strftime("%H:%M")}}, upsert = True)

		return jsonify({"success":"true","message":"Attendance Marked"})
	else:	
		carddetails=mongo.db.RFIDlist.find_one({"cardId":request.get_json()["cardno"]})
		if carddetails:
			studentdetail=mongo.db.student_info.find_one({"RollNo":carddetails["RollNo"],"Batch":carddetails["batchname"]})			
			present=request.get_json()
			present["studentid"]=str(studentdetail["_id"])
			present["batch"]=carddetails["batchname"]
			AlreadyMarked=mongo.db.studattendance.find({"date":present["date"],"studentid":present["studentid"]},{"_id":False})
			AlreadyMarked=list(AlreadyMarked)
			if not len(AlreadyMarked):
				mongo.db.studattendance.insert(present)
			return jsonify({"success":"true","message":"Attendance Marked"})
		else:
			return jsonify({"success":"false","message":"invalid card"})



#Mark Attendance By Software
@app.route("/studentattendance",methods=["POST"])
def studentattendance():

	Attendance={}
	Attendance["date"]=datetime.now().strftime ("%Y-%m-%d")
	Attendance["time"]=datetime.now().strftime ("%H:%M:%S")
	Attendance["studentid"]=request.get_json()["studId"]
	Attendance["batch"]=request.get_json()["batch"]
	AlreadyMarked=mongo.db.studattendance.find({"date":Attendance["date"],"studentid":Attendance["studentid"]},{"_id":False});
	AlreadyMarked=list(AlreadyMarked)
	if not len(AlreadyMarked):
		mongo.db.studattendance.insert(Attendance)
	return jsonify({"success":"true"})

#get Attendance Of Batch
@app.route("/getbatchattendance",methods=["POST"])
def getbatchattendance():
	#batchname="Volcano"
	batchname=request.get_json()["batchname"]
	s=[]
	students=mongo.db.student_info.find({"Batch":batchname},{"_id":True,"firstName":True,"lastName":True,"RollNo":True}).sort('RollNo',1);
	students=list(students)
	if len(students):
		for stud in students:
			stud["_id"]=str(stud["_id"])
			s.append(stud)

	startdate=mongo.db.studattendance.find({"batch":batchname},{"date":True}).sort('date',1).limit(1)
	enddate=mongo.db.studattendance.find({"batch":batchname},{"date":True}).sort('date',-1).limit(1)
	startdate= list(startdate)
	enddate=list(enddate)
	if len(startdate):
		#print startdate[0]["date"]
		curdate=datetime.strptime(startdate[0]["date"], '%Y-%m-%d').date()
		enddate=datetime.strptime(enddate[0]["date"], '%Y-%m-%d').date()
		attendance=[]
		temp={}
		month=[]
		prevmonth=curdate.strftime("%B-%Y")
		while(curdate<=enddate):
			daytemp={}
			if(prevmonth!=curdate.strftime("%B-%Y")):
				temp["month"]=prevmonth
				temp["mattendance"]=month
				attendance.append(temp)
				month=[]
				temp={}
				prevmonth=curdate.strftime("%B-%Y")
				#print attendance
				#print "inside if prevmonth"
			
			daytemp["date"]=curdate.strftime("%d")
			dayattendance=[]
			
			for student in s:
				ispresent=mongo.db.studattendance.find({"date":str(curdate),"studentid":student["_id"]})
				ispresent=list(ispresent)
				if len(ispresent):
					dayattendance.append("P")
				else:
					dayattendance.append("A")

			daytemp["attendance"]=dayattendance
			month.append(daytemp)
			curdate=curdate + timedelta(days=1)

		temp["month"]=curdate.strftime("%B-%Y")
		temp["mattendance"]=month
		attendance.append(temp)

		#print attendance
			#enddate=mongo.db.studattendance.find({"batch":batchname},{"date":True}).sort('date',-1).limit(1)
		return jsonify({"success":"true","studentlist":s,"attendance":attendance})
	else:
		return jsonify({"success":"false","message":"Attendance not found"})


@app.route("/testdate",methods=["POST"])
def testdate():
	tt=mongo.db.newtimetables.find({ "date":{'$regex' : 'Dec', '$options' : 'i'}},{"_id":False});
	tt=list(tt)

	return jsonify({"success":"true","tt":tt})
@app.route("/addfield",methods=["POST"])
def addfield():
	mongo.db.student_info.update({} ,{"$set":{"isDeleted" : "false"}},upsert=True)
	return jsonify({"success":"truehh"})

@app.route("/getdr",methods=["POST"])
def getdr():
	final={}
	#final[""]
	id="5a93eb56ce00f2d360377281"
	dt=mongo.db.dailyreport.find({"_id":ObjectId(id)},{"_id":False})
	dt=list(dt)
	syllabus=mongo.db.syllabus.find({"_id":ObjectId(dt["syll_id"])},{"_id":False});
	syllabus=list(syllabus)
	final["syllabus"]=syllabus
	
	return jsonify({"success":"true","temp":final})


@app.route("/sendsms",methods=["POST"])
def sendsms():
	mobile=request.get_json()["mobile"]
	msg=request.get_json()["msg"]
	sms='http://msg.msgclub.net/rest/services/sendSMS/sendGroupSms?AUTH_KEY=d47cccfbcc9269f165cc8718bd82a2c&message='+str(msg)+'&senderId=MTEDUC&routeId=1&mobileNos='+str(mobile)+'&smsContentType=english'
	
	try:
		requests.get(sms)
		return jsonify({"success":"true"})
	except Exception,e:
		print e
		return jsonify({"success":"false"})



	#'http://msg.msgclub.net/rest/services/sendSMS/sendGroupSms?AUTH_KEY=d47cccfbcc9269f165cc8718bd82a2c&message=helloooo&senderId=MTEDUC&routeId=1&mobileNos=99601369180&smsContentType=english'

@app.route("/updatestatus", methods=["POST"])
def updatestatus():
	branch=request.get_json()["branch"]
	dt=mongo.db.pistatus.find({"branch":branch})
	dt=list(dt)
	tt=str(datetime.now())
	if len(dt):
		result = mongo.db.pistatus.update_one({"branch":branch},{"$set":{"time":tt}},upsert=True)

	else:
		mongo.db.pistatus.insert({"branch":branch,"time":tt})
	
	return jsonify({"success":"true","message":"Successfully Updated"})

@app.route("/markEmpAttendance",methods=["POST"])
def markEmpAttendance():
	mongo.db.staffRfidattendance.update({"staffid":request.get_json()["id"],"date":request.get_json()["date"]},{'$push': {'time': request.get_json()["time"]}}, upsert = True)	
	return jsonify({"success":"true","message":"Attendance Marked"})


@app.route("/getempattendance",methods=["POST"])
def getempattendance():
	staffid=request.get_json()["id"]
	inout=mongo.db.staffRfidattendance.find({"staffid":staffid})
	inout=list(inout)
	for l in inout:
		l["_id"]=str(l["_id"])
	
	if len(inout):
		return jsonify({"success":"true","inout":inout})
	else:
		return jsonify({"success":"false"})

@app.route("/getdashdailyreport",methods=['POST'])
def getdashdailyreport():
	fd=[]
	if(request.get_json()):
		dr={}
		dailyreport=mongo.db.newdailyreport.find_one({"batch":request.get_json()['id']},{"_id":False})
		dr["batch"]=dailyreport["batch"]
		dr["syllabusdetails"]=mongo.db.syllabus.find_one({"_id":ObjectId(dailyreport["syllid"])},{"_id":False})
		one_topic_max_lecture=[]
		temp={"teacherlist":[],"lecrecord":[]};
		
		idx=0
		for sub in dr["syllabusdetails"]["syllabus"]['subject']:
			subname=sub["subject"]
			#print "subject: "+subname

			tp=[]
			t=[]
			for topic in sub["topic"]:
				temp["lecrecord"].append([])
				temp["teacherlist"].append([])
				topicname=topic["topicname"]
				#print "topic: "+topicname
				lec =[]
				lec=mongo.db.staffattendancedetails.find({"topic":topicname,"subject":subname,"batch":dr["batch"]},{"_id":False,"date":True,"staffid":True,"topic":True,"duration":True})
				lec=list(lec)
				templec={}
				for l in lec:
					if(l['duration']-60>20):
							templec=l
							templec["duration"]=l["duration"]-60
							lec.append(l)
			#	print idx
				#if len(lec):
				lec=sortlist(lec)
				staff=[]
				for l in lec:
					if l["staffid"] not in staff:
						staff.append(l["staffid"])

				newlec=lec
				#print staff
				for l in range(len(lec),20):
					newlec.append({"date":"","topic":topicname})

				tp.append(newlec)
				tname=""
				for i in range(0,len(staff)):
					sd=mongo.db.staffdetails.find_one({"_id":ObjectId(staff[i])},{"_id":False,"fname":True,"lname":"True"})
					#sd=list(sd)
					if(i==0):
						tname=tname+sd["fname"]+" " +sd["lname"]+""
					else:
						tname=tname+","+sd["fname"]+" " +sd["lname"]+""
					


				t.append(tname)
			temp["teacherlist"][idx]=t
			temp["lecrecord"][idx]=tp
			idx=idx+1
				
		dr["lecturedetails"]=temp
		fd.append(dr)

	else:

		temp={}
		dailyreport=mongo.db.newdailyreport.find({"isDeleted":"false"})
		dailyreport = list(dailyreport)	
		for daily in dailyreport:

			print "hello"
			temp={}
			daily["_id"]=str(daily["_id"])
			temp["_id"]=daily["_id"]
			temp["batch"]=daily["batch"]
			temp["syllabusdetails"]=mongo.db.syllabus.find_one({"isDeleted":"false","_id":ObjectId(daily['syllid'])},{"syllName":True,"syllyear":True,"_id":False})
			fd.append(temp)

	if len(fd):
		return jsonify({"success":"true","dailyreport":fd})
	else:
		return jsonify({"success":"false","message":"No dailyreport Found. Please add it!"})	

@app.route("/getstaffRfidattendance",methods=["POST"])
def getstaffRfidattendance():
	staffid=request.get_json()["staffid"]
	#staffid="5a0e8e7946465d485268abe9";
	startdate=mongo.db.staffRfidattendance.find({"staffid":staffid},{"date":True}).sort('date',1).limit(1)
	enddate=mongo.db.staffRfidattendance.find({"staffid":staffid},{"date":True}).sort('date',-1).limit(1)

	startdate= list(startdate)
	enddate=list(enddate)
	if len(startdate):
		curdate=datetime.strptime(startdate[0]["date"], '%Y-%m-%d').date()
		enddate=datetime.strptime(enddate[0]["date"], '%Y-%m-%d').date()
	
		attendance=[]
		temp={}
		month=[]
		prevmonth=curdate.strftime("%B-%Y")
		
		while(curdate<=enddate):
			#daytemp={}
			if(prevmonth!=curdate.strftime("%B-%Y")):
				temp["month"]=prevmonth
				temp["mattendance"]=month
				
				attendance.append(temp)
				month=[]
				temp={}
				prevmonth=curdate.strftime("%B-%Y")
			#daytemp["date"]=curdate.strftime("%d")
			ispresent=mongo.db.staffRfidattendance.find({"date":str(curdate),"staffid":staffid},{"staffid":True,"time":True,"date":True,"_id":False})
			ispresent=list(ispresent)
			if len(ispresent):
				month.append(ispresent)
			
			curdate=curdate + timedelta(days=1)

		temp["month"]=curdate.strftime("%B-%Y")
		temp["mattendance"]=month
		attendance.append(temp)
		return jsonify({"success":"true","attendance":attendance})
	else:
		return jsonify({"success":"false","message":"Attendance not found"})

##################################GKB############################
@app.route('/paperinoutfilter',methods=['POST'])
def paperinoutfilter():
	try:
		result=mongo.db.paperinout.find(request.get_json())
		datares=[]
		total_records=0
		total_in=0
		total_out=0
		total_amount=0
		for res in result:
			res['_id']=str(res['_id'])
			if res['Status']=='In':
				total_in+=1
			else:
				total_out+=1
			total_amount+=int(res['Total_Amount'])
			datares.append(res)

		headers=[]
		headers.append('Faculty_Name')
		headers.append('Branch')
		headers.append('batch')
		headers.append('Assign_Date')
		headers.append('Exp_Submission_Date')
		headers.append('Submission_Date')
		headers.append('Subject')
		headers.append('Quantity')
		headers.append('Rate')
		headers.append('penalty')
		headers.append('Total_Amount')
		headers.append('Status')
		
		return jsonify({"success":True,"headers":headers,"paperData":datares,"total_in":total_in,
			"total_out":total_out,"total_amount":total_amount})
	except Exception,e:
		print e
		return jsonify({"success":False})



@app.route('/paperOutentryrevert',methods=['POST'])
def paperOutentryrevert():
	try:
		id=request.get_json()['id']
		mongo.db.paperinout.update({"_id":ObjectId(id)},{'$set':{"Status":"Out"}},True)
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/paperInentry',methods=['POST'])
def paperInentry():
	try:
		id=request.get_json()['id']
		mongo.db.paperinout.update({"_id":ObjectId(id)},{'$set':{"Status":"In"}},True)
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/getbatchesfrombranchpapers',methods=['POST'])
def getbatchesfrombranchpapers():
	try:
		result=mongo.db.branches.find_one({"branchname":request.get_json()['branch']})
		branchid=str(result['_id'])
		allbatches=[]
		result=mongo.db.coursedetails.find({'branchid':branchid})
		for res in result:
			allbatches.append(res['batchname']+"("+res["coursename"]+")")
		return jsonify({"success":True,"batches":allbatches})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/paperinoutedit',methods=['POST'])
def paperinoutedit():
	try:
		id=request.get_json()['editid']
		assigndate=request.get_json()['Assign_Date']
		subject=request.get_json()['Subject']
		quantity=request.get_json()['Quantity']
		rate=request.get_json()['Rate']
		Total_Amount=request.get_json()['Total_Amount']
		Submission_Date=request.get_json()['Submission_Date']
		Exp_Submission_Date=request.get_json()['Exp_Submission_Date']
		penalty=request.get_json()['penalty']
		result = mongo.db.paperinout.update({"_id":ObjectId(id)} ,{"$set":{"Assign_Date":assigndate,"Subject":subject
		,"Quantity":quantity,"Rate":rate,"Total_Amount":Total_Amount,"Exp_Submission_Date":Exp_Submission_Date,
		"penalty":penalty,"Submission_Date":Submission_Date,"batch":request.get_json()['batch']}},
			multi=True,upsert=False)

		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/softdeletepaperrec',methods=['POST'])
def softdeletepaperrec():
	try:
		mongo.db.paperinout.update_one({"_id":ObjectId(request.get_json()['_id'])},{"$set":{"isDeleted":"True"}})
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})
		

@app.route('/paperinoutreadall',methods=['POST'])
def readallpaperinout():
	try:
		result=mongo.db.paperinout.find({"isDeleted":"False"})
		datares=[]
		total_records=0
		total_in=0
		total_out=0
		total_amount=0

		for res in result:
			res['_id']=str(res['_id'])
			if res['Status']=='In':
				total_in+=1
			else:
				total_out+=1
			total_amount+=int(res['Total_Amount'])
			datares.append(res)
		headers=[]
		headers.append('Faculty_Name')
		headers.append('Branch')
		headers.append('batch')
		headers.append('Assign_Date')
		headers.append('Exp_Submission_Date')
		headers.append('Submission_Date')
		headers.append('Subject')
		headers.append('Quantity')
		headers.append('Rate')
		headers.append('penalty')
		headers.append('Total_Amount')
		headers.append('Status')

		return jsonify({"success":True,"headers":headers,"paperData":datares,"total_in":total_in,
			"total_out":total_out,"total_amount":total_amount})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/paperinoutgetstaff',methods=['POST'])
def getstaffandcity():
	try:
		result=mongo.db.staffdetails.find({},{"fname":True,"mname":True,"lname":True,"_id":False})
		fullname=[]
	#get staff id
		for res in result:
			temp=res['fname']+' '+res['mname']+' '+res['lname']
			fullname.append(temp)
		fullname=list(set(fullname))	
	#get city and branch
		branches=[]
		result=mongo.db.branches.find({},{"branchname":True,"cityid":True,"_id":False})
		for res in result:
			bname=res['branchname']
			cityname=mongo.db.cities.find_one({"_id":ObjectId(res['cityid'])},{"cityname":True,"_id":False})
			bname=bname+"("+cityname['cityname']+")"
			branches.append(bname)
		result=mongo.db.coursedetails.find()
		batches=[]
		for res in result:
			batches.append(res['batchname']+"("+res['coursename']+")")
		return jsonify({"success":True,"name":fullname,"branches":branches,"batches":batches})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/paperinoutaddout',methods=['POST'])
def addoutentry():
	try:
		mongo.db.paperinout.insert(request.get_json())
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})


###############################accoount passbook################################3333


@app.route('/passbookBalancefilter',methods=['POST'])
def passbookBalancefilter():
	try:
		#here  we calculate passbook actual balance plus minu credit debit balance
		result=mongo.db.balance.find({},{"balance":True,"_id":False})
		amount=int(result[0]['balance'])
		inamt=0
		outamt=0
		print request.get_json()
		result=mongo.db.bankpassbook.find(request.get_json())
		allData=[]
		dates=[]

		for res in result:
			res['_id']=str(res['_id'])
			tmpdata={}
			dates.append(res['entrydate'])
			tmpdata['_id']=res['_id']
			tmpdata['Amount']=res['Amount']
			tmpdata['EntryDate']=res['entrydate']
			tmpdata['Mode']=res['mode']
			tmpdata['AmountType']=res['Amounttype']

			

			if res['mode']=='cash':
				tmpdata['ChequeNo']='NA'
				tmpdata['ChequeDate']='NA'
				tmpdata['ChequeType']='NA'
				tmpdata['ChequeStatus']='NA'
				tmpdata['HolderName']='NA'
				if res['Amounttype']=='In':
					inamt+=float(res['Amount'])
				else:
					outamt+=float(res['Amount'])
					
			else:
				tmpdata['ChequeNo']=res['chequeno']
				tmpdata['ChequeDate']=res['chequedate']
				tmpdata['Amount']=res['Amount']
				tmpdata['AmountType']=res['Amounttype']
				tmpdata['HolderName']=res['chequeholdername']
				if res['Amounttype']=='In':
					inamt+=float(res['Amount'])
				else:
					outamt+=float(res['Amount'])
				

				 
			allData.append(tmpdata)
		 
		headers=[]

		headers.append('ChequeDate')
		headers.append('ChequeNo')
		headers.append('HolderName')
		headers.append('Amount')
		headers.append('EntryDate')
		headers.append('Mode')
		headers.append('AmountType')

		inamt+=amount
		current_totalamt=inamt-outamt
		return jsonify({"headers":headers,"success":True,"allData":allData,"In":inamt,"Out":outamt,"currentamt":current_totalamt})
		
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/assignpassbookcheque',methods=['POST'])
def assignpassbookcheque():
	try:
		mongo.db.assigncheque.insert(request.get_json())
		return jsonify({"success":True})
	except Exception,e:
		return jsonify({"success":False})

@app.route('/savepassbookrecord',methods=['POST'])
def savepassbookrecord():
	try:
		mongo.db.bankpassbook.insert(request.get_json())
		return jsonify({"success":True})
	except Exception,e:
		return jsonify({"success":False})

@app.route('/addbalance',methods=['POST'])
def addbalance():
	uname=request.get_json()['uname']
	upass=request.get_json()['upass']
	balance=request.get_json()['balance']
	date=str(datetime.now().strftime ("%d-%m-%Y"))

	result=mongo.db.userlogins.find({"username":uname,"password":upass,"usertype":"2"}).count()
	if result==1:
		mongo.db.balance.update({"username":uname},{'$set':{"username":uname,"password":upass,"balance":balance,"date":date}},True)
		return jsonify({"success":True})
	else:
		return jsonify({"success":False})

@app.route('/getchqdataadgrid',methods=['POST'])
def getchqdataadgrid():
	try:
		chqassign={}
		result=mongo.db.assigncheque.find()
		for res in result:
			res['_id']=str(res['_id'])
			chqassign[res['_id']]=res
		#get all cheque data
		searchdata=mongo.db.bankpassbook.find({"mode":"Cheque"})
		searchdata=list(searchdata)
		allData=[]
		for key in chqassign:
			start=int(chqassign[key]['startchqno'])
			end=int(chqassign[key]['endchqno'])+1
			for i in range(start,end):
				flag=0
				tmpdata={}
				for search in searchdata:
					if str(i)==str(search['chequeno']):
						tmpdata['ChequeNo']=i
						tmpdata['ChequeDate']=search['chequedate']
						tmpdata['Amount']=search['Amount']
						tmpdata['AmountType']=search['Amounttype']
						tmpdata['AssignTo']=chqassign[key]['staffnameassign']
						flag=1
				if flag==0:
					tmpdata['ChequeNo']=i
					tmpdata['ChequeDate']=""
					tmpdata['Amount']=""
					tmpdata['AmountType']=""
					tmpdata['AssignTo']=chqassign[key]['staffnameassign']
				allData.append(tmpdata)

					 	
		headers=[]
 		headers.append('ChequeNo')
		headers.append('ChequeDate')
		headers.append('Amount')
		headers.append('AmountType')
		headers.append('AssignTo')
		return jsonify({"headers":headers,"success":True,"allData":allData})
			 		
	except Exception,e:
		print e
		return jsonify({"success":False})
	return jsonify({"success":False})

		
@app.route('/deletefrompassbook',methods=['POST'])
def deletefrompassbook():
	try:
		mongo.db.bankpassbook.delete_one({"_id":ObjectId(request.get_json()['_id'])})
		return jsonify({"success":True})
	except Exception,e:
		return jsonify({"success":False})


@app.route('/gettotalpassbookBalance',methods=['POST'])
def gettotalpassbookBalance():
	try:
		#here  we calculate passbook actual balance plus minu credit debit balance
		result=mongo.db.balance.find({},{"balance":True,"_id":False})
		amount=int(result[0]['balance'])
		inamt=0
		outamt=0
		result=mongo.db.bankpassbook.find()
		allData=[]
		dates=[]

		for res in result:
			res['_id']=str(res['_id'])
			tmpdata={}
			dates.append(res['entrydate'])
			tmpdata['_id']=res['_id']
			tmpdata['Amount']=res['Amount']
			tmpdata['EntryDate']=res['entrydate']
			tmpdata['Mode']=res['mode']
			tmpdata['AmountType']=res['Amounttype']
			tmpdata['Description']=res['description']
			

			if res['mode']=='cash':
				tmpdata['ChequeNo']='NA'
				tmpdata['ChequeDate']='NA'
				tmpdata['ChequeType']='NA'
				tmpdata['ChequeStatus']='NA'
				tmpdata['HolderName']='NA'
				if res['Amounttype']=='In':
					inamt+=float(res['Amount'])
				else:
					outamt+=float(res['Amount'])
					
			else:
				tmpdata['ChequeNo']=res['chequeno']
				tmpdata['ChequeDate']=res['chequedate']
				tmpdata['Amount']=res['Amount']
				tmpdata['AmountType']=res['Amounttype']
				tmpdata['HolderName']=res['chequeholdername']
				if res['Amounttype']=='In':
					inamt+=float(res['Amount'])
				else:
					outamt+=float(res['Amount'])
				

				 
			allData.append(tmpdata)
		 
		headers=[]

		headers.append('ChequeDate')
		headers.append('ChequeNo')
		headers.append('HolderName')
		headers.append('Amount')
		headers.append('EntryDate')
		headers.append('Mode')
		headers.append('AmountType')
		headers.append('Description')
		inamt+=amount
		current_totalamt=inamt-outamt
		return jsonify({"headers":headers,"success":True,"LastUpdate":max(dates),"allData":allData,"In":inamt,"Out":outamt,"currentamt":current_totalamt})
		
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/getoutentrys',methods=['POST'])
def getoutentrys():
	try:
		result=mongo.db.paymentout.find({})
		tot_amountout=0
		tot_pedingout=0
		allData=[]
		headers=[]
		for res in result:
			tmpdata={}
			tmpdata['_id']=str(res['_id'])
			if res['mode']=='cheque':
				tmpdata['ESPLCITY']=res['esplcity']
				tmpdata['ESPLBRANCH']=res['esplbranch']
				tmpdata['AMOUNT']=res['Amount']
				tmpdata['ENTRYDATE']=res['entrydate']
				tmpdata['MODE']=res['mode']
				tmpdata['CHEQUENO']=res['chequeno']
				tmpdata['DESCRIPTION']=res['outdesciption']
				tmpdata['STATUS']=res['status']
				if res['status']=='Pending':
					tot_pedingout+=float(res['Amount'])
				tot_amountout+=float(res['Amount'])
				allData.append(tmpdata)
			else:
				tmpdata['ESPLCITY']=res['esplcity']
				tmpdata['ESPLBRANCH']=res['esplbranch']
				tmpdata['AMOUNT']=res['Amount']
				tmpdata['ENTRYDATE']=res['entrydate']
				tmpdata['MODE']=res['mode']
				tmpdata['CHEQUENO']='NA'
				tmpdata['DESCRIPTION']=res['outdesciption']
				tmpdata['STATUS']='Paid'
				tot_amountout+=float(res['Amount'])
				allData.append(tmpdata)
		
		headers.append('ESPLCITY')
		headers.append('ESPLBRANCH')
		headers.append('AMOUNT')
		headers.append('ENTRYDATE')
		headers.append('MODE')
		headers.append('CHEQUENO')
		headers.append('DESCRIPTION')
		headers.append('STATUS')
		return jsonify({"headers":headers,"success":True,"allData":allData,"tot_amountout":tot_amountout,"tot_pedingout":tot_pedingout})
	except Exception,e:
		return jsonify({"success":False})

@app.route('/saveoutrecords',methods=['POST'])
def saveoutrecords():
	try:
		mongo.db.paymentout.insert(request.get_json())
		return jsonify({"success":True})
	except Exception,e:
		return jsonify({"success":False})
@app.route('/sudentinoutrecordsfilter',methods=['POST'])
def sudentinoutrecordsfilter():
	try:
		cityData={}
		citys=mongo.db.cities.find({},{"cityname":True})
		for city in citys:
			cityData[str(city['_id'])]=city['cityname']
		result=mongo.db.student_info.find({"admitStatus":"1","isDeleted":"false"})
		allrecords=[]
		total_amount=0
		pending_in=0
		paid_in=0
		for res in result:
			if "payment" in res:
				for pay in res["payment"]:
					tmpdata={}
					tmpdata['_id']=str(res['_id'])
					print tmpdata['_id']
					tmpdata['Name']=res['firstName']+" "+res['middleName']+" "+res['lastName']
					tmpdata['City']=cityData[res['cityid']]
					tmpdata['Center']=res['Center']
					tmpdata['Batch']=res['Batch']
					tmpdata['Product']=res['product']
					tmpdata['AdmissionDate']=res['admissiondate']
					tmpdata['BoardName']=res['BoardName']
					tmpdata["Mode"] = res["payment"][pay]["mode"]
					flag=0
					for key in request.get_json():
						if tmpdata[key]!=request.get_json()[key]:
							flag=1
					if flag==0:
						print pay,res['_id']
						if tmpdata['Mode']=='Cheque':
							if "Status" in res["payment"][pay]:
								tmpdata['Status']=res["payment"][pay]["Status"]
							else:
								print 'Status not define ',tmpdata['Center'],tmpdata['_id']
								tmpdata['Status']='Not Mention'

							if "Amount" in res["payment"][pay]:
								tmpdata['Amount']=res["payment"][pay]["Amount"]
								if "statusfromaccount" in res["payment"][pay]:
									if res["payment"][pay]["statusfromaccount"]=="Paid":
										tmpdata['Status']="Paid"
										paid_in+=float(tmpdata['Amount'])
									else:
										tmpdata['Status']="Pending"
										pending_in+=float(tmpdata['Amount'])
								else:
									tmpdata['Status']="Pending"
									pending_in+=float(tmpdata['Amount'])
							else:
								print 'Amount not define ',tmpdata['Center'],tmpdata['_id']
								tmpdata['Amount']='000'	
						else:
							if "Status" in res["payment"][pay]:
								tmpdata['Amount']=res["payment"][pay]["Amount"]
								tmpdata['Status']=res["payment"][pay]["Status"]
								if(tmpdata['Status']=='Paid'):
									paid_in+=float(tmpdata['Amount'])
								else:
									pending_in+=float(tmpdata['Amount'])
							else:
								print 'Status not define ',tmpdata['Center'],tmpdata['_id']
								tmpdata['Status']='Not Mention'		
						allrecords.append(tmpdata)
						
			else:
				print 'payment not mention ',tmpdata['_id']
		total_amount=paid_in+pending_in	 		
		headers=[]
		headers.append('Name')
		headers.append('AdmissionDate')
		headers.append('City')
		headers.append('Center')
		headers.append('Batch')
		headers.append('BoardName')
		headers.append('Product')
		headers.append('Mode')
		headers.append('Amount')
		headers.append('Status')		
		return jsonify({"success":True,"records":allrecords,"headers":headers,"paid_in":paid_in,"pending_in":pending_in,
			"total_amount":total_amount})
		
	except Exception,e:
		print 'Exception ',e

@app.route('/getoutentrysfilter',methods=['POST'])
def getoutentrysfilter():
	try:
		tot_amountout=0
		tot_pedingout=0
		result=mongo.db.paymentout.find(request.get_json())
		allData=[]
		headers=[]
		for res in result:
			tmpdata={}
			tmpdata['_id']=str(res['_id'])
			if res['mode']=='cheque':
				tmpdata['ESPLCITY']=res['esplcity']
				tmpdata['ESPLBRANCH']=res['esplbranch']
				tmpdata['AMOUNT']=res['Amount']
				tmpdata['ENTRYDATE']=res['entrydate']
				tmpdata['MODE']=res['mode']
				tmpdata['CHEQUENO']=res['chequeno']
				tmpdata['DESCRIPTION']=res['outdesciption']
				tmpdata['STATUS']=res['status']
				if res['status']=='Pending':
					tot_pedingout+=float(res['Amount'])
				tot_amountout+=float(res['Amount'])
				allData.append(tmpdata)
			else:
				tmpdata['ESPLCITY']=res['esplcity']
				tmpdata['ESPLBRANCH']=res['esplbranch']
				tmpdata['AMOUNT']=res['Amount']
				tmpdata['ENTRYDATE']=res['entrydate']
				tmpdata['MODE']=res['mode']
				tmpdata['CHEQUENO']='NA'
				tmpdata['DESCRIPTION']=res['outdesciption']
				tmpdata['STATUS']='Paid'
				tot_amountout+=float(res['Amount'])
				allData.append(tmpdata)
		
		headers.append('ESPLCITY')
		headers.append('ESPLBRANCH')
		headers.append('AMOUNT')
		headers.append('ENTRYDATE')
		headers.append('MODE')
		headers.append('CHEQUENO')
		headers.append('DESCRIPTION')
		headers.append('STATUS')
		return jsonify({"headers":headers,"success":True,"allData":allData,"tot_amountout":tot_amountout,"tot_pedingout":tot_pedingout})
	except Exception,e:
		return jsonify({"success":False})

@app.route('/changestatustopaid',methods=['POST'])
def changestatustopaid():
	try:
		print request.get_json()
		mongo.db.student_info.update_one({"_id":ObjectId(request.get_json()['_id'])},{"$set":{"payment."+str(request.get_json()['pay'])+".statusfromaccount":request.get_json()['status']}})
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})
		

@app.route('/chequerecordsgetall',methods=['POST'])
def chequerecordsgetall():
	try:
		paid=0
		pending=0
		cityData={}
		citys=mongo.db.cities.find({},{"cityname":True})
		for city in citys:
			cityData[str(city['_id'])]=city['cityname']
		result=mongo.db.student_info.find({"admitStatus":"1","isDeleted":"false"})
		allrecords=[]
		city=[]
		
		for res in result:
			if "payment" in res:
				for pay in res["payment"]:
					tmpdata={}
					tmpdata['pay']=pay
					tmpdata['_id']=str(res['_id'])
					tmpdata['Name']=res['firstName']+" "+res['middleName']+" "+res['lastName']
					tmpdata['City']=cityData[res['cityid']]
					tmpdata['Center']=res['Center']
					tmpdata["Mode"] = res["payment"][pay]["mode"]
					if tmpdata['Mode']=='Cheque':
						if "Status" in res["payment"][pay]:
							tmpdata['Amount']=res["payment"][pay]["Amount"]
							tmpdata['Status']=res["payment"][pay]["Status"]
						else:
							print 'Status not define ',tmpdata['Center'],tmpdata['_id']

						if "statusfromaccount" in res["payment"][pay]:
							if res["payment"][pay]["statusfromaccount"]=="Paid":
								tmpdata['Status']="Paid"
								paid+=1
							else:
								tmpdata['Status']="Pending"
								pending+=1
								
						else:
							tmpdata['Status']="Pending"
							pending+=1
							

						if 'Number' in res["payment"][pay]:
							tmpdata['ChequeNumber']=res["payment"][pay]["Number"]
						else:
							tmpdata['ChequeNumber']='000'
							print 'Cheque Number not define ',tmpdata['_id']

						if 'Date' in res["payment"][pay]:
							tmpdata['ChequeDate']=res["payment"][pay]["Date"]
						else:
							tmpdata['ChequeDate']='No Date Mention'
							print 'Cheque Date not define ',tmpdata['_id']	

						if 'AccountHolderName' in res["payment"][pay]:
							tmpdata['HolderName']=res["payment"][pay]["AccountHolderName"]
						else:
							tmpdata['HolderName']='Not Mention'
							print 'Cheque Account Holder not define ',tmpdata['_id']

						if 'NameOfBank' in res["payment"][pay]:
							tmpdata['NameOfBank']=res["payment"][pay]["NameOfBank"]
						else:
							tmpdata['NameOfBank']='Not Mention'
							print 'Cheque Bank not define ',tmpdata['_id']					
						allrecords.append(tmpdata)
			else:
				print 'payment not mention ',tmpdata['Center'],tmpdata['_id']
		headers=[]
		headers.append('Name')
		headers.append('City')
		headers.append('Center')
		headers.append('ChequeNumber')
		headers.append('Amount')
		headers.append('ChequeDate')
		headers.append('HolderName')
		headers.append('NameOfBank')
		headers.append('Status')
		
			#print len(allrecords)
		return jsonify({"success":True,"records":allrecords,"headers":headers,"paid":paid,"pending":pending})
	except Exception,e:
		print "Exception ",e
		return ''

@app.route('/sudentinoutrecords',methods=['POST'])
def sudentinoutrecords():
	try:
		cityData={}
		citys=mongo.db.cities.find({},{"cityname":True})
		for city in citys:
			cityData[str(city['_id'])]=city['cityname']
		result=mongo.db.student_info.find({"admitStatus":"1","isDeleted":"false"})
		allrecords=[]
		city=[]
		center=[]
		batch=[]
		product=[]
		mode=[]
		status=[]
		board=[]
		total_amount=0
		pending_in=0
		paid_in=0
		try:
			mongo.db.accounterror.remove({"section":"Student INOut"})
		except Exception,e:
			print e	

		for res in result:
			if "payment" in res:
				for pay in res["payment"]:

					tmpdata={}
					tmpdata['_id']=str(res['_id'])
					print tmpdata['_id']
					tmpdata['Name']=res['firstName']+" "+res['middleName']+" "+res['lastName']
					tmpdata['City']=cityData[res['cityid']]
					city.append(tmpdata['City'])
					tmpdata['Center']=res['Center']
					center.append(tmpdata['Center'])
					tmpdata['Batch']=res['Batch']
					batch.append(tmpdata['Batch'])
					tmpdata['Product']=res['product']
					product.append(tmpdata['Product'])
					tmpdata['AdmissionDate']=res['admissiondate']
					tmpdata['BoardName']=res['BoardName']
					board.append(tmpdata['BoardName'])
					
					tmpdata["Mode"] = res["payment"][pay]["mode"]
					mode.append(tmpdata['Mode'])
					if tmpdata['Mode']=='Cheque':
						if "Status" in res["payment"][pay]:
							tmpdata['Status']=res["payment"][pay]["Status"]
						else:
							print 'Status not define ',tmpdata['Center'],tmpdata['_id']
							tmpdata['Status']='Not Mention'
							addaccouterror(tmpdata['Name']+' at '+tmpdata['Center']+' ,Cheque Status Not Mention','Student INOut')

						if "Amount" in res["payment"][pay]:
							tmpdata['Amount']=res["payment"][pay]["Amount"]
							if "statusfromaccount" in res["payment"][pay]:
								if res["payment"][pay]["statusfromaccount"]=="Paid":
									tmpdata['Status']="Paid"
									paid_in+=float(tmpdata['Amount'])
								else:
									tmpdata['Status']="Pending"
									pending_in+=float(tmpdata['Amount'])
							else:
								tmpdata['Status']="Pending"
								pending_in+=float(tmpdata['Amount'])
						else:
							print 'Amount not define ',tmpdata['Center'],tmpdata['_id']
							tmpdata['Amount']='000'
							addaccouterror(tmpdata['Name']+' at '+tmpdata['Center']+' ,Cheque Amount Not Mention','Student INOut')
							
						
									
					else:
						if "Status" in res["payment"][pay]:
							tmpdata['Amount']=res["payment"][pay]["Amount"]
							tmpdata['Status']=res["payment"][pay]["Status"]
							if(tmpdata['Status']=='Paid'):
								paid_in+=float(tmpdata['Amount'])
							else:
								pending_in+=float(tmpdata['Amount'])
							status.append(tmpdata['Status'])
						else:
							print 'Status not define ',tmpdata['Center'],tmpdata['_id']
							tmpdata['Status']='Not Mention'
							addaccouterror(tmpdata['Name']+' at '+tmpdata['Center']+' ,Cash Status Not Mention','Student INOut')
					allrecords.append(tmpdata)	
			else:
				print 'payment not mention ',res['Center'],res['_id']
				addaccouterror(res['firstName']+' '+res['middleName']+' '+res['lastName']+' Payment Not Mention at '+res['Center'],'Student INOut')
		total_amount=paid_in+pending_in
		city=list(set(city))
		center=list(set(center))
		batch=list(set(batch))
		product=list(set(product))
		mode=list(set(mode))
		status=list(set(status))
		board=list(set(board))		
 		headers=[]
		headers.append('Name')
		headers.append('AdmissionDate')
		headers.append('City')
		headers.append('Center')
		headers.append('Batch')
		headers.append('BoardName')
		headers.append('Product')
		headers.append('Mode')
		headers.append('Amount')
		headers.append('Status')
			#print len(allrecords)
		return jsonify({"success":True,"records":allrecords,"headers":headers,"city":city,
			"center":center,"batch":batch,"product":product,"mode":mode,"status":status,"board":board,
			"paid_in":paid_in,"pending_in":pending_in,"total_amount":total_amount})
	except Exception,e:
		print "Exception ",e
		return ''


@app.route('/accountDash',methods=['POST'])
def accountDash():
	try:
		#here  we calculate passbook actual balance plus minu credit debit balance
		result=mongo.db.balance.find({},{"balance":True,"_id":False})
		amount=int(result[0]['balance'])
		debit_pending=0
		debit_clear=0
		credit_pending=0
		credit_clear=0
		total_credit=0;
		result=mongo.db.bankpassbook.find()
		dates=[]
		for res in result:
			dates.append(res['entrydate'])
			if res['mode']=='cheque':
				if res['chqoption']=='Credit':
					if res['status']=='Pending':
						credit_pending+=float(res['Amount'])
					else:
						credit_clear+=float(res['Amount'])
				else:
					if res['status']=='Pending':
						debit_pending+=float(res['Amount'])
					else:
						debit_clear+=float(res['Amount'])
			else:
				credit_clear+=float(res['Amount'])
		total_credit=amount+credit_clear+credit_pending-debit_pending-debit_clear
		print 'Account Balance ',total_credit
		datesdata=max(dates)
		print 'Last Updated at ',max(dates)

		#for total student income
		cityData={}
		citys=mongo.db.cities.find({},{"cityname":True})
		for city in citys:
			cityData[str(city['_id'])]=city['cityname']
		result=mongo.db.student_info.find({"admitStatus":"1","isDeleted":"false"})
		allrecords=[]
		city=[]
		center=[]
		batch=[]
		product=[]
		mode=[]
		status=[]
		board=[]
		total_amount=0
		pending_in=0
		paid_in=0
		for res in result:
			if "payment" in res:
				for pay in res["payment"]:
					tmpdata={}
					tmpdata["Mode"] = res["payment"][pay]["mode"]
					if tmpdata['Mode']=='Cheque':
						if "Status" in res["payment"][pay]:
							tmpdata['Status']=res["payment"][pay]["Status"]
						else:
							tmpdata['Status']='Not Mention'
						if "Amount" in res["payment"][pay]:
							tmpdata['Amount']=res["payment"][pay]["Amount"]
							if "statusfromaccount" in res["payment"][pay]:
								if res["payment"][pay]["statusfromaccount"]=="Paid":
									tmpdata['Status']="Paid"
									paid_in+=float(tmpdata['Amount'])
								else:
									tmpdata['Status']="Pending"
									pending_in+=float(tmpdata['Amount'])
							else:
								tmpdata['Status']="Pending"
								pending_in+=float(tmpdata['Amount'])
						else:
							tmpdata['Amount']='000'
							
						
									
					else:
						if "Status" in res["payment"][pay]:
							tmpdata['Amount']=res["payment"][pay]["Amount"]
							tmpdata['Status']=res["payment"][pay]["Status"]
							if(tmpdata['Status']=='Paid'):
								paid_in+=float(tmpdata['Amount'])
							else:
								pending_in+=float(tmpdata['Amount'])
						else:
							tmpdata['Status']='Not Mention'
		total_amount=paid_in+pending_in
		# cityData={}
		# citys=mongo.db.cities.find({},{"cityname":True})
		# for city in citys:
		# 	cityData[str(city['_id'])]=city['cityname']
		# result=mongo.db.student_info.find({"admitStatus":"1","isDeleted":"false"})
		# allrecords=[]
		# city=[]
		# center=[]
		# batch=[]
		# product=[]
		# mode=[]
		# status=[]
		# board=[]
		# total_amount=0
		# pending_in=0
		# paid_in=0

		# for res in result:
		# 	if "payment" in res:
		# 		for pay in res["payment"]:
		# 			if "Status" in res["payment"][pay]:
		# 				if(res["payment"][pay]["Status"]=='Paid'):
		# 					paid_in+=float(res["payment"][pay]["Amount"])
		# 				else:
		# 					pending_in+=float(res["payment"][pay]["Amount"])
		# 				total_amount+=float(res["payment"][pay]["Amount"])
						
		# 	else:
		# 		print 'payment not mention '
		# print 'Total student amount ',total_amount
		# print 'Total pending amount ',pending_in
		# print 'Total paid amount ',paid_in
		# #getsalary records
		salarydata=[]
		result=mongo.db.salarymonthwise.find()
		no=1
		
		
		for res in result:
			res['no']=no
			no+=1
			res['_id']=str(res['_id'])
			salarydata.append(res)
		
		#get all centers for graph
		rescenters=mongo.db.branches.find()
		allData=[]
		datagraph=['BRACH','INCOME','PAID','PENDING']
		allData.append(datagraph)
		centers=[]
		for ces in rescenters:
			obj={}
			obj['Center']=ces['branchname']
			amount,paid_inb,pending_inb=brachwisemoneyforchart(obj)
			datagraph=[obj['Center'],amount,paid_inb,pending_inb]
			allData.append(datagraph)

		citys=mongo.db.cities.find({},{"cityname":True})
		piedata=[]
		tmpdata=['City','Income']
		piedata.append(tmpdata)
		obj={}
		for city in citys:
			obj['City']=city['cityname']
			amount,paid_inb,pending_inb=brachwisemoneyforchart(obj)
			tmpdata=[city['cityname'],amount]
			piedata.append(tmpdata)
		print 'monthwise',salarydata
		return jsonify({"piedata":piedata,"allData":allData,"success":True,"salarydata":salarydata,"total_amount":total_amount,"pending_in":pending_in,"paid_in":paid_in,"total_credit":total_credit,"datesdata":datesdata})
	except Exception,e:
		print e
		return ''
		
def brachwisemoneyforchart(obj):
	try:
		cityData={}
		citys=mongo.db.cities.find({},{"cityname":True})
		for city in citys:
			cityData[str(city['_id'])]=city['cityname']
		result=mongo.db.student_info.find({"admitStatus":"1","isDeleted":"false"})
		allrecords=[]
		total_amount=0
		pending_in=0
		paid_in=0
		for res in result:
			tmpdata={}
			tmpdata['_id']=str(res['_id'])
			tmpdata['Name']=res['firstName']+" "+res['middleName']+" "+res['lastName']
			tmpdata['City']=cityData[res['cityid']]
			tmpdata['Center']=res['Center']
			tmpdata['Batch']=res['Batch']
			tmpdata['Product']=res['product']
			tmpdata['AdmissionDate']=res['admissiondate']
			tmpdata['BoardName']=res['BoardName']
			citywisein={}
			if "payment" in res:
				for pay in res["payment"]:
					tmpdata["Mode"] = res["payment"][pay]["mode"]
					if "Status" in res["payment"][pay]:
						tmpdata['Amount']=res["payment"][pay]["Amount"]
						tmpdata['Status']=res["payment"][pay]["Status"]
						flag=0
						for key in obj:
							if tmpdata[key]!=obj[key]:
								flag=1
						if flag==0:
							allrecords.append(tmpdata)
							if(tmpdata['Status']=='Paid'):
								paid_in+=float(tmpdata['Amount'])
							else:
								pending_in+=float(tmpdata['Amount'])
							total_amount+=float(tmpdata['Amount'])
					else:
						print 'Status not define ',tmpdata['_id']
						
			else:
				print 'payment not mention ',tmpdata['_id']
			 		
		print "In ",paid_in
		return total_amount,paid_in,pending_in
		
	except Exception,e:
		print 'Exception ',e	

		
# @app.route('/doLogin', methods=['POST'])
# def doLogin():
# 	formdata = request.get_json()
# 	result = mongo.db.userlogins.find({"username":formdata['username'],"password":formdata['password'],"statusActive":"1","isDeleted":"false"})
# 	newResult = list(result)
# 	for nres in newResult:
# 		nres["_id"]=str(nres["_id"])
# 	if len(newResult):
# 		return jsonify({"success": "true", "message": "Login Successfull!", "data":newResult})
# 	else:
# 		return jsonify({"success": "false", "message": "Username/Password is incorrect!"})

#function for feedback form		
#get branches
@app.route('/getbranches',methods=['POST'])
def getbranches():
	try:
		branches=mongo.db.branches.find()
		branch=[]
		for br in branches:
			tmp={}
			tmp['name']=br['branchname']
			tmp['cityid']=br['cityid']
			branch.append(tmp)
		return jsonify({"success":True,"branch":branch})	
	except Exception,e:
		print e	
		return jsonify({"success":False})

@app.route('/buttonstatusfeedback',methods=['POST'])
def buttonstatusfeedback():
	try:
		print request.get_json()
		val=''
		if request.get_json()['status']==True:
			val='on'
		else:
			request.get_json()['status']==False
			val='off'
				
		mongo.db.feedbackbutton.update_one({"_id":ObjectId(request.get_json()['_id'])},{"$set":{"visible":val}})
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})
			

@app.route('/deletefeedback',methods=['POST'])
def deletefeedback():
	try:
		mongo.db.feedback.remove({"_id":ObjectId(request.get_json()['_id'])})
		return jsonify({"success":True})
	except Exception,e:
		print e	
		return jsonify({"success":False})

@app.route('/approvefeedback',methods=['POST'])
def approvefeedback():
	try:
		mongo.db.feedback.update_one({'_id':ObjectId(request.get_json()['_id'])},{"$set":{"approve":request.get_json()['approve']}})
		return jsonify({"success":True})
	except Exception,e:
		print e	
		return jsonify({"success":False})

@app.route('/getfeedback',methods=['POST'])
def getfeedback():
	try:
		result=mongo.db.feedback.find()
		allData=[]
		for res in result:
			tmp={}
			tmp['_id']=str(res['_id'])
			tmp['ParentName']=res['name_parents']
			tmp['ParentMobile']=res['name_mobile']
			tmp['WardName']=res['name_ward']
			tmp['Center']=res['name_branch']
			tmp['Feedback']=res['name_feedback']
			tmp['approve']=res['approve']
			allData.append(tmp)
		headers=[]
		headers.append('ParentName')
		headers.append('ParentMobile')
		headers.append('WardName')
		headers.append('Center')
		headers.append('Feedback')
		headers.append('Status')
		#feedback button
		result=mongo.db.feedbackbutton.find_one()
		buttondata=[]
		tmp={}
		tmp['visible']=result['visible']
		tmp['_id']=str(result['_id'])
		buttondata.append(tmp)
		return jsonify({"success":True,"alldata":allData,"headers":headers,"buttondata":buttondata})	
	except Exception,e:
		print e	
		return jsonify({"success":False})

@app.route('/addfeedback',methods=['POST'])
def addfeedback():
	try:
		result=mongo.db.student_info.find({"$or":[{"fatherMobile":request.get_json()['name_mobile']},{"motherMobile":request.get_json()['name_mobile']}]}).count()
		if result!=0:
			#set default approve is 0
			request.get_json()['approve']='0'
			mongo.db.feedback.insert(request.get_json())
			return jsonify({"success":True})
		else:
			return jsonify({"success":False,"message":"Mobile Number not Registered!!"})	
	except Exception,e:
		print e	
		return jsonify({"success":False})

@app.route('/deleteadvance',methods=['POST'])
def deleteadvance():
	try:
		mongo.db.advance.delete_one({"_id":ObjectId(request.get_json()['_id'])})
		return jsonify({"success":True})
	except Exception,e:
		return jsonify({"success":False})
@app.route('/updatestffattenfromaccount',methods=['POST'])
def updatestffattenfromaccount():
	try:
		mongo.db.staffattendancedetails.update_one({"_id":ObjectId(request.get_json()['_id'])},{"$set":{"duration":request.get_json()['duration']}})
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})
		
@app.route('/deletefromsalaryaccount',methods=['POST'])
def deletefromsalaryaccount():
	try:
		mongo.db.salary.delete_one({"_id":ObjectId(request.get_json()['_id']),"staffid":request.get_json()['staffid']})
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})


@app.route('/advanceupdateinsalary',methods=['POST'])
def advanceupdateinsalary():
	try:
		salary_month=request.get_json()['month']
		salary_year=request.get_json()['year']
		tempdate=salary_month+"-"+salary_year
		staffid=request.get_json()['staffid']
		result=mongo.db.salary.find_one({"staffid":staffid,"salarydate":tempdate})
		advance=result['Advance']
		newadvance=request.get_json()['newadvance']
		advancedb=mongo.db.advance.find_one({'staffid':staffid,'lastdeductionmonth':salary_month})
		isactive='true'
		#rolback
		currentremadv=float(advancedb['currentremadv'])+float(advance)
		print currentremadv
		advance_monwise=advancedb['advance_monwise']
		if newadvance<currentremadv:
			currentremadv=currentremadv-newadvance
			Netpay=float(result['Netpay'])+advance-newadvance
			advance_monwise[tempdate]=newadvance
			mongo.db.advance.update_one({'staffid':staffid,'lastdeductionmonth':salary_month},{"$set":{
					"isactive":isactive,"currentremadv":currentremadv,"advance_monwise":advance_monwise}})
			mongo.db.salary.update_one({'staffid':staffid,'salarydate':tempdate},{"$set":{
					"Netpay":Netpay,"Advance":newadvance}})
			return jsonify({"success":True,"message":"Advance Updated Successfully!!"})	

		elif float(currentremadv)-float(newadvance)<0:
			return jsonify({"success":False,"message":"Advance is Greater Than Remaining Amount"})


	except Exception,e:
		print e
		return jsonify({"success":False,"message":e})

@app.route('/deleteassignchq',methods=['POST'])
def deleteassignchq():
	id_to_delete = request.get_json()["_id"]
	try:
		mongo.db.assigncheque.delete_one({"_id":ObjectId(id_to_delete)})	
		return jsonify({"success":True,"message":"Deleted Successfully!"})
	except:
		return jsonify({"success":False,"message":"Not deleted! Something Went Wrong!!"})

@app.route('/getchqassign',methods=['POST'])
def getchqassign():
	try:
		result=mongo.db.assigncheque.find()
		allData=[]
		for res in result:
			tmp={}
			tmp['_id']=str(res['_id'])
			tmp['StartNo']=res['startchqno']
			tmp['EndNo']=res['endchqno']
			tmp['Name']=res['staffnameassign']
			allData.append(tmp)

		headers=[]
		headers.append("Name")
		headers.append('StartNo')
		headers.append('EndNo')
		 
		return jsonify({"success":True,"alldata":allData,"headers":headers})
	except Exception,e:
		print e
		return jsonify({"success":False})		

@app.route('/getadvanceDetails',methods=['POST'])
def getadvanceDetails():
	try:
		result=mongo.db.advance.find()
		allData=[]
		for res in result:
			tmp={}
			tmp['_id']=str(res['_id'])
			tmp['DOA']=res['dateofassign']
			tmp['staffname']=res['staffname']
			tmp['amount']=res['advamt']
			tmp['staffid']=res['staffid']
			tmp['status']=res['isactive']
			tmp['deduction']=res['deduction']
			allData.append(tmp)

		headers=[]
		headers.append("staffname")
		headers.append('DOA')
		headers.append('amount')
		headers.append('deduction')
		headers.append('status')
		return jsonify({"success":True,"alldata":allData,"headers":headers})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/updateadvance',methods=['POST'])
def updateadvance():
	try:
		#udate staffid amount as advance ig getting update so calculation donw

		mongo.db.advance.update_one({"_id":ObjectId(request.get_json()['_id']),"isactive":"true"},{"$set":{"dateofassign":request.get_json()['dateofassign'],
			"advamt":request.get_json()['advamt'],"deduction":request.get_json()['deduction'],"currentremadv":request.get_json()['currentremadv'],"lastdeductionmonth":request.get_json()['lastdeductionmonth']}})
		return jsonify({"success":True})
	except Exception,e:
		print e
		return jsonify({"success":False})

@app.route('/addadvanceacc',methods=['POST'])
def addadvanceacc():

	try:
	 	result=mongo.db.advance.find({"staffid":request.get_json()['staffid'],"isactive":"true"}).count()
		if result==0:
			mongo.db.advance.insert(request.get_json())
			return jsonify({"success":True,"message":"Advance Assign"})
			
		else:
			return jsonify({"success":False,"message":"Advance Already Assign"})
	except Exception,e:
		print e
		return jsonify({"success":False,"message":e})
@app.route('/getstafflistacc',methods=['POST'])
def getstafflistacc():
	try:
		result=mongo.db.staffdetails.find({"isDeleted":"false"})
		fullname={}
	#get staff id
		for res in result:
			res['_id']=str(res['_id'])
			temp=res['fname']+' '+res['mname']+' '+res['lname']
			fullname[temp]=res['_id']
		return jsonify({"success":True,"names":fullname})
	except Exception,e:
		return jsonify({"success":False})
@app.route("/export", methods=['POST'])
def export_records():
	salary_year= request.get_json()['year']
	salary_month= request.get_json()['month']
	tempdate=salary_month+"-"+salary_year
	print salary_year,salary_month
	result=mongo.db.salary.find({"salarydate":tempdate})
	staff_file=open('staff_salary.csv','w+')
	employee_file=open('employee_salary.csv','w+')
	
	employee_file.write('Name,Bank Name,Account No,Salary\n')
	staff_file.write('Name,Bank Name,Account No,Salary\n')

	sum_employee=0
	sum_staff=0
	tds_staff=0
	for x in result:
		data=str(x['Name']).replace(',',' ')+','+ str(x['Bank']).replace(',',' ')+',=""&' +str(x['BankACC']).replace(',',' ')+','+str(x['Netpay'])
		if x['stafftype']=='Teacher':
			if x['Netpay']!=0:
				staff_file.write(data+'\n')
				sum_staff=sum_staff+float(x['Netpay'])
				tds_staff=tds_staff+float(x['Tds'])

		else:
			if x['Netpay']!=0:
				employee_file.write(data+'\n')
				sum_employee=sum_employee+float(x['Netpay'])
		 	
	staff_file.write(str('Total Amount')+','+str(sum_staff)+','+str('TDS')+','+str(tds_staff))
	employee_file.write(str('Total Amount')+','+str(sum_employee))
	#addd salay to one table to view month wise salary in admin panel
	#request.get_json()['director'] this value comes only after view /save salary 
	sum_total=sum_employee+sum_staff
	# mongo.db.salarymonthwise.update_one({"salarymonth":tempdate},{"$set":{
	# 	"director":request.get_json()['director'],
	# 	"fixsalary":request.get_json()['fixsalary'],
	# 	"contract":request.get_json()['contract'],
	# 	"employee":request.get_json()['employee'],"salary":tempdate,"amt":sum_total,"tds":tds_staff}},upsert=True)

	return jsonify({ "success":True})

#get branches
@app.route("/getfilerdatasal", methods=['POST'])
def getfilerdatasal():
	try:
		result=mongo.db.branches.find()
		branches=[]
		for res in result:
			branches.append(res['branchname'])
		result=mongo.db.cities.find()
		city=[]
		for res in result:
			city.append(res['cityname'])
		
		result=mongo.db.coursedetails.find()
		batchname=[]
		for res in result:
			batchname.append(res['batchname'])
		batchname=list(set(batchname))
		result=mongo.db.coursedetails.find()
		coursename=[]
		for res in result:
			coursename.append(res['coursename'])
		coursename=list(set(coursename))
		result=mongo.db.staffdetails.find({"$or":[{"stafftype":"Teacher","salarydetails.mode":"Salary"},{"designation":"Director"}]})	
		staffname=[]
		for res in result:
			tmp={}
			tmp['name']=res['fname']+' '+res['mname']+' '+res['lname']
			tmp['staffid']=str(res['_id'])
			tmp['Selected']=False
			if res['designation']=='Director':
				tmp['Selected']=True
			staffname.append(tmp)

		return jsonify({"success":True,"branches":branches,"staffname":staffname,"city":city,"batchname":batchname,"coursename":coursename})
	except Exception,e:
		print e
		return jsonify({"success":False})		

def tdsceil(val):
	return math.ceil(val)	
def salaryceilfloor(val):
	updateval=math.ceil(val)
	updateval=updateval-val
	if updateval>0.50:
		val=math.floor(val)
	else:
		val=math.ceil(val)
	return val

@app.route('/viewsalarymonthwise',methods=['POST'])
def viewsalarymonthwise():
	salary_month=request.get_json()['month']
	salary_year=request.get_json()['year']
	tempdate=salary_month+"-"+salary_year
	total_tds=0
	CMP_PF=0			
	EMP_PF=0
	director=0
	employee=0
	fixsalary=0
	contract=0
	headers=getsalaryheaders()
	print tempdate
	all_salary=mongo.db.salary.find({"salarydate":tempdate})
	alldata=[]
	for salary in all_salary:
		temp={}
		temp=salary
		temp['_id']=str(temp['_id'])
		alldata.append(temp)
		total_tds+=float(salary['Tds'])
		CMP_PF+=float(salary['CMP_PF'])
		EMP_PF+=float(salary['EMP_PF'])
		if (salary['stafftype']=='Teacher') and (salary['SalaryType']=='Fix Salary'):
			fixsalary+=salary['Netpay']
		elif (salary['stafftype']=='Teacher') and (salary['SalaryType']=='Contract'):
			contract+=salary['Netpay']
		elif (salary['stafftype']=='Employee') and ('Director' in salary['Designation']):
			director+=salary['Netpay']	
		else:
			employee+=salary['Netpay']
	return jsonify({"employee":round(employee,2),"fixsalary":round(fixsalary,2),"contract":round(contract,2),"director":round(director,2),"success":True,"all_salary":alldata,"headers":headers,"total_tds":round(total_tds),"CMP_PF":round(CMP_PF,2),"EMP_PF":round(EMP_PF,2)})

@app.route('/getaccounterros',methods=['POST'])
def getaccounterros():
	try:
		result=mongo.db.accounterror.find()
		if result:
			alldata=[]
			headers=[]
			for res in result:
				res['_id']=str(res['_id'])
				alldata.append(res)
			headers.append('date')
			headers.append('section')
			headers.append('error')
				
			return jsonify({"success":True,"message":"Records Successfully Loaded!!","alldata":alldata,"headers":headers})		
		else:
			return jsonify({"success":True,"message":"No Records Found!!"})	
					

	except Exception,e:
		print e	
		return jsonify({"success":False,"message":"Database Exception!!"})

#here we use this function to add errors in accounterror database
def addaccouterror(errmsg,section):
	try:
		mongo.db.accounterror.insert({"date":datetime.now().strftime ("%d-%m-%Y"),"section":section,"error":errmsg})
	except Exception,e:
		print e		
@app.route('/getsalarymonthwise',methods=['POST'])
def getsalarymonthwise():
	#get batches state 10 = ESpALIER like wise
	batchDetails=mongo.db.coursedetails.find()
	batchdict={}
	for batch in batchDetails:
		batchdict[batch['batchname']]=batch['coursename']+' '+batch['std']
		
	salary_month=request.get_json()['month']
	salary_year=request.get_json()['year']
	dbflag=request.get_json()['dbflag']
	tempdate=salary_month+"-"+salary_year
	if dbflag=='1':
		mongo.db.salary.remove({"salarydate":tempdate})
		#mongo.db.advance.update({"lastdeductionmonth":salary_month},{"$set":{"lastdeductionmonth":"0"}},multi=True)
	staffDetails=mongo.db.staffdetails.find({"isDeleted":"false"})
	cnt=0
	all_salary=[]
	erros_insalary=[]
	for staff in staffDetails:
		staff['_id']=str(staff['_id'])
		if 'salarydetails' in staff:
			#check this stffid and date present in salary tab;e
			#if yes dont calculate pick from salary table and show if no calculate and store in salary table
			res=checkinsalary(staff['_id'],tempdate)
			if res ==0:
				#no record foun
				if (staff['salarydetails']['mode']=='Contract') and (staff['stafftype']=='Teacher'):
					staffrate={}
					contractlist=staff['salarydetails']['contractlist']
					for contract in contractlist:
						staffrate[contract['course']+' '+contract['std']]=contract['rate']
					attendaance=mongo.db.staffattendancedetails.find({"date":{"$regex":tempdate},"staffid":staff['_id'],"isDeleted":"false"})	
					staff_all_lect_data=[]
					total_salary=0
					for att in attendaance:
						if batchdict[att['batch']] in staffrate:
							rate=float(staffrate[batchdict[att['batch']]])
							total=round((rate/60)*int(att['duration']),2)
							#function to add valid lec in main list
							tmpvalidlec=addvalidlecvalue(att,rate,total)
							staff_all_lect_data.append(tmpvalidlec)
							total_salary+=total
						else:
							print 'staff ',att['staffid'],'batch ',att['batch'],'batch desc',batchdict[att['batch']],'staffrate ',staffrate,' Not mention'
							erros_insalary.append('Staff : '+staff['fname']+' '+staff['lname']+' , batch Details: '+att['batch']+' '+str(batchdict[att['batch']])+str(' Lecture Rate Not Mention')+str(',Existing staffRate :')+str(staffrate))
					print 'To   ',staff['_id'],total_salary
					total_salary=salaryceilfloor(total_salary)
					tds=round((total_salary*10)/100,2)
					tds=tdsceil(tds)
					updated_salary=total_salary-tds
					all_salary.append(addstaffsalary(tempdate,staff,staff_all_lect_data,staff['_id'],total_salary,tds,updated_salary,'Contract',0,0,0))
				
				elif (staff['salarydetails']['mode']=='Salary') and (staff['stafftype']=='Teacher'):
					total_salary=float(staff['salarydetails']['permonthsalary'])
					total_salary=salaryceilfloor(total_salary)
					tds=round((total_salary*10)/100,2)
					tds=tdsceil(tds)
					updated_salary=total_salary-tds
					staff_all_lect_data=[]
					attendaance=mongo.db.staffattendancedetails.find({"date":{"$regex":tempdate},"staffid":staff['_id'],"isDeleted":"false"})	
					for att in attendaance:
						#function to add valid lec in main list
						rate=0
						total=0
						tmpvalidlec=addvalidlecvalue(att,rate,total)
						staff_all_lect_data.append(tmpvalidlec)
						
					all_salary.append(addstaffsalary(tempdate,staff,staff_all_lect_data,staff['_id'],total_salary,tds,updated_salary,'Fix Salary',0,0,0))	
				elif 	(staff['salarydetails']['mode']=='Salary') and ('Director' in staff['designation']) and (staff['stafftype']=='Employee'):
					total_salary=float(staff['salarydetails']['permonthsalary'])
					total_salary=salaryceilfloor(total_salary)
					tds=round((total_salary*10)/100,2)
					tds=tdsceil(tds)
					updated_salary=total_salary-tds
					staff_all_lect_data=[]
					if staff['gender']=='male':
						if salary_month=='03':
							ptax=300
						else:
							ptax=200
					updated_salary=updated_salary-ptax
					staff_all_lect_data=[]
					all_salary.append(addstaffsalary(tempdate,staff,staff_all_lect_data,staff['_id'],total_salary,tds,updated_salary,'Fix Salary',ptax,0,0))	
				elif staff['stafftype']=='Supervisor':
					print staff['designation']	
				else:
					total_salary=float(staff['salarydetails']['permonthsalary'])
					total_salary=salaryceilfloor(total_salary)
					temp=getemployeecalculation(tempdate,total_salary,staff,salary_month)
					all_salary.append(temp)
			else:
				#fetch record from salary db if aredy calulation done
				rec=mongo.db.salary.find_one({"staffid":staff['_id'],"salarydate":tempdate})
				rec['_id']=str(rec['_id'])
				all_salary.append(rec)		
		else:
			#print record whos salarydetails not present
			print ''
			#print staff['fname']+' '+staff['lname']+' '+staff['_id']+' Salary Details Not Present'
	total_tds=0
	CMP_PF=0			
	EMP_PF=0
	director=0
	employee=0
	fixsalary=0
	contract=0
	headers=getsalaryheaders()
	#push error in DB
	erros_insalary=list(set(erros_insalary))
	#remove existing error from db 
	try:
		mongo.db.accounterror.remove({"section":"Account Salary"})
	except Exception,e:
		print e	
	for error in erros_insalary:
		addaccouterror(error,'Account Salary')
	for salary in all_salary:
		salary=advaceccalculation(dbflag,salary,salary_month,tempdate)
		remadvance=calculateremadvance(salary['staffid'],tempdate)
		salary['REM_Advance']=remadvance
		salary['_id']=str(salary['_id'])
		total_tds+=float(salary['Tds'])
		CMP_PF+=float(salary['CMP_PF'])
		EMP_PF+=float(salary['EMP_PF'])
		if (salary['stafftype']=='Teacher') and (salary['SalaryType']=='Fix Salary'):
			fixsalary+=salary['Netpay']
		elif (salary['stafftype']=='Teacher') and (salary['SalaryType']=='Contract'):
			contract+=salary['Netpay']
		elif (salary['stafftype']=='Employee') and ('Director' in salary['Designation']):
			director+=salary['Netpay']	
		else:
			employee+=salary['Netpay']
	return jsonify({"employee":round(employee,2),"fixsalary":round(fixsalary,2),
		"contract":round(contract,2),"director":round(director,2)
		,"success":True,"all_salary":all_salary,"headers":headers,"total_tds":round(total_tds),"CMP_PF":round(CMP_PF,2),"EMP_PF":round(EMP_PF,2)})
def calculateremadvance(id,saldate):
	try:
		records=mongo.db.advance.find_one({"staffid":id,"isactive":"true"})
		if records:
			currentremadv=records['currentremadv']
			#add remadvance in stff salary so that in view salary it show rem advance
			mongo.db.salary.update_one({"staffid":id,"salarydate":saldate},{"$set":{"REM_Advance":currentremadv}})
			return currentremadv
		else:
			mongo.db.salary.update_one({"staffid":id,"salarydate":saldate},{"$set":{"REM_Advance":0}})
			return 0	
	except Exception,e:
		print e	


def checkinsalary(id,datedata):
	try:
		#if staffid in advance then recalculate advance and dlete existing staff entry from salary
		# cnt=mongo.db.advance.find({"staffid":id,"isactive":"true"}).count()
		# if cnt==1:
		# 	mongo.db.salary.delete_one({"staffid":id,"salarydate":datedata})
		# 	return 0
		# #if not in advance chaeck already salary calculation done for same month then no need to do again
		res=mongo.db.salary.find({"staffid":id,"salarydate":datedata}).count()
		return int(res)
	except Exception,e:
		print e
		return e
def addvalidlecvalue(att,rate,total):
	temp={}
	temp=att
	temp['_id']=str(temp['_id'])
	temp['rate']=rate
	temp['total']=total
	return temp

def addstaffsalary(tempdate,staff,staff_all_lect_data,staffid,total_salary,tds,updated_salary,salarytype,ptax,pf_employee_amt,pf_company_amt):
	#get advnce
	result=mongo.db.advance.find({"staffid":str(staffid),"isactive":"true"})
	result=list(result)
	if len(result)!=0:
		print result
	temp={}
	temp['staff_all_lect_data']=staff_all_lect_data
	temp['staffid']=str(staffid)
	temp['Salary']=total_salary
	temp['Tds']=tds
	temp['Netpay']=updated_salary
	temp['SalaryType']=salarytype
	temp['Ptax']=ptax
	temp['EMP_PF']=pf_employee_amt
	temp['CMP_PF']=pf_company_amt
	temp['Name']=staff['fname']+' '+staff['lname']
	temp['stafftype']=staff['stafftype']
	temp['PAN']=str(staff['pan'])
	temp['Bank']=staff['bankname']
	temp['BankACC']=str(staff['bank'])
	temp['Advance']=0
	temp['salarydate']=tempdate
	temp['Designation']=staff['designation']

	#add to salary becoz entry not present
	mongo.db.salary.insert(temp)
	return temp
def getemployeecalculation(tempdate,total_salary,staff,salary_month):
	ptax=0
	pf_employee_amt=0
	pf_company_amt=0
	if total_salary>=10000:
		if staff['gender']=='male':
			if salary_month =='03':
				ptax=300
			else:
				ptax=200
		pf_employee_amt=(total_salary*60*12)/10000
		#apply salary floor to pf aslo
		pf_employee_amt=salaryceilfloor(pf_employee_amt)
		pf_company_amt=(total_salary*60*13)/10000
		pf_company_amt=salaryceilfloor(pf_company_amt)
		updated_salary=total_salary-ptax-pf_employee_amt
	elif total_salary>=7500 and total_salary<10000:
		if staff['gender']=='male':
			ptax=175
		else:
			ptax=0
		pf_employee_amt=(total_salary*60*12)/10000
		pf_employee_amt=salaryceilfloor(pf_employee_amt)
		pf_company_amt=(total_salary*60*13)/10000
		pf_company_amt=salaryceilfloor(pf_company_amt)
		updated_salary=total_salary-ptax-pf_employee_amt
	else:
		pf_employee_amt=(total_salary*60*12)/10000
		pf_employee_amt=salaryceilfloor(pf_employee_amt)
		pf_company_amt=(total_salary*60*13)/10000
		pf_company_amt=salaryceilfloor(pf_company_amt)
		updated_salary=total_salary-pf_employee_amt
	staff_all_lect_data=[]	
	temp=addstaffsalary(tempdate,staff,staff_all_lect_data,staff['_id'],total_salary,0,updated_salary,'Employee',ptax,pf_employee_amt,pf_company_amt)				
	return temp	
def getsalaryheaders():
	headers=[]
	headers.append('Name')
	headers.append('Bank')
	headers.append('BankACC')
	headers.append('stafftype')
	headers.append('SalaryType')
	headers.append('Salary')
	headers.append('Tds')
	headers.append('Ptax')
	headers.append('EMP_PF')
	headers.append('CMP_PF')
	headers.append('Netpay')
	headers.append('Advance')
	headers.append('REM_Advance')
	return headers	
def checkadvanceassign(staffid,saldate):
	try:
		result=mongo.db.salary.find_one({'staffid':staffid,'salarydate':saldate})
		if result['Advance']!=0:
			return 1
		else:
			return 0
	except Exception,e:
		print e
def advaceccalculation(dbflag,sal,mon,saldate):
	staffid=sal['staffid']
	try:
		result=mongo.db.advance.find_one({'staffid':staffid,'isactive':'true'})
		if result:
			#check advance assign for same month staff if yes it measn user checking previous month salary
			# 1 measn already calcuated
			ans=checkadvanceassign(staffid,saldate)
			if ans==0:
				flag=0
				isactive='true'
				lastdeductionmonth=0
				currentremadv=0
				if mon!=result['lastdeductionmonth']:
					lastdeductionmonth=mon
					deduction=float(result['deduction'])
					remadv=float(result['currentremadv'])
					if deduction>remadv:
						deduction=remadv
						flag=1
						currentremadv=0
					else:
						currentremadv=remadv-deduction
						
					if flag==1:
						isactive='false'
					Netpay=float(sal['Netpay'])-deduction
					Advance=deduction
					#adding monthwise advance in advance table
					advancedbtt=mongo.db.advance.find_one({'staffid':staffid,'isactive':'true'})
					if 'advance_monwise' in advancedbtt:
						advance_monwise=advancedbtt['advance_monwise']
					else:
						advance_monwise={}
					advance_monwise[saldate]=Advance
					mongo.db.advance.update_one({'staffid':staffid,'isactive':'true'},{"$set":{
						"isactive":isactive,"currentremadv":currentremadv,"lastdeductionmonth":lastdeductionmonth
						,"advance_monwise":advance_monwise}})
					mongo.db.salary.update_one({'staffid':staffid,'salarydate':saldate},{"$set":{
						"Netpay":Netpay,"Advance":Advance}})
					sal['Netpay']=Netpay
					sal['Advance']=Advance	
					return sal
				else:
					##if advance already calculated and salary is reloadi.e recalculate then fetch advancce
					##only
					if (dbflag=='1') and (result['lastdeductionmonth']==mon):
						deduction=float(result['deduction'])
						Netpay=float(sal['Netpay'])-deduction
						Advance=deduction	
						mongo.db.salary.update_one({'staffid':staffid,'salarydate':saldate},{"$set":{
							"Netpay":Netpay,"Advance":Advance}})
						sal['Netpay']=Netpay
						sal['Advance']=Advance	
						return sal
		elif dbflag=='1':
				result=mongo.db.advance.find_one({'staffid':staffid,'isactive':'false','lastdeductionmonth':mon})
				if result:
					advance_monwise=result['advance_monwise']
					advance=advance_monwise[saldate]
					Netpay=float(sal['Netpay'])-advance
					Advance=advance	
					mongo.db.salary.update_one({'staffid':staffid,'salarydate':saldate},{"$set":{
							"Netpay":Netpay,"Advance":Advance}})
					sal['Netpay']=Netpay
					sal['Advance']=Advance	
					return sal 		
		elif float(sal['Advance'])>0:
			#this means someone created advance genrate salary and delete advance so 
			#this entry should be checl with sal if advance >0 then rollback
			cnt=mongo.db.advance.find({'staffid':staffid}).count()
			if cnt==0:
				sal['Netpay']=float(sal['Netpay'])+sal['Advance']
				sal['Advance']=0
				mongo.db.salary.update_one({'staffid':staffid,'salarydate':saldate},{"$set":{
						"Netpay":sal['Netpay'],"Advance":sal['Advance']}})

				
		return sal		

	except Exception,e:
		print e
def calculatetimedetails(allattedata):
	if len(allattedata)==0 :
		return 0
	else:
		for rec in allattedata:
			if ('devicetime' not in rec) and ('time' in rec):
				for tm in rec['time']:
					tmp=tm.split(":")
					if len(tmp)==3:
						print 'Device Entry ',tm
					else:
						print 'Befre  Manual ENtry ',tm
						in_time = datetime.strptime(tm, "%I:%M")
						out_time = datetime.strftime(in_time, "%H:%M")
						print 'After ',timeto24format(out_time)

def timeto24format(out_time):
	m2=out_time
	if out_time >= "10:00" and out_time <= "13:00":
		if m2 >= "10:00" and m2 >= "12:00":
			m2 = ("""%s%s""" % (m2, " AM"))
		else:
			m2 = ("""%s%s""" % (m2, " PM"))
	else:
		m2 = ("""%s%s""" % (m2, " PM"))
	m2 = datetime.strptime(m2, '%I:%M %p')
	m2 = m2.strftime("%H:%M %p")
	m2 = m2[:-3]
	return m2	
			
			
	return ''


@app.route('/getempoyeeattendanceinOut',methods=['POST'])
def getempoyeeattendanceinOut():
	try:
		result=mongo.db.salary.find({"stafftype":"Employee"})
		for res in result:
			id=res['staffid']
			print res['Name']
			attedancedata=mongo.db.staffRfidattendance.find({"staffid":id})
			allattedata=[]
			for attend in attedancedata:
				attend_date=attend['date'].split("-")
				attend_date=attend_date[1]+'-'+attend_date[0]
				if attend_date=='06-2018':
					allattedata.append(attend)
			calculatetimedetails(allattedata)		
		return jsonify({"success":True})	
	except Exception,e:
		print e
		return jsonify({"success":False})		

@app.route('/salaryfilter',methods=['POST'])
def salaryfilter():
	try:
		cities=mongo.db.cities.find()
		city={}
		for cit in cities:
			city[str(cit['_id'])]=cit['cityname']

		course={}	
		courseres=mongo.db.coursedetails.find()
		for coursearr in courseres:
			course[coursearr['batchname']]=coursearr['coursename']

		
		staffdata=mongo.db.staffdetails.find()
		staffrecords={}
		for staff in staffdata:
			staff['_id']=str(staff['_id'])
			staffrecords[staff['_id']]=staff

		branches=mongo.db.branches.find()
		branch={}
		for br in branches:
			branch[str(br['_id'])]=br['branchname']	

		search={}
		if 'salarydate' in request.get_json():
			search['salarydate']=request.get_json()['salarydate']
		if 'DateType' in request.get_json():
			if 'DateType'=='All Month':
				search={}
		#here we get all data and later as per filter we have to parse data
		#from filter city to all
		result=mongo.db.salary.find(search)
		result=list(result)
		alldata=[]
		for res in result:
			res['_id']=str(res['_id'])
			if 'city' in request.get_json():
				staffcityid=staffrecords[res['staffid']]['cityid']
	 			if city[staffcityid]==request.get_json()['city']:
	 				alldata.append(res)
	 	
	 	if len(alldata)>1:
	 		result=alldata
	 	
	 	if 'Designation' in request.get_json():
	 		alldata=[]
	 		for res in result:
	 			if request.get_json()['Designation']=='Director':
	 				if res['Designation']=='Director':
	 					alldata.append(res)
	 			if request.get_json()['Designation']=='Teaching(Fix)':
	 				if (res['stafftype']=='Teacher') and (res['SalaryType']=='Fix Salary'):
	 					alldata.append(res)
	 			if request.get_json()['Designation']=='Teaching(Contract)':
	 				if (res['stafftype']=='Teacher') and (res['SalaryType']=='Contract'):
	 					alldata.append(res)		
	 			if request.get_json()['Designation']=='Employee Salary':
	 				if (res['stafftype']=='Employee') and (res['SalaryType']=='Employee'):
	 					alldata.append(res)
	 	if len(alldata)>1:
	 		result=alldata

	 	if 'branch' in request.get_json():
	 		alldata=[]
	 		for res in result:
	 			if 'employeebranch' in staffrecords[res['staffid']]:
	 				staffdata_forbrach=staffrecords[res['staffid']]
	 				if branch[staffdata_forbrach['employeebranch']]==request.get_json()['branch']:
	 					alldata.append(res)

	 	if len(alldata)>1:
	 		result=alldata
	 	if 'batch' in request.get_json():
	 		alldata=[]
	 		for res in result:
	 			if (res['stafftype']=='Teacher') and (res['SalaryType']=='Contract'):
	 				staff_all_lect_data=[]
	 				flag=0
	 				for lect in res['staff_all_lect_data']:
	 					if lect['batch']==request.get_json()['batch']:
	 						staff_all_lect_data.append(lect)
	 						flag=1
	 				if flag==1:
	 					res['staff_all_lect_data']=staff_all_lect_data 
	 					alldata.append(res)
	 	if len(alldata)>1:
	 		result=alldata						
	 	if 'course' in request.get_json():
	 		alldata=[]
	 		for res in result:
	 			if (res['stafftype']=='Teacher') and (res['SalaryType']=='Contract'):
	 				staff_all_lect_data=[]
	 				flag=0
	 				for lect in res['staff_all_lect_data']:
	 					if  course[lect['batch']]==request.get_json()['course']:
	 						staff_all_lect_data.append(lect)
	 						flag=1
	 				if flag==1:
	 					res['staff_all_lect_data']=staff_all_lect_data 
	 					alldata.append(res)

	 	if len(alldata)>1:
	 		result=alldata
	 	director=0
		employee=0
		fixsalary=0
		contract=0
	 	director_per_branch=0
	 	staff_per_branch=0
	 	if ('staffdetails' in request.get_json()) and ('branch' in request.get_json()):
	 		staffdata=request.get_json()['staffdetails']
	 		result=mongo.db.salary.find(search)
	 		staff_total=0
	 		director_total=0
	 		for res in result:
	 			for data in staffdata:
	 				if (data['staffid']==res['staffid']) and (res['Designation']!='Director'):
	 					staff_total+=res['Netpay']
	 				if (data['staffid']==res['staffid']) and (res['Designation']=='Director'):
	 					director_total+=res['Netpay']
	 		selected_center_cnt=(request.get_json()['selected_center_cnt'])			
	 		branchwise_share=0

	 		staff_total=salaryceilfloor(staff_total)
	 		if selected_center_cnt!=0:
	 			staff_per_branch=staff_total/selected_center_cnt
	 		staff_per_branch=salaryceilfloor(staff_per_branch)
	 			
	 		director_total=salaryceilfloor(director_total)
	 		if selected_center_cnt!=0:
	 			director_per_branch=director_total/selected_center_cnt

	 		director_per_branch=salaryceilfloor(director_per_branch)	
	 		director=director_per_branch
	 		fixsalary=staff_per_branch
	 		
	 	headers=getsalaryheaders()
	 	filterdata=[]
	 	total_amount_fil=0
	 	total_tds=0
		CMP_PF=0			
		EMP_PF=0
		for data in alldata:
	 		temp={}
			temp['staffid']=data['staffid']
			temp['Salary']=data['Salary']
			temp['Tds']=data['Tds']
			temp['Netpay']=data['Netpay']
			temp['SalaryType']=data['SalaryType']
			temp['Ptax']=data['Ptax']
			temp['EMP_PF']=data['EMP_PF']
			temp['CMP_PF']=data['CMP_PF']
			temp['Name']=data['Name']
			temp['stafftype']=data['stafftype']
			temp['Designation']=data['Designation']
			temp['PAN']=data['PAN']
			temp['Bank']=data['Bank']
			temp['BankACC']=data['BankACC']
			temp['Advance']=data['Advance']
			temp['salarydate']=data['salarydate']
			temp['staff_all_lect_data']=data['staff_all_lect_data']
			temp['REM_Advance']=data['REM_Advance']
			total_tds+=float(temp['Tds'])
			CMP_PF+=float(temp['CMP_PF'])
			EMP_PF+=float(temp['EMP_PF'])
			if ('course' in request.get_json()) or ('batch' in request.get_json()):
				for rec in temp['staff_all_lect_data']:
					total_amount_fil+=float(rec['total'])
			else:
				total_amount_fil+=float(temp['Netpay'])
			filterdata.append(temp)
		#if branch is in filter then only  we need wmployee salary sepratrly
		if 'branch' in request.get_json():
			employee=total_amount_fil

		total_amount_fil=total_amount_fil+director_per_branch+staff_per_branch
		total_amount_fil=salaryceilfloor(total_amount_fil)
		return jsonify({"employee":employee,"fixsalary":staff_per_branch,"director":director_per_branch,"headers":headers,"alldata":filterdata,"total_tds":total_tds,
		"CMP_PF":CMP_PF,"EMP_PF":EMP_PF,'total_amount':total_amount_fil,"success":True})	
	except Exception,e:
		print e
		return jsonify({"success":False})	

		
@app.route('/accountdashsalryrecpt',methods=['POST'])
def accountdashsalryrecpt():
	try:
		startDate=request.get_json()['startdate']
		startDate=startDate.split('-')
		startDate=datetime(year=int(startDate[1]), month=int(startDate[0]), day=1)
		startDate=startDate.date()

		endDate=request.get_json()['enddate']
		endDate=endDate.split('-')
		endDate=datetime(year=int(endDate[1]), month=int(endDate[0]), day=1)
		endDate=endDate.date()
		 
		result=mongo.db.salarymonthwise.find()
		print 'Start ',startDate,' End Date ',endDate
		payemen_file=open('salaryTds.csv','w+')
		payemen_file.write('Date,Amount,Tds\n')
		sum=0
		tds=0
		for res in result:
			dateval=res['salary']
			dateval=dateval.split('-')
			datec= datetime(year=int(dateval[1]), month=int(dateval[0]), day=1)
			datec= datec.date()
			if (datec>=startDate) and (datec<=endDate):
				data=str(res['salary'])+','+ str(res['amt'])+','+str(res['tds'])
				payemen_file.write(data+"\n")
			 	sum=sum+float(res['amt'])
				tds=tds+float(res['tds'])
		payemen_file.write(str(' ')+','+str('Total Amount')+','+str(sum)+'\n')
		payemen_file.write(str(' ')+','+str('Total Tds')+','+str(tds))
		return jsonify({"filename":"salaryTds.csv","success":True})	
	except Exception ,e:
		print e
		return jsonify({"success":False})	
		
		
if __name__ == "__main__":
	app.run(debug=True, host='0.0.0.0', port=7777, threaded=True,ssl_context= 'adhoc')

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

app = Flask("__name__")
CORS(app)
app.config["MONGO_DBNAME"] = "mt"
mongo = PyMongo(app)
cardList=[]


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
		print destination
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
	parent=[]

	timetable=mongo.db.newtimetables.find({"date":datetime.now().strftime ("%d-%b-%y")},{"_id":False});
	if timetable:
		timetable=list(timetable)
		temp={}
		temp["day"]="today"
		temp["timetable"]=timetable
		parent.append(temp)
	to=(datetime.now() + timedelta(days=1))
	#to=to.strftime ("%d-%b-%y")
	tommorow=to.strftime ("%d-%b-%y")
	tommorowtimetable=mongo.db.newtimetables.find({"date":tommorow},{"_id":False});
	
	if tommorowtimetable:
		temp={}
		temp["day"]="tommorow"
		tymtable=list(tommorowtimetable)
		temp["timetable"]=tymtable
		parent.append(temp)

	if len(parent):
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
		timetables = mongo.db.newtimetables.find({"isDeleted":"false"})
	timetables = list(timetables)	
	for timetable in timetables:
		timetable["_id"]=str(timetable["_id"])
		cityname=mongo.db.cities.find({"_id":ObjectId(timetable["city"])})
		cityname=list(cityname)
		timetable["cityname"]=cityname[0]["cityname"]
	if len(timetables):
		return jsonify({"success":"true","timetables":timetables})
	else:
		return jsonify({"success":"false","reason":"No schedule Found. Please add it!"})


@app.route('/newcreatetimetable', methods=['POST'])
def newcreatetimetable():
	if request.get_json():
		cityid = request.get_json()['ttCity']
		timetable_date = request.get_json()['ttDate']

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

	if len(parent):
		return jsonify({"success":"true","timetable":parent})
	else:
		return jsonify({"success":"false","reason":"No terms Found. Please add it!"})


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
		return jsonify({"success":"false","reason":"No terms Found. Please add it!"})

@app.route('/shiftBatch',methods=['POST'])
def shiftBatch():
	fromBatchName=request.get_json()["fromBatchName"]
	toBranchName=request.get_json()["toBranchName"]
	toBranchId=request.get_json()["toBranchId"]
	result = mongo.db.coursedetails.update_one({"batchname":fromBatchName} ,{"$set":{"branchname":toBranchName,"branchid":toBranchId}},upsert=False)
	return jsonify({"success":"true","reason":"Batch Shifted successfully!"})

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
	return jsonify({"success":"true","reason":"count generated!","dashCount":dashCount})

@app.route('/deletestudent',methods=['POST'])
def deletestudent():
	studid=request.get_json()["studId"]
	result = mongo.db.student_info.update_one({"_id":ObjectId(studid)} ,{"$set":{"isDeleted":"True"}},upsert=False)
	return jsonify({"success":"true","reason":"Student Deleted successfully!"})

@app.route('/shiftBatchStudent',methods=['POST'])
def shiftBatchStudent():
	fromBatchName=request.get_json()["fromBatchName"]
	toBranchName=request.get_json()["toBranchName"]
	print fromBatchName
	print toBranchName
	result = mongo.db.student_info.update({"Batch":fromBatchName} ,{"$set":{"Center":toBranchName}},multi=True,upsert=False)
	return jsonify({"success":"true","reason":"Students Shifted successfully!"})

@app.route('/chktimetableexist',methods=['POST'])
def chktimetableexist():
	cityid=request.get_json()["ttCity"]
	tdate=request.get_json()["ttDate"]
	timetables = mongo.db.newtimetables.find({"city":cityid,"date":tdate},{"_id":False})
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

						return jsonify({"success":"true","overlap":"true","timetables":timetables,"reason":"Teacher Lecture Timing overlap"})

	if(res=="false"):
		for timetable in timetables[0]["timetable"]:
			for i in range(0,len(timetable["batchtimetable"])):
				for j in range(i+1,len(timetable["batchtimetable"])):
					res=checkovellaping(timetable["batchtimetable"][i]["stime"],timetable["batchtimetable"][i]["etime"],timetable["batchtimetable"][j]["stime"],timetable["batchtimetable"][i]["etime"])
					if(res=="true"):
						timetable["batchtimetable"][i]["overlap"]="true"
						timetable["batchtimetable"][j]["overlap"]="true"
						return jsonify({"success":"true","overlap":"true","timetables":timetables,"reason":"Batch Lecture Timing overlap"})

	
	if(res=="false"):
		return jsonify({"success":"true","overlap":"false","timetables":timetables})



@app.route('/updatetimetable',methods=['POST'])
def updatetimetable():
	tt=request.get_json()['timetables'][0]
	print request.get_json()['timetables'][0]['timetable']
	mongo.db.newtimetables.update_one({"_id":ObjectId(tt['_id'])} ,{"$set":{"timetable":tt['timetable']}},upsert=False)
	return jsonify({"success":"true","reason":"Update successfully!"})


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
		return jsonify({"success":"false","reason":"No schedule Found. Please add it!"})

@app.route('/registeredMobile',methods=['POST'])
def registeredmobile():
	print "in registeredmobile"
	print request.get_json()["mobile"]
	if(request.get_json()["type"]=="Teacher"):
		print "in teacher"
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
		studmobile = mongo.db.student_info.find({"studentMobile":request.get_json()["mobile"]})
		studmobile=list(studmobile)
		for mo in studmobile:
			mo["_id"]=str(mo["_id"]);
			if mo not in studentlist:
				studentlist.append(mo)
		mommobile = mongo.db.student_info.find({"motherMobile":request.get_json()["mobile"]})
		mommobile=list(mommobile)
		for mo in mommobile:
			mo["_id"]=str(mo["_id"]);
			if mo not in studentlist:
				studentlist.append(mo)

		dadmobile = mongo.db.student_info.find({"fatherMobile":request.get_json()["mobile"]})
		dadmobile=list(dadmobile)
		for mo in dadmobile:			
			mo["_id"]=str(mo["_id"]);
			if mo not in studentlist:
				studentlist.append(mo)
		if len(studentlist):
	 		return jsonify({"success":"true","staff":studentlist})
		else:
	 		return jsonify({"success":"false","reason":"No mobile Found!"})



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
	 	return jsonify({"success":"false","reason":"No mobile Found!"})
	

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
# 	 	return jsonify({"success":"false","reason":"No mobile Found!"})

@app.route("/getstaffattendance",methods=["POST"])
def getstaffattendance():
	#staffid="59d09c2e46465d5db8e5dfff"
	staffid=request.get_json()["id"]
	lectures=mongo.db.staffattendancedetails.find({"staffid":staffid})
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
	mongo.db.student_info.update_one({"_id":ObjectId(request.get_json()['id'])} ,{"$set":{"Center":request.get_json()['Center'],"Batch":request.get_json()['Batch']}},upsert=False)
	return jsonify({"success":"true","message":"Student Transfer successfully!"})


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
	 	return jsonify({"success":"false","reason":"No Batches Found. Please Add Batch!"})

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
	 	return jsonify({"success":"false","reason":"No Batches Found. Please Add Batch!"})
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
	return jsonify({"success":"true","reason":"Update successfully!"})


@app.route('/getsyllabusname',methods=['POST'])
def getsyllabusname():
	syllabusname= mongo.db.syllabus.find({},{"syllName":True,"syllyear":True,"_id":False})
	syllabusname=list(syllabusname)    
	if len(syllabusname):
		return jsonify({"success":"true","syllabusname":syllabusname})
	else:
		return jsonify({"success":"false","reason":"No syllabus Found. Please Add syllabus!"})


@app.route('/getsubjectforbatches',methods=['POST'])
def getsubjectforbatches():
	#noty4aws
	subjects = mongo.db.dailyreport.find({"batch":request.get_json()["batch"]})
	subjects=list(subjects)
	subject=[]
	if len(subjects):
		for s in subjects[0]["syllabusdetails"]["syllabus"]["subject"]:
			subject.append(s["subject"])

	if len(subjects):
	 	return jsonify({"success":"true","subjects": subject})
	else:
	 	return jsonify({"success":"false","reason":"No subjects Found. Please Add subjects!"})

@app.route('/gettopicsforsubject',methods=['POST'])
def gettopicsforsubject():
	#noty4aws
	subjects = mongo.db.dailyreport.find({"batch":request.get_json()["batch"]})
	subjects=list(subjects)
	topics=[]
	if len(subjects):
		for s in subjects[0]["syllabusdetails"]["syllabus"]["subject"]:
			if (s["subject"]==request.get_json()["subject"]):
				#print s["subject"]
				topics=s["topic"]
	if len(subjects):
	 	return jsonify({"success":"true","topics": topics})
	else:
	 	return jsonify({"success":"false","reason":"No subjects Found. Please Add subjects!"})



@app.route('/createdailyreport',methods=['POST'])
def createdailyreport():
	# syllabusname="SSC SEMI 10th"
	# syllyear="2017-2018"
	# batch="Volcano"
	syllabusname=request.get_json()["syllName"]
	syllyear=request.get_json()["syllyear"]
	batch=request.get_json()["syllBatch"]
	syllabus= mongo.db.syllabus.find({"syllName":syllabusname,"syllyear":syllyear,})
	syllabus=list(syllabus)
	for s in syllabus:
		s["syllid"] = str(s["_id"]) 
		del s["_id"]  
	dailyreport={};
	dailyreport["batch"]=batch
	dailyreport["syllabusdetails"]=syllabus[0]
	one_topic_max_lecture=[]
	temp={"hours":[],"teacherlist":[],"lecrecord":[]};
	for i in xrange(1,36):
		pass
		one_topic_max_lecture.append("")
	for sub in syllabus[0]["syllabus"]['subject']:
		for topic in sub["topic"]:
			temp["hours"].append("")
			temp["teacherlist"].append("")
			temp["lecrecord"].append(one_topic_max_lecture)

	dailyreport["lecturedetails"]=temp
	mongo.db.dailyreport.insert(dailyreport)	
	if len(syllabus):
		return jsonify({"success":"true"})
	else:
		return jsonify({"success":"false","reason":"No syllabus Found. Please Add syllabus!"})

@app.route('/editdailyreport',methods=['POST'])
def editdailyreport():
	dailyreport=request.get_json()['dailyreport'][0]
	mongo.db.schedules.update_one({"_id":ObjectId(dailyreport['_id'])} ,{"$set":{"lecturedetails":dailyreport['lecturedetails']}},upsert=False)
	return jsonify({"success":"true","reason":"Update successfully!"})

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
		return jsonify({"success":"false","reason":"No dailyreport Found. Please add it!"})



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
	print cities
	for city in cities:
		city["_id"] = str(city["_id"])
	city = list(cities)
	if len(city):
	 	return jsonify({"success":"true","cities":city})
	else:
	 	return jsonify({"success":"false","reason":"No City Found. Please add City!"})



@app.route('/getstaffnames',methods=['POST'])
def getstaffnames():
	staff = mongo.db.staffdetails.find({},{"fname":True,"lname":True,"_id":False})
	staffs = list(staff)
	print staff
	names=[]
	for staff in staffs:
		names.append(staff['fname']+" "+staff['lname']);

	# print names

	if len(staffs):
	 	return jsonify({"success":"true","staffs":names})
	else:
	 	return jsonify({"success":"false","reason":"No Staff Found!"})	 	


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
	 	return jsonify({"success":"false","reason":"No Subject Found!"})

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
	 	return jsonify({"success":"false","reason":"No admin Found. Please add City admin!"})

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
		return jsonify({"success":"false","reason":"No branch Found. Please add branch!"})

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
	 	return jsonify({"success":"false","reason":"No branch Admin Found. Please add branch admin!"})



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
	 	return jsonify({"success":"false","reason":"Fee Structure Not Present"})

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
	 	return jsonify({"success":"false","reason":"Fee Structure Not Present"})


@app.route('/FeeStructure', methods=["POST"])
def FeeStructure():
	productid=request.get_json()["id"]
	feeStructure = mongo.db.feestructure.find({"_id":ObjectId(str(productid))},{"_id":False})
	feeStructureList = []
	dates=[]
	temp=[]
	for fee in feeStructure:
		feeStructureList.append(fee)
	print feeStructureList[0]['start_date']
	startinfo=feeStructureList[0]['start_date'].split("/")
	print startinfo

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
	print request.get_json()
	idtoupdate =  request.get_json()["_id"]
	del request.get_json()["_id"]
	mongo.db.feestructure.update_one({"_id":ObjectId(idtoupdate)} ,{"$set":request.get_json()},upsert=True)
	return jsonify({"success":"true","message":"Updated Successfully Added"})

@app.route("/demo",methods=["GET"])
def demo():
	return jsonify({"success":"true"})

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

	print studattendance
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

	print studedata
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
	print studedata
	if studedata:
		return jsonify(
			{"success": "true", "message": "Showing Admitted List!", "studentList": studedata})
	else:
		return jsonify({"success": "false", "message": "Student Not Found"})

# @app.route('/getrfidforassignment', methods=['GET'])
# def getrfidforassignment():
# 	data=mongo.db.rfids.find({},{"_id":False})
# 	rfids=list(data)

# 	if rfids:
# 		return jsonify({"success":"true","rfids":rfids,"message":"successfully"})
# 	else:
# 		return jsonify({"success":"false","message":"rfid unavailable"})

@app.route('/addnewstudent', methods=["POST"])
def addnewstudent():
    pass
    data=request.get_json()["studentdata"]
    data["admissiondate"] = datetime.now().date().strftime("%d-%m-%Y")
    #count = mongo.db.student_info.find({"Batch": data['Batch']}).count()
    count = mongo.db.student_info.find({"Batch": data['Batch']},{"RollNo":True,"_id":False}).sort('RollNo',-1).limit(1)
    count = list(count)
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
	print studedata
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
		print "hjfd" 
		branchid = request.get_json()["branchid"]
		courses = mongo.db.coursedetails.find({"branchid":branchid}).distinct("coursename")	
		course = list(courses)
	if len(request.get_json())==2:
		print "22222" 
		branchid = request.get_json()["branchid"]
		coursename = request.get_json()["coursename"]
		courses = mongo.db.coursedetails.find({"branchid":branchid,"coursename":coursename})	
	
		course = list(courses)
		for c in course:
			c["_id"] = str(c["_id"])

	objBranchId = ObjectId(branchid)
	branches = mongo.db.branches.find_one({'_id':objBranchId})
	print branches['branchname']
	branchname = branches['branchname']

	if len(course):
	 	return jsonify({"success":"true","course":course,"branchid":branchid,"branchname":branchname})
	else:
	 	return jsonify({"success":"false","reason":"No batch Found. Please add batch!","branchid":branchid,"branchname":branchname})

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
	print stafdata
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
	print term[0]
	if len(term):
		return jsonify({"success":"true","terms":term})
	else:
		return jsonify({"success":"false","reason":"No terms Found. Please add it!"})

@app.route('/feereportcount',methods=['POST'])
def feereportcount():
	addmissioncount=mongo.db.student_info.find({"admitStatus":1}).count()
	if len(str(addmissioncount)):
		return jsonify({"success":"true","addmissioncount":addmissioncount})
	else:
		return jsonify({"success":"false","reason":"feereportcount"})
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
		return jsonify({"success":"false","reason":"No terms Found. Please add it!"})

@app.route('/getBatch',methods=['POST'])
def getBatch():
	batches=mongo.db.coursedetails.find(request.get_json(),{"_id":False}).distinct("batchname")	
	batch = list(batches)		
	if len(batch):
		return jsonify({"success":"true","batch":batch})
	else:
		return jsonify({"success":"false","reason":"No terms Found. Please add it!"})

@app.route('/getBranchStaffList', methods=['POST'])
def getBranchStaffList():
	staffdata = mongo.db.staffdetails.find({"isDeleted":"false"})
	staffdata=list(staffdata)
	for c in staffdata:
			c["_id"] = str(c["_id"])
			c["fullname"]=str(c["fname"])+" "+str(c["mname"])+" "+str(c["lname"])
	return jsonify({"success":"true","staffdata":staffdata})
	print staffdata

@app.route('/getStaffInfo', methods=['POST'])
def getStaffInfo():
	idi = request.get_json()["id"]
	data = mongo.db.staffdetails.find({"_id":ObjectId(str(idi))})
	staffdata = list(data)
	print staffdata
	if(len(staffdata)):
		staffdata[0]["_id"]=str(staffdata[0]["_id"])
	if staffdata:
		return jsonify(
			{"success": "true", "message": "Showing Staff Info!", "staffData": staffdata})
	else:
		return jsonify({"success": "false", "message": "Something Went wrong.Please try again!"})

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
	 	return jsonify({"success":"false","reason":"No Staff Found. Please Add Staff!"})

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
	 	return jsonify({"success":"false","reason":"No Staff Found. Please Add Staff!"})

@app.route('/getstd',methods=['POST'])
def getstd():
	print request.get_json()
	std = mongo.db.coursedetails.find(request.get_json()).distinct('std')
	std = list(std)	
	if len(std):
	 	return jsonify({"success":"true","std":std})
	else:
	 	return jsonify({"success":"false","reason":"standard found"})

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
		return jsonify({"success":"false","reason":"No terms Found. Please add it!"})

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
		return jsonify({"success":"false","reason":"No schedule Found. Please add it!"})

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
		return jsonify({"success":"false","reason":"No schedule Found. Please add it!"})

@app.route('/editYearlySchedule',methods=['POST'])
def editYearlySchedule():
	schedule=request.get_json()['schedules'][0]
	mongo.db.schedules.update_one({"_id":ObjectId(schedule['_id'])} ,{"$set":{"schedule":schedule['schedule']}},upsert=False)
	return jsonify({"success":"true","reason":"Update successfully!"})

@app.route('/editYearlySchedulebatch',methods=['POST'])
def editYearlySchedulebatch():
	schedule=request.get_json()['schedules'][0]
	mongo.db.schedules.update_one({"_id":ObjectId(schedule['_id'])} ,{"$set":{"batch":schedule['batch']}},upsert=False)
	return jsonify({"success":"true","reason":"Update successfully!"})

@app.route('/getColors',methods=['POST'])
def getColors():
	result = mongo.db.schedulecolors.find({},{"_id":False})
	result = list(result)
	print result
	colors = {}
	for k in result[0]["colors"]:
		#colors.append(k[])
		for k1,v1 in k.items():
			print k1,v1
			colors[k1]=v1
	print colors
	return jsonify({"success":"true","color":colors})


@app.route('/addColor',methods=['POST'])
def addColor():
	print request.get_json()['colorfor']
	print request.get_json()['color']
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
	dailyreport=mongo.db.dailyreport.find({"batch": request.get_json()["batch"]})
	dailyreport=list(dailyreport)
	dailyreport=dailyreport[0]
	syllabus=dailyreport["syllabusdetails"]["syllabus"]
	idx=0
	for subject in syllabus["subject"]:
		if subject["subject"]==request.get_json()["subject"]:
			print subject["subject"]
			for topic in subject["topic"]:
				if topic["topicname"]==request.get_json()["topic"]:
					break
				else:
					idx=idx+1

			break
		else:
			idx=idx+len(subject["topic"])
	lecturedetails=dailyreport["lecturedetails"]
	for i in xrange(0,len(lecturedetails["lecrecord"][idx])):
		if lecturedetails["lecrecord"][idx][i]== "":
			lecturedetails["lecrecord"][idx][i]=request.get_json()["date"]
			print "yo"
			break

	print lecturedetails
	mongo.db.dailyreport.update_one({"_id":dailyreport["_id"]} ,{"$set":{"lecturedetails":lecturedetails}},upsert=False)

	return jsonify({"success":"true","message":"Staff attendance Added Successfully!","staff":staff[0]})

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
	studedata = mongo.db.student_info.find({"admitStatus": "1"})
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
	  	return jsonify({"success":"false","reason":"No Courses Found. Please add course!","cityid":request.get_json()["cityid"]})


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
	 	return jsonify({"success":"false","reason":"No batch Found. Please add batch!","branchid":branchid})

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
	 	return jsonify({"success":"false","reason":"No batch Found. Please add batch!"})

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
	 	return jsonify({"success":"false","reason":"Unkown Error, Please Contact Support!"})

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
# 	 	return jsonify({"success":"false","reason":"Unkown Error, Please Contact Support!"})

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
        return jsonify({"success":"false","reason":"No users Found. Please Add user!"})

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
        return jsonify({"success":"false","reason":"No users Found. Please Add user!"})

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
	print request.get_json()
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
	return jsonify({"success":"true","reason":"Update successfully!"})


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
	#print request.get_json()
	carddetails=mongo.db.RFIDlist.find_one({"cardId":request.get_json()["cardno"]})
	#print carddetails
	studentdetail=mongo.db.student_info.find_one({"RollNo":carddetails["RollNo"],"Batch":carddetails["batchname"]})
	#print studentdetail
	#print "studentdetail"
	#print studentdetail["RollNo"]
	#print studentdetail["Batch"]
	present=request.get_json()
	present["studentid"]=str(studentdetail["_id"])
	present["batch"]=carddetails["batchname"]
	AlreadyMarked=mongo.db.studattendance.find({"date":present["date"],"studentid":present["studentid"]},{"_id":False})
	AlreadyMarked=list(AlreadyMarked)
	if not len(AlreadyMarked):
		mongo.db.studattendance.insert(present)
	return jsonify({"success":"true","message":"Attendance Marked"})


#Mark Attendance By Software
@app.route("/studentattendance",methods=["POST"])
def studentattendance():
	print request.get_json()
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
		print startdate[0]["date"]
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
				prevmonth=curdate.strftime("%B-%Y")
			daytemp["date"]=curdate.strftime("%d")
			dayattendance=[]
			for student in s:
				ispresent=mongo.db.studattendance.find({"date":str(curdate),"studentid":student["_id"]})
				ispresent=list(ispresent)
				if len(ispresent):
					dayattendance.append("P")
				else:
					dayattendance.append("A")

				#print curdate
				#dayattendance.append()
			daytemp["attendance"]=dayattendance
			month.append(daytemp)

			curdate=curdate + timedelta(days=1)




		temp["month"]=curdate.strftime("%B")
		temp["mattendance"]=month
		attendance.append(temp)

			#enddate=mongo.db.studattendance.find({"batch":batchname},{"date":True}).sort('date',-1).limit(1)
		return jsonify({"success":"true","studentlist":s,"attendance":attendance})
	else:
		return jsonify({"success":"false","reason":"Attendance not found"})


@app.route("/testdate",methods=["POST"])
def testdate():
	tt=mongo.db.newtimetables.find({ "date":{'$regex' : 'Dec', '$options' : 'i'}},{"_id":False});
	tt=list(tt)

	return jsonify({"success":"true","tt":tt})
@app.route("/addfield",methods=["POST"])
def addfield():
	mongo.db.student_info.update({} ,{"$set":{"isDeleted" : "false"}},upsert=True)
	return jsonify({"success":"truehh"})

        
if __name__ == "__main__":
	app.run(debug=True, host='0.0.0.0', port=5128, threaded=True)
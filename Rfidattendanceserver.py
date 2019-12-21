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

@app.route("/markattendance",methods=["POST"])
def markattendance():
	print "device date "+ request.get_json()["date"]
	print "device time "+request.get_json()["time"]
	print "server time "+ strftime("%H:%M")
	#print request.get_json()
	staffrfidinfo=mongo.db.staffRfidlist.find_one({"cardid":request.get_json()["cardno"]})
	if staffrfidinfo:
		if(request.get_json()["cardno"]):
			mongo.db.staffRfidattendance.update({"cardid":request.get_json()["cardno"],"staffid":staffrfidinfo["staffid"],"date":request.get_json()["date"]},{'$push': {'time': request.get_json()["time"],'servertime': strftime("%H:%M")}}, upsert = True)
		else:
			#staffinfo=mongo.db.staffRfidlist.find_one({"staffid":request.get_json()["cardno"]})
			mongo.db.staffRfidattendance.update({"staffid":staffrfidinfo["staffid"],"date":request.get_json()["date"]},{'$push': {'time': request.get_json()["time"],'servertime': strftime("%H:%M")}}, upsert = True)

		return jsonify({"success":"true","message":"Attendance Marked"})
	else:	
		carddetails=mongo.db.RFIDlist.find_one({"cardId":request.get_json()["cardno"]})
		if carddetails:
			studentdetail=mongo.db.student_info.find_one({"RollNo":carddetails["RollNo"],"Batch":carddetails["batchname"]})			
			present=request.get_json()
			#print "card deatals"
			#print present
			#print "student detail"
			#print studentdetail
			if studentdetail!=None:
				present["studentid"]=str(studentdetail["_id"])
				present["batch"]=carddetails["batchname"]
				AlreadyMarked=mongo.db.studattendance.find({"date":present["date"],"studentid":present["studentid"]},{"_id":False})
				AlreadyMarked=list(AlreadyMarked)
				if not len(AlreadyMarked):
					mongo.db.studattendance.insert(present)
				return jsonify({"success":"true","message":"Attendance Marked"})
			else:
				return jsonify({"success":"false","message":"invalid card"})
		else:
			return jsonify({"success":"false","message":"invalid card"})


if __name__ == "__main__":
	app.run(debug=True, host='0.0.0.0', port=8080, threaded=True,ssl_context= 'adhoc')


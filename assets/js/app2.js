function isFutureDate(idate) {
    var today = new Date().getTime(),
        idate = idate.split("-");

    idate = new Date(idate[2], idate[1] - 1, idate[0]).getTime();
    return (today - idate) < 0 ? true : false;
}


var app = angular.module('attaboy', ['ngMessages', 'ui.bootstrap']);

app.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function() {
                scope.$apply(function() {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

app.filter('twentyFourToTwelve', function() {
    return function(inputTime) {
        var splitTime = inputTime.split(':');
        var ampm = "am";
        if (splitTime[0] >= 12) {
            ampm = "pm";
        }


        splitTime[0] = splitTime[0] % 12;
        if (splitTime[0] < 10) {
            splitTime[0] = '0' + splitTime[0];
        }
        if (splitTime[1] < 10 && splitTime[1] > 0) {
            splitTime[1] = '0' + splitTime[1];
        }
        return splitTime.join(':') + " " + ampm;
    };
});
app.filter('converttopa', function() {
    return function(inputonezero) {
        if (inputonezero == 1) {
            return "Present";
        } else {
            return "Absent";
        }

    };
});


app.controller('attaboyController', function($scope, $http, $timeout, $window, $filter) {
    $scope.editstudentshow = false;


    $scope.fetchCCclasses = function()
    {
            console.log(localStorage.mobile);
            var parameter = JSON.stringify({               
                "mobile": localStorage.mobile             

            });
            $http.post("http://210.212.181.86:4567/fetchccclasses", parameter)
                .success(function(data) {
                    waitingDialog.hide();
                    if (data.success == "true") {

                       
                        $scope.classes = data.classes;
                         $scope.showpdflink = false;


                    }
                })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something went wrong! ");

                });

          


    };
    $scope.showpdflink = false;

    $scope.downloadAttendanceReport= function()
    {
        var parameter = JSON.stringify({               
                "class_uid": $scope.selectedclass       

            });
        $http.post("http://210.212.181.86:4567/makedefaulterlist", parameter)
                .success(function(data) {
                    waitingDialog.hide();
                    if (data.success == "true") {
                        $scope.showpdflink = true;
                        $scope.pdflink = "http://gescoeerp.in/"+data.downloadlink;                      
                  


                    }
                })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something went wrong! ");

                });




    };

    $scope.EditStudent = function(student) {
        

        $scope.studenttable = false;
        $scope.editstudentshow = true;
        $scope.edstudentrollno = student.rollno;
        $scope.edstudentname = student.name;
        $scope.edstudentemail = student.email;
        $scope.edstudentmobile = student.mobile;
        $scope.edstudentparentmobile = student.parent_mobile;
        $scope.edstudentid = student._id;

    };

    $scope.canceledit = function() {
        $scope.studenttable = true;
        $scope.editstudentshow = false;
    };

    $scope.updateStudent = function() {
        if ($scope.edstudentrollno == undefined || $scope.edstudentname == undefined || $scope.edstudentemail == undefined || $scope.edstudentmobile == undefined || $scope.edstudentparentmobile == undefined) {
            toastr.error("Please fill all the details.  ");
        } else {
            var parameter = JSON.stringify({
                "id": $scope.edstudentid,
                "rollno": $scope.edstudentrollno,
                "name": $scope.edstudentname,
                "email": $scope.edstudentemail,
                "mobile": $scope.edstudentmobile,
                "parentmobile": $scope.edstudentparentmobile

            });
            console.log(parameter);

            waitingDialog.show('...Please Wait', {
                dialogSize: 'sm',
                progressType: 'error'
            });
            $http.post("http://210.212.181.86:4567/updatestudent", parameter)
                .success(function(data) {
                    waitingDialog.hide();
                    if (data.success == "true") {

                        toastr.success(data.message);
                        $scope.studenttable = true;
                        $scope.editstudentshow = false;

                        $timeout(function() {
                            $scope.fetchStudentsAdd();
                        }, 1000);


                    }
                })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something went wrong! ");

                });

        }



    };




    $scope.DownloadExcelReport = function() {
        if ($scope.subjectmodel != undefined) {
            $scope.selectedSubject = JSON.parse($scope.subjectmodel);
            console.log($scope.selectedSubject);
            var parameter = JSON.stringify({
                "subject_uid": $scope.selectedSubject["subject_uid"],
                "class_uid":$scope.selectedSubject["cuid"]
            });
            waitingDialog.show('...Please Wait', {
                dialogSize: 'sm',
                progressType: 'error'
            });
            $http.post("http://210.212.181.86:4567/downloadexcelreport", parameter)
                .success(function(data) {
                    if (data.success == "true") {

                        $scope.downloadlink = "http://210.212.181.86/" + data.downloadlink;
                        waitingDialog.hide();


                    } else {
                        toastr.error(data.reason);
                        waitingDialog.hide();
                    }
                }).error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something Went Wrong!");
                });
        }

    };


    $scope.toggleSelect = function($event) {
        angular.forEach($scope.students, function(item) {
            item.selected = $event.target.checked;
        });
    }

    $scope.toggleSelectStaff = function($event) {
        angular.forEach($scope.staff, function(item) {
            item.selected = $event.target.checked;
        });
    }


    $scope.toggleSelectHODs = function($event) {
        angular.forEach($scope.hods, function(item) {
            item.selected = $event.target.checked;
        });
    }

    $scope.submitbtn = true;
    $scope.confirmbtn = false;
    $scope.forgotpwdblock = true;
    
    $scope.showConfirm = function() {
        $scope.sessiondate = $('#datepicker').val();

        if (isFutureDate($scope.sessiondate)) {
            $scope.hideConfirm();

            toastr.error("Future dated attendance not allowed!");

        } else if ($scope.classinfo == undefined) {
            
            toastr.error("Please Select Class");
            $scope.hideConfirm();

        } else if ($scope.sessiondate == "") {
            $scope.hideConfirm();

            toastr.error('Please Select Date');

        } else if ($scope.sessiontime == undefined) {
            toastr.error('Please Select Time');
            $scope.hideConfirm();
        } else if ($scope.presentabsent == undefined) {
            toastr.error("Please Select Present/Absent Checkbox");

            $scope.hideConfirm();
        } else {

            $scope.classdetails = JSON.parse($scope.classinfo);
            $scope.rollnoArray = [];
            angular.forEach($scope.students, function(student) {
                if (!!student.selected) $scope.rollnoArray.push(JSON.parse(angular.toJson(student)));
            });


            $scope.chosentime = $scope.sessiontime;
            if ($scope.rollnoArray.length > 0) {
                $scope.submitbtn = false;
                $scope.confirmbtn = true;


            } else {

                toastr.error("Please Select atleast one student or mark all absent");

                $scope.hideConfirm();


            }


        }


    };

    $scope.hideConfirm = function() {
        $scope.submitbtn = true;
        $scope.confirmbtn = false;

    };
    $scope.mobilenos = [];

    $scope.showConfirmBtnMsg = function() {


        angular.forEach($scope.staff, function(st) {
            if (!!st.selected) $scope.mobilenos.push(JSON.parse(angular.toJson(st.mobile_no)));
        });

        angular.forEach($scope.students, function(st) {
            if (!!st.selected) $scope.mobilenos.push(JSON.parse(angular.toJson(st.mobile_no)));
        });

        angular.forEach($scope.hods, function(st) {
            if (!!st.selected) $scope.mobilenos.push(JSON.parse(angular.toJson(st.mobile_no)));
        });

        if ($scope.mobilenos.length == 0) {
            toastr.error("Please Select atleast one receiver");
            $scope.hideConfirm();
        } else if ($scope.message == undefined) {
            toastr.error("Please Enter message");
            $scope.hideConfirm();

        } else {
            $scope.submitbtn = false;
            $scope.confirmbtn = true;


        }
    };

    $scope.showConfirmBtnMsgParents = function() {




        angular.forEach($scope.students, function(st) {
            if (!!st.selected) $scope.mobilenos.push(JSON.parse(angular.toJson(st.mobile)));
        });

        if ($scope.classinfo == undefined) {
            toastr.error("Please Select Class");
            $scope.hideConfirm();

        } else if ($scope.mobilenos.length == 0) {
            toastr.error("Please Select atleast one receiver");
            $scope.hideConfirm();
        } else if ($scope.message == undefined) {
            toastr.error("Please Enter message");
            $scope.hideConfirm();

        } else {
            $scope.submitbtn = false;
            $scope.confirmbtn = true;


        }
    };

    $scope.sendMessage = function() {
        var parameter = JSON.stringify({
            "message": $scope.message,
            "mobilenos": $scope.mobilenos,
            "sender": localStorage.mobile
        });
        $http.post("http://210.212.181.86:4567/sendmessage", parameter)
            .success(
                function(data) {
                    toastr.success(data.message);
                    $scope.hideConfirm();

                });




    }



    $scope.downloadlink = false;

    $scope.successbox = false;
    $scope.alertbox = false;
    $scope.classtable = false;
    $scope.studenttable = false;
    $scope.subjectattendancetable = false;
    $scope.sendcode = true;
    $scope.progressbar = false;
    $scope.registerform = true;
    $scope.codeform = false;
    $scope.attendancetable = false;
    $scope.showbatches = false;

    //	$scope.sessiontime = new Date();
    $scope.attendancedetails = false;

    $scope.hstep = 1;
    $scope.mstep = 1;

    $scope.options = {
        hstep: [1, 2, 3],
        mstep: [1, 5, 10, 15, 25, 30]
    };

    $scope.ismeridian = true;
    $scope.toggleMode = function() {
        $scope.ismeridian = !$scope.ismeridian;
    };

    $scope.update = function() {
        var d = new Date();
        d.setHours(14);
        d.setMinutes(0);
        $scope.sessiontime = d;
    };

    $scope.changed = function() {};

    $scope.clear = function() {
        $scope.sessiontime = null;
    };
    $scope.currentsession = undefined;
    $scope.detailSessionAttendance = function(subject) {
        if (subject != undefined) {
            $scope.editattendancebox = false;
            $scope.attendancetable = true;
            $scope.currentsession = subject;

            $scope.classsessionwiseattendance = subject.presenty;
            angular.forEach($scope.classsessionwiseattendance, function(student) {
                student.rollno = parseInt(student.rollno);
            });



        }


    };

    $scope.editattendancebox = false;
    $scope.editSessionAttendance = function(subject) {
        if (subject != undefined) {

            $scope.currentsession = subject;
            $scope.attendancetable = false;
            $scope.editattendancebox = true;
            

            var cntr = 0;
            angular.forEach(subject.presenty, function(item) {

                if ($scope.presentabsent == "present") {
                    if (item.present == 1) {
                        item.selected = true;
                    } else {
                        item.selected = false;
                    }
                } else {

                    if (item.present == 0) {
                        item.selected = true;
                    } else {
                        item.selected = false;
                    }


                }
                cntr += 1;
            });
            $scope.students = subject.presenty;
            angular.forEach($scope.students, function(student) {
                student.rollno = parseInt(student.rollno);
            });
            
           
            
            $scope.presentabsent = subject.presentabsent;
            $scope.currentsessiontime = subject.sessiontime;
            $scope.currentsessiondate = subject.sessiondate;
            
            $('#datepicker').val($scope.currentsessiondate);
            $scope.sessiontime = $scope.currentsessiontime;

            
        }


    };


    $scope.updateAttendance = function() {

        $scope.rollnoArray = [];
        angular.forEach($scope.students, function(student) {
            if (!!student.selected) $scope.rollnoArray.push(JSON.parse(angular.toJson(student)));
        });


        $scope.currentsession.sessiontime = $scope.sessiontime;
        $scope.currentsession.sessiondate = $('#datepicker').val();
        
        
        if($scope.currentsession.sessiontime == undefined)
        {
        toastr.error("Select Time");
        }
        else if($scope.currentsession.sessiondate == undefined)
        {
        toastr.error("Select Date");
        
        }       
        
        else if ($scope.rollnoArray.length > 0) {

            var r = confirm("Are you sure?");
            if (r == true) {
                if ($scope.currentsession.subjecttype == "Practical" || $scope.currentsession.subjecttype == "Tutorial") {

                    var parameter = JSON.stringify({
                        "id":$scope.currentsession._id,
                        
                        "presentabsent": $scope.presentabsent,
                        "class_uid": $scope.currentsession.class_uid,
                        "subject_uid": $scope.currentsession.subject_uid,
                        "subjectname": $scope.currentsession.subjectname,
                        "faculty": $scope.currentsession.faculty,
                        "students": $scope.rollnoArray,
                        "sessiondate": $scope.currentsession.sessiondate,
                        "sessiontime": $scope.currentsession.sessiontime,
                        "batch": $scope.currentsession.batch,
                        "subjecttype": $scope.currentsession.subjecttype,

                    });

                } else {

                    var parameter = JSON.stringify({
                        "id":$scope.currentsession._id,
                        
                        "presentabsent": $scope.presentabsent,
                        "class_uid": $scope.currentsession.class_uid,
                        "subject_uid": $scope.currentsession.subject_uid,
                        "subjectname": $scope.currentsession.subjectname,
                        "subjecttype": $scope.currentsession.subjecttype,
                        "faculty": $scope.currentsession.faculty,
                        "students": $scope.rollnoArray,
                        "sessiondate": $scope.currentsession.sessiondate,
                        "sessiontime": $scope.currentsession.sessiontime

                    });
                }

               waitingDialog.show("...Please Wait");
                $http.post("http://210.212.181.86:4567/updateattendance", parameter)
                    .success(
                        function(data) {

                            if (data.success == "true") {
                            waitingDialog.hide();
                                toastr.success(data.message);
                                $scope.hideConfirm();

                            } else {
                               waitingDialog.hide();
                                toastr.error(data.message);
                                $scope.hideConfirm();
                            }
                            
                            
                            $timeout(function() {

                        $scope.personalAtttendance();
                    }, 300);
                            
                        })
                    .error(function(err) {
                        waitingDialog.hide();
                        toastr.error("Something Went Wrong");
                    });


            }
        } else {

            toastr.error("Please Select atleast one student or mark all absent");


        }


    };


    $scope.personalAtttendance = function() {
        if ($scope.subjectmodel != undefined) {
            $scope.selectedSubject = JSON.parse($scope.subjectmodel);
            $scope.downloadlink = false;
            var parameter = JSON.stringify({
                "subject_uid": $scope.selectedSubject["subject_uid"]
            });

            waitingDialog.show('...Please Wait');
            $http.post("http://210.212.181.86:4567/getstaffsubjectwiseattendance", parameter)
                .success(
                    function(data) {
                        waitingDialog.hide();

                        if (data.success == "true") {

                            if (data.total_sessions > 0) {

                                $scope.subjectattendancetable = true;
                                $scope.attendancetable = false;
                                $scope.totalSessions = data.total_sessions;
                                $scope.subjectAttendance = data.subject_wise_attendance;
                                
                                console.log(typeof($scope.subjectAttendance[0].sessiondate));
                                
                                angular.forEach($scope.subjectAttendance, function(subject) {
                                    subject.newdate = subject.sessiondate.replace('-','');

                                    });

                                console.log(typeof($scope.subjectAttendance[0].sessiondate));

                                
                            } else {
                                $scope.subjectattendancetable = false;

                                $scope.attendancetable = false;
                                toastr.error("Attendance Not Found!");

                            }
                        } else {
                            $scope.attendancetable = false;
                            toastr.error(data.reason);

                        }
                    }
                );
        }
    };
    
    $scope.sendsms = "true";

    $scope.takeAttendance = function() {

        $scope.sessiondate = $('#datepicker').val();


        if ($scope.classinfo == undefined) {
            toastr.error("Please Select Class")

            $scope.hideConfirm();

        } else if ($scope.sessiondate == "") {
            $scope.hideConfirm();

            toastr.error('Please Select Date');

        } else if ($scope.sessiontime == undefined) {
            toastr.error('Please Select Time');
            $scope.hideConfirm();
        } else if ($scope.presentabsent == undefined) {
            toastr.error("Please Select Present/Absent Checkbox");

            $scope.hideConfirm();
        } else {

            $scope.classdetails = JSON.parse($scope.classinfo);
            $scope.rollnoArray = [];
            angular.forEach($scope.students, function(student) {
                if (!!student.selected) $scope.rollnoArray.push(JSON.parse(angular.toJson(student)));
            });



            $scope.chosentime = $scope.sessiontime;
            if ($scope.rollnoArray.length > 0) {

                if ($scope.classdetails["subjecttype"] == "Practical" || $scope.classdetails["subjecttype"] == "Tutorial") {

                    var parameter = JSON.stringify({
                        "presentabsent": $scope.presentabsent,
                        "class_uid": $scope.classdetails["cuid"],
                        "subject_uid": $scope.classdetails["subject_uid"],
                        "subjectname": $scope.classdetails["subjectname"],
                        "faculty": $scope.classdetails["faculty_name"],
                        "students": $scope.rollnoArray,
                        "sessiondate": $scope.sessiondate,
                        "sessiontime": $scope.chosentime,
                        "batch": $scope.batchname,
                        "subjecttype": $scope.classdetails["subjecttype"],
                        "sendsms":$scope.sendsms

                    });

                } else {

                    var parameter = JSON.stringify({
                        "presentabsent": $scope.presentabsent,
                        "class_uid": $scope.classdetails["cuid"],
                        "subject_uid": $scope.classdetails["subject_uid"],
                        "subjectname": $scope.classdetails["subjectname"],
                        "subjecttype": $scope.classdetails["subjecttype"],
                        "faculty": $scope.classdetails["faculty_name"],
                        "students": $scope.rollnoArray,
                        "sessiondate": $scope.sessiondate,
                        "sessiontime": $scope.chosentime,
                        "sendsms":$scope.sendsms


                    });
                }

                waitingDialog.show("...Please Wait");
                $http.post("http://210.212.181.86:4567/addattendance", parameter)
                    .success(
                        function(data) {

                            if (data.success == "true") {
                               waitingDialog.hide();

                                toastr.success(data.message);
                                $scope.hideConfirm();


                            } else {
                               waitingDialog.hide();
                                toastr.error(data.message +"<br/><br/>Conducted Session: <br/>"+data.conducted_by.subjectname+":"+data.conducted_by.subjecttype+"<br/> Date:"+data.conducted_by.sessiondate+"<br/> Time:"+data.conducted_by.sessiontime);
                                
                                console.log(data.conducted_by);
                                $scope.hideConfirm();

                            }
                        });


            } else {

                toastr.error("Please Select atleast one student or mark all absent");

                $scope.hideConfirm();


            }


        }


    };

    $scope.uploadFile = function() {

        if ($scope.classinfo == undefined) {

            toastr.error("Please Select Class");

        } else if ($scope.myFile == undefined) {
            toastr.error("Please Choose file to upload");


        } else {
            var file = $scope.myFile;
            var classinfo = $scope.classinfo;
            var uploadUrl = "http://210.212.181.86:4567/uploadstudents";

            waitingDialog.show("...Please Wait");
            var fd = new FormData();
            fd.append('class', classinfo);
            fd.append('file', file);

            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            })

            .success(function(data) {

                if (data.success == "true") {
                    waitingDialog.hide();
                    toastr.success(data.message);
                    $timeout(function() {

                        $scope.fetchStudentsAdd();
                    }, 300);

                } else {
                    waitingDialog.hide();
                    toastr.error(data.message);
                }

            })

            .error(function() {
                waitingDialog.hide();
                toastr.error("Something is wrong");
            });


        }
    };
    $scope.uploadStaffDetailsFile = function() {

        if ($scope.branchname == undefined) {
            toastr.error("Please Select Branch");

        } else if ($scope.myFile == undefined) {
            toastr.error("Please Choose file to upload");

        } else {
            var file = $scope.myFile;
            var branchname = $scope.branchname;
            var uploadUrl = "http://210.212.181.86:4567/uploadstaff";

            

            waitingDialog.show("...Please Wait");
            var fd = new FormData();
            fd.append('branch', branchname);
            fd.append('file', file);

            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            })

            .success(function(data) {

                if (data.success == "true") {
                    waitingDialog.hide();

                    
                    
                    toastr.success(data.message);
                    $timeout(function() {
                    $scope.hodinit();
                    }, 1000);
                    
                }

            })

            .error(function() {

                toastr.error("Something Went Wrong");
            });


        }
    };

    $scope.checkLogin = function() {
        if (localStorage.role == "student") {
            $window.location.href = "student.html";
        }
        if (localStorage.role == "staff") {
            $window.location.href = "staff.html";
        }
        if (localStorage.role == "hod") {
            $window.location.href = "hod.html";
        }

        if (localStorage.role == "admin") {
            $window.location.href = "admin.html";
        }



    };


    $scope.login = function() {
        if ($scope.email == undefined) {
            toastr.error("Please Enter Email");

        } else if ($scope.email.indexOf("@") < 1 || $scope.email.lastIndexOf(".") < $scope.email.indexOf("@") || $scope.email.lastIndexOf(".") + 2 > $scope.email.length) {

            toastr.error("Email ID is not Valid");

        } else if ($scope.password == undefined) {
            toastr.error("Please Enter Password");

        } else if ($scope.email.password >= 8) {
            toastr.error("Password length should be atleast 8 characters");


        } else if ($scope.role == undefined) {
            toastr.error("Please Select Role");

        } else {
            waitingDialog.show("...Please Wait");

            var parameter = JSON.stringify({
                "email": $scope.email,
                "password": $scope.password,
                "role": $scope.role
            });
            $http.post("http://210.212.181.86:4567/login", parameter)
                .success(
                    function(data) {

                        if (data.success == "true") {
                            waitingDialog.hide();
                            
                            $scope.emailcode = true;
                            $scope.registerform = false;
                            
                            localStorage.email = $scope.email;
                            localStorage.role = $scope.role;
                            localStorage.mobile = data.mobile;
                            if ($scope.role == "student") {
                                $window.location.href = "student.html";
                            }
                            if ($scope.role == "staff") {
                                $window.location.href = "staff.html";
                            }
                            if ($scope.role == "hod") {
                                $window.location.href = "hod.html";
                            }

                            if ($scope.role == "admin") {
                                $window.location.href = "admin.html";
                            }

                            toastr.success(data.message);

                        } else {

                            waitingDialog.hide();
                            toastr.error(data.message);
                        }
                    }
                );

        }

    };

    $scope.logout = function() {
        localStorage.clear();
        $window.location.href = "index.html";

    };


    $scope.sendmail = function() {


        if ($scope.email == undefined) {
            toastr.error("Please Enter Mail Address");
        } else if ($scope.email.indexOf("@") < 1 || $scope.email.lastIndexOf(".") < $scope.email.indexOf("@") || $scope.email.lastIndexOf(".") + 2 > $scope.email.length) {
            toastr.error("Please Enter Valid Mail Address");
        } else if ($scope.password == undefined) {
            toastr.error("Please Enter Password");

        } else if ($scope.password.length < 8 || $scope.password.length > 30) {
            toastr.error("Password length must be between 8-30 characters ");

        } else if ($scope.role == undefined) {
            toastr.error("Please Select Role");

        } else {
            waitingDialog.show("...Please Wait");
            var parameter = JSON.stringify({
                "email": $scope.email,
                "password": $scope.password,
                "role": $scope.role
            });
            $http.post("http://210.212.181.86:4567/sendmail", parameter)
                .success(
                    function(data) {

                        if (data.success == "true") {
                            waitingDialog.hide();

                            $scope.emailcode = true;
                            $scope.registerform = false;
                            toastr.success(data.message);
                        } else {
                            waitingDialog.hide();
                            toastr.error(data.message);

                        }
                    }
                );

        }

    };

    $scope.register = function() {

        if ($scope.mcode == undefined) {
            toastr.error("Please Enter Code");
        } else {
            var parameter = JSON.stringify({
                "email": $scope.email,
                "password": $scope.password,
                "code": $scope.mcode,
                "role": $scope.role
            });
            waitingDialog.show("...Please Wait");

            $http.post("http://210.212.181.86:4567/register", parameter)
                .success(
                    function(data) {
                    waitingDialog.hide();
                        if (data.success == "true") {
                            

                            $scope.emailcode = true;
                            toastr.success(data.message);
                            $timeout(function() {

                                $window.location.href = "index.html";
                            }, 2000);
                        } else {
                            waitingDialog.hide();
                            toastr.error(data.message);
                        }
                    }
                ).error(function(err){
                    waitingDialog.hide();
                    toastr.error("Something Went Wrong");
                
                });
        }

    };


    $scope.admininit = function() {
        $scope.role = localStorage.role;
        if ($scope.role != "admin" ) {
            $scope.logout();
        } else {
            waitingDialog.show("...Please Wait");
            $http.get("http://210.212.181.86:4567/getbranches")
                .success(function(data) {

                    //$scope.classnames = data.classnames;
                    $scope.branches = data.branches;
                    $scope.hods = data.hods;
                    /*	$scope.divisions = data.divisions;
					//$scope.staff = data.staff;
					$scope.classrooms = data.classrooms;
					$scope.acad_year = data.acad_year;
					$scope.semesters = data.semesters*/
                    waitingDialog.hide();
                })


            .error(function(err) {
                waitingDialog.hide();
                toastr.error("Something Went Wrong");

            });

        }


    };
    $scope.studentinit = function() {
        waitingDialog.show("...Please Wait");
        $scope.role = localStorage.role;
        if ($scope.role != "student") {
            waitingDialog.hide();
            $scope.logout();
        } else {
            var parameter = JSON.stringify({
                "mobile": localStorage.mobile
            });

            $http.post("http://210.212.181.86:4567/getattendancestudents", parameter)
                .success(function(data) {
                    waitingDialog.hide();
                    if (data.success == "true") {
                        $scope.subject_wise_attendance = data.subject_wise_attendance;
                        var totalSessionAttended = 0;
                        var totalSessions = 0;

                        for (var i = 0; i < $scope.subject_wise_attendance.length; i++) {
                            totalSessionAttended += parseInt($scope.subject_wise_attendance[i]["session_attended"]);
  
                            totalSessions += parseInt($scope.subject_wise_attendance[i]["total_sessions"]);
                        }
                        $scope.totalSessionAttended = totalSessionAttended;
                        $scope.totalSessions = totalSessions;
                    } else {
                        waitingDialog.hide();
                        toastr.error("Something Went Wrong");
                    }


                })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something Went Wrong");

                });


        }
    };

    $scope.detailSubjectAttendance = function(subject) {
        $scope.attendancedetails = true;
        $scope.details = subject.details;


    };


    $scope.staffinit = function() {
        waitingDialog.show("...Please Wait");
        $scope.role = localStorage.role;
        if ($scope.role != "staff") {
            waitingDialog.hide();
            $scope.logout();
        } else {

            var parameter = JSON.stringify({
                "mobile": localStorage.mobile
            });

            $http.post("http://210.212.181.86:4567/getsubjects", parameter)
                .success(function(data) {
                    waitingDialog.hide();

                    if (data.success == "true") {
                        if (data.iscc == "true") {
                            $scope.isclasscoordinator = true;
                        }

                        $scope.subjects_teaching = data.subjects_teaching;
                        $scope.cc_classes = data.classes;
                        $scope.branches = data.branches;

                    } else {
                        toastr.error(data.message);
                    }


                })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something is wrong ! Please try again after sometime!")

                })

            ;


        }
    };
    $scope.deleteStaff = function(staffid) {

        var r = confirm("Are you sure?");
        if (r == true) {
            var parameter = JSON.stringify({
                "id": staffid
            });

            $http.post("http://210.212.181.86:4567/deletestaff", parameter)
                .success(function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        $scope.hodinit();

                    } else {
                        toastr.error("Something is wrong!");


                    }


                });

        }


    };
    
     $scope.deleteSessionAttendance = function(sessionid) {
        console.log(sessionid);
        var r = confirm("Are you sure?");
        if (r == true) {
            var parameter = JSON.stringify({
                "id": sessionid
            });

            $http.post("http://210.212.181.86:4567/deletesession", parameter)
                .success(function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        
                         $timeout(function() {
                              $scope.personalAtttendance();
                            }, 300);
                       
                      

                    } else {
                        toastr.error("Something is wrong!");


                    }


                });

        }


    };


    $scope.deleteAllStudents = function(selectedclass) {

        var r = confirm("Are you sure?");
        if (r == true) {
            var parameter = JSON.stringify({
                "selectedclass": selectedclass
            });
            $http.post("http://210.212.181.86:4567/deleteallstudents", parameter)
                .success(function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        $scope.fetchStudentsAdd();

                    } else {
                        toastr.error("Something is wrong!");
                    }
                })
                .error(function(err) {
                    toastr.error("Something is wrong!");
                });




        }


    };

    $scope.deleteStudent = function(studentid) {
        var r = confirm("Are you sure?");
        if (r == true) {
            waitingDialog.show("...Please Wait");

            var parameter = JSON.stringify({
                "id": studentid
            });
            $http.post("http://210.212.181.86:4567/deleteStudent", parameter)
                .success(function(data) {
                waitingDialog.hide();
                    if (data.success == "true") {
                        toastr.success(data.message);
                          $timeout(function() {
                               $scope.fetchStudentsAdd();
                            }, 300);
                        
                        
                        
                    } else {
                        toastr.error("Something is wrong!");

                    }


                });
        }

    };


    $scope.deleteClass = function(classid) {
        var r = confirm("Are you sure?");
        if (r == true) {
            waitingDialog.show("...Please Wait");

            var parameter = JSON.stringify({
                "id": classid
            });
            $http.post("http://210.212.181.86:4567/deleteclass", parameter)
                .success(function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        $scope.hodinit();
                        waitingDialog.hide();
                    } else {
                        toastr.error("Something is wrong!");
                        waitingDialog.hide();

                    }


                });
        }

    };

    $scope.deleteSubject = function(subjectid) {

        var r = confirm("Are you sure?");
        if (r == true) {
            var parameter = JSON.stringify({
                "id": subjectid
            });
            $http.post("http://210.212.181.86:4567/deletesubject", parameter)
                .success(function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        $scope.fetchSubjects();

                    } else {
                        toastr.error("Something is wrong!");


                    }


                });

        }

    };


    $scope.hodinit = function() {
        $scope.role = localStorage.role;
        if ($scope.role != "hod") {
            $scope.logout();
        } else {
            var parameter = JSON.stringify({
                "mobile": localStorage.mobile
            });

            $http.post("http://210.212.181.86:4567/getclasses", parameter)
                .success(function(data) {

                    $scope.classnames = data.classnames;
                    $scope.branches = data.branches;
                    $scope.divisions = data.divisions;
                    $scope.staff = data.staff;
                    $scope.classrooms = data.classrooms;
                    $scope.acad_year = data.acad_year;
                    $scope.semesters = data.semesters
                     $scope.hods = data.hods;
                });


            var parameter = JSON.stringify({
                "mobile": localStorage.mobile
            });

            $http.post("http://210.212.181.86:4567/getallclasses", parameter)
                .success(function(data) {
                    if (data.success == "true") {
                        $scope.classtable = true;
                        $scope.allclasses = data.allclasses

                    } else {
                        $scope.classtable = false;
                    }

                });
        }

    };


    $scope.addNewClass = function() {

        var class_unique_id = $scope.cn + $scope.branchname + $scope.division + $scope.acadyear + $scope.semester;
        $scope.class_unique_id = class_unique_id.replace("-", "");

        var parameter = JSON.stringify({
            "class_unique_id": $scope.class_unique_id,
            "class": $scope.cn,
            "branch": $scope.branchname,
            "division": $scope.division,
            "class_coordinator": $scope.faculty,
            "class_room_no": $scope.classroom,
            "acad_year": $scope.acadyear,
            "semester": $scope.semester,
            "currently_active": $scope.curr_active
        });
        
        waitingDialog.show("...Please Wait");

        $http.post("http://210.212.181.86:4567/addnewclass", parameter)
            .success(
                function(data) {
                waitingDialog.hide();
                    if (data.success == "true") {
                        toastr.success(data.message);
                        
                        $timeout(function() {
                                $scope.hodinit();
                            }, 1000);
                        



                    } else if (data.success == "false") {

                        toastr.error(data.reason);


                    }
                }
            )
            .error(function(err){
            waitingDialog.hide();
            toastr.error("Something went wrong");
            })
            
            ;


    };

    $scope.fetchStaff = function() {
        if ($scope.branchname != undefined) {
            var parameter = JSON.stringify({
                "branch": $scope.branchname
            });
            
            waitingDialog.show("...Please Wait");
            $http.post("http://210.212.181.86:4567/fetchstaff", parameter)
                .success(
                    function(data) {
                    waitingDialog.hide();
                        if (data.success == "true") {
                            $scope.staff = data.staff;
                        } else {
                            toastr.error(data.reason);
                            

                        }
                    }


                )
                .error(function(err){
                waitingDialog.hide();
                    toastr.error("Something Went Wrong");
                });
        }
    }


    $scope.fetchDeptStaff = function() {
        if ($scope.cuid != undefined) {
            var parameter = JSON.stringify({
                "cuid": $scope.cuid
            });
            $http.post("http://210.212.181.86:4567/fetchdeptstaff", parameter)
                .success(
                    function(data) {

                        if (data.success == "true") {
                            $scope.staff = data.staff;

                            $scope.fetchSubjects();
                        } else {
                        
                            toastr.error(data.reason);

                        }
                    }


                ).error(function(err){
                    toastr.error("Something went wrong");
                });
        }
    }

    $scope.deactiveClass = function(classuid) {
        var parameter = JSON.stringify({
            "class_unique_id": classuid
        });

        $http.post("http://210.212.181.86:4567/deactiveclass", parameter)
            .success(
                function(data) {
                    if (data.success == "true") {
                        
                        toastr.success(data.message);
                        $http.get("http://210.212.181.86:4567/getallclasses")
                            .success(function(data) {
                                if (data.success == "true") {
                                    $scope.classtable = true;
                                    $scope.allclasses = data.allclasses
                                } else {
                                    $scope.classtable = false;
                                }
                            });



                    } else if (data.success == "false") {
                        toastr.error(data.reason);
                        

                    }
                }
            );

    };


    $scope.addNewStaff = function() {
        var parameter = JSON.stringify({
            "staff_unique_id": $scope.mobile,
            "staff_name": $scope.staffname,
            "qualification": $scope.qualif,
            "mobile_no": $scope.mobile,
            "email": $scope.email,
            "branch": $scope.branchname
        });


        $http.post("http://210.212.181.86:4567/addnewstaff", parameter)
            .success(
                function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        
                        $scope.hodinit();
                    } else if (data.success == "false") {
                        toastr.error(data.reason);

                    }


                }
            );


    };

    $scope.addNewHOD = function() {
        var parameter = JSON.stringify({
            "staff_unique_id": $scope.mobile,
            "staff_name": $scope.staffname,
            "qualification": $scope.qualif,
            "mobile_no": $scope.mobile,
            "email": $scope.email,
            "branch": $scope.branchname
        });


        $http.post("http://210.212.181.86:4567/addnewhod", parameter)
            .success(
                function(data) {
                    if (data.success == "true") {
                        toastr.success(data.message);
                        $scope.admininit();
                    } else if (data.success == "false") {

                        toastr.error(data.reason);
                    }


                }
            );


    };


    $scope.fetchStudents = function() {
        if ($scope.classinfo != undefined) {


            $scope.selectedclass = JSON.parse($scope.classinfo);
            $scope.todisplay = $scope.selectedclass["abbr"] + " " + $scope.selectedclass["subjectname"] + " " + $scope.selectedclass["subjecttype"]


            if ($scope.selectedclass["subjecttype"] == "Practical" || $scope.selectedclass["subjecttype"] == "Tutorial") {

                if ($scope.batchname == undefined) {
                    var parameter = JSON.stringify({
                        "class_uid": $scope.selectedclass["cuid"]
                    });
                    waitingDialog.show("...Please Wait");
                    $http.post("http://210.212.181.86:4567/getbatches", parameter)
                        .success(
                            function(data) {

                                if (data.success == "true") {
                                    $scope.showbatches = true;
                                    $scope.batches = data.batches;
                                    $scope.studenttable = false;
                                    $scope.students = null;
                                    waitingDialog.hide();
                                    toastr.success("Please Select Batch");

                                } else {
                                    waitingDialog.hide();
                                    toastr.error(data.reason);

                                }

                            }


                        );
                } else {


                    var parameter = JSON.stringify({
                        "class_uid": $scope.selectedclass["cuid"],
                        "batch": $scope.batchname
                    });


                    $http.post("http://210.212.181.86:4567/fetchstudents", parameter)
                        .success(
                            function(data) {

                                if (data.success == "true") {

                                    $scope.studenttable = true;
                                    $scope.students = data.students;
                                    angular.forEach($scope.students, function(student) {
                                    student.rollno = parseInt(student.rollno);
                                });
                                    

                                } else {
                                toastr.error( data.reason);

                                }

                            }


                        );


                }


            } else {


                var parameter = JSON.stringify({
                    "class_uid": $scope.selectedclass["cuid"]
                });


                $http.post("http://210.212.181.86:4567/fetchstudents", parameter)
                    .success(
                        function(data) {

                            if (data.success == "true") {
                                $scope.showbatches = false;
                                $scope.batches = null;

                                $scope.studenttable = true;
                                $scope.students = data.students;
                                angular.forEach($scope.students, function(student) {
                                    student.rollno = parseInt(student.rollno);
                                });

                            } else {
                                   toastr.error(data.reason);

                            }

                        }


                    );
            }
        }
    }


    $scope.fetchStudentsAdd = function() {
        if ($scope.classinfo != undefined) {


            $scope.selectedclass = $scope.classinfo;

            var parameter = JSON.stringify({
                "class_uid": $scope.selectedclass
            });

            waitingDialog.show("...Please Wait");
            $http.post("http://210.212.181.86:4567/fetchstudents", parameter)
                .success(
                    function(data) {
                        waitingDialog.hide();
                        if (data.success == "true") {

                            $scope.studenttable = true;
                            
                            
                            $scope.students = data.students;
                            
                            angular.forEach($scope.students, function(student) {
                                student.rollno = parseInt(student.rollno);
                            });
                            waitingDialog.hide();

                        } else {

                            toastr.error("No Students found in this class");
                            $scope.studenttable = false;
                            waitingDialog.hide();
                        }

                    }


                )
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something Went Wrong");
                });
        } else {
            $scope.studenttable = false;
        }
    }


    $scope.fetchSubjects = function() {
        if ($scope.cuid != undefined) {


            var parameter = JSON.stringify({
                "cuid": $scope.cuid
            });
            $http.post("http://210.212.181.86:4567/fetchsubjects", parameter)
                .success(
                    function(data) {

                        if (data.success == "true") {
                            $scope.subjecttable = true;
                            $scope.subjects = data.subjects;
                        } else {
                            toastr.error(data.reason);

                        }

                    }


                );
        }
    }


    $scope.addSubject = function() {
        if ($scope.cuid != undefined && $scope.faculty != undefined && $scope.subjectname != undefined && $scope.abbr != undefined && $scope.unicode != undefined && $scope.subjecttype != undefined) {
            var parameter = JSON.stringify({
                "cuid": $scope.cuid,
                "faculty": $scope.faculty,
                "subjectname": $scope.subjectname,
                "abbr": $scope.abbr,
                "unicode": $scope.unicode,
                "subjecttype": $scope.subjecttype

            });

            waitingDialog.show("...Please Wait");

            $http.post("http://210.212.181.86:4567/addnewsubject", parameter)
                .success(
                    function(data) {
                    waitingDialog.hide();
                        if (data.success == "true") {
                        
                            
                            toastr.success(data.message);
                            $scope.fetchSubjects();
                            
                            waitingDialog.hide();

                        } else {
                            toastr.error(data.reason);
                            waitingDialog.hide();

                        }

                    })
                    .error(function(err){
                        waitingDialog.hide();
                        toastr.error("Something went wrong");
                    })
                    ;

        }


    }

    $scope.createBatch = function() {
        var parameter = JSON.stringify({
            "class_uid": $scope.classinfo,
            "batchname": $scope.batchname,
            "firstrollno": $scope.firstrollno,
            "lastrollno": $scope.lastrollno
        });

        waitingDialog.show("...Please Wait");
        $http.post("http://210.212.181.86:4567/createbatch", parameter)
            .success(
                function(data) {
                    waitingDialog.hide();
                    if (data.success == "true") {

                        toastr.success("Succcessfully Created");
                        waitingDialog.hide();
                        setTimeout(function() {
                            $scope.fetchStudentsAdd();
                        }, 1000);


                    } else {
                        waitingDialog.hide();
                        toastr.error(data.reason);

                    }


                }).error(function(err) {
                waitingDialog.hide();
                toastr.error("Something Went Wrong");

            });


    }


    $scope.forgotpwd = function() {
        if ($scope.emailmobile == undefined) {
            toastr.error("Please Enter Email /Mobile Number");
        } else if ($scope.role == undefined) {
            toastr.error("Please Select Role");
        } else {

            waitingDialog.show('...Please Wait', {
                dialogSize: 'sm',
                progressType: 'error'
            });
            var parameter = JSON.stringify({
                "emailmobile": $scope.emailmobile,
                "role": $scope.role
            });




            $http.post("http://210.212.181.86:4567/forgotpwd", parameter)
                .success(
                    function(data) {
                        if (data.success == "true") {
                            waitingDialog.hide();
                            toastr.success(data.message);
                            $scope.forgotpwdblock = false;
                            $scope.emailcode = true;

                        } else {
                            waitingDialog.hide();
                            toastr.error(data.message);

                        }


                    })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something went wrong!");

                });

        }


    };

    $scope.checkcode = function() {
        if ($scope.mcode == undefined) {
            toastr.error("Please Enter Code");
        }
        if ($scope.password == undefined) {
            toastr.error("Please Enter New Password");
        } else if ($scope.password.length < 8 || $scope.password.length > 30) {
            toastr.error("Password length must be between 8 to 30");
        } else {
            waitingDialog.show('...Please Wait', {
                dialogSize: 'sm',
                progressType: 'error'
            });

            var parameter = JSON.stringify({
                "emailmobile": $scope.emailmobile,
                "code": $scope.mcode,
                "role": $scope.role,
                "pwd": $scope.password
            });
            $http.post("http://210.212.181.86:4567/passwordreset", parameter)
                .success(
                    function(data) {
                        if (data.success == "true") {
                            waitingDialog.hide();
                            toastr.success(data.message);
                            $scope.forgotpwdblock = true;
                            $scope.emailcode = false;
                            $window.location.href = "index.html";

                        } else {
                            waitingDialog.hide();
                            toastr.error(data.message);
                        }
                    })
                .error(function(err) {
                    waitingDialog.hide();
                    toastr.error("Something went wrong!");
                });


        }

    };


});
    // create the module and name it scotchApp
    var riddlerApp = angular.module('riddlerApp', ['ngRoute','angularUtils.directives.dirPagination','ngFileUpload','720kb.datepicker','moment-picker','ngMessages','wingify.timePicker','ui.multiselect','ngMaterial','ngAnimate',
    'ngAria','ngMessages','mdPickers','smart-table']);

    riddlerApp.config(['momentPickerProvider', function (momentPickerProvider) {
      momentPickerProvider.options({ 
        minutesFormat: 'mm',
        hoursFormat:'hh',
        minutesStep:1
      }); 
    }]);

    riddlerApp.directive("filesInput", function() {
return {
require: "ngModel",
link: function postLink(scope,elem,attrs,ngModel) {
  elem.on("change", function(e) {
    var files = elem[0].files;
    ngModel.$setViewValue(files);
  })
}
}
});

    riddlerApp.directive('stSelectDistinct', [function() {
      return {
        restrict: 'E',
        require: '^stTable',
        scope: {
          collection: '=',
          predicate: '@',
          predicateExpression: '='
        },
        template: '<select ng-model="selectedOption" ng-change="optionChanged(selectedOption)" ng-options="opt for opt in distinctItems"></select>',
        link: function(scope, element, attr, table) {
          var getPredicate = function() {
            var predicate = scope.predicate;
            if (!predicate && scope.predicateExpression) {
              predicate = scope.predicateExpression;
            }
            return predicate;
          }

          scope.$watch('collection', function(newValue) {
            var predicate = getPredicate();

            if (newValue) {
              var temp = [];
              scope.distinctItems = ['All'];

              angular.forEach(scope.collection, function(item) {

                var value = item[predicate].toString();                

                if (value && value.trim().length > 0 && temp.indexOf(value) === -1) {
                  temp.push(value.toString());
                }
              });
              temp.sort();

              scope.distinctItems = scope.distinctItems.concat(temp);
              scope.selectedOption = scope.distinctItems[0];
              scope.optionChanged(scope.selectedOption);
            }
          }, true);

          scope.optionChanged = function(selectedOption) {
            var predicate = getPredicate();

            var query = {};

            query.distinct = selectedOption;

            if (query.distinct === 'All') {
              query.distinct = '';
            }

            table.search(query, predicate);
          };
        }
      }
    }]);
    



riddlerApp.filter('unique', function() {
    return function (arr, field) {
        console.log(field);
        var o = {}, i, l = arr.length, r = [];
        for(i=0; i<l;i+=1) {
            o[arr[i][field]] = arr[i];
        }
        for(i in o) {
            r.push(o[i]);
        }

/*        console.log(r);
*/        return r;
    };
  });

riddlerApp.filter('customFilter', ['$filter', function($filter) {
      var filterFilter = $filter('filter');
      var standardComparator = function standardComparator(obj, text) {
        text = ('' + text).toLowerCase();
        return ('' + obj).toLowerCase().indexOf(text) > -1;
      };

      return function customFilter(array, expression) {
        function customComparator(actual, expected) {

          var isBeforeActivated = expected.before;
          var isAfterActivated = expected.after;
          var isLower = expected.lower;
          var isHigher = expected.higher;
          var higherLimit;
          var lowerLimit;
          var itemDate;
          var queryDate;

          if (angular.isObject(expected)) {
            //exact match
            if (expected.distinct) {
              if (!actual || actual.toLowerCase() !== expected.distinct.toLowerCase()) {
                return false;
              }

              return true;
            }

            //matchAny
            if (expected.matchAny) {
              if (expected.matchAny.all) {
                return true;
              }

              if (!actual) {
                return false;
              }

              for (var i = 0; i < expected.matchAny.items.length; i++) {
                if (actual.toLowerCase() === expected.matchAny.items[i].toLowerCase()) {
                  return true;
                }
              }

              return false;
            }

            //date range
            if (expected.before || expected.after) {
              try {
                if (isBeforeActivated) {
                  higherLimit = expected.before;

                  itemDate = new Date(actual);
                  queryDate = new Date(higherLimit);

                  if (itemDate > queryDate) {
                    return false;
                  }
                }

                if (isAfterActivated) {
                  lowerLimit = expected.after;


                  itemDate = new Date(actual);
                  queryDate = new Date(lowerLimit);

                  if (itemDate < queryDate) {
                    return false;
                  }
                }

                return true;
              } catch (e) {
                return false;
              }

            } else if (isLower || isHigher) {
              //number range
              if (isLower) {
                higherLimit = expected.lower;

                if (actual > higherLimit) {
                  return false;
                }
              }

              if (isHigher) {
                lowerLimit = expected.higher;
                if (actual < lowerLimit) {
                  return false;
                }
              }

              return true;
            }
            //etc

            return true;

          }
          return standardComparator(actual, expected);
        }

        var output = filterFilter(array, expression, customComparator);
        return output;
      };
    }]);
   

    riddlerApp.factory('HttpInterceptor', function ($window, $q) {
    return {
        request: function(config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.getItem('user-token')) {
              // may also use sessionStorage
                config.headers.x_access_token = $window.sessionStorage.getItem('user-token');
            }
            return config || $q.when(config);
        },
        response: function(response) {
            if (response.status === 401) {
                alert('Please Login First');
                 $window.location.href = 'index.html';
            }
            return response || $q.when(response);
        }
    };
});

    // Register the previously created AuthInterceptor.
    riddlerApp.config(function ($httpProvider) {
        $httpProvider.interceptors.push('HttpInterceptor');
    });
    

    riddlerApp.directive("filesInput", function() {
  return {
    require: "ngModel",
    link: function postLink(scope,elem,attrs,ngModel) {
      elem.on("change", function(e) {
        var files = elem[0].files;
        ngModel.$setViewValue(files);
      })
    }
  }
});

    riddlerApp.directive('fileModel', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                    	////console.log(attrs.fileModel);

                        modelSetter(scope, element[0].files[0]);
                        if (attrs.fileModel == "dataFile") {
                        	////console.log("qp");
                            scope.uploadtestfile();

                        }
                        if (attrs.fileModel == "portionPDF") {
                        	////console.log("ttportion");
                            scope.uploadtesttimetableportion();

                        }
                        if (attrs.fileModel == "timetablePDF") {
                        	////console.log("tt");
                            scope.uploadtesttimetable();

                        }                        
                     

                    });


                });
            }
        };
    }]);


    riddlerApp.directive('fileModel1', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel1);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                    	////console.log("attrs.fileModel1");

                        modelSetter(scope, element[0].files[0]);
                        if (attrs.fileModel1 == "portionPDF") {
                        	////console.log("ttportion");
                            scope.uploadtesttimetableportion();

                        }                                   
                     

                    });


                });
            }
        };
    }]);

    riddlerApp.directive('loading', function () {
      return {
        restrict: 'E',
        replace:true,
        template: '<div class="loading w3-round-xxlarge"><img src="assets/icons/marvel.gif" width="100" height="100" /></div>',
        link: function (scope, element, attr) {
              scope.$watch('loading', function (val) {
                  if (val)
                      $(element).show();
                  else
                      $(element).hide();
              });
        }
      }
  })
   riddlerApp.service('idService', function() {
        var idList = [];

        var addId = function(newObj) {
        idList.push(newObj);
        };

        var getId = function(){
        return idList;
        };

        return {
        addId: addId,
        getId: getId
        };

    });

    riddlerApp.filter('titlecase', function() {
     return function(input) {
      var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

      input = input.toLowerCase();
      return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
       if (index > 0 && index + match.length !== title.length &&
        match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
        (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
        title.charAt(index - 1).search(/[^\s-]/) < 0) {
        return match.toLowerCase();
       }

       if (match.substr(1).search(/[A-Z]|\../) > -1) {
        return match;
       }

       return match.charAt(0).toUpperCase() + match.substr(1);
      });
     }
    });

    riddlerApp.config(function($sceProvider) {
        $sceProvider.enabled(false);
    });



    // configure our routes
    riddlerApp.config(function($routeProvider) {
        $routeProvider
            // route for the home page
            .when('/',{
            templateUrl : 'app/accounts/accountLogin.html',
            controller : 'accountLoginController'
            })
            // .when('/', {
            //     templateUrl : 'app/home.html',
            //     controller : 'homeController'
            // })
            .when('/login', {
                templateUrl : 'login.html',
                controller : 'homeController'
            })
            .when('/newcitysettings', {
                templateUrl : 'app/newcitysettings.html',
                controller : 'homeController'
            })
            .when('/student', {
                templateUrl : 'app/student/listStudent.html',
                controller : 'studentController'
            })
            .when('/attendance', {
                templateUrl : 'app/attendance.html',
                controller : 'homeController'
            })
             .when('/studentattendance', {
                templateUrl : 'app/student/studentattendance.html',
                controller : 'studentController'
            })
            .when('/studentProfile', {
                templateUrl : 'app/student/studentprofile.html',
                controller : 'studentController'
            })
            .when('/addstaff', {
                templateUrl : 'app/staff/addstaff.html',
                controller : 'staffController'
            })
            .when('/managecity', {
                templateUrl : 'app/admin/managecity.html',
                controller : 'homeController'
            })
            .when('/adminpanel', {
                templateUrl : 'app/admin/adminpanel.html',
                controller : 'homeController'
            })
            .when('/tc', {
                templateUrl : 'terms.html',
                controller : 'termController'
            })
            .when('/feeStructure', {
                templateUrl : 'app/feestructure.html',
                controller : 'feesController'
            })
            .when('/viewDiscounts', {
                templateUrl : 'app/viewDiscounts.html',
                controller : 'feesController'
            })
             .when('/feeSetting', {
                templateUrl : 'app/feeSetting.html',
                controller : 'feesController'
            })
             .when('/adminDashboard',{
                templateUrl : 'app/admin/adminDashboard.html',
                controller : 'scheduleController'
             })
             .when('/feesReport',{
                templateUrl : 'app/feesReport.html',
                controller : 'homeController'
             })
             .when('/enquiryForm',{
                templateUrl : 'app/student/enquiryForm.html',
                controller : 'studentController'
             })
             .when('/admission', {
                templateUrl : 'app/student/admissionform.html',
                controller : 'studentController'
            })
             .when('/directAdmission', {
                templateUrl : 'app/student/directadmitform.html',
                controller : 'studentController'
            })
             .when('/enquiry', {
                templateUrl : 'app/student/listEnquiryStudents.html',
                controller : 'studentController'
            })
              .when('/staffList', {
                templateUrl : 'app/staff/stafflist.html',
                controller : 'staffController'
            })

             .when('/staffProfile', {
                templateUrl : 'app/staff/staffprofile.html',
                controller : 'staffController'
            })
             .when('/staffAttendance', {
                templateUrl : 'app/staff/staffattendence.html',
                controller : 'staffController'
            })
             .when('/createSchedule',{
                templateUrl : 'app/schedule/createSchedule.html',
                controller : 'scheduleController'
            })
            .when('/viewSchedule',{
                templateUrl : 'app/schedule/schedule.html',
                controller : 'scheduleController'
            })
            .when('/createTimetable',{
                templateUrl : 'app/schedule/createTimetable.html',
                controller : 'scheduleController'
            })
            .when('/viewTimetable',{
                templateUrl : 'app/schedule/timetable.html',
                controller : 'scheduleController'
            })
            .when('/changepwd',{
                templateUrl : 'app/changepwd.html',
                controller : 'studentController'
            })
            .when('/manageuser', {
                templateUrl : 'app/admin/manageuser.html',
                controller  : 'homeController'
            })
            .when('/message',{
                templateUrl : 'app/message.html',
                controller : 'homeController'
            })
            .when('/createSyllabus',{
                templateUrl : 'app/schedule/createSyllabus.html',
                controller : 'scheduleController'
            })
             .when('/viewSyllabus', {
                templateUrl : 'app/schedule/viewSyllabus.html',
                controller : 'scheduleController'
            })
            .when('/editSyllabus', {
              templateUrl : 'app/schedule/syllabus.html',
              controller : 'scheduleController'
            })
            .when('/search', {
                templateUrl : 'app/search.html',
                controller : 'homeController'
            })
            .when('/uploadTest', {
                templateUrl : 'app/uploadTest.html',
                controller : 'studentController'
            })
            .when('/createDailyreport', {
                templateUrl : 'app/schedule/createDailyreport.html',
                controller : 'scheduleController'
            })
            .when('/newcreateDailyreport', {
                templateUrl : 'app/schedule/newcreateDailyreport.html',
                controller : 'scheduleController'
            })
            .when('/viewDailyreport', {
                templateUrl : 'app/schedule/viewDailyreport.html',
                controller : 'scheduleController'
            })
             .when('/viewnewDailyreport', {
                templateUrl : 'app/schedule/viewnewDailyreport.html',
                controller : 'scheduleController'
            })
            .when('/editDailyreport', {
                templateUrl : 'app/schedule/editDailyreport.html',
                controller : 'scheduleController'
            })
            .when('/viewLecturerecord', {
                templateUrl : 'app/schedule/viewLecturerecord.html',
                controller : 'scheduleController'
            }) 
            .when('/manageteachers', {
                templateUrl : 'app/admin/manageTeachers.html',
                controller : 'homeController'
            })
             .when('/newcreateTimetable',{
                templateUrl : 'app/schedule/newcreateTimetable.html',
                controller : 'scheduleController'
            })
            .when('/hallTicket',{
                templateUrl : 'app/hallTicket.html',
                controller : 'testController'
            }) 
            .when('/newviewTimetable',{
                templateUrl : 'app/schedule/newtimetable.html',
                controller : 'scheduleController'
            })
             .when('/uploadTimetable',{
                templateUrl : 'app/uploadTimetable.html',
                controller : 'studentController'
            })
             .when('/createResult',{
                templateUrl : 'app/result/createResult.html',
                controller : 'homeController'
            })
             .when('/assignRfid',{
                templateUrl : 'app/rfid/assignRfid.html',
                controller : 'rfidController'
            })
            .when('/assignStaffRfid',{
                templateUrl : 'app/rfid/assignStaffRfid.html',
                controller : 'rfidController'
            })
             .when('/editRfid',{
                templateUrl : 'app/rfid/editRfid.html',
                controller : 'rfidController'
            })
             .when('/viewResult',{
                templateUrl : 'app/result/viewResult.html',
                controller : 'homeController'
            })
            .when('/papersinout',{
            templateUrl : 'app/accounts/papersinout.html',
            controller : 'papersinoutController'
			})
		.when('/accountPassBook',{
            templateUrl : 'app/accounts/accountPassBook.html',
            controller : 'accountPassBookController'
        })
         .when('/studentsInOut',{
            templateUrl : 'app/accounts/studentsInOut.html',
            controller : 'studentsInOutController'
        })
         .when('/chequerecords',{
            templateUrl : 'app/accounts/chequerecords.html',
            controller : 'chequerecordsController'
        })
         .when('/accountadminDashboard',{
            templateUrl : 'app/accounts/accountadminDashboard.html',
            controller : 'accountadminDashboardController'
        })
      .when('/accounterrors',{
            templateUrl : 'app/accounts/accounterrors.html',
            controller : 'accounterrorsController'
        })
      .when('/accountsalary',{
            templateUrl : 'app/accounts/accountsalary.html',
            controller : 'accountsalaryController'
        })
      .when('/parentsfeedback',{
            templateUrl : 'app/accounts/parentsfeedback.html',
            controller : 'parentsfeedbackController'
        })
       .when('/feedbackadmin',{
            templateUrl : 'app/accounts/feedbackadmin.html',
            controller : 'feedbackadminController'
        })
          .when('/accountLogin',{
            templateUrl : 'app/accounts/accountLogin.html',
            controller : 'accountLoginController'
        })
            ;
    });

    // create the controller and inject Angular's $scope
    riddlerApp.controller('homeController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
    	//console.log("Inside Home Controller");
        $('#sidebar').addClass('active');
        $('#main').removeClass('active');

        $scope.loggedIn = localStorage.loggedIn;
        $scope.showeditables = localStorage.showeditables;
        $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
        ////console.log($scope.loginData);

    $scope.branches = false;
    $scope.managecities = false;
    $scope.managecityadmins = false;
    $scope.managebranches = false;
    $scope.managebranchadmins = false;
    $scope.showsyllabuslist=true;

    //login logic
    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

        $scope.loginAuth = function() {
            ////console.log("in login auth");
             $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
             ////console.log($scope.loginData);
          //  $scope.loginData = localStorage.loginData;
            if($scope.loginData == undefined)
            {
                $location.path('/');
            }
        }

        $scope.doLogin = function () {

            if($scope.username == undefined )
            {
                iziToast.error({title: 'Error',message: "Please Enter User name", position: 'bottomLeft'});

            } 
            else if($scope.password == undefined)
            {
                iziToast.error({title: 'Error',message: "Please Enter Password", position: 'bottomLeft'});
            }
            /*else if($scope.usertype == undefined || $scope.usertype =="blank")
            {

                iziToast.error({title: 'Error',message: "Please select user type", position: 'bottomLeft'});
            }*/
            else{

                        var userData = JSON.stringify({
                        "username" : $scope.username,
                        "password" : $scope.password
                    });

                        $scope.loading = true;
                    $http.post("https://espl.in.net/accountsapi/doLogin",userData)
                        .success(function (data) {
                            $scope.loading = false;
                            if (data.success == "true") {
                                ////console.log(data.data[0]);
                                localStorage.loggedIn = true;
                                localStorage.usertype = data.data[0].usertype;
                                $scope.loggedIn = localStorage.loggedIn;
                                localStorage.loginData = JSON.stringify(data.data[0]);

                                if (data.data[0].usertype === "0") {
                                    localStorage.showeditables = true;
                                }
                                else{ localStorage.showeditables = false;}
                                $location.path('adminDashboard');
                                $window.location.reload();
                                /*$('.modal-backdrop').remove();
                                $('.modal').remove();
                                $route.reload();*/
                                /*$scope.loginData = localStorage.loginData;
                                //console.log($scope.loginData);*/
                                ////console.log("Login Success!");
                                iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                            } else {
                                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                            }
                        })
                        .error(function (err) {
                            iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
                        });
        }
        };

        //login logic ends

    $scope.showsyllabus = function()
    {
    	////console.log("in home controller");
      $scope.viewsyllabus = true;
     // $scope.showadssection = false;
     
    };

    $scope.sendcustomsms=function(smslist)
    {
        console.log(smslist);
        var mobilenos="";
        var checkedSmsList = [];
        ////console.log('checked function');
        for (var i = 0; i < smslist.length; i++) 
        {
            if (smslist[i].isChecked === true) {
                console.log("yo");
                ////console.log(smslist[i].firstName + smslist[i].middleName + smslist[i].lastName );
                checkedSmsList.push(smslist[i]);
            }   
        }

       if($scope.sms == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter message To Send", position: 'bottomLeft'});

        }
        else if($scope.smstosend == undefined)
        {
            iziToast.error({title: 'Error',message: "Please Select Parent Or Students Or Both To Send Sms", position: 'bottomLeft'});

        }
        else if(!smslist.length)
        {
          iziToast.error({title: 'Error',message: "No Student Present To Send Sms", position: 'bottomLeft'});
        }
        else
        {
          if($scope.smstosend== "Parents")
          {
            
             var parent="";
                 var p="";
              for (var x = 0; x < checkedSmsList.length; x++) {
                if(smslist[x].fatherMobile != undefined){
                  parent=parent+checkedSmsList[x].fatherMobile+",";
                }
                else if(checkedSmsList[x].motherMobile != undefined)
                {
                  parent=parent+checkedSmsList[x].motherMobile+",";
                }else{}
                     
            } 
                if(parent[parent.length-1]==",")
                {
                    p=parent.slice(0,parent.length-1);                  
                }
                mobilenos=p;
          }
          
          else if($scope.smstosend== "Students")
          {
            console.log("send to student");
            var studentsmslist="";
              for (var x = 0; x < checkedSmsList.length-1; x++) {
                studentsmslist=studentsmslist+checkedSmsList[x].studentMobile+",";                     
            } 
            studentsmslist=studentsmslist+checkedSmsList[checkedSmsList.length-1].studentMobile; 
            mobilenos=studentsmslist;
          }
          else if($scope.smstosend== "both")
          {
            var bothsmslist="";
              for (var x = 0; x < checkedSmsList.length; x++) {
                    if(checkedSmsList[x].fatherMobile != undefined){
                        bothsmslist=bothsmslist+checkedSmsList[x].fatherMobile+",";
                    }
                    else if(checkedSmsList[x].motherMobile != undefined)
                    {
                        bothsmslist=bothsmslist+checkedSmsList[x].motherMobile+",";
                    }else{}
                //bothsmslist=bothsmslist+smslist[x].fatherMobile+",";        
            }
            for (var x = 0; x < checkedSmsList.length-1; x++) {
              bothsmslist=bothsmslist+checkedSmsList[x].studentMobile+",";      
            } 
            bothsmslist=bothsmslist+checkedSmsList[checkedSmsList.length-1].studentMobile; 
             mobilenos=bothsmslist
          }
          else{}
                    var smsdata = JSON.stringify({"mobile":mobilenos,"msg":$scope.sms});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
          		
        }
        
    
    };

    $scope.sendsmstostaff = function(stafflist)
    {
        

        if($scope.staffmessage == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter message To Send", position: 'bottomLeft'});

        }
      
        else if(!stafflist.length)
        {
          iziToast.error({title: 'Error',message: "No Student Present To Send Sms", position: 'bottomLeft'});
        }
        else
        {
                checkedstafflist=[];
              for (var x = 0; x < $scope.staff.length; x++) {
                if($scope.staff[x].isChecked===true)
                checkedstafflist.push($scope.staff[x]);
                                   
                } 
                staffsmslist=""
                for (var x = 0; x < checkedstafflist.length-1; x++) {
                    staffsmslist=staffsmslist+checkedstafflist[x].mobile+",";                     
                } 
              staffsmslist=staffsmslist+checkedstafflist[checkedstafflist.length-1].mobile; 
                console.log(staffsmslist);
            var smsdata = JSON.stringify({"mobile":staffsmslist,"msg":$scope.staffmessage});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
        }

       
       /* staffsmslist=[];
         console.log("send to Staff");
            var studentsmslist="";
              for (var x = 0; x < checkedSmsList.length-1; x++) {
                staffsmslist=staffsmslist+checkedSmsList[x].studentMobile+",";                     
            } 
            studentsmslist=studentsmslist+checkedSmsList[checkedSmsList.length-1].studentMobile; 
            mobilenos=studentsmslist;*/


    }

    $scope.checkAllStudents = function()
    {
    	if ($scope.checkedAll == true) 
    	{
    		for (var i = 0; i < $scope.studentList.length; i++) 
	        {
	        $scope.studentList[i].isChecked = true;   
	        }
    	}
    	else
    	{
    		for (var i = 0; i < $scope.studentList.length; i++) 
	        {
	        $scope.studentList[i].isChecked = false;   
	        }
    	}
    };


 $scope.checkAllStaff = function()
    {
        console.log("in checkAllStaff");
        console.log($scope.checkedAllstaff);
        if ($scope.checkedAllstaff == true) 
        {
            for (var i = 0; i < $scope.staff.length; i++) 
            {
            $scope.staff[i].isChecked = true;   
            }
        }
        else
        {
            for (var i = 0; i < $scope.staff.length; i++) 
            {
            $scope.staff[i].isChecked = false;   
            }
        }
    };


 
    
    $scope.getStudentsforrfids = function () {
 //var param=JSON.stringify({});
  /*          var name = localStorage.batchname;
            $scope.batchname=localStorage.batchname;
            //console.log(name);
            var param=JSON.stringify({"batch":"true","batchname": name})
            //console.log(param);
            $scope.loading=true;*/
            $http.get("https://espl.in.net/accountsapi/getStudentListforrfids")
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.studentList=data.studentList;
                    $scope.loading=false;
                    /*iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                        $scope.studentList={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };
            $scope.getrfidforassignment = function () {
 
            $http.get("https://espl.in.net/accountsapi/getrfidforassignment")
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.rfids=data.rfids;
                    $scope.loading=false;
                   /* iziToast.show({theme: 'dark',title:'Success',message: 
                        data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                        $scope.rfids={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.rfids={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };
          $scope.assignRFID = function () {
            if($scope.studentid==undefined || $scope.studentid=="")
            {
                 iziToast.error({title: 'Error',message: "Please Select Student", position: 'bottomLeft'});
            }
            else if($scope.rfid==undefined || $scope.rfid=="")
            {
                iziToast.error({title: 'Error',message: "Please Select RFID NO.", position: 'bottomLeft'});
            }else{
                  var param=JSON.stringify({"studentid":$scope.studentid,"rfidno":$scope.rfid})
            //console.log(param);
 
            $http.post("https://espl.in.net/accountsapi/assignRFID",param)
                .success(function (data) {
                    
                    if (data.success == "true") {
                    /*//console.log(data);
                    $scope.rfids=data.rfids;
                    $scope.loading=false;*/
                    iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                    } else {
                        /*$scope.rfids={};*/
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                   /* $scope.loading=false;
                    $scope.rfids={};*/
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });

            }
          
        };

        
    $scope.getStudentsforrfids = function () {
 //var param=JSON.stringify({});
  /*          var name = localStorage.batchname;
            $scope.batchname=localStorage.batchname;
            //console.log(name);
            var param=JSON.stringify({"batch":"true","batchname": name})
            //console.log(param);
            $scope.loading=true;*/
            $http.get("https://espl.in.net/accountsapi/getStudentListforrfids")
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.studentList=data.studentList;
                    $scope.loading=false;
                    /*iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                        $scope.studentList={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

                $scope.getBranchesForShift =function(){

        id=localStorage.cityid;    
        var param=JSON.stringify({"cityid": id})
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getallbranches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        $scope.sourceBranches = data.branches;
                        $scope.sourceBatches={};
                        //console.log(data);

                    } else {
                         $scope.sourceBranches ={};
                         $scope.sourceBatches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.sourceBranches = {};
                    $scope.sourceBatches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

        $scope.getBatchesForShift = function (id)
        {
        var param=JSON.stringify({"branchid": id})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getcoursesnew",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.sourceBranchId=data.branchid;
                        $scope.sourceBatches = data.courses;
                    } else {
                        $scope.sourceBranchId=data.branchid;
                        $scope.sourceBatches = {};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.sourceBranchId=data.branchid;
                    $scope.sourceBatches = {};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });

        };

        $scope.saveShiftDataSource= function(data)
        {
            //console.log('Source savedata  :'+data);

            data=JSON.parse(data);
            $scope.fromBranchName=data.branchname;
            $scope.fromBranchId=data.branchid;
            $scope.fromBatchName=data.batchname;
            //console.log('Branch name  :'+$scope.fromBranchName);
            //console.log('Branch id  :'+$scope.fromBranchId);
            //console.log('Batchname :'+$scope.fromBatchName);
        };

        $scope.saveShiftDataDest= function(data)
        {
            //console.log('Dest savedata  :'+data);

            data=JSON.parse(data);
            $scope.toBranchName=data.branchname;
            $scope.toBranchId=data._id;
            //console.log('Branch name  :'+$scope.toBranchName);
            //console.log('Branch id  :'+$scope.toBranchId);
        };

        $scope.clearShiftData = function(){
            //console.log('in clearShiftData');
            $scope.sourceBatches={};
            $scope.sourceBranches={};
            $scope.source.CenterId={};
            $scope.source.BatchData={};
            $scope.destination.CenterData={};
            };


        $scope.shiftBatch=function(){
            //console.log('in shift batch');
            //console.log('Source branch name  :'+$scope.fromBranchName);
            //console.log('Source branch  id  :'+$scope.fromBranchId);
            //console.log('Source Batchname :'+$scope.fromBatchName);
            //console.log('Dest branch name  :'+$scope.toBranchName);
            //console.log('Dest branch id  :'+$scope.toBranchId);

            var flag = confirm("Do You Really Want To Shift Batch ");
                if (flag == true) 
                {
                    var batchparam=JSON.stringify({"fromBatchName": $scope.fromBatchName,"toBranchName":$scope.toBranchName,"toBranchId":$scope.toBranchId})
                    //console.log(batchparam);

                    $scope.loading = true;
                    $http.post("https://espl.in.net/accountsapi/shiftBatch",batchparam)
                            .success(function (data) {
                                if (data.success == "true") {
                                    ////console.log(data);
                                    //iziToast.show({theme: 'dark',title:'Success',message: 'Batch Shifted Successfully',position: 'bottomLeft',progressBarColor: 'rgb(0, 255, 184)'});

                                    var studparam=JSON.stringify({"fromBatchName": $scope.fromBatchName,"toBranchName":$scope.toBranchName})
                    //console.log(studparam);

                    $http.post("https://espl.in.net/accountsapi/shiftBatchStudent",studparam)
                            .success(function (data) {
                                $scope.loading = false;
                                if (data.success == "true") {
                                    iziToast.show({theme: 'dark',title:'Success',message: 'Shifted Successfully',position: 'bottomLeft',progressBarColor: 'rgb(0, 255, 184)'});                                    
                                    //console.log(data);
                                } else {
                                    $scope.loading = false;
                                    iziToast.error({title: 'Error',message: "Failed ! Try Again", position: 'bottomLeft'});
                                }
                            }).error(function(err){
                                $scope.result={};
                                iziToast.error({title: 'Error',message: "Failed ! Try Again", position: 'bottomLeft'});
                        });
                                } else {
                                    iziToast.error({title: 'Error',message: "Failed ! Try Again", position: 'bottomLeft'});

                                }
                            }).error(function(err){
                                $scope.result={};
                                iziToast.error({title: 'Error',message: "Failed ! Try Again", position: 'bottomLeft'});
                            });

                    
                } 
                else 
                {
                    //console.log('Cancelled');                
                }

                $('#shiftBatchModal').modal('hide');
        };
    $scope.showeditcityadmins =function()
    {
    $scope.managecityadmins = true;

    $scope.managecities = false;
    $scope.managebranches = false;
    $scope.managebranchadmins = false;
    $scope.getCities();
    };

     $scope.checkuser=function(usertypeid='')
    {
        if(usertypeid==0)
            {
                $scope.super=true;
            }
            else{
                $scope.super=false;
            }
       

    };

    $scope.showeditbranches =function()
    {
    $scope.managebranches = true;

    $scope.managecities = false;
    $scope.managecityadmins = false;
    $scope.managebranchadmins = false;
    $scope.getCities();
    $scope.getbranches();
    };



    $scope.showeditcities = function()
    {
    $scope.managecities= true;
    $scope.managecityadmins = false;
    $scope.managebranches = false;
    $scope.managebranchadmins = false;

    };



    $scope.showeditbranchadmins = function()
    {
    $scope.managecities= false;
    $scope.managecityadmins = false;
    $scope.managebranches = false;
    $scope.managebranchadmins = true;

    };

    $scope.getCityAdmins = function()
    {
        $http.post("https://espl.in.net/accountsapi/getcityadmin")
        .success(function(data){
           // toastr.success(data.message);
           if(data.success == "true")
           {

           $scope.cityadmins = data.admins;
       }
        })  
        .error(function(err){
            iziToast.error({title: 'Error',message: "Something went wrong!", position: 'bottomLeft'});
        }) 


    };


    $scope.addCityAdmin = function()
    {

         var datatosend =JSON.stringify({"email":$scope.cityadminemail, 
            "mobile":$scope.cityadminmobile, 
            "cityid":$scope.cityid,
            "username":$scope.cityadminusername
        });

        $http.post("https://espl.in.net/accountsapi/ad",datatosend)
        .success(function(data){
            toastr.success(data.message);
            $scope.getCities();


        })
        .error(function(err){
            iziToast.error({title: 'Error',message: "Something went wrong!", position: 'bottomLeft'});
        }) 
    };

   $scope.addBranch = function(cityid)
{
    if($scope.b == undefined)
    {
         iziToast.error({title: 'Error',message: "Please Enter Information!", position: 'bottomLeft'});
    }
    else if($scope.b['branchname']==undefined || $scope.b['branchname']=="")
    {
        iziToast.error({title: 'Error',message: "Please Enter Branch Name!", position: 'bottomLeft'});
    }
    else if($scope.b['address']==undefined || $scope.b['address']==""){
         iziToast.error({title: 'Error',message: "Please Enter Branch Address!", position: 'bottomLeft'});
    }
    else if($scope.b['contact']==undefined || $scope.b['contact']==""){
         iziToast.error({title: 'Error',message: "Please Enter Branch Contact!", position: 'bottomLeft'});
    }
    else{
            $('#myModalbranch').modal('hide');
            $scope.b["cityid"]=cityid;
            var datatosend =JSON.stringify($scope.b);
            //console.log(datatosend);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/addbranch",datatosend)
            .success(function(data){
                $scope.loading = false;
                $scope.getBranches(cityid);
                $scope.b={};

            })  
            .error(function(err){
                $scope.b={};
                waitingDialog.hide();
                //toastr.error("Something went wrong! Please try again...");
            }) 

        }
   
};


/*    $scope.getCities = function()
    {
        $scope.loading = true;
        $http.get("https://espl.in.net/accountsapi/getcities")
        .success(function(data){
            $scope.loading = false;
           // toastr.success(data.message);
           if(data.success == "true")
           {

           $scope.cities = data.cities;
       }
        })  
        .error(function(err){
            $scope.cities=""
      //  toastr.error("Something went wrong! Please try again...");
        }) 



    };*/

     $scope.addCity = function() {
        if($scope.cityname==undefined || $scope.cityname=="")
        {
             iziToast.error({title: 'Error',message: "Please Enter City Name", position: 'bottomLeft'});           
        }
        else if($scope.district==undefined || $scope.district=="")
        {
            iziToast.error({title: 'Error',message: "Please Enter District", position: 'bottomLeft'});           
        }else if($scope.state==undefined || $scope.state=="")
        {
            iziToast.error({title: 'Error',message: "Please Enter State", position: 'bottomLeft'});          
        }else
        {
            $('#myModalHorizontal').modal('hide');
        var datatosend =JSON.stringify({"cityname":$scope.cityname, "district":$scope.district, "state":$scope.state});

        //console.log(datatosend);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/addcity",datatosend)
        .success(function(data){
            $scope.loading = false;
            //toastr.success(data.message);
            $scope.getCities();

        })  
        .error(function(err){
            waitingDialog.hide();
    /*toastr.error("Something went wrong! Please try again...");*/
        }) 

        }
   
};

$scope.reloadManageCity = function()
{
    $('#myModalHorizontal').modal('hide');
    setTimeout( function(){$route.reload();}  , 1000);
};


$scope.resetAddBranch =function(){
    //console.log('resetting');
    $scope.b={};
};
$scope.resetAddBatch = function(){
        //console.log('resetting');
        $scope.c={};
};
$scope.resetUpdateBranch=function(){
    //console.log('resetting');
    $scope.branchtoedit={};

};


   /* $scope.addCity = function() {
        
        var datatosend =JSON.stringify({"cityname":$scope.cityname, "district":$scope.district, "state":$scope.state});

        $http.post("https://espl.in.net/accountsapi/addcity",datatosend)
        .success(function(data){
            toastr.success(data.message);
            $scope.getCities();
        })  
        .error(function(err){
    toastr.error("Something went wrong! Please try again...");
        }) 
    };
*/

    $scope.result={};
        $scope.getAllFees = function (board) {
        //console.log('board :'+board);
        //console.log('city :'+localStorage.cityid);
       localStorage.feeBoard=board;
       data={};
       data["board"]=board;
       data["city"]=localStorage.cityid;
       var param=JSON.stringify({"data":data})
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getfeestructure",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.result=data;
                        $scope.headBoard=localStorage.feeBoard;

                    } else {
                        $scope.result={};
                        $scope.loading = false;

                    }
                }).error(function(err){
                    $scope.result={};
                  //  toastr.error("Something Went Wrong......!");
                });
    
    };



            $scope.feesCalculate = function () {
$scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/FeeStructure")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.data=data;
/*                    toastr.error("trjhvfgkbjuygbjtv";
*/

                    } else {
                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });
    
    };

       /*$scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
        };

        $scope.loginAuth = function() {
            //console.log("in login auth");
             $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
             //console.log($scope.loginData);
           // $scope.loginData = localStorage.loginData;
            if($scope.loginData == undefined)
            {
                $location.path('/');
            }
        };

        $scope.doLogin = function () {

            var userData = JSON.stringify({
            "username" : $scope.username,
            "password" : $scope.password

        });

            $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/doLogin",userData)
            .success(function (data) {
                $scope.loading = false;
                //console.log(data);
                if (data.success == "true") {
                   
                    localStorage.loggedIn = true;
                    $scope.loggedIn = localStorage.loggedIn;
                    localStorage.loginData = JSON.stringify(data.data[0]);
                    $scope.loginData = localStorage.loginData;
                    /*$location.path('adminDashboard');
                    $('.modal-backdrop').remove();
                    $('.modal').remove();
                    $route.reload();
                    //console.log("Login Success!");
                    iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                } else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                }
            })
            .error(function (err) {
                iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
        };*/
 $scope.result1={};
 
        $scope.getCities = function () 
      {
         $scope.loading = true;
            $http.get("https://espl.in.net/accountsapi/getcities")
                .success(function (data) {
                     $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.result1=data;
                        
                    } else {
                        $scope.result1={};
                        ////console.log("server error");
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                       
                    }
                }).error(function(err){
                    iziToast.error({
                            title: 'Error',
                            message: "server not found",
                            position: 'bottomLeft'
                        });
                    //console.log("function");
                    $scope.result1={};
                    //iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
        };

         $scope.getStudentInfo = function () {
            var paid=0,pending=0;
            var param=JSON.stringify({"id": localStorage.studentId,"batchname":localStorage.batchname})

            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getStudentInfo",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.studentInfo = data.studentData;
                    $scope.batchName = data.batch;
                    //console.log($scope.studentInfo);

                        for (var x = 0; x < $scope.studentInfo[0].NoOfInstallment ; x++) 
                        {
                            var dex = ""+x;

                            if ($scope.studentInfo[0].payment[dex].Status === 'Paid') 
                            {
                                paid = parseInt(paid) + parseInt($scope.studentInfo[0].payment[dex].Amount);
                            }

                            else{
                                pending = parseInt(pending) + parseInt($scope.studentInfo[0].payment[dex].Amount);
                            }
                        }

                        //console.log('Paid :'+paid);
                        //console.log('Pending :'+pending);
                        //console.log('Total :'+$scope.studentInfo[0].total);
                        $scope.paid=paid;
                        $scope.pending=pending;

                } 
                else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                }
            })

            .error(function(err){

                iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

            });

        };


        $scope.getBoard = function (branchname) {
        //localStorage.resultid = id;
        var param=JSON.stringify({"branchname": branchname})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBoard",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.boards=data.board;
                        $scope.batches={};
                       
                    } else {
                        $scope.boards={};
                        $scope.batches={};
                        
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                        $scope.boards={};
                        $scope.batches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };


        $scope.getBatch = function (branchname,board) {
     //console.log("");
        //localStorage.resultid = id;
        var param=JSON.stringify({"branchname": branchname,"coursename":board})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBatch",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches=data.batch;
                       
                    } else {
                        $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.batches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };
                
    $scope.getBranches = function (id='') {
       // localStorage.cityid = id;
       if(id=='')
       {
        id=localStorage.cityid;
       }else{
        localStorage.cityid=id;
       }

       
        var param=JSON.stringify({"cityid": id})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getallbranches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data.branches);
                        $scope.singleBranchResult = data.branches;
                        $scope.cityid=data.cityid;
                        $scope.boards={};
                        $scope.batches={};
                        $scope.branchesDiv=true;
                        $scope.batchesDiv=false;
                        //localStorage.result = data.branches;
                    } else {
                         $scope.cityid=data.cityid;
                         $scope.singleBranchResult = {};
                         $scope.boards={};
                         $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.singleBranchResult = {};
                    $scope.boards={};
                    $scope.batches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };


$scope.getbatchesnew = function (id) {
        //localStorage.resultid = id;
        localStorage.branchId = id;
        var param=JSON.stringify({"branchid": id})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getcoursesnew",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.branch_id=data.branchid;
                        $scope.coursesinfo1 = data.courses;
                        $scope.batchesDiv=true;
                        //$scope.branchname = data.branchname;
                        //localStorage.result = data.branches;
                    } else {
                        $scope.branch_id=data.branchid;
                        $scope.coursesinfo1 = {};
                         $scope.batchesDiv=true;
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.branch_id=data.branchid;
                        $scope.coursesinfo1 = {};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };


    $scope.getCourses = function (id) {
        //localStorage.resultid = id;
        var param=JSON.stringify({"branchid": id})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getcourse",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.branch_id=data.branchid;
                        $scope.coursesinfo = data.course;
                        $scope.branchname = data.branchname;
                        //localStorage.result = data.branches;
                    } else {
                         $scope.branch_id=data.branchid;
                         $scope.branchname = data.branchname;
                        $scope.coursesinfo = {};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.coursesinfo = {};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };

     $scope.getBatches = function (name,id) {
        var param=JSON.stringify({"coursename":name,"branchid": id})
        //console.log(param);
        $scope.loading = true;
       $http.post("https://espl.in.net/accountsapi/getBatches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batchesinfo=data.batches;
                    } else {
                         $scope.batchesinfo={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                     $scope.batchesinfo={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };

    $scope.saveStudentId = function (studentId) {
         //console.log("yo");
            //console.log(studentId);
            //console.log("yo");
            localStorage.studentId = studentId;
            
            $location.path('studentProfile');
        };

    $scope.saveBatchid =function (id)
    {
        //console.log("btch");
        idService.addId(id);
        localStorage.batchid = id;
        /*var id = idService.getId();
        //console.log(id);*/
    };
     $scope.saveBatchname =function (name)
    {
        ////console.log("btch");
        //idService.addId(id);
        localStorage.batchname = name;
        /*var id = idService.getId();
        //console.log(id);*/
    };

    $scope.getStaffNames = function () 
      {
        //console.log("get staff names func");
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getstaffnames")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.staffnames=data.staffs;
                        
                        //waitingDialog.hide();

                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                        //toastr.error(data.message);
                     //   waitingDialog.hide();

                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };

         $scope.generate = function (name) 
      {
      //    //console.log(name);
        fullname=name.split(' ');
      //    //console.log(fullname);
        var fname = fullname[0];
        var lname = fullname[1];
      //  //console.log(fname);
        ////console.log(lname);
         if(lname.length >= 4) {
              username = fname.substr(0,1) + lname.substr(0,49);
         } else {
              username = fname.substr(0,4) + lname.substr(0,49);
         }
         username = username.replace(/\s+/g, '');
         username = username.replace(/\'+/g, '');
         username = username.replace(/-+/g, '');
         username = username.toLowerCase();
         $scope.username=username;
         //console.log( $scope.username);
      //   //console.log(username);
       //  document.form.username.value = username;
    

     var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890';
        var pass = '';
        for (var x = 0; x < 8; x++) {
            var i = Math.floor(Math.random() * chars.length);
            pass += chars.charAt(i);
        }    
        $scope.password=pass;
        //console.log($scope.password);
     //   document.form.row_password.value = pass;


    };

$scope.templist={};
    $scope.getsmsStudentList = function () {
        //console.log("in getsmsStudentList");
        $scope.loading = true;
        //console.log($location.protocol());
        //console.log($location.host());
        //console.log($location.port());
    $http.get("https://espl.in.net/accountsapi/getsmsStudentList")
       /* $http.get($location.protocol()+"://"+$location.host()+":5128/getsmsStudentList")*/
            .success(
            function (data) {
                $scope.loading = false;
                    if (data.success === "true"){
                        iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                        waitingDialog.hide();
                        $scope.studentList = data.studentList;
                        $scope.templist=$scope.studentList;
                        //console.log($scope.templist);
                    } else {
                        waitingDialog.hide();
                       // toastr.error(data.message);
                    }
                }
            )
    };

      $scope.getStaffDetails = function () {
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getBranchStaffList")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);

                        $scope.staff=data.staffdata;
                        waitingDialog.hide();
                    } else {
                        waitingDialog.hide();
                    }
                }).error(function(err){ 
                });
        };


   $scope.templist={};    
    $scope.getsmsFeeStudentList = function () {
        //console.log("in xyz");
        $scope.loading = true;
var paid=0,pending=0;
        $http.get("https://espl.in.net/accountsapi/getsmsStudentList")
            .success(
            function (data) {
                $scope.loading = false;
                    if (data.success === "true"){
                        iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                        waitingDialog.hide();
                        $scope.studentList = data.studentList;
                      //  //console.log($scope.studentList);
                       // //console.log('length'+$scope.studentList.length);
                        
                        for (var j = 0; j < $scope.studentList.length; j++) 
                        {
                        $scope.studentList[j].paidfees=0;
                        $scope.studentList[j].pendingfees=0;
                        ////console.log($scope.studentList[j]);
                        var dex2=""+j;

                        if ($scope.studentList[j].NoOfInstallment) {
                            ////console.log('in if');
                            for (var x = 0; x < $scope.studentList[j].NoOfInstallment ; x++) 
                            {
                                var dex = ""+x;

                               // //console.log('outer :'+dex2);
                               // //console.log('inner:'+dex);

                                if ($scope.studentList[dex2].payment[dex].Status === 'Paid') 
                                {
                                   // //console.log('paid'+$scope.studentList[dex2].payment[dex].Amount);
                                     paid= parseInt(paid) + parseInt($scope.studentList[dex2].payment[dex].Amount);
                                }

                                else
                                {
                
                                  //  //console.log('pending'+$scope.studentList[dex2].payment[dex].Amount);
                                     pending= parseInt(pending) + parseInt($scope.studentList[dex2].payment[dex].Amount);
                                }
                            }

                            $scope.studentList[dex2].paidfees=paid;
                            $scope.studentList[dex2].pendingfees=pending;
                            paid=0;
                            pending=0;
                            $scope.templist=$scope.studentList;

                        }
                        else{
                            //console.log('in else');
                        }
                        }
                    } else {
                        waitingDialog.hide();
                       // toastr.error(data.message);
                    }
                }
            )
    };

$scope.onchangecardval=function(){

console.log($scope.templist[1].total);
var totalfees =0;
var totalpaidfees =0;
var totalpendingfees =0;
//totalfees = parseInt(totalfees);
var count=0;
    for(var i = 0; i < $scope.templist.length; i++){
        var x=""+i;
        totalfees += $scope.templist[x].total;
        totalpaidfees += $scope.templist[x].paidfees;
        totalpendingfees += $scope.templist[x].pendingfees;
    }
    $scope.totalfees=totalfees;
    $scope.totalpaidfees=totalpaidfees;
    $scope.totalpendingfees=totalpendingfees;
    $scope.count=$scope.templist.length;
};    
    

     $scope.viewbatchstudents = function(batch){
  
        var param=JSON.stringify({"batchname": batch})
        //console.log(param);
        localStorage.batchname=batch;
        $location.path('student');


    };

    $scope.editBranch = function(branchtoupdate)
{
    $scope.branchtoedit = branchtoupdate;
};

 $scope.updateBranch = function() {
    if($scope.branchtoedit.address==undefined || $scope.branchtoedit.address=="")
    {
         iziToast.error({title: 'Error',message: "Please Enter Address!", position: 'bottomLeft'});
    }else if($scope.branchtoedit.contact==undefined || $scope.branchtoedit.contact=="")
    {
         iziToast.error({title: 'Error',message: "Please Select Contact!", position: 'bottomLeft'});
    }else
    {
        $('#updatebranch').modal('hide');
         var datatosend =JSON.stringify({"address":$scope.branchtoedit.address, "contact":$scope.branchtoedit.contact,"branchid":$scope.branchtoedit._id});
        //console.log(datatosend);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/updatebranch",datatosend)
        .success(function(data){
            $scope.loading = false;
            //console.log(data);

            //toastr.success(data.message);
           // $scope.getCities();
        })  
        .error(function(err){
            waitingDialog.hide();
    /*toastr.error("Something went wrong! Please try again...");*/
        }) 
    }
    
    var datatosend =JSON.stringify({"address":$scope.branchtoedit.address, "contact":$scope.branchtoedit.contact,"branchid":$scope.branchtoedit._id});
    //console.log(datatosend);
    $scope.loading = true;
    $http.post("https://espl.in.net/accountsapi/updatebranch",datatosend)
    .success(function(data){
        $scope.loading = false;
        //console.log(data);
        //toastr.success(data.message);
       // $scope.getCities();
    })  
    .error(function(err){
        waitingDialog.hide();
/*toastr.error("Something went wrong! Please try again...");*/
    }) 
};

$scope.c={};
$scope.addBatch = function(branchid)
{
     if($scope.c['std']==undefined || $scope.c['std']=="")
    {
        iziToast.error({title: 'Error',message: "Please Select Standard!", position: 'bottomLeft'});
    }
    else if($scope.c['batchname']==undefined || $scope.c['batchname']==""){
         iziToast.error({title: 'Error',message: "Please Enter Batch Name!", position: 'bottomLeft'});
    }
    else if($scope.c['coursename']==undefined || $scope.c['coursename']==""){
         iziToast.error({title: 'Error',message: "Please Enter Select Course!", position: 'bottomLeft'});
    }
    else{
        $('#myModalbatch').modal('hide');
        $scope.c["branchid"]=branchid;
        var bdetails={};
        var param =JSON.stringify({"branchid":branchid});
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getsinglebranch",param)
        .success(function(data){
        $scope.loading = false;
        // //console.log(data.singlebranches.branchname);
        bdetails=data.singlebranches;

        $scope.c["branchname"]=bdetails.branchname;
        $scope.c["cityid"]=bdetails.cityid;
        var datatosend =JSON.stringify($scope.c);
        //console.log(datatosend);

        $http.post("https://espl.in.net/accountsapi/addbatchnew",datatosend)
        .success(function(data){
            $scope.getbatchesnew($scope.c["branchid"]);
            $scope.c={};

        })  
        .error(function(err){
            waitingDialog.hide();
        }) 
        })  
        .error(function(err){
         waitingDialog.hide();
        })

    }

 
   

   
};

$scope.saveUserid =function (id)
    {
        //console.log("save user id");
        localStorage.userid = id;
    };
$scope.reloadAddUserPage = function()
{

    $('#myModalHorizontal').modal('hide');
    setTimeout( function(){$route.reload();}  , 1000);
};

    $scope.insertUser = function () 
      { 
        var alreadyExists=false;
        //console.log($scope.staffname);
        //console.log($scope.branchid);
        //console.log($scope.usertype);
        if($scope.staffname == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Staffname", position: 'bottomLeft'});

        }
        else if($scope.usertype == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Usertype", position: 'bottomLeft'});
        }
        else if($scope.cityid == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter City", position: 'bottomLeft'});
        }
        else if($scope.usertype == "1" && $scope.branchid == undefined)
        {
             /*//console.log($scope.usertype);
            if($scope.branchid == undefined)
            {*/
                iziToast.error({title: 'Error',message: "Enter Branch", position: 'bottomLeft'});
            }else{
                
          var userData = JSON.stringify({
            "staffname" : $scope.staffname,
            "username" : $scope.username,
            "password" : $scope.password,
            "cityid" : $scope.cityid,
            "branchid" : $scope.branchid,
            "email" : $scope.email,
            "mobile":$scope.mobile,
            "usertype":$scope.usertype,
            "isDeleted":"false",
            "statusActive":"1"
        });
            //console.log(userData);
            $scope.loading = true;

            $http.post("https://espl.in.net/accountsapi/testUserExistence",userData)
            .success(function(data){
              if(data.success == "true")
              {
        alert('User Already Exists');             }
              else{
      $http.post("https://espl.in.net/accountsapi/insertuser",userData)
            .success(
                function (data) {
                    $scope.loading = false;
                        if (data.success === "true") {
                                                   

                            var msg ="Dear "+$scope.staffname+" Your Username is "+ $scope.username +" And Password is "+ $scope.password ;
                          
                           var smsdata = JSON.stringify({"mobile":$scope.mobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })

                            iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-ban',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                            $('.modal-backdrop').remove();
                            $('.modal').remove();
                            $route.reload();
                            //setTimeout( function(){$route.reload();}  , 1000);  
                        } else {

                            waitingDialog.hide();
                            toastr.error(data.message);
                        }
                    }
                );              }
            })  
            .error(function(err){
              toastr.error("Something went wrong! Please try again...");
            })
        }
       // }
        /*else if($scope.usertype == 1)
        {
             //console.log("int");
            if($scope.branchid == undefined)
            {
                iziToast.error({title: 'Error',message: "Enter Branch", position: 'bottomLeft'});
            }
        }*/
       /* else if($scope.branchid == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Branch", position: 'bottomLeft'});
        }*/
        
};

$scope.getTeachersLogin=function()
    {
        $scope.loading=true;
        $http.post("https://espl.in.net/accountsapi/getTeachers")
        .success(function(data){
           if(data.success == "true")
           {
            //console.log(data.teachers);
           $scope.teachers = data.teachers;
           $scope.loading=false;
       }
        })  
        .error(function(err){
        $scope.loading=false;
        }) 
    };

    $scope.saveTeacherId =function (id)
    {
        //console.log("save teacherId");
        localStorage.teacherId = id;
    };

    $scope.deleteTeacherLogin=function()
    {
    //console.log("Inside Delete Teacher");
             var param=JSON.stringify({"teacherId": localStorage.teacherId})
        //console.log(param);
             $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deleteTeacher",param)
                .success(function (data) {
                    $scope.loading = false;
                    $scope.getTeachersLogin();
                    if (data.success == "true") {
                        //console.log(data);
                          iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                    
                    } else {
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                        $scope.loading = false;

                    }
                }).error(function(err){
                    $scope.loading = false;
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });        
    };

        $scope.deleteuser = function(){
            //console.log("inside delete user");
             var param=JSON.stringify({"userid": localStorage.userid})
        //console.log(param);
             $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deleteuser",param)
                .success(function (data) {
                    $scope.loading = false;
                    $scope.getusers();
                    if (data.success == "true") {
                        //console.log(data);
                          iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                    
                    } else {
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });


        };

         $scope.deactivate = function(id){
            //console.log("deactivate user");
             var param=JSON.stringify({"userid": id})
        //console.log(param);
             $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deactivateuser",param)
                .success(function (data) {
                    $scope.loading = false;
                    $scope.getusers();
                    if (data.success == "true") {
                        //console.log(data);
                          iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                    
                    } else {
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });


        };

        $scope.activate = function(id){
            //console.log("activate user");
             var param=JSON.stringify({"userid": id})
        //console.log(param);
             $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/activateuser",param)
                .success(function (data) {
                    $scope.loading = false;
                    $scope.getusers();
                    if (data.success == "true") {
                        //console.log(data);
                          iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                    
                    } else {
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });


        };



        $scope.getusers=function()
    {
        $scope.loading=true;
        $http.post("https://espl.in.net/accountsapi/getusers")
        .success(function(data){
           // toastr.success(data.message);
           if(data.success == "true")
           {
            //console.log("users");
            //console.log(data.users);
           $scope.users = data.users;
           $scope.loading=false;
       }
        })  
        .error(function(err){
       // toastr.error("Something went wrong! Please try again...");
        $scope.loading=false;
        }) 
    };

        $scope.getUsertypes = function() {
            //console.log("get staff names func");
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getusertypes")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.usertypes=data.usertypes;
                    } else {
                       /* iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });*/
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
        }


         $scope.testRegistered=function()
        {
            console.log($scope.utype);
            //console.log('in testRegistered');
            var param = JSON.stringify({"mobile": $scope.mobile,"type":$scope.utype});
            //console.log(param);
            if ($scope.mobile && $scope.utype)
                {
                    $http.post("https://espl.in.net/accountsapi/registeredMobile",param)
                        .success(function (data) {
                            if (data.success == "true" ) {
                                //console.log(data.staff);
                                if($scope.utype=="Teacher / Staff")
                                {
                                    $scope.staff = data.staff;
                                    localStorage.staffId = data.staff[0]['_id'];
                                    $scope.generateOtp();
                                }
                                else
                                {
                                    $scope.staff = data.staff[0];
                                    localStorage.studentId = data.staff[0]['_id'];
                                    $scope.generateOtp();
                                }
                                
                            } else {
                                iziToast.error({title: 'Error',message: data.message,position: 'bottomLeft'});
                            }
                        }).error(function(err){
                            iziToast.error({title: 'Error',message: 'Server Error! Please contact admin', position: 'bottomLeft'});
                        })
                }
        };

        $scope.openStudentProfile = function(studentid)
        {
            //console.log($scope.student);
            //console.log(studentid);
            localStorage.studentId = studentid;
        }

        $scope.generateOtp =function(){
        var otp = Math.floor(100000 + Math.random() * 900000);
        localStorage.otp=otp;
            if (localStorage.otp) {
                $scope.genButton=false;
                $scope.otpDiv=true;
                $scope.errorMsg=false;
                var msg ="Your OTP (One Time Password) For login Is : "+localStorage.otp;
                var smsdata = JSON.stringify({"mobile":$scope.mobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                }
                                else
                                {                             
                                }
                                })
                            .error(function(err){ 
                            })
                                      
            }
        }

        $scope.verifyOtp =function(){
            if (localStorage.otp === $scope.otp) {
                //console.log('verified');
                $scope.errorMsg=false;
                if ($scope.utype == 'Teacher / Staff') {
                    localStorage.paymentflag = 'true'
                    $location.path('staffProfile');
                }
                else
                {
                    $location.path('studentProfile');
                }
                 $('.modal-backdrop').remove();
                    $('.modal').remove();
                    $route.reload();
            }
            else{
                $scope.errorMsg=true;
                //console.log('Failed');
            }
            
        }

        $scope.regenerateOtp =function(){
            $scope.errorMsg=false;
            $scope.testRegistered();
        }

        $scope.clearOtpData=function()
        {
            $scope.otp="";
            $scope.mobile="";
            $scope.otpDiv=false;
            $scope.genButton=true;
        }

$scope.toggleEditableResult = function(){
        //console.log("in toggle editable result");
        if($scope.showEditableResult == true)
        {
            $scope.showEditableResult = false;   
        }else{
            $scope.showEditableResult = true;
        }
    }



        $scope.createResult = function(batchid){

            
        if($scope.resultofbatch == undefined)
        {
            iziToast.error({title: 'Error',message: "Select batch", position: 'center'});

        }
        else if($scope.testname == undefined)
        {
            iziToast.error({title: 'Error',message: "Please Write Proper Test Name", position: 'center'});

        } 
        else if($scope.examDate == undefined)
        {
            iziToast.error({title: 'Error',message: "Select exam date", position: 'center'});
        }
        else 
        {
           //waitingDialog.show('...Please Wait');
           //console.log("IN function create result");
            var batchdata = JSON.stringify({"batchid" : $scope.resultofbatch,"testname" : $scope.testname,"examdate":$scope.examDate});
            //console.log(batchdata);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/createbatchresult",batchdata)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                       // sleep(2000);
                        //waitingDialog.hide();
                       //setTimeout($scope.getSchedules,1000);
                       $route.reload();
                    } else {
                        //waitingDialog.hide();
                    }
                }).error(function(err){
                    //console.log("server error");
                });
        }
       
    };

    $scope.deleteResult = function(id)
    {
        //console.log('Deleting :'+id);

        var flag = confirm("Do You Really Want Delete This Result");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deleteresult",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.getTests();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }
    };


    $scope.calc=function(index){
        var sum=0;
        for (var i = 0; i < $scope.testresult[0].subject.length ; i++) {
            if($scope.testresult[0].subject[i].submarks[index] == "")
            {
                return "";
            }
            else{
                var numreg= new RegExp(/^[0-9]+$/);
                if(numreg.test($scope.testresult[0].subject[i].submarks[index]))
                {
                    sum=sum+parseInt($scope.testresult[0].subject[i].submarks[index]);
                }
           }
        }
        return sum;

    }

    $scope.calcpercentage=function(index){
        var sum=0;
        for (var i = 0; i < $scope.testresult[0].subject.length ; i++) {
            if($scope.testresult[0].subject[i].submarks[index] == "")
            {
                return "";
            }
            else{
                var numreg= new RegExp(/^[0-9]+$/);
                if(numreg.test($scope.testresult[0].subject[i].submarks[index]))
                {
                    sum=sum+parseInt($scope.testresult[0].subject[i].submarks[index]);
                }
           }
        }
        return ((sum/$scope.testresult[0].totaltestmarks)*100).toFixed(2);

    }

    $scope.calculate=function(){
        return 20;

    }

    $scope.getTests =function ()
    {
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/gettests")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.tests=data.tests;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });


    };

    $scope.exportResult = function (name)
    {
    //console.log('export result');  
        html2canvas(document.getElementById(name), {
            onrendered: function (canvas) {
                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                        width: 510
                    }]
                };
                pdfMake.createPdf(docDefinition).download(name + ".pdf");
            }
        });
    };

    $scope.getresultforstudent = function(batch) {
        //console.log(batch);
            var param=JSON.stringify({"batch":batch});
            //console.log(param);
            $http.post("https://espl.in.net/accountsapi/getresultforstudent",param)
                .success(function (data) {
                    if (data.success == "true") {
                        $scope.resultlist = data.resultlist;
                         //console.log($scope.resultlist);
                    }else{
                //iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                //toastr.error(data.message);
                $scope.resultlist = "0";
                }
                })
                .error(function(err) {
                    $scope.resultlist = "0";
                iziToast.error({title: 'Error',message: "Server Error!Please Contact Admin!", position: 'bottomLeft'});
            //toastr.error("Something went wrong! ");
                });
        }

    $scope.storeresultId =function(id)
    {
        localStorage.testid=id;
    }
    
    $scope.getTestResultData =function()
    {
        var param=JSON.stringify({"id": localStorage.testid})        
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/gettestresult",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.testresult=data.testresult;
                        //console.log($scope.testresult);
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });


    }

    $scope.submitResult = function(){
        //console.log("in submit batch marks function");
        //var param = $scope.schedule;
        var param = JSON.parse( angular.toJson({"testresult" :$scope.testresult}));
        //waitingDialog.show('...Please Wait');
        $scope.loading = true;
        //console.log(param);
        $http.post("https://espl.in.net/accountsapi/updatetestresult",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log("success");
                    //waitingDialog.hide();
                    
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    }

     $scope.getBatchforBranchLogin =function ()
        {
            //console.log("branch login get batch");
        cityid = localStorage.cityid;
        var sab = JSON.parse(localStorage.loginData);
        //console.log(sab);
        //console.log(sab.branchid);
        if (localStorage.usertype=="1") {
            //console.log("branchadmin");
            branchid = sab.branchid;
        var param=JSON.stringify({"cityid": cityid,"branchid": branchid});  
        }
        else
        {
            //console.log("superadmin");
            var param=JSON.stringify({"cityid": cityid});
        }       
        //console.log('city batches :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getBatch",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches=data.batch;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });

        };

       $scope.batchforattendance = function (batchname) {

           /* var name = localStorage.batchname;
            $scope.batchname=localStorage.batchname;
            //console.log(name);*/
            var param=JSON.stringify({"batchname": batchname})
            //console.log(param);
            $scope.loading=true;
            $http.post("https://espl.in.net/accountsapi/getbatchattendance",param)
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.attendance=data.attendance;
                    $scope.studentlist=data.studentlist;
                    $scope.loading=false;
                    iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                    } else {
                        $scope.studentList={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

         $scope.getBatchforStudentResult =function ()
        {
            //console.log("in result");
            var ldata=JSON.parse(localStorage.loginData);
            //console.log(ldata);
        var param=JSON.stringify({"branchid":ldata.branchid})        
        //console.log('branch batches :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getcoursesnew",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.courses=data.courses;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });

        };



});

riddlerApp.controller('studentController', function($scope,$http,Upload,$window,$location,$route,$filter,$rootScope, idService) {
    $scope.today = $filter('date')(new Date(),'yyyy-MM-dd');
    $scope.loggedIn = localStorage.loggedIn;
    $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
    //console.log($scope.loginData);
   
    $scope.showeditables = localStorage.showeditables;
    $scope.parseInt = parseInt;    $scope.copyChequeDetails = function() {
    //console.log('in copy function');
    var sourceName = $scope.studentList.payment['0'].AccountHolderName;
    var sourceBank = $scope.studentList.payment['0'].NameOfBank;
    var sourceBranch = $scope.studentList.payment['0'].BranchName;
    for (var i = 1; i <= $scope.studentList.NoOfInstallment-1; i++) 
    {
        if ($scope.studentList.payment[''+i].mode === 'Cheque') 
        {
        $scope.studentList.payment[''+i].AccountHolderName = sourceName;
        $scope.studentList.payment[''+i].NameOfBank = sourceBank;
        $scope.studentList.payment[''+i].BranchName = sourceBranch;
        }    
    }      
};
    $scope.reverse = false;

        $scope.copyChequeDetails = function() {
    //console.log('in copy function');
    var sourceName = $scope.studentList.payment['0'].AccountHolderName;
    var sourceBank = $scope.studentList.payment['0'].NameOfBank;
    var sourceBranch = $scope.studentList.payment['0'].BranchName;
    for (var i = 1; i <= $scope.studentList.NoOfInstallment-1; i++) 
    {
        if ($scope.studentList.payment[''+i].mode === 'Cheque') 
        {
        $scope.studentList.payment[''+i].AccountHolderName = sourceName;
        $scope.studentList.payment[''+i].NameOfBank = sourceBank;
        $scope.studentList.payment[''+i].BranchName = sourceBranch;
        }    
    }      
};

    $scope.getstd = function(board) {
        $scope.loading = true;
        var param = JSON.stringify({"coursename":board});
        $http.post("https://espl.in.net/accountsapi/getstd",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log(data);
                    $scope.std = data.std;
                } else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                }
            }).error(function(err){
                iziToast.error({title: 'Error',message: "Standard Not Found!", position: 'bottomLeft'});
            })
    };



    $scope.checkAttendance = function(){
        angular.forEach($scope.studentList, function(student) {
             // //console.log(student);


                if (!!student.selected) {
                //  $scope.rollnoArray.push(JSON.parse(angular.toJson(student)))
                  //student.present = "present";
                  //console.log(student._id);
                  var param =JSON.stringify({"studId":student._id});
                  //console.log(param);

                }else
                {
          student.present = "absent";   
          //console.log("else printed");              
                }
            });
            
    }

    $scope.confirmStudentAttendance = function(){
      
        
       $scope.rollnoArray = [];
            angular.forEach($scope.studentList, function(student) {
              

                if (!!student.selected) {
                //  $scope.rollnoArray.push(JSON.parse(angular.toJson(student)))
                  student.present = "present";

                }else
                {
          student.present = "absent";                 
                }
            });
            /*if($scope.startTime == undefined)
            {
                        iziToast.error({
                            title: 'Error',
                            message: "Please select start time",
                            position: 'bottomLeft'
                        });

            }*/
        if($scope.endTime == undefined)
            {
                        iziToast.error({
                            title: 'Error',
                            message: "Please select end time",
                            position: 'bottomLeft'
                        });

            }
        /*    else if($scope.selectedstaff == undefined || $scope.selectedstaff == "")
            {
                        iziToast.error({
                            title: 'Error',
                            message: "Please select staff",
                            position: 'bottomLeft'
                        });

            }*/
            else if($scope.batch == undefined)
            {
                        iziToast.error({
                            title: 'Error',
                            message: "Please select batch",
                            position: 'bottomLeft'
                        });

            }
            /*else if($scope.subject == undefined)
            {
                        iziToast.error({
                            title: 'Error',
                            message: "Please select subject",
                            position: 'bottomLeft'
                        });

            }
            else if($scope.topic == undefined)
            {
                        iziToast.error({
                            title: 'Error',
                            message: "Please select topic",
                            position: 'bottomLeft'
                        });

            }
*/            else
            {
                
                $('#attendanceModal').modal('show');
                $scope.staffselected = JSON.parse($scope.selectedstaff);









            }



    };
    $('#attendanceModal').modal({ show: false});

/*$scope.checkAllStudents = function()
    {
        //console.log("check all first written");
        for (var i = 0; i < $scope.studentList.length; i++) 
        {
        $scope.studentList.selected = true;   
        }
    };*/

    $scope.unCheckStudents = function ()

    {
       //console.log("uncheck init calles"); 
        for (var i = 0; i < $scope.studentList.length; i++) 
        {
        $scope.studentList.selected = false;   
        }
    };

    $scope.checkAllStudentsAttendance = function()
    {
        //console.log("check all second written");
        //console.log($scope.checkedAllattendance);
        if ($scope.checkedAllattendance == false) 
        {
            for (var i = 0; i < $scope.studentList.length; i++) 
            {
            $scope.studentList[i].selected = false;   
            }
        }
        else
        {
            
            for (var i = 0; i < $scope.studentList.length; i++) 
            {
            $scope.studentList[i].selected = true;   
            }
        }
    };

    $scope.unCheckCheckAllAttendance = function()
    {
        /*for (var i = 0; i < $scope.studentList.length; i++) 
            {
            $scope.studentList[i].isChecked = false;   
            }*/
            $scope.checkedAll = false;
    };



    $scope.addstudentattendance = function()
    {
        var flagforatt;
        //console.log("mark attendance clicked");
       angular.forEach($scope.studentList, function(student) {
                if (!!student.selected) {
                  var param =JSON.stringify({"studId":student._id,"batch":$scope.batch});
                //console.log(param);
            $http.post("https://espl.in.net/accountsapi/studentattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    //console.log(data);
                    if (data.success == "true") {
                        
                        /*iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });*/
                       $location.path('adminDashboard');
                       
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                     })
            }
            })
      $window.alert("Attendance Added Successfully");
    };

    $scope.deleteStudent=function(){
        //console.log('in Delete student');
        //console.log('Stud id to delete' +$scope.studentInfo[0]._id);

        var param =JSON.stringify({"studId":$scope.studentInfo[0]._id})

            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deletestudent",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: "Delete Succefull",
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: "Failed To Delete Student",
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });        
        $('#deleteStudentModal').modal('hide');
    };


     $scope.getStaffList = function () 
      {
        cityid = localStorage.cityid;
        var param=JSON.stringify({"cityid": cityid})        
        //console.log('city stafflist :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getstafflistall")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.staffs=data.stafflist;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };

         $scope.batchforattendance = function () {
            console.log("Batch for Attendance");
            var batch_name=localStorage.batchname;
            //console.log(name);
            var param=JSON.stringify({"batchname": batch_name})
            //console.log(param);
            $scope.loading=true;
            $http.post("https://espl.in.net/accountsapi/getbatchattendance",param)
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.attendance=data.attendance;
                    $scope.studentlist=data.studentlist;
                    $scope.loading=false;
                    iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                    } else {
                        $scope.studentList={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };


        $scope.getBatchforStaffAttendance =function ()
        {
        cityid = localStorage.cityid;
        var param=JSON.stringify({"cityid": cityid})        
        //console.log('city batches :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getBatch",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches=data.batch;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });

        };

        

    $scope.getSubjects = function (batchname) 
      {
            var param=JSON.stringify({"batch": batchname})
            $scope.loading = true;
            $scope.subject="";
            $scope.topic="";
            $scope.topics={};
            $http.post("https://espl.in.net/accountsapi/getsubjectforbatches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.subjects=data.subjects;
                        $scope.topics={};
                    } else {
                        $scope.subjects={};
                        $scope.topics={};

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    $scope.topics={};
                    $scope.subjects={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };


        $scope.getTopics = function (batchname,subj) 
      {
            var param=JSON.stringify({"batch": batchname,"subject":subj})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/gettopicsforsubject",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.topics=data.topics;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };






    
    $scope.toggleSelect = function($event) {
        angular.forEach($scope.studentList, function(item) {
            item.selected = $event.target.checked;
        });
    }

    $scope.changepwd = function() {
        //console.log($scope.newpasswordt);
        var param = JSON.stringify({"id":$scope.loginData._id,"pass":$scope.newpasswordt});
        //console.log(param);
        $http.post("https://espl.in.net/accountsapi/changepwd",param)
            .success(function (data) {
                if (data.success == "true") {
                    //console.log("success");
                     $scope.loading=false;
                    iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                
                  setTimeout( function(){$route.reload();}  , 1000);
                    
                    
                } else {
                   
                }
            })
            .error(function (err) {
                
            });

    }

    $scope.displayall=function()
    {
        $scope.admission= true;
        $scope.payment=true;
        $scope.terms=true;
       /* $scope.$apply();*/
    };
     $scope.afterdisplay=function()
    {
        setTimeout( function(){$scope.addnewstudent()}  , 1000);
    }
    $scope.afterdisplaydirect=function()
    {
        setTimeout( function(){$scope.admitstudentdirectly()}  , 1000);
    }
    $scope.savepdf = function(name,foldername){
        //console.log('In Save PDF function');
        html2canvas(document.getElementById(name),
        { 
            onrendered: function (canvas) 
            {

                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                        width: 510,
                    }]
                };
              
                const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBase64((data) => {  //alert(data);
            var pdfdata = JSON.stringify({"pdfdata":data,"pdfname":name,"foldername":foldername});
              // //console.log(pdfdata);
            $http.post("https://espl.in.net/accountsapi/createpdf",pdfdata)
            .success(function (data) {
                if (data.success == "true") {
                    //console.log("success");
                    
                } else {
                            //console.log('In Else');       
                }
            })
            .error(function (err) {
                
            });
            //139.59.4.32
            //console.log("hello");

        });
            }
        });
    }


$scope.saveEditedFees=function()
    {

    paymentFlag=0;
    toCheck=$scope.studentInfo[0].total;
    totalToCheck=0;
    dCount=$scope.studentInfo[0].NoOfInstallment;

    checkflag=true;
        cashflag=true;
        ddflag=true;

        for (var x = 0; x < dCount; x++) 
        {
            if($scope.studentInfo[0].payment[x].mode == "Cheque")
            {
               checkflag= $scope.validateChequeDetails($scope.studentInfo[0].payment[x]);
            }
            if($scope.studentInfo[0].payment[x].mode == "Cash")
            {
                cashflag=$scope.validateCashDetails($scope.studentInfo[0].payment[x]);
            }
            if($scope.studentInfo[0].payment[x].mode == "DD")
            {
               ddflag= $scope.validateDDDetails($scope.studentInfo[0].payment[x]);
            }
            if(x=dCount-1)
            {
               if(checkflag&&ddflag&&cashflag)
                {
                    for (var x = 0; x < dCount; x++) 
                    {
                        //console.log(x+'value : '+$scope.studentInfo[0].payment[x].Amount);
                        totalToCheck=parseInt(totalToCheck)+parseInt($scope.studentInfo[0].payment[x].Amount);
                    }
                    //console.log('Initial test :'+toCheck);
                    //console.log('total :'+totalToCheck);
                    toCheck = parseInt(toCheck);
                    if (totalToCheck == toCheck) 
                    {
                        paymentFlag=1;
                    }
                    else{
                        alert('Installments Total Is Incorrect');
                    }
                }   
            }
        }
      

        if (paymentFlag == 1) 
        {
           //alert('All Okkay'); 
           studedata=$scope.studentInfo[0];
            var id=studedata["_id"];
            //console.log("datsdj");
            delete(studedata["_id"]);
            //console.log(studedata);
            //console.log(id);
            var param=JSON.stringify({"id": id,"data":studedata});
            //console.log(param);
            $scope.loading = true;
           $http.post("https://espl.in.net/accountsapi/editstudentinfo",param)
            .success(function (data) {
                if (data.success == "true") {
                    //console.log("success");
                     $scope.studentInfo=data.studentdata;
                     $scope.loading=false;
                    iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                $('#myModal').modal('hide');
                $scope.getStudentInfo();
                  setTimeout( function(){$route.reload();}  , 1000);
                } else {
                }
            })
            .error(function (err) {
            });
        }
    };
  
 /*   $scope.saveEditedFees=function()
    {
    //console.log('in save fees');
    //console.log($scope.studentInfo[0]);

    paymentFlag=0;                                                    as on 25-4-2018
    toCheck=$scope.studentInfo[0].total;
    totalToCheck=0;
    dCount=$scope.studentInfo[0].NoOfInstallment;

    for (var x = 0; x < dCount; x++) 
        {
            //console.log(x+'value : '+$scope.studentInfo[0].payment[x].Amount);
            totalToCheck=parseInt(totalToCheck)+parseInt($scope.studentInfo[0].payment[x].Amount);
        }
        //console.log('Initial value :'+toCheck);
        //console.log('calculated total :'+totalToCheck);
        if (totalToCheck == toCheck) 
        {
            paymentFlag=1;
        }
        else{
            alert('Installments Total Is Incorrect');
        }

        if (paymentFlag == 1) 
        {
           //alert('All Okkay'); 
           studedata=$scope.studentInfo[0];
            var id=studedata["_id"];
            //console.log("datsdj");
            delete(studedata["_id"]);
            //console.log(studedata);
            //console.log(id);
            var param=JSON.stringify({"id": id,"data":studedata});
            //console.log(param);
            $scope.loading = true;
           $http.post("https://espl.in.net/accountsapi/editstudentinfo",param)
            .success(function (data) {
                if (data.success == "true") {
                    //console.log("success");
                     $scope.studentInfo=data.studentdata;
                     $scope.loading=false;
                    iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                $('#myModal').modal('hide');
                $scope.getStudentInfo();
                  setTimeout( function(){$route.reload();}  , 1000);
                } else {
                }
            })
            .error(function (err) {
            });
        }
    };*/

        $scope.exportPayment = function(name){
       
        html2canvas(document.getElementById(name), {
            onrendered: function (canvas) {
                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                        width: 510
                    }]
                };
                pdfMake.createPdf(docDefinition).download(name + ".pdf");
            }
        });

     };



   $scope.reloadPage=function()
    {
        $('#myModal').modal('hide');
                $scope.getStudentInfo();
                
                  setTimeout( function(){$route.reload();}  , 1000);
        //$route.reload();
    };

    

     $scope.calculateFees = function (branchname) {
      //console.log('in function');

       $scope.studentList.netfees=Math.round($scope.studentList.fees - ($scope.studentList.fees* ($scope.studentList.discount / 100)));
       $scope.studentList.gst=Math.round($scope.studentList.netfees *($scope.studentList.tax/100));
       $scope.studentList.total=$scope.studentList.netfees+$scope.studentList.gst;
    };

     $scope.calculatediscount=function(branchname){
        console.log("yo");
        $scope.studentList.discount=((($scope.studentList.fees-($scope.studentList.total/(1+($scope.studentList.tax/100))))/$scope.studentList.fees)*100)
        $scope.studentList.netfees=($scope.studentList.fees - ($scope.studentList.fees* ($scope.studentList.discount / 100)));
        $scope.studentList.gst=($scope.studentList.netfees *($scope.studentList.tax/100));  
};

    $scope.calCashInstallments =function()
    {
       // //console.log('in cash Installments');

        if ($scope.cash.NoOfInstallment == 1) {
            $scope.cash.ddAmount=$scope.studentList.total;
        }
        if($scope.cash.NoOfInstallment > 1)
        {
        $scope.cash.ddAmount="";       
        }
    };

    $scope.calDDInstallments =function()
    {
        ////console.log('in DD Installments');

        if ($scope.dd.NoOfInstallment == 1) {
            $scope.dd.ddAmount=$scope.studentList.total;
        }
        if($scope.dd.NoOfInstallment > 1)
        {
        $scope.dd.ddAmount="";       
        }
    };

     $scope.getproduct = function(board)
  {
    var param=JSON.stringify({"board":board,"city":localStorage.cityid});
     //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getfeestructure",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.products=data.fees;
                       
                    } else {
                        $scope.products={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.products={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
  };

    $scope.getBoard = function (branchname) {
        //localStorage.resultid = id;
        var param=JSON.stringify({"branchname": branchname})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBoard",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.boards=data.board;
                        $scope.batches={};
                       
                    } else {
                       
                        $scope.boards={};
                        $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    
                    $scope.boards={};
                        $scope.batches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };

    $scope.getenqiryperson = function (enid) {
        //localStorage.resultid = id;
        var param=JSON.stringify({"enquiryid": enid})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getenqiryperson",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.enquiryperson=data.enquiryperson;
                        //console.log($scope.enquiryperson);
                        //$scope.boards=data.board;
                       
                    } else {
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };    

$scope.editStudentProfileStatus =function(){
$scope.editstudentflagstatus=false;
};   
$scope.submitStudentProfile=function()
{
    if($scope.studentInfo[0].dob == undefined || $scope.studentInfo[0].dob == "")
        {
            iziToast.error({title: 'Error',message: "Enter Date of Birth", position: 'bottomLeft'});
      }
      else if($scope.studentInfo[0].schoolName == undefined || $scope.studentInfo[0].schoolName == "")
        {
            iziToast.error({title: 'Error',message: "Enter School Name", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].studentMobile == undefined || $scope.studentInfo[0].studentMobile == "")
        {
            iziToast.error({title: 'Error',message: "Enter Student Mobile", position: 'bottomLeft'});
    }
    else if($scope.studentInfo[0].studentMobile.length != 10)
        {
            iziToast.error({title: 'Error',message: "Enter 10 digit Valid Student Mobile", position: 'bottomLeft'});
    }
      else if($scope.studentInfo[0].schoolTiming == undefined || $scope.studentInfo[0].schoolTiming == "")
        {
            iziToast.error({title: 'Error',message: "Enter School Timing", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].Email.indexOf("@") < 1 || $scope.studentInfo[0].Email.lastIndexOf(".") < $scope.studentInfo[0].Email.indexOf("@") || $scope.studentInfo[0].Email.lastIndexOf(".") + 2 > $scope.studentInfo[0].Email.length)
        {
            iziToast.error({title: 'Error',message: "Enter valid Email Address", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].pincode == undefined || $scope.studentInfo[0].pincode == "")
        {
            iziToast.error({title: 'Error',message: "Enter Pincode", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].fatherName == undefined || $scope.studentInfo[0].fatherName == "")
        {
            iziToast.error({title: 'Error',message: "Enter Father Name", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].fatherMobile == undefined || $scope.studentInfo[0].fatherMobile == "")
        {
            iziToast.error({title: 'Error',message: "Enter Father Mobile", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].fatherMobile.length != 10)
        {
            iziToast.error({title: 'Error',message: "Enter 10 digit Valid Father Mobile", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].fatherMail == undefined || $scope.studentInfo[0].fatherMail == "")
        {
            iziToast.error({title: 'Error',message: "Enter Father Email Address", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].fatherMail.indexOf("@") < 1 || $scope.studentInfo[0].fatherMail.lastIndexOf(".") < $scope.studentInfo[0].fatherMail.indexOf("@") || $scope.studentInfo[0].fatherMail.lastIndexOf(".") + 2 > $scope.studentInfo[0].fatherMail.length)
        {
            iziToast.error({title: 'Error',message: "Enter valid Father Email Address", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].fatherOcc == undefined || $scope.studentInfo[0].fatherOcc == "")
        {
            iziToast.error({title: 'Error',message: "Enter Father Occupation", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].motherName == undefined || $scope.studentInfo[0].motherName == "")
        {
            iziToast.error({title: 'Error',message: "Enter Mother Name", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].motherMail == undefined || $scope.studentInfo[0].motherMail == "")
        {
            iziToast.error({title: 'Error',message: "Enter Mother's Email Address", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].motherMail.indexOf("@") < 1 || $scope.studentInfo[0].motherMail.lastIndexOf(".") < $scope.studentInfo[0].motherMail.indexOf("@") || $scope.studentInfo[0].motherMail.lastIndexOf(".") + 2 > $scope.studentInfo[0].motherMail.length)
        {
            iziToast.error({title: 'Error',message: "Enter valid Mother Email Address", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].motherMobile == undefined || $scope.studentInfo[0].motherMobile == "")
        {
            iziToast.error({title: 'Error',message: "Enter Mother Mobile", position: 'bottomLeft'});
        }
        else if($scope.studentInfo[0].motherMobile.length != 10)
        {
            iziToast.error({title: 'Error',message: "Enter 10 digit Valid Mother Mobile", position: 'bottomLeft'});
        }

        else{
    $scope.editstudentflagstatus=true;

   //console.log($scope.studentInfo[0]);
 studedata=$scope.studentInfo[0];
    var id=studedata["_id"];
    //console.log("datsdj");
    delete(studedata["_id"]);
    //console.log(studedata);
    //console.log(id);
    var param=JSON.stringify({"id": id,"data":studedata});
    //console.log(param);
    $scope.loading = true;
     $http.post("https://espl.in.net/accountsapi/editstudentinfo",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        $scope.studentInfo=data.studentdata;
                     } else {
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
   
};
};
$scope.getBatch = function (branchname,board) {
     //console.log("in batches");
        //localStorage.resultid = id;
        var param=JSON.stringify({"branchname": branchname,"coursename":board})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBatch",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches=data.batch;
                       
                    } else {
                        $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                     $scope.batches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };
    
     $scope.export = function(name,ht){
       
        html2canvas(document.getElementById(name), {
            onrendered: function (canvas) {
                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                     
                        width: 510,
                        height: ht
                    }]
                };
                pdfMake.createPdf(docDefinition).download(name + ".pdf");
            }
        });

     }
    $scope.displayadmission=function()
    {
        //console.log($scope.studentList);
        $scope.admission= true;
        $scope.payment=false;
        $scope.terms=false;
    };

    
    $scope.selectedMonth = "";
  $scope.selectedMonthFilter = function(element) {
    //console.log("month"+$scope.selectedMonth);
    if(!$scope.selectedMonth) return true;
    return element.enqDate.getMonth() == $scope.selectedMonth;
  }
  
    $scope.displayterms=function()
    {
        paymentFlag=0;
        toCheck=$scope.studentList.total;
        totalToCheck=0;
        dCount=$scope.studentList.NoOfInstallment;
        checkflag=true;
        cashflag=true;
        ddflag=true;

        for (var x = 0; x < dCount; x++) 
        {
            if($scope.studentList.payment[x].mode == undefined || $scope.studentList.payment[x].mode == "")
            {
               iziToast.error({title: 'Error',message: "Incorrect Details", position: 'bottomLeft'});
            }
            if($scope.studentList.payment[x].mode == "Cheque")
            {
               checkflag= $scope.validateChequeDetails($scope.studentList.payment[x]);
            }
            if($scope.studentList.payment[x].mode == "Cash")
            {
                cashflag=$scope.validateCashDetails($scope.studentList.payment[x]);
            }
            if($scope.studentList.payment[x].mode == "DD")
            {
               ddflag= $scope.validateDDDetails($scope.studentList.payment[x]);
            }
        }
        if(checkflag&&ddflag&&cashflag)
        {
            for (var x = 0; x < dCount; x++) 
            {
                //console.log(x+'value : '+$scope.studentList.payment[x].Amount);
                totalToCheck=parseInt(totalToCheck)+parseInt($scope.studentList.payment[x].Amount);
            }
            //console.log('Initial test :'+toCheck);
            //console.log('total :'+totalToCheck);
            toCheck = parseInt(toCheck);
            if (totalToCheck == toCheck) 
            {
                paymentFlag=1;
            }
            else{
                alert('Installments Total Is Incorrect');
            }

        }

        

        if (paymentFlag == 1) 
        {
            //console.log($scope.studentList);
            $scope.admission= false;
            $scope.payment=false;
            $scope.terms=true;    
        }
        
    };


    $scope.validateCashDetails = function(paymentDetail)
    {
        if (paymentDetail.Date == undefined || paymentDetail.Date == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Date", position: 'bottomLeft'});
            return false;
        }
        else if (paymentDetail.Status == undefined || paymentDetail.Status == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Status", position: 'bottomLeft'});
             return false;
        }
        else
        {
            return true;
        }
    }

    $scope.validateChequeDetails = function(paymentDetail)
    {
        if (paymentDetail.AccountHolderName == undefined || paymentDetail.AccountHolderName == "") {
            iziToast.error({title: 'Error',message: "Provide Installment AccountHolderName", position: 'bottomLeft'});
             return false;
        }
       else if (paymentDetail.NameOfBank == undefined || paymentDetail.NameOfBank == "") {
            iziToast.error({title: 'Error',message: "Provide Installment NameOfBank", position: 'bottomLeft'});
             return false;
        }
       else if (paymentDetail.BranchName == undefined || paymentDetail.BranchName == "") {
            iziToast.error({title: 'Error',message: "Provide Installment BranchName", position: 'bottomLeft'});
             return false;
        }
       else if (paymentDetail.Number == undefined || paymentDetail.Number == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Number", position: 'bottomLeft'});
             return false;
        }
       else if (paymentDetail.Date == undefined || paymentDetail.Date == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Date", position: 'bottomLeft'});
             return false;
        }
       else if (paymentDetail.Status == undefined || paymentDetail.Status == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Status", position: 'bottomLeft'});
             return false;
        }
        else{
             return true;

        }
        
    }

    $scope.validateDDDetails = function(paymentDetail)
    {
        if (paymentDetail.NameOfBank == undefined || paymentDetail.NameOfBank == "") {
            iziToast.error({title: 'Error',message: "Provide Installment NameOfBank", position: 'bottomLeft'});
            return false;
        }
        else if (paymentDetail.BranchName == undefined || paymentDetail.BranchName == "") {
            iziToast.error({title: 'Error',message: "Provide Installment BranchName", position: 'bottomLeft'});
            return false;
        }
        else if (paymentDetail.Number == undefined || paymentDetail.Number == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Number", position: 'bottomLeft'});
            return false;
        }
       else if (paymentDetail.Date == undefined || paymentDetail.Date == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Date", position: 'bottomLeft'});
            return false;
        }
        else if (paymentDetail.Status == undefined || paymentDetail.Status == "") {
            iziToast.error({title: 'Error',message: "Provide Installment Status", position: 'bottomLeft'});
            return false;
        }
        else
        {
            return true;
        }
    }
    
    $scope.feetopay=200;
    $scope.getckpaymentdetails=function()
    {

        //console.log("pay");
        //console.log($scope.studentList.total);
        $scope.feetopay=$scope.studentList.total;
        $scope.check=true;
        
    };
    $scope.displaypayment=function()
    {
        //console.log($scope.studentList);
        //$window.scrollTo(0, 0);
        //$(window).scrollTop();
        $scope.admission= false;
       $scope.terms=false;
        $scope.payment=true;
      /*  $scope.studentList.fees=88000;*/

    };

    $scope.getterms=function()
    {
        //console.log("terms");
        $scope.loading = true;
         $http.post("https://espl.in.net/accountsapi/getterms")
            .success(
                function (data) {
                    $scope.loading = false;
                    if (data.success === "true"){
                        /*iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });*/
                        waitingDialog.hide();
                       //console.log(data.success);
                       $scope.Terms=data.terms;
                      /*  $scope.T =erms data.studentList[0];*/
                      /* //console.log($scope.data.terms[0]);*/
                    } else {
                        //console.log("error ali");
                        waitingDialog.hide();
                        toastr.error(data.message);
                    }
                }
            )};

        $scope.addnewenquirystudent = function() {
            loginId = JSON.parse(localStorage.loginData);
            //console.log(loginId);
            //console.log(loginId._id);
            //console.log(loginId['_id']);
        waitingDialog.show("...Please Wait");
        var studentData = JSON.stringify({
            "firstName" : $scope.enquiry_fname,
            "middleName" : $scope.enquiry_mname,
            "lastName" : $scope.enquiry_lname,
            "dob" : $scope.enquiry_dob,
            "studentMobile" : $scope.enquiry_mobile,
            "address" : $scope.enquiry_address,
            "schoolName" : $scope.enquiry_schoolName,
            "schoolTiming" : $scope.enquiry_schoolTiming,
            "std" : $scope.enquiry_std,
            "fatherName" : $scope.enquiry_pname,
            "fatherOcc" : $scope.enquiry_pOcc,
            "fatherMail" : $scope.enquiry_pmail,
            "fatherOfficeAddress" : $scope.enquiry_pAdd,
            "fatherMobile" : $scope.enquiry_pMobile,
            "Email":$scope.enquiry_email,
            "enquiredBy": loginId._id,
            "cityid":localStorage.cityid,
            "isDeleted":"false"

        })
        ////console.log(localStorage.loginData._id);
        //console.log(studentData);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/addnewenquirystudent", studentData)
                .success(
                    function (data) {
                        $scope.loading = false;
                        if (data.success === "true") {
                            waitingDialog.hide();
                                var msg ="Dear "+$scope.enquiry_fname+" Thanks for enquiry Mahesh Tutorials";
                                 var smsdata = JSON.stringify({"mobile":$scope.enquiry_mobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
                                    

                            $location.path('student');
                            //toastr.success(data.message);
                            iziToast.show({ 
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                        } else {
                            waitingDialog.hide();
                            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                        }
                    });
            };

            
    $scope.deleteEnquiry = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete This Enquiry");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deleteenquiry",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.getEnquiryStudentList();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }
    };
                

   $scope.studentList={};
    $scope.dd={};
    $scope.cheque={};


   //$scope.studentList.gender = "female";
  // $scope.gendr = "male";

   $scope.admitstudentdirectly = function ()
   {

    if ($scope.studentList.firstName === undefined) {
            $('#fnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter First Name!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.middleName === undefined) {
            $('#mnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Middle Name!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.lastName === undefined) {
            $('#lnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Surname!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.dob=== undefined) {
            $('#dobdiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Date of Birth!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.Email === undefined) {
            //toastr.error("Please Enter Email");
            $('#emaildiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Email Address!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.Email.indexOf("@") < 1 || $scope.studentList.Email.lastIndexOf(".") < $scope.studentList.Email.indexOf("@") || $scope.studentList.Email.lastIndexOf(".") + 2 > $scope.studentList.Email.length) {
            $('#emaildiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Entered Email is Not Valid!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.address === undefined) {
            $('#addressdiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Address!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.schoolName === undefined) {
            $('#schoolnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter School Name!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else {

           
        }
        //console.log('Before Save All Pdf');
       $scope.saveAllPdf();
       //console.log('after Save All pdf');
        $scope.studentList.admitStatus="1";
        $scope.studentList.cityid= localStorage.cityid;
        $scope.studentList.enquiredBy=localStorage.loginData["_id"];
        $scope.studentList.isDeleted="false";
        //$scope.studentList.batchid="598c415c75e87b41ed390bdf";



        //console.log($scope.studentList);
        var studentData = JSON.stringify({"studentdata":$scope.studentList});
   
$scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/addstudentdirectly", studentData)
                .success(
                    function (data) {
                        $scope.loading = false;
                        if (data.success === "true") {
                            //code for sms after admission 

                            var msg ="Dear "+$scope.studentList.firstName+" Welcome to Mahesh Tutorial! Congratulations in your choice to focus time and energy on your own growth"
                              var smsdata = JSON.stringify({"mobile":$scope.studentList.studentMobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })

                          
                            //toastr.success(data.message);
                            iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-ban',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });

                        $location.path('student');
                        } else {

                            
                            toastr.error(data.message);
                        }
                    }
                );

   }

   $scope.saveAllPdf = function()
   {
    //console.log('in saveAllPdf function');
    var dirname= $scope.studentList.firstName+'_'+$scope.studentList.middleName+'_'+$scope.studentList.lastName;
    $scope.savepdf('TnC',dirname);
    $scope.savepdf('admissionform',dirname);
    $scope.savepdf('paymentdetails',dirname);
    //console.log('out of  saveAllPdf function');
   };

   $scope.addnewstudent = function () {
        if ($scope.studentList.firstName === undefined) {
            $('#fnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter First Name!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.middleName === undefined) {
            $('#mnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Middle Name!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.lastName === undefined) {
            $('#lnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Surname!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.dob=== undefined) {
            $('#dobdiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Date of Birth!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.Email === undefined) {
            //toastr.error("Please Enter Email");
            $('#emaildiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Email Address!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.Email.indexOf("@") < 1 || $scope.studentList.Email.lastIndexOf(".") < $scope.studentList.Email.indexOf("@") || $scope.studentList.Email.lastIndexOf(".") + 2 > $scope.studentList.Email.length) {
            $('#emaildiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Entered Email is Not Valid!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.studentMobile === undefined) {
            $('#studentMobilediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Mobile Number!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.address === undefined) {
            $('#addressdiv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter Address!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else if ($scope.studentList.schoolName === undefined) {
            $('#schoolnamediv').addClass('has-error');
            iziToast.show({
                theme: 'dark',
                title: 'Error',
                message: 'Please Enter School Name!',
                position: 'bottomLeft',
                icon: 'fa fa-ban',
                progressBarColor: 'rgb(0, 255, 184)'
            });
        } else {
            waitingDialog.show("...Please Wait");
        }
        var stud_id=$scope.studentList["_id"];
        delete $scope.studentList["_id"];
        $scope.studentList.admitStatus="1";
        $scope.studentList.cityid= localStorage.cityid;
        //var dirname= $scope.studentList.firstName+$scope.studentList.middleName+$scope.studentList.lastName;
        //console.log('Before Save All Pdf');
       $scope.saveAllPdf();
      // //console.log('after Save All pdf');
        //$scope.studentList.batchid="598c415c75e87b41ed390bdf";


       
        ////console.log(dirname);
      //  //console.log($scope.studentList);
        var studentData = JSON.stringify({"studentdata":$scope.studentList,'stud_id':stud_id});
 
$scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/addnewstudent", studentData)
                .success(
                    function (data) {
                        $scope.loading = false;
                        if (data.success === "true") {
                            waitingDialog.hide();
                            //console.log($scope.studentList.firstName);
                            //console.log($scope.studentList.studentMobile);
                            //code for sms

                            var msg ="Dear "+$scope.studentList.firstName+" Welcome to Mahesh Tutorial! Congratulations in your choice to focus time and energy on your own growth"
                             var smsdata = JSON.stringify({"mobile":$scope.studentList.studentMobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
                              
                            //toastr.success(data.message);
                            iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-ban',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });

                        $location.path('student');
                        } else {

                            waitingDialog.hide();
                            toastr.error(data.message);
                        }
                    }
                );
    };

    $scope.admit = function (x) {
            localStorage.admitData=x;
            $location.path('admission');
    };

    $scope.getEnquiryStudentList = function () {
        $scope.loading = true;
        param=JSON.stringify({"cityid":localStorage.cityid})
        $http.post("https://espl.in.net/accountsapi/getEnquiryStudentList",param)
            .success(
                function (data) {
                    $scope.loading = false;
                    if (data.success === "true"){
                        /*iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });*/
                        waitingDialog.hide();
                        $scope.enquiryList = data.enquiryList;
                        //console.log($scope.enquiryList);
                    } else {
                        waitingDialog.hide();
                        $scope.enquiryList = {};
                    }
                }
            )
    };

    $scope.getAdmittedStudentList = function () {
         $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getAdmittedStudentList")
            .success(
                function (data) {
                    $scope.loading = false;
                    if (data.success === "true"){
                        /*iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });*/

                         //console.log($scope.enquiryList);
                        waitingDialog.hide();
                        $scope.enquiryList = data.enquiryList;
                        //console.log($scope.enquiryList);
                    } else {
                        waitingDialog.hide();
                        toastr.error(data.message);
                    }
                }
            )
    };

    $scope.geteditdata = function () {
        //    //console.log("in fun");
           $scope.studentdata=localStorage.admitData;
           //console.log($scope.studentdata);
           localStorage.removeItem("admitData");
          // localStorage.clear();

           var studentData = JSON.stringify({"batch":"false","id":$scope.studentdata});
           $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getAdmittedStudentList",studentData)
            .success(
                function (data) {
                    $scope.loading = false;
                    if (data.success === "true"){
                        /*iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-check',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });*/
                        waitingDialog.hide();
                       
                        $scope.studentList = data.studentList[0];
                        //console.log($scope.studentList);
                    } else {
                        //console.log("error ali");
                        waitingDialog.hide();
                        toastr.error(data.message);
                    }
                }
            )

          // //console.log($scope.studentdata);
          // //console.log($scope.studentdata);
    };

        $scope.go = function ( path ) {
          $location.path( path );
        };

        $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
        };

        $scope.loginAuth = function() {
            //console.log("in login auth");
             $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
             //console.log($scope.loginData);
          //  $scope.loginData = localStorage.loginData;
            if($scope.loginData == undefined)
            {
                $location.path('/');
            }
        }

  //       $scope.login = function()
  // {
  //    $http.post("https://espl.in.net/accountsapi/login",JSON.stringify($scope.form2))
  //   .success(function(data){
  //     if(data.token){
  //       $window.sessionStorage.setItem('user-token', data.token);
  //       alert("Login Success.",data.token);
  //       $window.location.href = 'after_login.html';
  //     }
  //     else{
  //       alert("Invalid Credentials.");
  //     }
  //   })
  //   .error(function(err){
  //     alert("Something went wrong!! ,Please check log for more details.");
  //     console.log(err);

  //    })

        $scope.doLogin = function () {

            if($scope.username == undefined )
            {
                iziToast.error({title: 'Error',message: "Please Enter User name", position: 'bottomLeft'});

            } 
            else if($scope.password == undefined)
            {
                iziToast.error({title: 'Error',message: "Please Enter Password", position: 'bottomLeft'});
            }
            else if($scope.usertype == undefined || $scope.usertype =="blank")
            {

                iziToast.error({title: 'Error',message: "Please select user type", position: 'bottomLeft'});
            }
            else{

                        var userData = JSON.stringify({
                        "username" : $scope.username,
                        "password" : $scope.password,
                        "usertype" : $scope.usertype
                    });

                        $scope.loading = true;
                    $http.post("https://espl.in.net/accountsapi/doLogin",userData)
                        .success(function (data) {
                            $scope.loading = false;
                            if (data.success == "true") {
                                // if(data.token){
                                //     $window.sessionStorage.setItem('user-token', data.token);
                                //console.log(data.data[0]);
                                localStorage.loggedIn = true;
                                localStorage.usertype = data.data[0].usertype;
                                $scope.loggedIn = localStorage.loggedIn;
                                localStorage.loginData = JSON.stringify(data.data[0]);

                                if (data.data[0].usertype === "0") {
                                    localStorage.showeditables = true;
                                }
                                else{ localStorage.showeditables = false;}
                                /*$location.path('adminDashboard');*/
                                $('.modal-backdrop').remove();
                                $('.modal').remove();
                                $route.reload();
                                /*$scope.loginData = localStorage.loginData;
                                //console.log($scope.loginData);*/
                                //console.log("Login Success!");
                                iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                }
                            else {
                                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                            }
                        })
                        .error(function (err) {
                            iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
                        });
        }
        };

        $scope.getStudentInfo = function () {
            var paid=0,pending=0;
           // var param=JSON.stringify({"id": localStorage.studentId,"batchname":localStorage.batchname})
           var param=JSON.stringify({"id": localStorage.studentId})
            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getStudentInfo",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.studentInfo = data.studentData;
                    $scope.batchName = data.batch;
                    //console.log($scope.studentInfo);

                        for (var x = 0; x < $scope.studentInfo[0].NoOfInstallment ; x++) 
                        {
                            var dex = ""+x;

                            if ($scope.studentInfo[0].payment[dex].Status === 'Paid') 
                            {
                                paid = parseInt(paid) + parseInt($scope.studentInfo[0].payment[dex].Amount);
                            }

                            else{
                                pending = parseInt(pending) + parseInt($scope.studentInfo[0].payment[dex].Amount);
                            }
                        }

                        //console.log('Paid :'+paid);
                        //console.log('Pending :'+pending);
                        //console.log('Total :'+$scope.studentInfo[0].total);
                        $scope.paid=paid;
                        $scope.pending=pending;
                        $scope.attendance = data.attendance;

                        //console.log($scope.attendance);
                        $scope.getquestionpaperforstudent($scope.studentInfo[0].Batch);
                } 
                else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                }
            })

            .error(function(err){

                iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

            });

        };

        $scope.addNewInstallment=function()
        {
            //$scope.studentInfo[0].payment.push({});che
            if($scope.studentInfo[0].NoOfInstallment<12)
            {
                $scope.studentInfo[0].NoOfInstallment=parseInt($scope.studentInfo[0].NoOfInstallment)+1;
                //console.log("add change in installments");
                //console.log($scope.studentInfo[0]);
            }
            else
            {
                alert("no of installment can not be exceeded");
            }
            
        }

        $scope.deleteInstallment=function(deleteindex)
        {
            if ($scope.studentInfo[0].deletedpayment==undefined) {
                $scope.studentInfo[0]['deletedpayment']=[];
            }
        //console.log("deeleteindex " + deleteindex);
        var dindex = "" + deleteindex;
        //console.log("dindexdindex " + dindex);
        //console.log($scope.studentInfo[0]);
        //console.log("array "+$scope.studentInfo[0].deletedpayment);

        $scope.studentInfo[0].deletedpayment.push(angular.copy($scope.studentInfo[0].payment[dindex]));
        //  $scope.studentInfo[0].payment.splice(deleteindex,1);
        //   delete($scope.studentInfo[0].payment[dindex])
        var keys = Object.keys($scope.studentInfo[0].payment);
        var len = keys.length;
        //console.log("lenght "+len);
        var i=0
        for (i = deleteindex; i < len-1; i++) {
        // alert($scope.studentInfo[0].payment[""+i]);
        $scope.studentInfo[0].payment[""+i]=$scope.studentInfo[0].payment[""+(i+1)];
        }
        delete($scope.studentInfo[0].payment[""+i]);


        //  delete(studedata["_id"]);
        //deletedpayment
        $scope.studentInfo[0].NoOfInstallment=parseInt($scope.studentInfo[0].NoOfInstallment)-1;
        //console.log("delete change in installments");
        //console.log($scope.studentInfo[0]);
        };
        //$scope.studentInfo[0]['deletedpayment']={};




        $scope.getStudentsForAttendance = function (batchname) {

           /* var name = localStorage.batchname;
            $scope.batchname=localStorage.batchname;
            //console.log(name);*/
            var param=JSON.stringify({"batch":"true","batchname": batchname})
            //console.log(param);
            $scope.loading=true;
            $http.post("https://espl.in.net/accountsapi/getstudentslistforattendance",param)
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.studentList=data.studentList;
                    $scope.loading=false;
                    /*iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                        $scope.studentList={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

        
        $scope.getStudents = function () {

            var name = localStorage.batchname;
            $scope.batchname=localStorage.batchname;
            //console.log(name);
            var param=JSON.stringify({"batch":"true","batchname": name})
            //console.log(param);
            $scope.loading=true;
            $http.post("https://espl.in.net/accountsapi/getAdmittedStudentList",param)
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.studentList=data.studentList;
                    $scope.loading=false;
                    /*iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                        $scope.studentList={};
                    //iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

        

/*$scope.getSchools = function () {
            $http.post("https://espl.in.net/accountsapi/getSchoolsList")
                .success(function (data) {
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.schools=data.schooldata;
                        waitingDialog.hide();
                    } else {
                        waitingDialog.hide();
                    }
                }).error(function(err){ 
                });
        };*/

        $scope.update=function(schoolname){
/*            //console.log("hello");
            //console.log(localStorage.batchid);
            //console.log(schoolname);*/
            var userData = JSON.stringify({
            "schoolname" : schoolname.trim(),"batchid":localStorage.batchid});
            //console.log(userData);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getschoolstudlist",userData)
               .success(function (data) {
                $scope.loading = false;
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.studentList=data.studentList;
                    /*iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                        //console.log("ttttt");
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    //console.log("gshdg");
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });

       };
        

        $scope.saveStudentId = function (studentId) {
            //console.log(studentId);
            localStorage.studentId = studentId;
            $location.path('studentProfile');
        };

      $scope.getfeedata = function(productid){
            var productdata=JSON.stringify({"id":productid});
            $http.post("https://espl.in.net/accountsapi/getfeedata",productdata)
               .success(function (data) {
                    if (data.success == "true") {
                        $scope.studentList.fees=data.fees.fees;
                        $scope.studentList.tax=data.fees.tax;
                        $scope.studentList.product=data.fees.productname;
                        localStorage.feedata=productdata;
                       //$scope.studentList.otherfees=0;
                        //console.log(data);
                        //console.log(data.fees.fees);
                        //console.log(data.fees.tax);
                        //console.log(localStorage.feedata);
                   
                    } else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
            //getfeedata
           /* $scope.studentList.fees=data.fees[0].fees;
            $scope.studentList.tax=data.fees[0].tax;*/
            /*//console.log($scope.studentList);
            feedata= JSON.stringify({"branchname":$scope.studentList['Center'],"coursename":$scope.studentList['BoardName'],"batchname":$scope.studentList['Batch']});
          //console.log(feedata);
          $scope.loading = true;
            $http.post("http://localhost:5128/getstd",feedata)
               .success(function (data) {
                $scope.loading = false;
                    if (data.success == "true") {
                  
                     feeStructuredata=   {"city":localStorage.cityid,"board":$scope.studentList['BoardName'],"std":data.std}
                     localStorage.feedata=JSON.stringify({"data":feeStructuredata});
                     //console.log( localStorage.feedata);
                    
                    
                      $http.post("http://localhost:5128/getfeestructure",JSON.stringify(feeStructuredata))
               .success(function (data) {
                    if (data.success == "true") {
                        //console.log( "fees");
                        //console.log( data.fees[0].fees);
                        $scope.studentList.fees=data.fees[0].fees;
                        $scope.studentList.tax=data.fees[0].tax;
                   
                    } else {
                        //console.log("ttttt");
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })

                    } else {
                        //console.log("ttttt");
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })*/

            //data={"branchname":$scope.studentList['Center'],"BoardName":$scope.studentList['BoardName']}
           // localStorage.feedata=
        };


        $scope.editstudentflagstatus = false;
        $scope.editstudentflagstatus = function () {
            if($scope.editstudentflagstatus == true)
            {
                $scope.editstudentflagstatus = false;
            }else{
                $scope.editstudentflagstatus = true;
            }
        }

        $scope.validateName = function(name) {
            //console.log("in validateName");
            if (name === "") {
                $(this).addClass('has-error');
                iziToast.show({theme: 'dark',title: 'Error',message: 'Please Enter First Name!',position: 'bottomLeft',icon: 'fa fa-ban',progressBarColor: 'rgb(0, 255, 184)'
                });
                return;
            }else if(/^[A-Za-z]+$/.test(name)==false){
                iziToast.show({
                        theme: 'dark',
                        title: ':(',
                        message: 'I don`t think this is really a name(no spaces allowed)!',
                        position: 'bottomLeft',
                        icon: 'fa fa-ban',
                        progressBarColor: 'rgb(0, 255, 184)'
                    });
                    return;
            }
        }

        $scope.validateEmail = function(email) {
            //console.log("in validateEmail");
            if (email === "") {
                $(this).addClass('has-error');
                iziToast.show({theme: 'dark',title: 'Error',message: 'Please Enter Email Address!',position: 'bottomLeft',icon: 'fa fa-ban',progressBarColor: 'rgb(0, 255, 184)'
                });
                return;
            }else if(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(email)==false){
                iziToast.show({
                        theme: 'dark',
                        title: ':(',
                        message: 'Enter valid Email Address!',
                        position: 'bottomLeft',
                        icon: 'fa fa-ban',
                        progressBarColor: 'rgb(0, 255, 184)'
                    });
                    return;
            }
        }

        $scope.validateMobile = function(number) {
            //console.log("in validateMobile");
            if (number === "") {
                $(this).addClass('has-error');
                iziToast.show({theme: 'dark',title: 'Error',message: 'Please Enter Mobile Number!',position: 'bottomLeft',icon: 'fa fa-ban',progressBarColor: 'rgb(0, 255, 184)'
                });
                return;
            }else if(/^\d{10}$/.test(number)==false){
                iziToast.show({
                        theme: 'dark',
                        title: ':(',
                        message: 'Enter valid Mobile Number!',
                        position: 'bottomLeft',
                        icon: 'fa fa-ban',
                        progressBarColor: 'rgb(0, 255, 184)'
                    });
                    return;
            }
        }

        $scope.getUsertypes = function() {
            //console.log("get user types func");
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getusertypes")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.usertypes=data.usertypes;
                    } else {
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
        }

        $scope.admissionformpdf = function(name) {
            //console.log(name);
            url = "http://espl.in.net/pdf/"+name+"/admissionform.pdf";
            $window.open(url,'_blank');
        }

        $scope.paymentdetailspdf = function(name) {
            //console.log(name);
            url = "http://espl.in.net/pdf/"+name+"/paymentdetails.pdf";
            $window.open(url,'_blank');
        }

        $scope.tncpdf = function(name) {
            //console.log(name);
            url = "http://espl.in.net/pdf/"+name+"/TnC.pdf";
            $window.open(url,'_blank');
        }

        $scope.getTotalRollNumbers = function(batch)
        {
        	console.log(batch);
        	var param = JSON.stringify({"Batch":batch});
        	$http.post("https://espl.in.net/accountsapi/getTotalRollNumbers",param)
        	.success(function(data) {
        		if (data.success == "true") {
        			$scope.totalrollnobatch = data.totalcount;
        		}
        	})

			.error(function(err){

                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });
        }

        $scope.transferStudent = function()
        {
            console.log($scope.transferrollno);
            //console.log('In Transfer Student Function');
            //console.log('ID :'+$scope.studentInfo[0]._id);
            //console.log('old branch n batch  :'+$scope.studentInfo[0].Center +':'+$scope.studentInfo[0].Batch);
            //console.log('New branch n batch  :'+$scope.transfer.Center +':'+$scope.transfer.Batch);
            var param=JSON.stringify({
            "id":$scope.studentInfo[0]._id,
            "Center":$scope.transfer.Center,
            "Batch":$scope.transfer.Batch,
            "RollNo":$scope.transfer.RollNo });
            //console.log(param);

            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/transferStudent",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log('Successfully change');
                        $scope.getStudentInfo();
                         $('#transferModal').modal('hide');
                         iziToast.error({title: 'Error',message: 'Student Transfered Successfully!!!', position: 'bottomLeft'});
                    } else {
                    iziToast.error({title: 'Error',message: 'Unable to transfer student... try again', position: 'bottomLeft'});
                    }
                })

                .error(function(err){

                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });


        }

        $scope.getcoursesbycity = function () {
            $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
            //console.log($scope.loginData['cityid']);
            var param = JSON.stringify({'cityid':$scope.loginData['cityid']});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getcoursesbycity",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.allcourses = data.courses;
                    }
            })
                .error(function (err) {
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                })
        }

        $scope.uploadtestfile = function() {
            $scope.questionpaperlink = undefined;
            var uploadUrl = "https://espl.in.net/accountsapi/uploadquestionpaper";
            var file = $scope.dataFile;
            if (file != undefined) {
                var fd = new FormData();
                fd.append('file', file);


                //waitingDialog.show("...Please wait");
                $scope.loading = true;

                $http.post(uploadUrl, fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .success(function(data) {
                    if (data.success == "true") {
                        //toastr.success("Successfully uploaded");
                        $scope.loading = false;
                        iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});
                        //console.log(data);
                        file = undefined;
                        $scope.dataFile = undefined;
                        $scope.questionpaperlink = data.qplink; 
                    } else {
                        //toastr.error(data.message);
                        file = undefined;
                        $scope.dataFile = undefined;
                        $scope.questionpaperlink = undefined;
                    }
                })
                .error(function() {
                    waitingDialog.hide();
                    //toastr.error("Something is wrong");
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                    file = undefined;
                });
            }
        };

            $scope.uploadtesttimetable = function() {
            $scope.testtimetablelink = undefined;
            var uploadUrl = "https://espl.in.net/accountsapi/uploadTimetable";
            var file = $scope.timetablePDF;
            if (file != undefined) {
                var fd = new FormData();
                fd.append('file', file);


                //waitingDialog.show("...Please wait");
                $scope.loading = true;

                $http.post(uploadUrl, fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .success(function(data) {
                    if (data.success == "true") {
                        //toastr.success("Successfully uploaded");
                        $scope.loading = false;
                        iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});
                        //console.log(data);
                        file = undefined;
                        $scope.timetablePDF = undefined;
                        $scope.testtimetablelink = data.ttlink; 
                    } else {
                        //toastr.error(data.message);
                        file = undefined;
                        $scope.timetablePDF = undefined;
                        $scope.testtimetablelink = undefined;
                    }
                })
                .error(function() {
                    waitingDialog.hide();
                    //toastr.error("Something is wrong");
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                    file = undefined;
                });
            }
        };


            $scope.uploadtesttimetableportion = function() {
            $scope.testtimetableportionlink = undefined;
            var uploadUrl = "https://espl.in.net/accountsapi/uploadTimetableportion";
            var file = $scope.portionPDF;
            if (file != undefined) {
                var fd = new FormData();
                fd.append('file', file);


                //waitingDialog.show("...Please wait");
                $scope.loading = true;

                $http.post(uploadUrl, fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .success(function(data) {
                    if (data.success == "true") {
                        //toastr.success("Successfully uploaded");
                        $scope.loading = false;
                        iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});
                        //console.log(data);
                        file = undefined;
                        $scope.portionPDF = undefined;
                        //console.log("portion link");
                        //console.log(data.ttportion);
                        $scope.testtimetableportionlink = data.ttportion; 
                    } else {
                        //toastr.error(data.message);
                        file = undefined;
                        $scope.portionPDF = undefined;
                        $scope.testtimetableportionlink = undefined;
                    }
                })
                .error(function() {
                    waitingDialog.hide();
                    //toastr.error("Something is wrong");
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                    file = undefined;
                });
            }
        };

        


        $scope.uploadTimetable = function()
        {
        	//console.log($scope.testtimetablelink);
          //console.log($scope.testtimetableportionlink);



    if($scope.ttName == undefined || $scope.ttName == "")
    {
        iziToast.error({title: 'Error',message: "Please Enter Timetable Name ", position: 'bottomLeft'});
    }
    else if($scope.ttBatch == undefined || $scope.ttBatch == "")
    {
        iziToast.error({title: 'Error',message: "Please Select Batch!", position: 'bottomLeft'});
    }
    else if($scope.testtimetablelink == undefined || $scope.testtimetablelink=="")
    {
        iziToast.error({title: 'Error',message: "Please Select Timetable File To Upload!", position: 'bottomLeft'});
    }
    else if($scope.testtimetableportionlink == undefined || $scope.testtimetableportionlink == "")
    {
        iziToast.error({title: 'Error',message: "Please Select Timetable Portion File To Upload!", position: 'bottomLeft'});
    }
    else{
            var parameter = JSON.stringify({
            "timetablename":$scope.ttName,
            "batch": $scope.ttBatch,
            "timtable": $scope.testtimetablelink,
            "portion": $scope.testtimetableportionlink,
            "isDeleted":"false"
             
            });

            $http.post("https://espl.in.net/accountsapi/uploadTestTimetable",parameter)
            .success(function(data) {
            waitingDialog.hide();
            if (data.success == "true") {
                iziToast.success({title: 'Error',message: data.message, position: 'bottomLeft'});
               //toastr.success(data.message);
               $route.reload();

            }
            else{
                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                //toastr.error(data.message);
            }
            })
            .error(function(err) {
            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
            //toastr.error("Something went wrong! ");
            });
        }



          
            //var uploadUrl = "https://espl.in.net/accountsapi/uploadtimetable";
           /* var target="/upload/timetables";
            var fd = new FormData();
            fd.append("data", angular.toJson($scope.fdata));
            for (i=0; i<$scope.filesArray.length; i++) {
                fd.append("file"+i, $scope.filesArray[i]);
            };

            var config = { headers: {'Content-Type': undefined},
                           transformRequest: angular.identity
                         }
            return $http.post(target, fd, config);*/
        }

    /*$scope.uploadTimetable = function() {
    //console.log('in upload file');

    $scope.upload($scope.timetablePDF);
    $scope.upload($scope.portionPDF);
        
    };


    $scope.upload = function (file) {
        Upload.upload({
            url: 'http://espl.in.net/mt/upload/timetables/',
            data: {file: file}
        }).then(function (resp) {
            //console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function (resp) {
            //console.log('Error status: ' + resp.status);
        });
    };
*/
     /*$scope.uploadTimetable = function() {

            var ttfile = $scope.timetablePDF;
            var porfile = $scope.portionPDF
            var ttName = $scope.ttName;
            var uploadUrl = "https://espl.in.net/accountsapi/uploadtimetable";

           // waitingDialog.show("...Please Wait");
            var fd = new FormData();
            fd.append('ttName', ttName);
            fd.append('ttfile', ttfile);
            fd.append('porfile', porfile);

            //console.log('formdata'+fd);

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
                }
            })
            .error(function() {
                toastr.error("Something Went Wrong");
            });
        };*/

    

    $scope.uploadTest = function()
    {

    if($scope.coursesfortest == undefined || $scope.coursesfortest == "")
    {
        iziToast.error({title: 'Error',message: "Please Select Course First!", position: 'bottomLeft'});
    }
    else if($scope.standardfortest == undefined || $scope.standardfortest == "")
    {
        iziToast.error({title: 'Error',message: "Please Select Standard First!", position: 'bottomLeft'});
    }
    else if($scope.subjectfortest == undefined)
    {
        iziToast.error({title: 'Error',message: "Please Enter Subject Name!", position: 'bottomLeft'});
    }
    else if($scope.testnamefortest == undefined)
    {
        iziToast.error({title: 'Error',message: "Please Enter Test Name!", position: 'bottomLeft'});
    }
     else if($scope.questionpaperlink == undefined)
    {
        iziToast.error({title: 'Error',message: "Please Select File!", position: 'bottomLeft'});
    }
    else{
            var parameter = JSON.stringify({
            "testName":$scope.testnamefortest,
            "subjectName": $scope.subjectfortest,
            "standard": $scope.standardfortest,
            "course": $scope.coursesfortest,
            "pdfurl": $scope.questionpaperlink  
            });

            $http.post("https://espl.in.net/accountsapi/uploadTest",parameter)
            .success(function(data) {
            waitingDialog.hide();
            if (data.success == "true") {
                iziToast.success({title: 'Error',message: data.message, position: 'bottomLeft'});
               //toastr.success(data.message);
               $route.reload();

            }
            else{
                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                //toastr.error(data.message);
            }
            })
            .error(function(err) {
            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
            //toastr.error("Something went wrong! ");
            });
        }
    };

    $scope.deleteTest = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete This Test");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deletetest",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.getquestionpapers();
                    $route.reload();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }

    };


    $scope.gettesttimetable = function () {
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/gettesttimetable")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.ttlist=data.ttlist;
                    }
                    else{
                         $scope.ttlist={};
                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                //toastr.error(data.message);
                }
                })
                .error(function(err) {
                     $scope.ttlist={};
                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
            //toastr.error("Something went wrong! ");
                });
        }

    $scope.getquestionpapers = function () {
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getquestionpapers")
                .success(function (data) {
                    //console.log(data);
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.qplist=data.qplist;
                    }
                    else{
                iziToast.error({title: 'Error',message: "No Question Paper Found On Server!", position: 'bottomLeft'});
                //toastr.error(data.message);
                }
                })
                .error(function(err) {
                iziToast.error({title: 'Error',message: "post error", position: 'bottomLeft'});
            //toastr.error("Something went wrong! ");
                });
        }

        $scope.getquestionpaperforstudent = function(batch) {
            //console.log(batch);
            var formdata = JSON.stringify({"batch":batch});
            $http.post("https://espl.in.net/accountsapi/getquestionpaperforstudent",formdata)
                .success(function (data) {
                    if (data.success == "true") {
                        $scope.qplist2 = data.qplist;
                         //console.log($scope.qplist2);
                    }else{
                //iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                //toastr.error(data.message);
                $scope.qplist2 = "0";
                }
                })
                .error(function(err) {
                    $scope.qplist2 = "0";
                iziToast.error({title: 'Error',message: "Server Error!Please Contact Admin!", position: 'bottomLeft'});
            //toastr.error("Something went wrong! ");
                });
        }
});

riddlerApp.controller('staffController', function($scope,$http,$filter,$window,$location,$route) {
    //console.log('staff controller');
    $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
    //console.log($scope.loginData.staffname);
    //$scope.today = $filter('date')(new Date(),'dd-MM-yyyy');
    $scope.showeditables = localStorage.showeditables;
     $scope.loginAuth = function() {
        //console.log("in login auth");
             $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
             //console.log($scope.loginData);
            //$scope.loginData = localStorage.loginData;
            if($scope.loginData == undefined)
            {
                $location.path('/');
            }
        }

        $scope.markEmpAttendance = function()
        {
            console.log($scope.today);
            var empdata = JSON.parse($scope.staffd);
            var newdate = $scope.today.split("-").reverse().join("-");
            //var newdate = $scope.today;
            console.log('in markEmpAttendance');
            console.log(empdata._id);
            console.log($scope.sTime);
            console.log(newdate);


        if(empdata._id == undefined)
        {
            iziToast.error({title: 'Error',message: "Select Staff", position: 'bottomLeft'});

        }
        else if($scope.sTime == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Time", position: 'bottomLeft'});
        }
        else{

            var param=JSON.stringify({"id":empdata._id,"time":$scope.sTime,"date":newdate})
            $scope.loading=true;
            $http.post("https://espl.in.net/accountsapi/markEmpAttendance",param)
                .success(function (data) {
                    if (data.success == "true") {
                    $scope.loading=false;
                    console.log("success");
                    iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                    } else {
                    console.log("failed");
                    $scope.loading=false;
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });

        }
        };


//login logic
    $scope.setLoginFalse = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('loginData');
            localStorage.removeItem('paymentflag');

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };


$scope.getcurrentcitystaff = function(cityid)
    {
        //console.log(cityid);
        ////console.log("localStorage id"+localStorage.cityid);
        var param=JSON.stringify({"cityid": cityid})
        waitingDialog.show('...Please Wait ');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getCurrentCityName",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.currentCity=data.currentCity;
                        waitingDialog.hide();
                    } else {
                        waitingDialog.hide();
                    }
                }).error(function(err){ 
                });

    };

 $scope.days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    $scope.getTodaysTime=function (){
        //console.log('Fetching Network date');
        $http.post("https://espl.in.net/accountsapi/getTodaysDate")
                        .success(function (data) {
                            if (data.success == "true") {  
                                //console.log(data);  
                                //console.log(data.todate);
                                $scope.today=data.todate;
                                //console.log($scope.today);
                            } else {
                                iziToast.error({title: 'Error',message: "Unable To Fetch Network Time", position: 'bottomLeft'});
                            }
                        }).error(function(err){
                            iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                        });

    };

    $scope.applyleave=function(staffid,stafffname,staffmname,stafflname,staffmobile)
    {
        var param=JSON.stringify({"staffid": staffid,"staffname": stafffname+" "+staffmname+" "+stafflname,"staffmobile":staffmobile,"fromDate":$scope.fdate,"toDate":$scope.tdate,"totalDays":$scope.totaldays,"reason":$scope.reason});
        $http.post("https://espl.in.net/accountsapi/addApplyleave",param)
            .success(function (data) {
                if (data.success == 'true') {
                    iziToast.error({title: 'Success',message: data.message, position: 'bottomLeft'});
                    $('.modal-backdrop').remove();
                    $('.modal').remove();
                    $route.reload();
                } else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                }
            }).error(function(err){
                iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
    }


    $scope.selectallfun=function(){
        
        for (var i = 0; i < $scope.stafflist.daysavailable.length; i++) {
            if ($scope.stafflist.daysavailable[i]=="Select All") {
                $scope.stafflist.daysavailable=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            }
            
        }
        
    };

     $scope.deletepaymententry=function(deleteindex)
        {

          $scope.staffInfo[0].salarydetails.contractlist.splice(deleteindex, 1);  

 
/*            //console.log("deeleteindex " + deleteindex);
            var dindex = "" + deleteindex;
            //console.log("dindexdindex " + dindex);
            //console.log($scope.staffInfo[0]);            
          var keys = Object.keys($scope.staffInfo[0].salarydetails.contractlist);
var len = keys.length;
//console.log("lenght "+len);
var i=0
             for (i = deleteindex; i < len-1; i++) {
      $scope.staffInfo[0].salarydetails.contractlist[""+i]=$scope.staffInfo[0].salarydetails.contractlist[""+(i+1)];
  }
  delete($scope.staffInfo[0].salarydetails.contractlist[""+i]);*/
        };

    $scope.reloadstaffPage=function()
    {
        //$('#myModal').modal('hide');
                $scope.getStaffInfo();
                //console.log("reloading Page");
                
                  setTimeout( function(){$route.reload();}  , 1000);
        //$route.reload();
    };

    $scope.getStaffInfo = function () {

            var param=JSON.stringify({"id": localStorage.staffId})

            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getStaffInfo",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.staffInfo = data.staffData;
                    $scope.batchName = data.batch;
                    $scope.paymentflag = localStorage.paymentflag;
                    //console.log($scope.staffInfo);
                    /*iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});*/
                    } else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })

                .error(function(err){

                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });

        };
        $scope.current={};
       // $scope.contractlist=[];
      /*  $scope.addnewcontract = function () {
          //console.log($scope.current);
          //console.log($scope.contractlist);
          if($scope.contractlist==undefined)
          {
            $scope.contractlist=[];
          }

          $scope.contractlist.push($scope.current);
          //console.log($scope.contractlist);
          $scope.current={};            
        };
        $scope.updatecontract = function () {
          //console.log($scope.current);
          //console.log($scope.staffInfo);

          $scope.staffInfo[0].salarydetails.contractlist.push($scope.current);
          $scope.current={};            
        };

        $scope.changemode=function(mode)
        {
          //$scope.salarydetails={};
          $scope.mode=mode;
          //console.log($scope.mode);

        }*/
         $scope.updatecontract = function () {
          //console.log($scope.current);
          //console.log($scope.staffInfo);

            if($scope.current.course == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Course", position: 'bottomLeft'});

        }
        else if($scope.current.std == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Standard", position: 'bottomLeft'});

        }
        else if($scope.current.rate == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Rate", position: 'bottomLeft'});
        }
        else{
            $scope.staffInfo[0].salarydetails.contractlist.push($scope.current);
            $scope.current={};  

        }

     };
        $scope.newValue = function(gender) {
            stafflist.gender=gender;
        }

         $scope.changemode=function(mode)
        {
          //$scope.salarydetails={};
          if($scope.staffInfo[0].salarydetails.length==undefined)
          {
            $scope.staffInfo[0].salarydetails.mode=mode;
            if($scope.staffInfo[0].salarydetails.mode=="Contract")
            {
              $scope.staffInfo[0].salarydetails.contractlist=[];
            }
          }
          else
          {
            if($scope.staffInfo[0].salarydetails.mode=="Salary")  
            {
              if($scope.staffInfo[0].salarydetails.contractlist!=undefined)
                {delete($scope.staffInfo[0].salarydetails.contractlist);}
              
            }
            if($scope.staffInfo[0].salarydetails.mode=="Contract")
            {
              if($scope.staffInfo[0].salarydetails.permonthsalary!=undefined)
              {delete($scope.staffInfo[0].salarydetails.permonthsalary);}
              
            }

          }
          //$scope.staffInfo[0].salarydetails.mode=mode;
          //console.log($scope.staffInfo[0].salarydetails.mode);
          
        }

        $scope.editsalarydetails=function()
    {
      //console.log("editsalarydetails");
      staffdata=$scope.staffInfo[0];
      var id=$scope.staffInfo[0]["_id"];
    //  //console.log(staffdata.salarydetails);
    /*  if(staffdata.salarydetails.length==undefined)
      {    
        //console.log("in if condition");
        staffdata.salarydetails.mode=$scope.mode;
        if(staffdata.salarydetails.mode=="Salary")
        {
          staffdata.salarydetails.permonthsalary=$scope.permonthsalary;
        }
        if(staffdata.salarydetails.mode=="Contract")
        {
          staffdata.salarydetails.contractlist=$scope.contractlist;
        }
        //staffdata.salarydetails=
      }*/
      //console.log(staffdata);
        delete(staffdata["_id"]);

        //console.log(staffdata);
        //console.log(id);
        var param=JSON.stringify(angular.toJson({"id": id,"data":staffdata}));
        //console.log(param);
        $scope.loading = true;
         $http.post("https://espl.in.net/accountsapi/editstaffinfo",param)
                    .success(function (data) {
                        $scope.loading = false;
                        if (data.success == "true") {
                            $scope.staffInfo=data.staffdata;  
                        } else {
                            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                        }
                    }).error(function(err){
                        iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                    });
    }  

         $scope.getTeachertimetable = function () {
            var cityid=$scope.staffInfo[0].cityid;
            //console.log("city id of teacher" + cityid);
            var param=JSON.stringify({"teacherid": localStorage.staffId,"cityid":cityid});

            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getteachertimetable",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.timetable = data.timetable;
                    //console.log(data);
                    //console.log($scope.timetable);
                    } else {
                         $scope.timetable={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })

                .error(function(err){

                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });

        };


        $scope.getStaffAttendancedetails = function () {

            var param=JSON.stringify({"id": localStorage.staffId})

            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getstaffattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.staffAttendanceInfo = data.lectures;
                    //console.log(data);
                    //console.log($scope.staffAttendanceInfo);
                    } else {
                         $scope.staffAttendanceInfo={};
                    //iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })

                .error(function(err){

                   // iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });

        };

         $scope.getEmployeeAttendancedetails = function () {

//console.log("get emplyee attendance details called");
            var param=JSON.stringify({"id": localStorage.staffId})

            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getemployeeattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.empAttendanceInfo = data.lectures;
                    //console.log(data);
                    //console.log($scope.empAttendanceInfo);
                    } else {
                         $scope.empAttendanceInfo={};
                    //iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })

                .error(function(err){

                   // iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });

        };

        $scope.getEmpAttendance = function()
        {
            var param=JSON.stringify({"id": localStorage.staffId})

            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getempattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.inOutTime = data.inout;
                    } else {
                        $scope.loading = false;
                        $scope.inOutTime={};
                    }
                })
                .error(function(err){
                   // iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

        $scope.getstaffRfidattendance = function()
        {
            var param=JSON.stringify({"staffid": localStorage.staffId})

            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getstaffRfidattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.inOutTime = data.attendance;
                    console.log($scope.inOutTime);
                    
                    } else {
                        $scope.loading = false;
                        $scope.inOutTime={};
                    }
                })
                .error(function(err){
                   // iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };

        $scope.getstaffpayment = function () {

            var param=JSON.stringify({"id": localStorage.staffId})

            //console.log(param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/summarypayment",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    $scope.payment = data.payment;
                    $scope.mode=data.mode;
                    //console.log(data);
                    //console.log("payment details");
                    } else {
                         $scope.payment={};
                         $scope.mode="";
                 //   iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })

                .error(function(err){

                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});

                });

        };

        $scope.saveStaffId = function (staffId) {
            //console.log(staffId);
            localStorage.staffId = staffId;
            $location.path('staffProfile');
        };
        $scope.calculateDuration = function () {
        var startTime=moment($scope.startTime, "HH:mm a");
        var endTime=moment($scope.endTime, "HH:mm a");
        var duration = moment.duration(endTime.diff(startTime));
        var hours = parseInt(duration.asHours());
        var minutes = parseInt(duration.asMinutes())-hours*60+(hours*60);
        $scope.totallectureminutes = minutes;

        $scope.staffd = JSON.parse($scope.staffd);
        $scope.staffname = $scope.staffd.fname + " " + $scope.staffd.lname;
        $scope.staffid = $scope.staffd._id;
        /*alert (minutes+' minutes.');*/
    }

    $scope.saveAttendance = function () {
       if($scope.staffid == undefined || $scope.staffid == "")
        {
            iziToast.error({title: 'Error',message: "Please select Staff", position: 'bottomLeft'});

        }
        else if($scope.batch == undefined || $scope.batch == "")
        {
            iziToast.error({title: 'Error',message: "Please Select Batch", position: 'bottomLeft'});

        }
        else if($scope.subject == undefined || $scope.subject == "")
        {
            iziToast.error({title: 'Error',message: "Please Select Subject", position: 'bottomLeft'});

        }
        else if($scope.topic == undefined || $scope.topic == "")
        {
            iziToast.error({title: 'Error',message: "Please Select Topic", position: 'bottomLeft'});

        }
        else if($scope.startTime == undefined || $scope.startTime == "")
        {
            iziToast.error({title: 'Error',message: "Please Select starttime", position: 'bottomLeft'});

        }
        else if($scope.endTime == undefined || $scope.endTime == "")
        {
            iziToast.error({title: 'Error',message: "Please Select endtime", position: 'bottomLeft'});

        }
        else if($scope.totallectureminutes<=0)
        {
            iziToast.error({title: 'Error',message: "Please Select Correct Time", position: 'bottomLeft'});
        }
        else
        {
            //console.log('save function');
      /*  var start= $scope.startTime;
        var end= $scope.endTime;
        var duration=moment.duration(end.diff(start));
        var hours = duration.asHours();*/
       /* //console.log("hours");
        //console.log(hours);*/
        var startTime=moment($scope.startTime, "HH:mm a");
    var endTime=moment($scope.endTime, "HH:mm a");
    var duration = moment.duration(endTime.diff(startTime));
    var hours = parseInt(duration.asHours());
    var minutes = parseInt(duration.asMinutes())-hours*60+(hours*60);
    alert (minutes+' minutes.');

      /*  var a = moment.duration(start, 'H');
        var b = moment.duration(end, 'H');

        var duration = b.subtract(a).minute(); */

        var param=JSON.stringify({
            "date":$scope.today,
            "staffid":$scope.staffid,
            "subject":$scope.subject,
            "topic":$scope.topic,
            "batch":$scope.batch,
            "startTime":$scope.startTime,
            "endTime":$scope.endTime,
            "duration":minutes,
            "isDeleted":"false"
        });

        //console.log(param);
        //$location.path('adminDashboard');
    $scope.loading = true;
    $http.post("https://espl.in.net/accountsapi/addstaffattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data.staff);
                        // var msg = " You conducted lecture of "+ $scope.subject+" from "+ start+" to "+ end +" on " +$scope.today+" . ";
                        var msg = "Greetings Teacher,\n"+data.staff.fname+" You conducted lecture of "+ $scope.subject+" from "+ $scope.startTime+" to "+ $scope.endTime +" at "+data.branch +" Branch of "+$scope.batch+" Batch on " +$scope.today+" . ";
                               var smsdata = JSON.stringify({"mobile":data.staff.mobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })

                        $('.modal-backdrop').remove();
                        $('.modal').remove();
                        $route.reload();
                 iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                waitingDialog.hide();
            } else {
                waitingDialog.hide();
            }
        }).error(function(err){ 
        });

        }
      

    };

$scope.saveEmployeeAttendance = function () {
    console.log($scope.today);
              //console.log('save function');
        var startTime=moment($scope.startTime, "HH:mm a");
        var endTime=moment($scope.endTime, "HH:mm a");
        var duration = moment.duration(endTime.diff(startTime));
        var hours = parseInt(duration.asHours());
        var minutes = parseInt(duration.asMinutes())-hours*60+(hours*60);
        /*alert (minutes+' minutes.');*/

        var param=JSON.stringify({
            "date":$scope.today,
            "staffid":$scope.staffid,
            "branch":$scope.branch,
            "startTime":$scope.startTime,
            "endTime":$scope.endTime,
            "duration":minutes
        });

        //console.log(param);
        //$location.path('adminDashboard');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/addemployeeattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        var msg = " You conducted lecture of "+ $scope.subject+" from "+ start+" to "+ end +" on " +$scope.today+" . ";
                         var smsdata = JSON.stringify({"mobile":data.staff.mobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
                        //console.log("Successfully added");
                        // var msg = " You conducted lecture of "+ $scope.subject+" from "+ start+" to "+ end +" on " +$scope.today+" . ";
                      /*  var msg = data.staff.fname+" You conducted lecture of "+ $scope.subject+" from "+ $scope.startTime+" to "+ $scope.endTime +" of "+$scope.batch+" Batch on " +$scope.today+" . ";
                                $http.get('http://msg.msgclub.net/rest/services/sendSMS/sendGroupSms?AUTH_KEY=d47cccfbcc9269f165cc8718bd82a2c&message='+msg+'&senderId=MTEDUC&routeId=1&mobileNos='+data.staff.mobile+'&smsContentType=english')
                        .success(function (data) {
                            if (data.responseCode == "3001") {
                                
                                 iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                waitingDialog.hide();
                            } else {
                                waitingDialog.hide();
                            }
                        }).error(function(err){ 
                        });*/
                        $('.modal-backdrop').remove();
                        $('.modal').remove();
                        $route.reload();
                 iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                waitingDialog.hide();
            } else {
                waitingDialog.hide();
            }
        }).error(function(err){ 
        });

        }
      
    $scope.totallectureminutes = "00:00 am";
 
$scope.saveattendanceindex = function(updateindex){
    $scope.updateindex=updateindex;
    //console.log($scope.updateindex);
    $scope.updatedata=$scope.staffAttendanceInfo[updateindex];
    //console.log($scope.updatedata);
}

$scope.saveemployeeattendanceindex = function(updateindex){
    $scope.updateindex=updateindex;
    //console.log($scope.updateindex);
    $scope.employeedata=$scope.empAttendanceInfo[updateindex];
    //console.log($scope.employeedata);
}


   $scope.saveupdatedAttendance=function(){
    ////console.log(updateindex);
    //console.log($scope.updatedata);
        var startTime=moment($scope.updatedata.startTime, "HH:mm a");
        var endTime=moment($scope.updatedata.endTime, "HH:mm a");
        var duration = moment.duration(endTime.diff(startTime));
        var hours = parseInt(duration.asHours());
        var minutes = parseInt(duration.asMinutes())-hours*60+(hours*60);
        staffid = localStorage.staffId;

       /* $scope.staffd = JSON.parse($scope.staffd);
        $scope.staffname = $scope.staffd.fname + " " + $scope.staffd.lname;
        $scope.staffid = $scope.staffd._id;
        */
        //console.log(staffid);
        //console.log($scope.updatedata.date);
        var param=JSON.stringify({
            "date":$scope.updatedata.date,
            "subject":$scope.updatedata.subject,
            "topic":$scope.updatedata.topic,
            "batch":$scope.updatedata.batch,
            "startTime":$scope.updatedata.startTime,
            "endTime":$scope.updatedata.endTime,
            "Id":$scope.updatedata._id,
            "duration":minutes
        });

        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/updatestaffattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    //console.log("success");
                    //waitingDialog.hide();
                    $('.modal-backdrop').remove();
                    $('.modal').remove();
                    //$location.path('createSchedule');
                    $route.reload();
                    
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    } 

    $scope.saveemployeeupdatedAttendance=function(){
    ////console.log(updateindex);
    //console.log($scope.employeedata);
        var startTime=moment($scope.employeedata.startTime, "HH:mm a");
        var endTime=moment($scope.employeedata.endTime, "HH:mm a");
        var duration = moment.duration(endTime.diff(startTime));
        var hours = parseInt(duration.asHours());
        var minutes = parseInt(duration.asMinutes())-hours*60+(hours*60);
       staffid = localStorage.staffId;

       /* $scope.staffd = JSON.parse($scope.staffd);
        $scope.staffname = $scope.staffd.fname + " " + $scope.staffd.lname;
        $scope.staffid = $scope.staffd._id;
        */
        ////console.log(staffid);
        //console.log($scope.employeedata.date);
        var param=JSON.stringify({
            "date":$scope.employeedata.date,
            "staffid":staffid,
            "branch":$scope.employeedata.branch,
            "startTime":$scope.employeedata.startTime,
            "endTime":$scope.employeedata.endTime,
            "Id":$scope.employeedata._id,
            "duration":minutes
        });

        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/updateemployeeattendance",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    //console.log("success");
                    //waitingDialog.hide();
                    $('.modal-backdrop').remove();
                    $('.modal').remove();
                    //$location.path('createSchedule');
                    $route.reload();
                    
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    } 

    $scope.getStaffList = function () 
      {
        cityid = localStorage.cityid;
        var param=JSON.stringify({"cityid": cityid})        
        //console.log('city stafflist :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getstafflistall",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.staffs=data.stafflist;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };


    $scope.getEmployeeList = function () 
      {
        cityid = localStorage.cityid;
        var param=JSON.stringify({"cityid": cityid})        
        //console.log('city stafflist :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getemployeelist",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.emp=data.stafflist;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };

        $scope.getBatchforStaffAttendance =function ()
        {
        cityid = localStorage.cityid;
        var sab = JSON.parse(localStorage.loginData);
        //console.log(sab);
        //console.log(sab.branchid);
        if (localStorage.usertype=="1") {
            //console.log("branchadmin");
            branchid = sab.branchid;
        var param=JSON.stringify({"cityid": cityid,"branchid": branchid});  
        }
        else
        {
            //console.log("superadmin");
            var param=JSON.stringify({"cityid": cityid});
        }       
        //console.log('city batches :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getBatch",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches=data.batch;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });

        };

$scope.getBranchforStaffAttendance =function ()
        {
            //console.log("in branch staff attendance");
        cityid = localStorage.cityid;
        var param=JSON.stringify({"cityid": cityid})        
        //console.log('city branches :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getallbranches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.branches = data.branches;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });


        };

    $scope.getSubjects = function (batchname) 
      {

        $scope.topic=undefined;
        $scope.subject=undefined;
            var param=JSON.stringify({"batch": batchname})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getsubjectforbatches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.subjects=data.subjects;
                        $scope.topics={};
                    } else {
                      $scope.topics={};
                      $scope.subjects={};
                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };


        $scope.getTopics = function (batchname,subj) 
      {
            var param=JSON.stringify({"batch": batchname,"subject":subj})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/gettopicsforsubject",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.topics=data.topics;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };

         $scope.loggedIn = localStorage.loggedIn;

         $scope.getStaffDetails = function () {
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getBranchStaffList")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);

                        $scope.staff=data.staffdata;
                        waitingDialog.hide();
                    } else {
                        waitingDialog.hide();
                    }
                }).error(function(err){ 
                });
        };


        $scope.editStaffProfileStatus =function(){
$scope.editstaffflagstatus=false;
};


$scope.submitStaffProfile=function()
{

if($scope.staffInfo[0].dob == undefined || $scope.staffInfo[0].dob == "")
        {
            iziToast.error({title: 'Error',message: "Enter Date of Birth", position: 'bottomLeft'});
        }
       else if($scope.staffInfo[0].gender == undefined || $scope.staffInfo[0].gender == "")
        {
            iziToast.error({title: 'Error',message: "Select Gender", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].mobile == undefined || $scope.staffInfo[0].mobile == "")
        {
            iziToast.error({title: 'Error',message: "Enter Mobile Number", position: 'bottomLeft'});
        }
       else if($scope.staffInfo[0].mobile.toString().length != 10)
        {
            iziToast.error({title: 'Error',message: "Enter 10 digit Valid Student Mobile", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].email == undefined || $scope.staffInfo[0].email == "")
        {
            iziToast.error({title: 'Error',message: "Enter staff Email", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].bg == undefined || $scope.staffInfo[0].bg == "")
        {
            iziToast.error({title: 'Error',message: "Enter Blood Group", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].email.indexOf("@") < 1 || $scope.staffInfo[0].email.lastIndexOf(".") < $scope.staffInfo[0].email.indexOf("@") || $scope.staffInfo[0].email.lastIndexOf(".") + 2 > $scope.staffInfo[0].email.length)
        {
            iziToast.error({title: 'Error',message: "Enter valid Email Address", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].joindate == undefined || $scope.staffInfo[0].joindate == "")
        {
            iziToast.error({title: 'Error',message: "Enter Date of Joining", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].bank == undefined || $scope.staffInfo[0].bank == "")
        {
            iziToast.error({title: 'Error',message: "Enter Bank Account Number", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].ifsc == undefined || $scope.staffInfo[0].ifsc == "")
        {
            iziToast.error({title: 'Error',message: "Enter Bank IFSC Code", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].bankname == undefined || $scope.staffInfo[0].bankname == "")
        {
            iziToast.error({title: 'Error',message: "Enter Bank Name", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].pan == undefined || $scope.staffInfo[0].pan == "")
        {
            iziToast.error({title: 'Error',message: "Enter Pan Number", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].start == undefined || $scope.staffInfo[0].start == "")
        {
            iziToast.error({title: 'Error',message: "Enter Start Time", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].end == undefined || $scope.staffInfo[0].end == "")
        {
            iziToast.error({title: 'Error',message: "Enter End Time", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].bankbranch == undefined || $scope.staffInfo[0].bankbranch == "")
        {
            iziToast.error({title: 'Error',message: "Enter Bank Branch Name", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].accountname == undefined || $scope.staffInfo[0].accountname == "")
        {
            iziToast.error({title: 'Error',message: "Enter Account Holder Name", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].designation == undefined || $scope.staffInfo[0].designation == "")
        {
            iziToast.error({title: 'Error',message: "Enter Designation", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].aadhar == undefined && $scope.staffInfo[0].aadhar !=/[0-9]{12}/)
        {
            iziToast.error({title: 'Error',message: "Enter Aadhar Number", position: 'bottomLeft'});
        }
        else if($scope.staffInfo[0].daysavailable.length == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Select Number of Days Available", position: 'bottomLeft'});
        }
      /*  else if($scope.staffInfo[0].stafftype == undefined || $scope.staffInfo[0].stafftype == "")
        {
            iziToast.error({title: 'Error',message: "Select Staff Type", position: 'bottomLeft'});
        }*/
        else{
    $scope.editstaffflagstatus=true;

   //console.log($scope.staffInfo[0]);


    staffdata=$scope.staffInfo[0];
    var idd=staffdata["_id"];
    //console.log("datsdj");
    //console.log(idd);
    delete(staffdata["_id"]);
    //console.log(staffdata);
    var param=JSON.stringify(angular.toJson({"id": idd,"data":staffdata}));
    //console.log(param);
    $scope.loading = true;
     $http.post("https://espl.in.net/accountsapi/editstaffinfo",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        $scope.staffInfo=data.staffdata;
                        
                        
                       
                    } else {
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
   
};
};

$scope.insertStaff = function (id) {    
         if($scope.stafflist.gender == undefined)
        {
            iziToast.error({title: 'Error',message: "Please Select Gender", position: 'bottomLeft'});

        }
        else if($scope.stafflist.stafftype == undefined || $scope.stafflist.stafftype == "")
        {
            iziToast.error({title: 'Error',message: "Please Select Staff Type", position: 'bottomLeft'});

        }
        else if($scope.stafflist.designation == undefined || $scope.stafflist.designation == "")
        {
            iziToast.error({title: 'Error',message: "Please Select Designation", position: 'bottomLeft'});

        }
        else if($scope.stafflist.stafftype == "Teacher" && $scope.stafflist.subject == undefined)
        {
             iziToast.error({title: 'Error',message: "Please Enter Subject", position: 'bottomLeft'});
        }
        else if($scope.stafflist.aadhar == undefined && $scope.stafflist.aadhar !=/[0-9]{12}/)
        {
            iziToast.error({title: 'Error',message: "Please Enter 12 digit aadhar number", position: 'bottomLeft'});

        }
        else
        {  

    //console.log('insert function');
     $scope.stafflist.isDeleted="false";
     $scope.stafflist.start= $scope.startTime;
    $scope.stafflist.end= $scope.endTime;
    $scope.salarydetails={};
    var staffData = JSON.stringify({"staffdata":$scope.stafflist});

   
        //waitingDialog.show();
        $scope.loading = true;
        waitingDialog.show("...Please Wait");
        $http.post("https://espl.in.net/accountsapi/addstaff", staffData)
            .success(
                function (data) {
                    $scope.loading = false;
                        if (data.success === "true") {
                             $window.location.href = "app/thankyou.html";
                                //console.log(staffData);
                           // waitingDialog.hide();
                            //toastr.success(data.message);
                            iziToast.show({
                                theme: 'dark',
                                title: 'Success',
                                message: data.message,
                                position: 'bottomLeft',
                                icon: 'fa fa-ban',
                                progressBarColor: 'rgb(0, 255, 184)'
                            });
                            waitingDialog.hide();
                            $location.path('staffList');
                        } else {
                        	waitingDialog.hide();
/*
                            waitingDialog.hide();
                            toastr.error(data.message);*/
                        }
                    });
        };

    }


    $scope.deleteStaff = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete This Staff");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deletestaff",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.getStaffDetails();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }
    };

    $scope.deleteattendance = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete this attendance entry?");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deleteattendance",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    // $scope.getStaffDetails();
                    $route.reload();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');
        }
    };
});

riddlerApp.controller('userController', function($scope,$http,$window) 
{
    //console.log('in userController');
});

riddlerApp.controller('rfidController', function($scope,$http,$window) 
{
    //console.log('in rfidController]');
    $scope.getAllBatchesRfid=function()
    {
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBatches")
                .success(function (data) {
                    //console.log(data);
                    $scope.loading = false;
                    if (data.success == "true") {
                        $scope.batches=data.batches;
                        //console.log($scope.batches);
                    } else {
                    }
                }).error(function(err){ 
                });
    };

    $scope.getAllStaffRfid=function()
    {
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getStaffListRfid")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        $scope.staffList=data.staffdata;
                        console.log($scope.staffList);
                    } else {
                        $scope.loading = false;
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.loading = false;
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };

    $scope.assignStaffRfid = function()
    {

        if($scope.staff_id == undefined || $scope.staff_id == "")
        {
            iziToast.error({title: 'Error',message: "Select Staff", position: 'bottomLeft'});
        }
        else if($scope.rfid == undefined || $scope.rfid == "")
        {
            iziToast.error({title: 'Error',message: "TAP RFID TAG", position: 'bottomLeft'});
        }
        else{
        var param=JSON.stringify({"staffid": $scope.staff_id,"cardid":$scope.rfid})
        console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/assignrfidforstaff",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});  
                    $scope.staff_id={};
                    $scope.rfid="";

                    } else {
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
                 }
    };

    $scope.getRfidList = function(){

        var param = JSON.stringify({"batch" :$scope.batchName});
        //console.log(param);

        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getassignedrfid",param)
                .success(function (data) {
                    //console.log(data);
                    $scope.loading = false;
                    if (data.success == "true") {
                       $scope.rfidList=data.rfidlist;
                        //console.log($scope.rfidList);
                    } else {
                    }
                }).error(function(err){ 
                });
    };


    $scope.saveRfidList = function()
    {

        var param = JSON.parse( angular.toJson({"rfidlist" :$scope.rfidList}));
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/updaterfidlist",param)
                .success(function (data) {
                    //console.log(data);
                    $scope.loading = false;
                    if (data.success == "true") {
                        $scope.getRfidList();
                       
                    } else {
                    }
                }).error(function(err){ 
                });
    };

    $scope.createRfidList = function()
    {
        //console.log('creating list');
        var cardList = [];
        var start = parseInt($scope.startRoll);
        var end = parseInt($scope.endRoll);
        for (var i = start; i <= end ; i++) 
        {
            cardList.push({"batchname":$scope.batchName,"RollNo":i,"cardId":""});
        }
        $scope.cardList = cardList;
        //console.log(cardList);
        
    };
    $scope.insertRfidList = function()
    {

        var param = JSON.parse( angular.toJson({"cardlist" :$scope.cardList}));
        //console.log(param);

         $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/assignrfid",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                    	iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                    	$location.path('assignRfid');
                    } else {
                    	iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){ 
                	 iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });

    };
    
});



riddlerApp.controller('feesController', function($scope,$http,$window,$location,$route) 
{
    $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
    //console.log($scope.loginData);

    //console.log('In Fees Controller');
     $scope.loginAuth = function() {
        //console.log("in login auth");
             $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
             //console.log($scope.loginData);
           // $scope.loginData = localStorage.loginData;
            if($scope.loginData == undefined)
            {
                $location.path('/');
            }
        }

    $scope.getCurrentCityName = function()
    {
        ////console.log("localStorage id"+localStorage.cityid);
        var param=JSON.stringify({"cityid": localStorage.cityid})
        waitingDialog.show('...Please Wait ');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getCurrentCityName",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.currentCity=data.currentCity;
                        waitingDialog.hide();
                    } else {
                        waitingDialog.hide();
                    }
                }).error(function(err){ 
                });

    };
    $scope.getCount = function(){
        waitingDialog.show('...Please Wait ');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/feereportcount")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.count=data.addmissioncount;
                        waitingDialog.hide();
                    } else {
                        waitingDialog.hide();
                    }
                }).error(function(err){ 
                });
        };

    $scope.feesCalculate = function () {
    var feesdata=localStorage.feedata;
    //console.log("in fee calculate");
    //console.log("fee calculate"+ feesdata);
   /*  param=JSON.stringify({"data":feesdata});
      //console.log(feesdata);*/
      $scope.loading = true;
    $http.post("https://espl.in.net/accountsapi/FeeStructure",feesdata)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.data=data;
                        $scope.fee=data.fee_structure;


                    } else {
                    }
                }).error(function(err){
                    //toastr.error("Something Went Wrong!");
                });
    
    
    };

    $scope.discountCalculate = function (productid='') {
   var feesdata=JSON.stringify({"id":productid});
    //console.log(feesdata);
   
      $scope.loading = true;
    $http.post("https://espl.in.net/accountsapi/FeeStructure",feesdata)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.data=data;
                        $scope.fee=data.fee_structure;
                        $scope.viewDiscounts=true;


                    } else {
                    }
                }).error(function(err){
                    //toastr.error("Something Went Wrong!");
                });
    
    
    };

    $scope.exportDiscount=function(name = '')
    {
        //console.log('in print discount');
        html2canvas(document.getElementById(name), {
            onrendered: function (canvas) {
                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                        width: 510
                    }]
                };
                //console.log('printing :'+name);
                pdfMake.createPdf(docDefinition).download(name + ".pdf");
            }
        });
    };
    

     $scope.insertnewstructure = function () {
        //console.log('in fun');
        var param = JSON.stringify({"data":$scope.fee})
        //console.log(param);
       $scope.loading = true;
    $http.post("https://espl.in.net/accountsapi/insertnewstructure",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                     iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});  
                     $scope.fee ={};
                      $('#addNewFeesModal').modal('hide');
                    } else {
                    }
                }).error(function(err){
                     iziToast.error({theme: 'dark',title:'Success',message: 'Error in app.js',position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});  
                });
    };

     $scope.getbranchesFee = function()
    {
        $scope.loading = true;
      $http.post("https://espl.in.net/accountsapi/getallbranches")
        .success(function(data){
           // toastr.success(data.message);
           $scope.loading = false;
           if(data.success == "true")
           {
            //console.log(data.branches);

           $scope.branches = data.branches;
       }
        })  
        .error(function(err){
        toastr.error("Something went wrong! Please try again...");
        }) 

      

    };

    $scope.getCitiesFee = function()
    {
        $scope.loading = true;
        $http.get("https://espl.in.net/accountsapi/getcities")
        .success(function(data){
            $scope.loading = false;
            if(data.success == "true")
            {
            $scope.cities = data.cities;
            //console.log($scope.cities);
            }
        })  
        .error(function(err){
            toastr.error("Something went wrong! Please try again...");
        }) 
    };


    $scope.getCenters = function (id='') {
        //console.log('In getCenters');
       if(id=='')
       {
        id=localStorage.cityid;
       }else{
        localStorage.cityid=id;
       }
       
        var param=JSON.stringify({"cityid": id})
        //console.log(param);
       $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getallbranches",param)
                .success(function (data) {
                    if (data.success == "true") {
                        $scope.loading = false;
                        //console.log(data.branches);
                        $scope.singleBranchResult = data.branches;
                        $scope.cityid=data.cityid;
                        $scope.boards={};
                        $scope.batches={};
                    } else {
                         $scope.cityid=data.cityid;
                         $scope.singleBranchResult = {};
                         $scope.boards={};
                         $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.singleBranchResult = {};
                    $scope.boards={};
                    $scope.batches={};
                    iziToast.error({title: 'Error',message: "Cannot Find Centers !", position: 'bottomLeft'});
                });
    };

    $scope.getBoard = function (branchname) {
        var param=JSON.stringify({"branchname": branchname})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBoard",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.boards=data.board;
                        $scope.batches={};
                       
                    } else {
                       
                        $scope.boards={};
                        $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    
                    $scope.boards={};
                        $scope.batches={};
                    iziToast.error({title: 'Error',message: "Cannot find Boards !", position: 'bottomLeft'});
                });
    };

    $scope.getproduct = function(board)
  {
    var param=JSON.stringify({"board":board,"city":localStorage.cityid});
     //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getfeestructure",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.products=data.fees;
                       
                    } else {
                        $scope.products={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.products={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
  };

  $scope.getBatch = function (branchname,board) {
     ////console.log("");
        //localStorage.resultid = id;
        var param=JSON.stringify({"branchname": branchname,"coursename":board})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBatch",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches=data.batch;
                       
                    } else {
                        $scope.batches={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.batches={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };

    $scope.getfeedata = function(productid){
            var productdata=JSON.stringify({"id":productid});
            $http.post("https://espl.in.net/accountsapi/getfeedata",productdata)
               .success(function (data) {
                    if (data.success == "true") {
                        //console.log('data from py'+data);
                        $scope.discount.fees=data.fees.fees;
                        $scope.discount.tax=data.fees.tax;
                        $scope.discount.product=data.fees.productname;
                        localStorage.feedata=productdata;
                        $scope.viewDiscounts=true;
                        ////console.log($scope.discount.fees);                   
                    } else {
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
        };


   $scope.getClassFee = function () {

         var param=JSON.stringify(localStorage.feedata);
       
        waitingDialog.show('...Please Wait ');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getclassfeetructure",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.result=data;
                        
                        waitingDialog.hide();


                    } else {
                        toastr.error(data.message);
                        waitingDialog.hide();

                    }
                }).error(function(err){
                  //  toastr.error("Something Went Wrong......!");
                });
    
    };

$scope.result={};
        $scope.getAllFees = function (board) {
        //console.log('board :'+board);
        //console.log('city :'+localStorage.cityid);
       localStorage.feeBoard=board;
/*       data={};
       data["board"]=board;
       data["city"]=localStorage.cityid;*/
       var param=JSON.stringify({"board":board,"city":localStorage.cityid})
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getfeestructure",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.result=data;
                        $scope.headBoard=localStorage.feeBoard;

                    } else {
                        $scope.result={};
                        $scope.loading = false;

                    }
                }).error(function(err){
                    $scope.result={};
                  //  toastr.error("Something Went Wrong......!");
                });
    
    };


    $scope.savedata={};
    $scope.saveData = function (id) {
        savedata1=$scope.savedata;
        savedata1["_id"]=id;

        $scope.savedata[id]['_id'] = id
        //console.log($scope.savedata[id]);
        if($scope.savedata[id] != undefined)

        {
    var param=JSON.stringify($scope.savedata[id]);
    //console.log(param);

        waitingDialog.show('Updating.....Please Wait');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/updatefeeinfo",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.result=data;
                        waitingDialog.hide();

                        setTimeout( function(){$scope.getAllFees(localStorage.feeBoard)}  , 1000);
                        //console.log('post update');
                        //localStorage.removeItem('feeBoard');
                    } else {
                         toastr.error(data.message);
                        waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong########!");
                    waitingDialog.hide();
                });
            }   
    };

    $scope.deleteFeeStructure = function(fee_id)
    {
        var flag = confirm("Do You Really Want Delete This Fee Structure");
        if (flag == true) 
        {
            var param=JSON.stringify({"fee_id": fee_id})
            //console.log('deleting fee  :'+param);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deletefeestructure",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $route.reload();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }

    };
});


riddlerApp.controller('testController',function($scope,$http,$route)
{

    $scope.alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                   'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
//console.log('In Test Controller');

    $scope.printTime = function(date)
    {
        var ndate=moment(date).format('hh:mm a');
        //console.log('Current Time  :'+$scope.currentTime);
        //console.log("Post Conversion :"+ndate);
    };

    $scope.convertTime = function()
    {
        $scope.convertedTime = moment($scope.Time).format('hh:mm a');
        //console.log('converted  :'+$scope.convertedTime);
    };

    $scope.getCitiesHT = function()
    {
        //console.log('in cities');
        $scope.loading = true;
        $http.get("https://espl.in.net/accountsapi/getcities")
        .success(function(data){
            //console.log(data);
            $scope.loading = false;
            $scope.cities = data.cities;
            })  
        .error(function(err){
            $scope.cities={};
      //  toastr.error("Something went wrong! Please try again...");
        })
    };

    $scope.getBranchesHT = function (id) {

        var param=JSON.stringify({"cityid": id})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getallbranches",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data.branches);
                        $scope.branches = data.branches;
                        $scope.batches={};
                    } else {
                         $scope.branches = {};
                         $scope.batches={};
                    }
                }).error(function(err){
                    $scope.branches = {};
                    $scope.batches={};
                });
    };

    $scope.getBatchesHT = function (id) {
        var param=JSON.stringify({"branchid": id})
        //console.log(param);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getcoursesnew",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.batches = data.courses;
                    } else {
                        $scope.batches = {};
                    }
                }).error(function(err){
                        $scope.batches = {};
                });
    };

    $scope.testFunction = function()
    {
        //console.log('this is test function');
    };

    $scope.getStudentsHT = function(batchname)
    {
        //console.log('this is list function  :'+batchname );
            var param=JSON.stringify({"batch":"true","batchname": batchname})
            //console.log(param);
            $scope.loading=true;
            $http.post("https://espl.in.net/accountsapi/getAdmittedStudentList",param)
                .success(function (data) {
                    
                    if (data.success == "true") {
                    //console.log(data);
                    $scope.studentList=data.studentList;
                    $scope.loading=false;
                    $scope.viewForm=true;
                    } else {
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                })
                .error(function(err){
                    $scope.loading=false;
                    $scope.studentList={};
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                });
    };

    $scope.generateHT= function()
    {

        $scope.generatedHT=true;
    };
/*    function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }*/
  $scope.sleep=function(milliseconds)
  {
    var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
      //console.log("After sleep");
      //console.log($scope.docDefinition);
  }

    $scope.exportHallTickets = function(){
        $scope.loading=true;
        var data=[];
         if(($scope.studentList.length%3)==0)
        {
            var count=$scope.studentList.length/3;

        }else{
            var count=parseInt($scope.studentList.length/3)+1;

        }
        //data.length=count

        for(var i=0;i<count;i++)
        {
            html2canvas(document.getElementById('block'+(i*3)), {
            onrendered: function (canvas) {
                var data1 = canvas.toDataURL();
                data.push(data1);
               // //console.log(data1); 
            }
            });
        }
        /*html2canvas(document.getElementById('block0'), {
            onrendered: function (canvas) {
                data1 = canvas.toDataURL();
                //console.log(data1); 
            }
        });


        html2canvas(document.getElementById('block3'), {
            onrendered: function (canvas) {
                data2 = canvas.toDataURL();   
                //console.log(data2);
            }
        });*/

       
        

            setTimeout(function() {
                var content1=[];
                for(var i=0;i<count;i++)
                {
                    content1.push({
                        image: data[i],
                        width: 510      
                    });
                }
                var docDefinition = {
                    content: content1
                };
                /*var docDefinition = {
                    content: [{
                        image: data1,
                        width: 510      
                    },
                    {
                        image: data2,
                        width: 510      
                    }]
                };*/
                ////console.log('outside    :' +data1);
                //console.log(docDefinition);
                pdfMake.createPdf(docDefinition).download($scope.batchname+ ".pdf");
                $scope.loading=false;
            }, 60000);
       
     };

    $scope.jsPDFTest2 = function()
    {

      var doc = new jsPDF();
      var pdfPart1 = jQuery('#block0');
      var pdfPart2 = jQuery("#block3");
      var pdfPart3 = jQuery("#block6");
      var specialElementHandlers = {
        '#loadVar': function(element, renderer) {
          return true;
        }
      };
      doc.fromHTML(pdfPart1.html() + pdfPart3.html() + pdfPart3.html(), 10, 10, {
        'width': 510,
        'elementHandlers': specialElementHandlers
      });
      doc.output('save', 'Download.pdf');
    };

     $scope.jspdfTest=function()
     {
        function generatePDF() {
        //window.scrollTo(0, 0);
        //$(window).scrollTop();

        var pdf = new jsPDF('p', 'pt', [580, 630]);

  
        html2canvas($("#block3")[0], {
            allowTaint: true,
            onrendered: function(canvas) {
                var ctx = canvas.getContext('2d');
                var imgData = canvas.toDataURL("image/png", 1.0);
                var htmlH = $("#block3").height() + 100;
                var width = canvas.width;
                var height = canvas.clientHeight;
                pdf.addPage(580, htmlH);
                pdf.addImage(imgData, 'PNG', 20, 20, (width - 40), (height));
            }
        });
        /*html2canvas($("#block6")[0], {
            allowTaint: true,
            onrendered: function(canvas) {
                var ctx = canvas.getContext('2d');
                var imgData = canvas.toDataURL("image/png", 1.0);
                var htmlH = $("#block6").height() + 100;
                var width = canvas.width;
                var height = canvas.clientHeight;
                pdf.addPage(580, htmlH);
                pdf.addImage(imgData, 'PNG', 20, 20, (width - 40), (height));
            }
        });*/
        setTimeout(function() {

            //jsPDF code to save file
            pdf.save('sample.pdf');

            //Generate BLOB object
            /*var blob = pdf.output("blob");

            //Getting URL of blob object
            var blobURL = URL.createObjectURL(blob);

            //Showing PDF generated in iFrame element
            var iframe = document.getElementById('sample-pdf');
            iframe.src = blobURL;

            //Setting download link
            var downloadLink = document.getElementById('pdf-download-link');
            downloadLink.href = blobURL;*/
        }, 2000);
    };
    generatePDF();
        /*var pdf = new jsPDF('p', 'pt', 'a4');
        pdf.addHTML($('#block0'), function() 
        {
        pdf.save('Test.pdf');
        });*/
     };

     $scope.exportBlock = function(name)
     {
        //console.log(name);
        html2canvas(document.getElementById(name), {
            onrendered: function (canvas) {
                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                        width: 510,
                        margin: [ 0, 25, 0, 0 ]
                    }]
                };
                pdfMake.createPdf(docDefinition).download(name + ".pdf");
            }
        });
     };

});

riddlerApp.controller('scheduleController', function($scope,$http,$window,$location,$route) 
{


	$scope.showsyllabuslist=true;
    $scope.showsyllabus = function()
    {
    	//console.log("in schedule controller");
    	$scope.showsyllabuslist=true;
      $scope.viewsyllabus = true;
     // $scope.showadssection = false;
     
    };

    $scope.countDashboard = function()
    {
        console.log("inside countDashboard");
        $scope.loading = true;

        $http.post("https://espl.in.net/accountsapi/countDashboard")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log(data);
                    $scope.dashCount = data.dashCount;                    
                } else {

                }
            }).error(function(err){
                console.log("server error");
            });
    }

     $scope.loginAuth = function() {
             //console.log("in login auth");
             $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
             //console.log($scope.loginData);
            //$scope.loginData = localStorage.loginData;
            if($scope.loginData == undefined)
            {
                $location.path('/');
            }
        }
    //console.log('in scheduleController');
    $scope.loggedIn = localStorage.loggedIn;
    $scope.loginData = JSON.parse(localStorage.getItem('loginData'));
    //console.log($scope.loginData);
    $scope.lecturecolor=["#FABF8F","#8DB4E2","#FFC000"]
   
    $scope.showeditables = localStorage.showeditables;

    $scope.schedules = {};

    $scope.mySplit = function(string, nb) {
    var array = string.split('-');
    return array[nb];
}

    $scope.export = function(name){
        html2canvas(document.getElementById(name),
        { 
            onrendered: function (canvas) 
            {

                var data = canvas.toDataURL();
                var docDefinition = {
                    pageOrientation: 'landscape',
                    pageSize: 'A4',
                    pageMargins: [ 180, 60, 40, 60 ],

                    content: [{
                        image: data,
                        width: 700,
                    }]
                };
                pdfMake.createPdf(docDefinition).download(name + ".pdf");
            }
        });
    }

    $scope.saveScheduleId = function(scheduleId)
    {
        localStorage.scheduleId = scheduleId;
    }

    $scope.toggleEditableYearlySchedule = function(){
        //console.log("in toggle editable yearly schedule function");
        if($scope.showEditableYearlySchedule == true)
        {
            $scope.showEditableYearlySchedule = false;   
        }else{
            $scope.showEditableYearlySchedule = true;
        }
    }

    $scope.callChangePath = function()
    {
        //console.log('sam');
       
    }
    $scope.getallbatches = function()
    {
        //console.log("in getall batches");
        var param ={};
        $http.post("https://espl.in.net/accountsapi/getBatch",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.batches=data.batch;
                    //console.log($scope.batches);
                    //console.log("success");
                    //waitingDialog.hide();

                    
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        ////console.log('sam');
       
    };

    $scope.editYearlySchedulebatch = function(){
        //console.log("in yearly schedule batch copy submit function");
        //console.log($scope.schedules);
        //var param = $scope.schedule;
        var param = JSON.parse( angular.toJson({"schedules" :$scope.schedules}));
        //waitingDialog.show('...Please Wait');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/editYearlySchedulebatch",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log("success");
                    //waitingDialog.hide();
                    $('.modal-backdrop').remove();
                    $('.modal').remove();
                    $location.path('createSchedule');
                  //  $route.reload();
                    
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    }

    $scope.submitYearlySchedule = function(){
        //console.log("in yearly schedule submit function");
        //console.log($scope.schedules);
        //var param = $scope.schedule;
        var param = JSON.parse( angular.toJson({"schedules" :$scope.schedules}));
        //waitingDialog.show('...Please Wait');
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/editYearlySchedule",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log("success");
                    //waitingDialog.hide();
                    $location.path('createSchedule');
                    
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    }

    $scope.getSchedules = function(id = ''){
        //waitingDialog.show('...Please Wait');
        if (id == '') {
            //console.log('in if of getSchedules');
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getSchedules")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.allschedules = data.schedules;
                    //console.log($scope.allschedules);
                    //waitingDialog.hide();
                } else {
                    //waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }else{
            //console.log("in else getSchedules");
            var id = JSON.stringify({"id":localStorage.scheduleId});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getSchedules",id)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $http.post("https://espl.in.net/accountsapi/getColors")
                        .success(function (data2){
                            if (data2.success == "true") {
                                $scope.scheduleColor = data2.color;
                                $scope.schedules = data.schedules;
                                //console.log($scope.schedules);
                                $location.path("viewSchedule");
                                ////console.log($scope.schedules);
                            }
                        });
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }
    };

    $scope.getdashschedule = function () {
        var formdata = JSON.stringify({"batchname":localStorage.batchname});
        ////console.log(formdata);

        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getdashschedule",formdata)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        $http.post("https://espl.in.net/accountsapi/getColors")
                        .success(function (data2){
                            if (data2.success == "true") {
                                $scope.scheduleColor = data2.color;
                                $scope.dashschedule = data.schedules;
                                $scope.batchName = localStorage.batchname;
                                ////console.log($scope.dashschedule);
                                ////console.log($scope.schedules);
                                //$location.path("viewSchedule");
                                ////console.log($scope.schedules);
                            }
                        });
                        ////console.log(data);
                    } else {
                        iziToast.error({title: 'Error',message: "No Schedule Available!!", position: 'bottomLeft'});
                    }
                }).error(function(err){
                    //console.log("server error");
                });
        }

 
    $scope.scheduleofbatch = [];

    $scope.createSchedule = function(){

        /*var datestart = new Date($scope.startDate);
        var dateend = new Date($scope.endDate);*/

        if ($scope.scheduleofbatch == undefined || $scope.scheduleofbatch == "") 
        {
            iziToast.error({title: 'Error',message: "Please Select Batch First", position: 'bottomLeft'}); 

        }    
        else if($scope.startDate == undefined)
        {
            iziToast.error({title: 'Error',message: "Select start date", position: 'bottomLeft'});

        }
        else if($scope.endDate == undefined)
        {
            iziToast.error({title: 'Error',message: "Select end date", position: 'bottomLeft'});

        } 
        /*else if ($scope.startDate > $scope.endDate) 
        {
            iziToast.error({title: 'Error',message: "End Date must come after Start Date", position: 'bottomLeft'});
            //iziToast.error({title: 'Error',message: $scope.startDate, position: 'bottomLeft'});

        }*/
        else 
        {
           
           //waitingDialog.show('...Please Wait');

            var scheduleDates = JSON.stringify({"startDate" : $scope.startDate,"endDate" : $scope.endDate,"batch":$scope.scheduleofbatch});
            //console.log(scheduleDates);
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/createschedule",scheduleDates)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $route.reload();
                       // sleep(2000);
                        //waitingDialog.hide();
                       setTimeout($scope.getSchedules,1000);
                    } else {
                        //waitingDialog.hide();
                    }
                }).error(function(err){
                    //console.log("server error");
                });
        }
       
    };

    $scope.deleteSchedule = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete This Schedule ");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deleteschedule",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.getSchedules();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }
    };

     $scope.addcolor = function(){
        //console.log(localStorage.bgccolor,$scope.colorfor);
        //waitingDialog.show('...Please Wait');
        var colorData = JSON.stringify({"color" : localStorage.bgccolor,"colorfor" : $scope.colorfor});
      $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/addColor",colorData)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $route.reload();
                    //$location.path('viewSchedule');
                   // //console.log(data);
                   // sleep(2000);
                   // waitingDialog.hide();
                 //  setTimeout($scope.getSchedules,1000);
                } else {
                    //waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    };

    // $scope.createTimetable = function() {
    //     var ttData = JSON.stringify({'ttCity': $scope.ttCity,'ttDate': $scope.ttDate});
    //     //console.log(ttData);
    //     $scope.loading = true;
    //     $http.post("https://espl.in.net/accountsapi/createtimetable",ttData)
    //                 .success(function (data) {
    //                     $scope.loading = false;
    //                     if (data.success == "true") {
    //                         //console.log(data);
    //                         $route.reload();
    //                         /*$scope.ttBatches=data.batch;*/
    //                     } else {
    //                         iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
    //                     }

    //                 }).error(function(err){
    //                     iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
    //                 });
    //     }

    $scope.newcreateTimetable = function() {
        if ($scope.ttCopy == undefined) {
            var ttData = JSON.stringify({'ttCity': $scope.ttCity,'ttDate': $scope.ttDate,'ttCopy': "noCopy"});
        }
        else
        {
            var ttData = JSON.stringify({'ttCity': $scope.ttCity,'ttDate': $scope.ttDate,'ttCopy': $scope.ttCopy});
        }
        console.log(ttData);
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/chktimetableexist",ttData)
                    .success(function (data) {
                        $scope.loading = false;
                        if (data.success == "true") {
                                          $http.post("https://espl.in.net/accountsapi/newcreatetimetable",ttData)
                                        .success(function (data) {
                                            $scope.loading = false;
                                            if (data.success == "true") {
                                                //console.log(data);
                                                $route.reload();
                                                /*$scope.ttBatches=data.batch;*/
                                            } else {
                                                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                                            }
                                        }).error(function(err){
                                            iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                                        });
                                      /*  //console.log(data);
                                        $route.reload();*/
                            /*$scope.ttBatches=data.batch;*/
                        } else {
                            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                        }
                    }).error(function(err){
                        iziToast.error({title: 'Error',message: "Something Went Wrongfg!", position: 'bottomLeft'});
                    });

  
        }

        $scope.getBType = function(test){
        //return ( typeof test);
        return typeof test;
    }


        $scope.deletesinglett = function (index,batchindex)
        {
            //console.log($scope.alltt[0].timetable[batchindex]['batchtimetable'][index]);
            $scope.alltt[0].timetable[batchindex]['batchtimetable'].splice(index,1);
      /*  $scope.allsyll[0].syllabus.subject.splice(localStorage.subjectindex, 1); 
        $scope.allsyll[0].syllabus=$scope.allsyll[0].syllabus;*/
        //overlap code
          $scope.teacherData = [];
        $scope.teacherData2 = [];
        //console.log("in daily timetable submit function");
        //console.log($scope.alltt);
        ////console.log($scope.teacherData);
        for(var i=0;i<$scope.alltt[0]['timetable'].length-1;i++)
        {
            for (var j = 0; j < $scope.alltt[0]['timetable'][i]['batchtimetable'].length; j++) {
            ////console.log(i);
            ////console.log($scope.alltt[0]['timetable'][i]['hours'][j]);
            ////console.log($scope.alltt[0]['timetable'][i]['hours'][j]['teacher']);
                if ($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername'] != "") {
                    if ($scope.teacherData.indexOf($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']) < 0) 
                    {
                        $scope.teacherData.push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']);
                        temp = [];
                        temp.push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]);
                        $scope.teacherData2.push(temp);  
                    }
                    else
                    {
                        var teacherIndex = $scope.teacherData.indexOf($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']);
                        $scope.teacherData2[teacherIndex].push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]);
                    }
                }
            }
        }
        //console.log("After fir loop teacher data 1 and 2");
        //console.log($scope.teacherData);
        //console.log($scope.teacherData2);

        //var param = $scope.schedule;
        var param = JSON.parse( angular.toJson({"timetables" :$scope.alltt,"teacherData":$scope.teacherData,"teacherData2":$scope.teacherData2}));
        //waitingDialog.show('...Please Wait');
        $scope.loading = true;
        //console.log("param");
        //console.log(param);
        $http.post("https://espl.in.net/accountsapi/editDailyTimetable",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log("success");
                    //console.log(data);
                    $scope.alltt = data.timetables;
                    //console.log($scope.alltt);
                }
        })
        }
        $scope.getmo=function(param,msg){
                    $http.post("https://espl.in.net/accountsapi/getteachermobile",param)
                    .success(function (data) {
                        $scope.loading = false;
                        if (data.success == "true") {
                            console.log(data);

                             var smsdata = JSON.stringify({"mobile":data.mobile,"msg":msg});
                            $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data) {
                                if(data.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();                                
                                }
                                else
                                {    
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
                      

                        }
                })

        }

        $scope.sendsmslecturereminder = function () {
            var i=0;
            var msg="";
            //console.log("yo yo yo yogita...write this function for sending sms lecture alert!");
            $scope.submitDailyTimetable();
            //console.log("------------------teacherdata---------------");
            //console.log($scope.teacherData2);
            for(i=0;i<$scope.teacherData2.length;i++)
            {
                msg="";
                param=JSON.stringify({"staffid":$scope.teacherData2[""+i][0]["teacherid"]})
                msg=" Dear Teacher "+ $scope.teacherData2[i][0]["teachername"] +" Your timetable for  "+ $scope.alltt[0]["date"] +" As Below: ";               
                  for(var j=0;j<$scope.teacherData2[i].length;j++)
                    {
                        msg=msg +" Batch - "+ $scope.teacherData2[i][j]["batch"] +" Subject "+ $scope.teacherData2[i][j]["subject"] +" Time : "+ $scope.teacherData2[i][j]["stime"] + " to "+ $scope.teacherData2[i][j]["etime"] + " ";
                    }
                    $scope.getmo(param,msg);                 
            }
        }

        $scope.newtt = [];
        $scope.addtt = function (index)
        {
            //var ndate=moment(date).format('hh:mm a');
            //$scope.convertedTime = moment($scope.Time).format('hh:mm a');

            var startTime = moment($scope.newtt[index].stime, 'HH:mm a');
            var endTime = moment($scope.newtt[index].etime, 'HH:mm a');
            var startTime2 = moment($scope.newtt[index].stime).format('hh:mm a');
            var endTime2 = moment($scope.newtt[index].etime).format('hh:mm a');

            //console.log(startTime);
            //console.log(endTime); 
            //console.log(startTime2); 
            //console.log(endTime2); 
/*          var startTime=moment($scope.newtt[index].stime, "HH:mm a");
          var endTime=moment($scope.newtt[index].etime, "HH:mm a");*/
          var duration = moment.duration(endTime.diff(startTime));

            if ($scope.newtt[index].stime == undefined || $scope.newtt[index].stime == "") {
                iziToast.error({title: 'Error',message: "Please Enter Start Time!", position: 'bottomLeft'});
            }
            else if ($scope.newtt[index].etime == undefined || $scope.newtt[index].etime == "")
            {
                iziToast.error({title: 'Error',message: "Please Enter End Time!", position: 'bottomLeft'});
            }
            else if ($scope.newtt[index].teacherdata == undefined || $scope.newtt[index].teacherdata == "") 
            {
                iziToast.error({title: 'Error',message: "Please Enter Teacher Name!", position: 'bottomLeft'});
            }
            else if ($scope.newtt[index].subject == undefined || $scope.newtt[index].subject == "") 
            {
                iziToast.error({title: 'Error',message: "Please Enter Subject!", position: 'bottomLeft'});
            }
            // else if (duration < 0)
            // {
            //   iziToast.error({title: 'Error',message: "Please Add Valid Timings!", position: 'bottomLeft'});
            // }
            else
            {

            //console.log(index);
            //console.log($scope.newtt);
            //$scope.alltt[0].timetable[index].batchtimetable.push({"stime":$scope.stime[index],"etime":$scope.etime[index]});
            $scope.alltt[0].timetable[index].batchtimetable.push({"stime":startTime2,"etime":endTime2,"overlap":"false","teacherdata":$scope.newtt[index].teacherdata,"subject":$scope.newtt[index].subject,"teachername":$scope.newtt[index].teachername,"teachersubjects":$scope.newtt[index].teachersubjects,"teacherid":$scope.newtt[index].teacherid,"batchname":$scope.newtt[index].batchname});
            //console.log($scope.alltt[0].timetable);
            //$scope.allsyll[0].syllabus.subject[index].topic.push({"topicname":$scope.newtopic[index],"hours":$scope.hour[index]});
          /*  $scope.subject[index].topic.push({"topicname":$scope.newtopic[index]});*/
            $scope.newtt[index] = {"stime":"","etime":"","teachersubjects":"","subject":"","teachername":"","teacherdata":"","teacherid":"","overlap":"false","batchname":$scope.alltt[0]['timetable'][index]["batchName"]};

            //overlap code
            $scope.teacherData = [];
        $scope.teacherData2 = [];
        //console.log("in daily timetable submit function");
        //console.log($scope.alltt);
        ////console.log($scope.teacherData);
        for(var i=0;i<$scope.alltt[0]['timetable'].length-1;i++)
        {
            for (var j = 0; j < $scope.alltt[0]['timetable'][i]['batchtimetable'].length; j++) {
            ////console.log(i);
            ////console.log($scope.alltt[0]['timetable'][i]['hours'][j]);
            ////console.log($scope.alltt[0]['timetable'][i]['hours'][j]['teacher']);
                if ($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername'] != "") {
                    if ($scope.teacherData.indexOf($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']) < 0) 
                    {
                        $scope.teacherData.push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']);
                        temp = [];
                        temp.push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]);
                        $scope.teacherData2.push(temp);  
                    }
                    else
                    {
                        var teacherIndex = $scope.teacherData.indexOf($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']);
                        $scope.teacherData2[teacherIndex].push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]);
                    }
                }
            }
        }
        //console.log("After fir loop teacher data 1 and 2");
        //console.log($scope.teacherData);
        //console.log($scope.teacherData2);

        //var param = $scope.schedule;
        var param = JSON.parse( angular.toJson({"timetables" :$scope.alltt,"teacherData":$scope.teacherData,"teacherData2":$scope.teacherData2}));
        //waitingDialog.show('...Please Wait');
        $scope.loading = true;
        //console.log("param");
        //console.log(param);
        $http.post("https://espl.in.net/accountsapi/editDailyTimetable",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                     if (data.overlap == "true") 
                        {                              
                            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});   
                        }
                    //console.log("success");
                    //console.log(data);
                    $scope.alltt = data.timetables;
                    //console.log($scope.alltt);
                }
        })
        }
    }

    $scope.getTimetable = function(id = ''){
        //waitingDialog.show('...Please Wait');
        if (id == '') {
            //console.log('in if of getTimetable');
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getTimetable")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.alltt = data.timetables;
                    //console.log($scope.alltt);
                    //waitingDialog.hide();
                } else {
                    //waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }else{
            //console.log("in else getTimetable");
            var id = JSON.stringify({"id":localStorage.timetableID});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getTimetable",id)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    /*$http.post("https://espl.in.net/accountsapi/getColors")
                        .success(function (data2){
                            if (data2.success == "true") {
                                $scope.scheduleColor = data2.color;
                                $scope.schedules = data.schedules;
                                //console.log($scope.schedules);
                                $location.path("viewSchedule")
                            }
                        });*/
                        $scope.alltt = data.timetables;
                        $scope.getStaffList($scope.alltt[0]['city']);
                    //console.log($scope.alltt);
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }
    };

    $scope.newgetTimetable = function(id = ''){
        //waitingDialog.show('...Please Wait');
        if (id == '') {
            //console.log('in if of newgetTimetable');
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/newgetTimetable")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.alltt = data.timetables;
                    //console.log($scope.alltt);
                    //waitingDialog.hide();
                } else {
                    //waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }else{
            //console.log("in else newgetTimetable");
            var id = JSON.stringify({"id":localStorage.timetableID});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/newgetTimetable",id)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    /*$http.post("https://espl.in.net/accountsapi/getColors")
                        .success(function (data2){
                            if (data2.success == "true") {
                                $scope.scheduleColor = data2.color;
                                $scope.schedules = data.schedules;
                                //console.log($scope.schedules);
                                $location.path("viewSchedule")
                            }
                        });*/
                        $scope.alltt = data.timetables;
                        $scope.getStaffList($scope.alltt[0]['city']);
                        //console.log($scope.alltt);

                    for (var i = 0; i < $scope.alltt[0]['timetable'].length; i++) {
                        temp = {};
                        temp["stime"]="";
                        temp["etime"]="";
                        temp["teachersubjects"]="";
                        temp["subject"]="";
                        temp["teachername"]="";
                        temp["teacherdata"]="";
                        temp["overlap"]="false";
                        temp["teacherid"]="";
                        temp["batchname"]=$scope.alltt[0]['timetable'][i]["batchName"];
                    
                    $scope.newtt.push(temp);
                    }
                    //console.log("after for loop");
                    //console.log($scope.newtt);
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }
    };

    $scope.gettodaystimetable = function ()
    {
        var formdata = JSON.stringify({"cityid":localStorage.cityid});
        $http.post("https://espl.in.net/accountsapi/gettodaystimetable",formdata)
            .success(function (data) {
                if (data.success == "true") {
                    //console.log(data);
                    $scope.dashtimetable = data.timetable;
                }
            })
            .error(function(err){
                //console.log("server error");
            });
    }

    $scope.teacherData = [];
    $scope.teacherData2 = [];
    $scope.submitDailyTimetable = function(){
        $scope.teacherData = [];
        $scope.teacherData2 = [];
        //console.log("in daily timetable submit function");
        //console.log($scope.alltt);
        ////console.log($scope.teacherData);
        for(var i=0;i<$scope.alltt[0]['timetable'].length-1;i++)
        {
          for (var j = 0; j < $scope.alltt[0]['timetable'][i]['batchtimetable'].length; j++) {
            ////console.log(i);
            ////console.log($scope.alltt[0]['timetable'][i]['hours'][j]);
            ////console.log($scope.alltt[0]['timetable'][i]['hours'][j]['teacher']);
                if ($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername'] != "") {
                    if ($scope.teacherData.indexOf($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']) < 0) 
                    {
                        $scope.teacherData.push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']);
                        temp=[];
                        temp2={};
                        temp2=$scope.alltt[0]['timetable'][i]['batchtimetable'][j];
                        temp2["batch"]=$scope.alltt[0]['timetable'][i]['batchName'];
                        temp.push(temp2);
                     /*   temp = [];
                        temp.push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]);*/
                        $scope.teacherData2.push(temp);
                    }
                    else
                    {
                        var teacherIndex = $scope.teacherData.indexOf($scope.alltt[0]['timetable'][i]['batchtimetable'][j]['teachername']);
                         temp={};
                        temp=$scope.alltt[0]['timetable'][i]['batchtimetable'][j];
                        temp["batch"]=$scope.alltt[0]['timetable'][i]['batchName'];
                      //  $scope.teacherData2[teacherIndex].push($scope.alltt[0]['timetable'][i]['batchtimetable'][j]);
                       $scope.teacherData2[teacherIndex].push(temp);
                    }
                }
            }
        }
        //console.log("After fir loop teacher data 1 and 2");
        //console.log($scope.teacherData);
        //console.log($scope.teacherData2);

        //var param = $scope.schedule;
        var param = JSON.parse( angular.toJson({"timetables" :$scope.alltt,"teacherData":$scope.teacherData,"teacherData2":$scope.teacherData2}));
        //waitingDialog.show('...Please Wait');
        $scope.loading = true;
        //console.log("param");
        //console.log(param);
        $http.post("https://espl.in.net/accountsapi/editDailyTimetable",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    //console.log("success");
                    //console.log(data);
                    $scope.alltt = data.timetables;
                    //console.log($scope.alltt);
                    if (data.overlap == "false") {
                        var param2 = JSON.stringify({"timetables" :$scope.alltt});
                        //console.log("before updating timetable");
                        //console.log(param2);
                        $http.post("https://espl.in.net/accountsapi/updatetimetable",param2)
                            .success(function (data) {
                            if (data.success == "true") {
                            //console.log("success");
                            /*//console.log(data);
                            $scope.alltt = data.timetables;*/
                            $route.reload();
                        }
                    })
                }
                    //waitingDialog.hide();
                    //$location.path('createSchedule');
                    //$route.reload();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    }

    $scope.overlap = function(overlap)
    {
        if (overlap == "true") {
            return "blink";
        }
    }

    $scope.reloadRoute = function() {
        $('.modal-backdrop').remove();
        $('.modal').remove();
        $route.reload();
    }

    $scope.getBoard = function () {
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getBoard")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.boards=data.board;                       
                    } else {
                        $scope.boards={};
                        iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                    }
                }).error(function(err){
                    $scope.boards={};
                    iziToast.error({title: 'Error',message: "Cannot find Boards !", position: 'bottomLeft'});
                });
    };

    $scope.getstd = function(board) {
      $scope.loading = true;
      var param = JSON.stringify({"coursename":board});
      $http.post("https://espl.in.net/accountsapi/getstd",param)
        .success(function (data) {
          $scope.loading = false;
          if (data.success == "true") {
            //console.log(data);
            $scope.std = data.std;
          } else {
            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
          }
        }).error(function(err){
          iziToast.error({title: 'Error',message: "Standard Not Found!", position: 'bottomLeft'});
        })
    }

    $scope.createSyllabus = function() {
      if($scope.syllName == undefined)
        {
            iziToast.error({title: 'Error',message: "Enter Name for Syllabus", position: 'bottomLeft'});

        }
        else if($scope.syllyear == undefined)
        {
            iziToast.error({title: 'Error',message: "Select Year", position: 'bottomLeft'});

        } 
        else 
        {

      var param = JSON.stringify({'syllName': $scope.syllName,'syllyear': $scope.syllyear});
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/createSyllabus",param)
                    .success(function (data) {
                        $scope.loading = false;
                        if (data.success == "true") {
                            ////console.log(data);
                            /*$scope.ttBatches=data.batch;*/
                            setTimeout($scope.getSyllabus,1000);
                        } else {
                            iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                        }
                    }).error(function(err){
                        iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
                    });
        }
    };

    $scope.deleteSyllabus = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete This Syllabus ");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deletesyllabus",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.getSyllabus();
                    $route.reload();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }
    };


    $scope.deleteTimeTable = function(id)
    {
        //console.log('Deleting :'+id);
        var flag = confirm("Do You Really Want Delete This Timetable");
        if (flag == true) 
        {
            var param=JSON.stringify({"id": id})
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/deletetimetable",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") 
                {
                    //console.log('Deleted Successfully');
                    $scope.newgetTimetable();
                    $route.reload();
                } 
                else 
                {
                    //console.log('Failed to Delete');
                }
            }).error(function(err){

            });    
        } 
        else 
        {
            //console.log('Cancelled');                
        }
    };

    $scope.getSyllabus = function(id = '') {
        //console.log("inside getsyllabus");
      if (id == '') {
            //console.log('in if of getSyllabus');
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getSyllabus")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.allsyll = data.syllabus;
                    //console.log($scope.allsyll);
                    //waitingDialog.hide();
                } else {
                    //waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }else{
            //console.log("in else getSyllabus");
            var id = JSON.stringify({"id":localStorage.syllabusId});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getSyllabus",id)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                   
                        $scope.syll = data.syllabus;
                    //console.log($scope.syll);
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }
    }

/*    $scope.subject = [];*/
    $scope.newtopic=[];
    $scope.hour=[];
    $scope.addsubjectinsyll = function() {
        if ($scope.newsubject == undefined || $scope.newsubject == "") {
            iziToast.error({title: 'Error',message: "Please Enter Subject Name!!", position: 'bottomLeft'});
        }
        else
        {
        //console.log("syllabus");
        //console.log($scope.allsyll[0].syllabus.subject);
       $scope.syll[0].syllabus.subject.push({"subject":$scope.newsubject,"topic":[]});
    /*  $scope.subject.push({"subject":$scope.newsubject,"topic":[]});*/
        $scope.newsubject="";
        }
    };
    $scope.addtopic=function(index){

        if ($scope.newtopic == undefined || $scope.newtopic == "") {
            iziToast.error({title: 'Error',message: "Please Enter Topic Name!!", position: 'bottomLeft'});
        }else if ($scope.hour == undefined || $scope.hour == "") {
            iziToast.error({title: 'Error',message: "Please Enter Hours of Lecture!!", position: 'bottomLeft'});
        }else
        {
        //console.log("adding");
        //console.log($scope.newtopic[index]);
        $scope.syll[0].syllabus.subject[index].topic.push({"topicname":$scope.newtopic[index],"hours":$scope.hour[index]});
      /*  $scope.subject[index].topic.push({"topicname":$scope.newtopic[index]});*/
        $scope.newtopic[index]="";
         $scope.hour[index]="";
        }

    };

    $scope.savesyllabus=function()
    {

          //var param = JSON.parse( angular.toJson({"schedules" :$scope.schedules}));
        var syllabusdata = JSON.parse(angular.toJson({"syllabus":$scope.syll}));
            $scope.loading = true;
            //console.log(syllabusdata);
            $http.post("https://espl.in.net/accountsapi/updatesyllabus",syllabusdata)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {

                   $location.path('createSyllabus');
                     /*   $scope.allsyll = data.syllabus;
                    //console.log($scope.allsyll);*/
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    }

    $scope.savettid = function(ttid)
    {
        localStorage.timetableID = ttid;
    }
    $scope.savesyllabusId = function(syllId)
    {
        localStorage.syllabusId = syllId;
    }
    $scope.deletetopic = function(subjectindex,topicindex)
    {
    	//console.log($scope.syll);
        $scope.syll[0].syllabus.subject[subjectindex].topic.splice(topicindex, 1); 
    }

    $scope.deletesubject = function()
    {

        $scope.syll[0].syllabus.subject.splice(localStorage.subjectindex, 1);
       // this.state($scope.syll[0].syllabus.subject);
        //this.setState($scope.syll[0].syllabus.subject);

    }
     $scope.storesubjectindex = function(subjectindex)
    {
       localStorage.subjectindex=subjectindex;
       console.log("inside function storesubjectindex");
    }
    

    $scope.getsyllabusname = function()
    {
        console.log("inside getsyllabusname");
         $http.post("https://espl.in.net/accountsapi/getsyllabusname")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.allsyllname=data.syllabusname;

                } else {
                    $scope.allsyllname={}; 
                }
            }).error(function(err){
                $scope.allsyllname={};
                //console.log("server error");
            });
        //$scope.allsyll[0].syllabus.subject.splice(subjectindex, 1); 
    }

    $scope.createdailyreport = function()
    {
         if ($scope.syllBatch == undefined || $scope.syllBatch == "") {
            iziToast.error({title: 'Error',message: "Please Select Batch!!", position: 'bottomLeft'});
        }
        else if ($scope.syllName == undefined || $scope.syllName == "") {
            iziToast.error({title: 'Error',message: "Please Select Syllabus Name!!", position: 'bottomLeft'});
        }else if ($scope.syllyear == undefined || $scope.syllyear == "") {
            iziToast.error({title: 'Error',message: "Please Select Syllabus Year!!", position: 'bottomLeft'});
        }else
        {
        var param = JSON.stringify({"syllName":$scope.syllName,"syllBatch":$scope.syllBatch,"syllyear":$scope.syllyear});
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/createdailyreport",param)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == 'true') {
                    $scope.syllName="";
                    $scope.syllBatch="";
                    $scope.syllyear="";
                     iziToast.success({title: 'success',message: "Daily Report Created", position: 'bottomLeft'});
                    setTimeout($scope.getnewdailyreport,1000);
                } else {
                    //console.log("nai zala");
                }
            }).error(function (err) {
                //console.log("server error");
            });
        }
    }

    $scope.getdailyreport = function(id = '') {
        if (id == '') {
            //console.log('in if of getdailyreport');
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getdailyreport")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.dailyreport = data.dailyreport;
                    //console.log($scope.dailyreport);
                    //waitingDialog.hide();
                } else {
                    //waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }else{
            //console.log("in else getdailyreport");
            var id = JSON.stringify({"id":localStorage.dailyreportId});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getdailyreport",id)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                        $scope.onedailyreport = data.dailyreport;
                    //console.log($scope.onedailyreport);
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }
    }

            $scope.getnewdailyreport = function(id = '') {
        if (id == '') {
            //console.log('in if of getdailyreport');
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getnewdailyreport")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                    $scope.dailyreport = data.dailyreport;
                   
                } else {
                    
                }
            }).error(function(err){
                //console.log("server error");
            });
        }else{
            console.log("in else getdailyreport");
            var id = JSON.stringify({"id":localStorage.newdailyreportId});
            $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getnewdailyreport",id)
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                        $scope.onedailyreport = data.dailyreport;
                         $scope.reportcolors={"01":"#0099e5","02":"#ff4c4c","03":"#34bf49","04":"#e4e932","05":"#d20962","06":"#7d3f98","07":"#537b35","08":"#fdb813","09":"#f94877","10":"#003399","11":"#341539","12":"#215732"};
                    console.log($scope.onedailyreport);
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
        }
    }


    $scope.getdashdailyreport = function() {
        var id = JSON.stringify({"id":localStorage.batchname});
        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getdashdailyreport",id)
        .success(function (data) {
            $scope.loading = false;
            if (data.success == "true") {
                    $scope.onedailyreport = data.dailyreport;
                     $scope.reportcolors={"01":"#0099e5","02":"#ff4c4c","03":"#34bf49","04":"#e4e932","05":"#d20962","06":"#7d3f98","07":"#537b35","08":"#fdb813","09":"#f94877","10":"#003399","11":"#341539","12":"#215732"};
                console.log($scope.onedailyreport);
                //waitingDialog.hide();
            } else {
               // waitingDialog.hide();
            }
        }).error(function(err){
            //console.log("server error");
        });
    }



     $scope.savenewdailyreportId = function(dailyreportId)
    {
        localStorage.newdailyreportId = dailyreportId;
    }

    $scope.savedailyreportId = function(dailyreportId)
    {
        localStorage.dailyreportId = dailyreportId;
    }

  /*  $scope.getdailyreportcolor=function()
    {
       $http.get("https://espl.in.net/accountsapi/getdailyreportcolor")
            .success(function (data) {
                $scope.loading = false;
                if (data.success == "true") {
                        $scope.reportcolors = data.colors;
                    //console.log($scope.reportcolors);
                    //waitingDialog.hide();
                } else {
                   // waitingDialog.hide();
                }
            }).error(function(err){
                //console.log("server error");
            });
    }*/

    $scope.getCities = function()
    {
        $scope.loading = true;
        $http.get("https://espl.in.net/accountsapi/getcities")
        .success(function(data){
            $scope.loading = false;
           // toastr.success(data.message);
           if(data.success == "true")
           {
           $scope.cities = data.cities;
            }
        })  
        .error(function(err){
            $scope.cities=""
      //  toastr.error("Something went wrong! Please try again...");
        })
    };

    $scope.savebatchname =function (name)
    {
        localStorage.lecrecbname = name;
    };

    $scope.lecturerecord = function ()
    {
        var senddata = JSON.stringify({"batch":localStorage.lecrecbname});

        $scope.loading = true;
        $http.post("https://espl.in.net/accountsapi/getlecturedetails",senddata)
            .success(function(data){
                $scope.loading = false;
           if(data.success == "true")
           {
            //console.log(data);
           $scope.lecturerecord = data.lecturedetails;
           $scope.days = data.day;
           $scope.dates = data.dates;
           $scope.batchnamelecrec = data.batch;
           //console.log($scope.lecturerecord);
            }
        })  
            .error(function(err){
            $scope.lecturerecord=""
        })
    }

    $scope.getStaffList = function (cityid) 
      {
        //cityid = localStorage.cityid;
        var param=JSON.stringify({"cityid": cityid});
        //console.log('city stafflist :'+param);
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getstafflistall")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.staffs=data.stafflist;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
        };

        $scope.assignTeacherid = function (teacherId,position,rowindex)
        {
          var index = -1;
            //console.log("yoyoy");
            //console.log($scope.alltt[0]['timetable'][0]['hours'][0]['subject']);
            teacherId=JSON.parse(teacherId);
            //console.log(teacherId["_id"]);
           $scope.alltt[0]['timetable'][position]['hours'][rowindex]['teacher']= teacherId["fname"]+" "+teacherId["lname"];
           $scope.alltt[0]['timetable'][position]['hours'][rowindex]['teachersubject']=teacherId['subject'];
     
        }

        $scope.newassignTeacherid = function (teacherid,position)
        {
           //  var index = -1;
           //  //console.log("yoyoy");
           //  //console.log($scope.alltt[0]['timetable'][0]['hours'][0]['subject']);
           //  teacherId=JSON.parse(teacherId);
           //  //console.log(teacherId["_id"]);
           // $scope.alltt[0]['timetable'][position]['hours'][rowindex]['teacher']= teacherId["fname"]+" "+teacherId["lname"];
           // $scope.alltt[0]['timetable'][position]['hours'][rowindex]['teachersubject']=teacherId['subject'];

           teacherdata = JSON.parse($scope.newtt[position].teacherdata);
           $scope.newtt[position].teachersubjects = teacherdata.subject;
            $scope.newtt[position].teacherid = teacherdata._id;
           $scope.newtt[position].teachername = teacherdata.fname+" "+teacherdata.lname;
           //console.log($scope.newtt[position]);
        }

    $scope.getLeavelist = function () 
      {
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/getLeavelist")
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        //console.log(data);
                        $scope.leaves=data.leaves;
                    } else {

                        iziToast.error({
                            title: 'Error',
                            message: data.message,
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});


            });
        };

    $scope.leaveaction = function (staffid,leavedate,staffmobile,action)
    {
        console.log(staffid,action);
        var param=JSON.stringify({"staffid": staffid,"leavedate": leavedate, "action":action});
        $scope.loading = true;
            $http.post("https://espl.in.net/accountsapi/leaveaction",param)
                .success(function (data) {
                    $scope.loading = false;
                    if (data.success == "true") {
                        iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                        if (action == 0) {
                            var msg ="Respected Sir/Mam, Your Request for leave has been Approved.";
                            var smsdata = JSON.stringify({"mobile":staffmobile,"msg":msg});
                        }
                        else {
                            var msg ="Respected Sir/Mam, Your Request for leave has been disapproved. For more Information please contact: Nashik: 9096430818/Aurangabad: 9923939292.";
                            var smsdata = JSON.stringify({"mobile":staffmobile,"msg":msg});
                        }
                        $http.post("https://espl.in.net/accountsapi/sendsms",smsdata)
                            .success(function (data2) {
                                if(data2.success=="true")
                                {
                                    iziToast.show({theme: 'dark',title:'Success',message:"sms sent",position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                                    waitingDialog.hide();
                                    $route.reload();
                                }
                                else
                                {
                                waitingDialog.hide();                         
                                }
                                })
                            .error(function(err){ 
                            })
                    } else {
                        iziToast.error({
                            title: 'Error',
                            message: "Something went Wrong!!",
                            position: 'bottomLeft'
                        });
                    }
                }).error(function(err){
                    iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'bottomLeft'});
            });
    }

})
/*riddlerApp.controller('papersinoutController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
   
	$scope.accounts = localStorage.accounts;


   $scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

        //clear button funcition
        $scope.clear=function(){

          $scope.quantity="";
          $scope.Subject="";
          $scope.date="";
          $scope.selected_branch="";
          $scope.selected_faculty="";


        }
        //filters function goes here in this all filter code is write 
        $scope.filters=function(){

        var obj = {};
         if($scope.filters_selected_status!=undefined)
          obj['Status']=$scope.filters_selected_status
        if($scope.filters_selected_branch!=undefined)
          obj['Branch']=$scope.filters_selected_branch
        if($scope.filter_Subject!=undefined)
           obj['Subject']=$scope.filter_Subject

          var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/paperinoutfilter",parm)
                      .success(function(data){
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.paperData;
                            $scope.Totalamounttop=data.total_amount;
                            $scope.TotalpaprIn=data.total_in;
                            $scope.Totalpaperout=data.total_out;
                            $scope.TotalRecord=data.paperData.length;
                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
           




        }

        $scope.penaltycal=function(){
          var expdate = Date.parseDate($scope.editdateofexpsub, "d-m-Y");
          var actualdate = Date.parseDate($scope.editdateofsub, "d-m-Y");


          console.log('Test '+expdate)
        }
            // ngchange on Rate vaalue this function is call to calculate totl amount
         $scope.amountmulti=function(){
          console.log('Test')
          $scope.edittitalamt=$scope.editrate*$scope.editquantity;
          $scope.edittitalamt=$scope.edittitalamt-$scope.editpenalty;
         }
          //to mark paper are complte this function is used on complete btn click
         $scope.paperIn=function(res){

          var parm=JSON.stringify({
              "id":$scope.editid=res['_id']
          })

              $http.post("https://espl.in.net/accountsapi/paperInentry",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                             $scope.getallinoutData();
                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })


         }

         //when model update button press this function perfrom updates 
        $scope.editupdate=function(){

              var parm=JSON.stringify({
            "Assign_Date":$scope.editdateofassign,
            "Subject":$scope.editSubject,
            "Quantity":$scope.editquantity,
            "Rate":$scope.editrate,
            "Total_Amount":$scope.edittitalamt,
            "Submission_Date":$scope.editdateofsub,
            "editid":$scope.editid
       })

              
              $http.post("https://espl.in.net/accountsapi/paperinoutedit",parm)
                      .success(function(data){

                       if(data.success==true){
 iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
 angular.element('#modellogin').modal('hide');
 $scope.getallinoutData();

}
else
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
                      })
                      .error(function(err){
  iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
     

        }
        //when edit on row is click this function execute and pass data to model
      $scope.paperEditeditdata=function(res){
        $scope.editstaffname=res['Faculty_Name']
       $scope.editdateofassign=res['Assign_Date']
       $scope.editSubject=res['Subject']
       $scope.editquantity=res['Quantity']
       if(res['Rate']!='')
       $scope.editrate=res['Rate']
        else
       $scope.editrate=0
       
       $scope.editid=res['_id']
       if(res['Submission_Date']!='')
       $scope.editdateofsub=res['Submission_Date']
       else
       $scope.editdateofsub=''

       if(res['Total_Amount']!='')
        $scope.edittitalamt=res['Total_Amount'] 
       else
        $scope.edittitalamt=0
      angular.element('#modellogin').modal('show');
      }
//this function read all inout data and display in table
     $scope.getallinoutData=function(){
              $http.post("https://espl.in.net/accountsapi/paperinoutreadall")
                      .success(function(data){
                        console.log(data);
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.paperData;
                            $scope.Totalamounttop=data.total_amount;
                            $scope.TotalpaprIn=data.total_in;
                            $scope.Totalpaperout=data.total_out;
                            $scope.TotalRecord=data.paperData.length;



                      })
                      .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
     } 


     //this function read staff name branches and provide in drop down button
      $scope.getpaperData=function(){

        $http.post("https://espl.in.net/accountsapi/paperinoutgetstaff").
        success(function(data){
              if(data.success==true){
                $scope.stafflist=data.name;
                $scope.branches=data.branches;
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })



      }

//this function performn out entry
      $scope.savepaperOut=function(){

       var parm=JSON.stringify({
            "Faculty_Name":$scope.selected_faculty,
            "Branch":$scope.selected_branch,
            "Assign_Date":$scope.date,
            "Subject":$scope.Subject,
            "Quantity":$scope.quantity,
            "Rate":"0",
            "Total_Amount":"0",
            "Submission_Date":"0",
            "Status":"Out"
       })
         
        $http.post("https://espl.in.net/accountsapi/paperinoutaddout",parm)
      .success(function(data){
              
              if(data.success==true){
iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
$scope.getallinoutData();

              }
              else
              {
iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});                
              }
      })
      .error(function(data){
iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
      })
      }

});
*/
riddlerApp.controller('accountsControllerExp', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
  
	$scope.accounts = localStorage.accounts;


  $scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

$scope.getData=function(city,salary_type,salary_status,allrec)
{
       $scope.advancedbtn=false;
 

    if((city || salary_type) && !salary_status ){
    
        $scope.isvisible=true;
    $http.post("https://espl.in.net/accountsapi/getstaffsalarydetails")
    .success(function(data){
        console.log(data);
        $scope.headers = data.headers;

        //filter Data
        $scope.filter_data=[]
        if(city&&salary_type){
           
          angular.forEach(data.payment,function(value,key){
              if (city==value['City'] && salary_type==value['Salary Type']){$scope.filter_data.push(value)}
          });

        }
         else if(city && !salary_type){
    
     angular.forEach(data.payment,function(value,key){
              if (city==value['City']){$scope.filter_data.push(value)}
          });


         }
         else if(!city && salary_type){
           angular.forEach(data.payment,function(value,key){
              if (salary_type==value['Salary Type']){$scope.filter_data.push(value)}
          });

         }
         else 
         {
          $scope.filter_data=data.payment
         } 
    

        //find total salary
        var sum=0;
        angular.forEach($scope.filter_data,function(value,key){
            sum=sum+parseFloat(value['Salary'])
        });
        $scope.set_records=$scope.filter_data.length;
        $scope.set_totalsalary=sum;

        $scope.staff =$scope.filter_data;
        $scope.currentrecords = $scope.filter_data;

    })
    .error(function(data){

    });



    }

    else
  {
      
      //for 3rd filter code
      if(salary_status=='Pending'){

          $http.post("https://espl.in.net/accountsapi/getpending")
.success(function(data){
        $scope.isvisible=false;
        $scope.headers = data.headers;
        $scope.staff = data.pending;
        $scope.currentrecords = data.pending;

      //find total salary
        var sum=0;
        angular.forEach(data.pending,function(value,key){
            sum=sum+parseFloat(value['Amount'])
        });
        $scope.set_totalpending=sum
        $scope.set_records=data.pending.length;
      
})
.error(function(data){
    console.log('Error ')      
})


      }

      if(salary_status=='Clear'){
         $scope.isvisible=false
    $http.post('https://espl.in.net/accountsapi/getverifyStatus')
    .success(function(data){
      $scope.isvisible=false;
        $scope.headers = data.headers;
        $scope.staff = data.pending;
        $scope.currentrecords = data.pending;


        //find total salary
        var sum=0;
        angular.forEach(data.pending,function(value,key){
            sum=sum+parseFloat(value['Amount'])
        });
      
        $scope.set_totalclear=sum;
        $scope.set_records=data.pending.length;
    })
    .error(function(data){})
      }

    if(salary_status=='Advanced'){
      //show all staff data 
      //assignAdvanced
     $scope.advancedbtn=true;
     $scope.isvisible=false;
      $http.post("https://espl.in.net/accountsapi/assignAdvanced").success(function(data){
              console.log('assign '+data.payment)
              $scope.headers = data.headers;
              $scope.currentrecords=data.payment
      })
      .error(function(data){

      })
      //end
    }


    if(salary_status=='Pay All'){
        console.log(allrec)
         var parm=JSON.stringify({"data":allrec})
         
        $http.post("https://espl.in.net/accountsapi/export",parm).success(function(data){
              
              url="https://espl.in.net/mt/"+data.filename
              console.log(url)   
              $window.open(url,'_blank');
              //open paymen module
              angular.element('#modelpaymentall').modal('show');

      })
      .error(function(data){

      })
    }





  }

    console.log(city,salary_type,salary_status)



}


//get verify status from db
  $scope.getverifyStatus=function(){
    $scope.isvisible=false
    $http.post('https://espl.in.net/accountsapi/getverifyStatus')
    .success(function(data){
      $scope.isvisible=false;
        $scope.headers = data.headers;
        $scope.staff = data.pending;
        $scope.currentrecords = data.pending;
    })
    .error(function(data){})

  }
  $scope.getmonths=function(){

    $scope.months=['01','02','03','04','05','06','07','08','09','10','11','12']
  }
  
   $scope.getuniqueCitys=function(){
      
    $scope.loading = true;
    $http.get("https://espl.in.net/accountsapi/getcities_distict")
    .success(function(data){
        $scope.loading = false;
       // toastr.success(data.message);
       if(data.success == "true")
       {
       $scope.cities_un = data.citiesun;
       console.log($scope.cities_un);
        }
    })  
    .error(function(err){
        $scope.cities=""
  //  toastr.error("Something went wrong! Please try again...");
    })

   }
   //end of function

   $scope.getSalary=function(month){
    $scope.isvisible=true;
    var parm=JSON.stringify({"month":month})
    $http.post("https://espl.in.net/accountsapi/getsalary",parm)
    .success(function(data){
        console.log(data);
        $scope.headers = data.headers;
        $scope.staff = data.payment;
        $scope.currentrecords = data.payment;


        //window.open("https://espl.in.net/accountsapi/export");


    })
    .error(function(data){

    });


       
   }

   $scope.paySalary=function(Name,salary,month){
        $scope.title=Name
        $scope.amount=salary
        $scope.month=month
        angular.element('#exampleModal').modal('show');
   }

   $scope.addadvance=function(rec){
         angular.element('#advancedModal').modal('show');
         $scope.rec_data=rec
   }


$scope.confirm_advance=function(amount,deduction){
      date=$scope.getDate();
      var parm=JSON.stringify({"date":date,"Name_id":$scope.rec_data['_id'],"Name":$scope.rec_data['Name'],"Contact No":$scope.rec_data['Contact No'],
        "Advance":amount,"Deduction_amount":deduction,"current_advance_amt":amount})
      $http.post("https://espl.in.net/accountsapi/addadvance",parm)
      .success(function(data){
          angular.element('#advancedModal').modal('hide');          
          $scope.getData('','','Advanced');
          $scope.advancedbtn=true;
      })
      .error(function(data){

      })


   }
   
$scope.getDate=function(){

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

if(dd<10) {
    dd = '0'+dd
} 

if(mm<10) {
    mm = '0'+mm
} 

today = mm + '/' + dd + '/' + yyyy;
return today;

  } 

$scope.pending_payment=function(chqbankname,chqnumber,chqdate,currentrecords,salary_month){

    console.log(chqbankname+' '+chqnumber+' '+chqdate+' '+currentrecords+' '+salary_month)
    var parm=JSON.stringify({"Cheque Bank":chqbankname,"Cheque Number":chqnumber,"Cheque Date":chqdate,
     "allrec":currentrecords,"salary_month":salary_month })

  $http.post("https://espl.in.net/accountsapi/addtopendingSalary",parm)
      .success(function(data){
          angular.element('#modelpaymentall').modal('hide');          
          
      })
      .error(function(data){

      })


}

   $scope.confirm_payment=function(bankname,chqnumber,chqdate,title,amount,month){
    var parm=JSON.stringify({"status":"pending","bankname":bankname,"chqnumber":chqnumber,"chqdate":chqdate,"name":title
      ,"amount":amount,"month":month})
      $http.post("https://espl.in.net/accountsapi/salarydistribution",parm)
      .success(function(data){
          angular.element('#exampleModal').modal('hide');          
          $scope.getStaff();
      })
      .error(function(data){

      })


   }
   
$scope.getPending=function(){

$http.post("https://espl.in.net/accountsapi/getpending")
.success(function(data){
        $scope.isvisible=false;
        $scope.headers = data.headers;
        $scope.staff = data.pending;
        $scope.currentrecords = data.pending;
    console.log('Hello')
})
.error(function(data){
    console.log('Error ')      
})

}

});


//SVG Code
riddlerApp.controller('accountsController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

	$scope.accounts = localStorage.accounts;


$scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

        $scope.getStudentPaymentInfo = function()
        {

             $http.post("https://espl.in.net/accountsapi/getstudentpaymentinfo")
            .success(function (data) {
                
                if (data.success == "true") {
                    
                    $scope.records = data.records;
                    $scope.headers = data.headers;
                   // $scope.headers1 = data.headers;
                  //$scope.monthwise_records = data.monthwise_records;
                    
            
                iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'topRight',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                } else {
                iziToast.error({title: 'Error',message: data.message, position: 'topRight'});
                }
            })
            .error(function(err){
            
                iziToast.error({title: 'Error',message: "Something Went Wrong!", position: 'topRight'});
            });


        };

        $scope.showincometable =false;
        $scope.showamountstable = false;
        $scope.searchhead = {};

        $scope.showrecords = function(month,records)
        {

            $scope.showincometable = true;
            $scope.showamountstable = false;
            $scope.currentmonth = month;
            $scope.currentrecords = records; 

            $('searchfields').removeAttr('value'); 


        };

        $scope.chequerecordstoassign = [];
        $scope.addToExpense = function(row)
        {
              var indexRow = $scope.chequerecordstoassign.indexOf(row);
              if (indexRow == -1) {

               $scope.chequerecordstoassign.unshift(row);

              } else {
               $scope.chequerecordstoassign.splice(indexRow, 1);
              }


        };

        $scope.assignCheques = function()
        {
            $scope.showincometable = false;

            if($scope.chequerecordstoassign.length ==0)
            {
                iziToast.error({title: 'Error',message:"Select Amount to Assign", position: 'topRight'});

            }
            else
            {
                $scope.showamountstable = true;


            }

        };

        $scope.assignAmt = function(rec)
        {
            console.log(rec);

        };




});

///////////////////////////////   Account passbook controller    //////////////////////////////////////
riddlerApp.controller('accountPassBookController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

	$scope.accounts = localStorage.accounts;


$scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }


    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };


$scope.getchqassigndetails=function(){

$http.post("https://espl.in.net/accountsapi/getchqassign").
        success(function(data){
              if(data.success==true){
                console.log(data)
                $scope.chequecollections=data.alldata;
                $scope.chequeheaders=data.headers;
                iziToast.success({title: 'Success',message: 'Details Fetch Successfully!!', position: 'bottomLeft'});                
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: 'Something Went Wrong!', position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })

}

$scope.deleteassignchq=function(rec){
  parm=JSON.stringify(rec)
  $http.post("https://espl.in.net/accountsapi/deleteassignchq",parm).
      success(function(data){
              if(data.success==true){           
              iziToast.success({title: 'Success',message: data.message, position: 'bottomLeft'}); 
              $scope.getchqassigndetails();
            }
            else
            {
         iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Assign Record Failed", position: 'bottomLeft'});
        
      })

}
$scope.clearchqdata=function(){

  $scope.staffnameassign=""
  $scope.startchqno=""
  $scope.endchqno=""
}

$scope.assignrecords=function(){
    console.log($scope.staffnameassign+","+$scope.startchqno+","+$scope.endchqno)
       parm=JSON.stringify({"staffnameassign":$scope.staffnameassign,"startchqno":$scope.startchqno,"endchqno": $scope.endchqno})    
      $http.post("https://espl.in.net/accountsapi/assignpassbookcheque",parm).
      success(function(data){
              if(data.success==true){           
              iziToast.success({title: 'Success',message: "Record Assigned Successfully", position: 'bottomLeft'}); 
              $scope.getchqassigndetails();
            }
            else
            {
         iziToast.error({title: 'Error',message: "Record Assign Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Assign Record Failed", position: 'bottomLeft'});
        
      })

}        
$scope.showchqgrid=function(){

  $http.post("https://espl.in.net/accountsapi/getchqdataadgrid").
      success(function(data){
              if(data.success==true){           
            $scope.headers = data.headers;
            $scope.currentrecords=data.allData;
            $scope.deletevar=false;
            iziToast.success({title: 'Success',message: "Passbook Reloaded", position: 'bottomLeft'}); 
            }
            else
            {
         iziToast.error({title: 'Error',message: "Passbook Reload Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Passbook Reload Failed", position: 'bottomLeft'});
        
      })
}

$scope.assigncheque=function(){
  $scope.getchqassigndetails();
  angular.element('#chequassignentry').modal('show');
}
$scope.modelcall=function(){
    angular.element('#modelcreditdebit').modal('show');
      $scope.selected_totalamount="";
      $scope.seleced_date="";
      $scope.selected_holdername="";
      $scope.selected_bankname="";
      $scope.selected_branchname="";
      $scope.selected_chequeno="";
      $scope.seleced_chqdate="";
      $scope.selected_chqstatus="";
      $scope.selected_chqoption="";




}

$scope.deletepassbook=function(rec){

  var obj={};
  obj['_id']=rec['_id']
  var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/deletefrompassbook",parm)
                      .success(function(data){
                          if(data.success==true){
                            $scope.gettotalpassbookBalance();
                            iziToast.success({title: 'Success',message: "Deleted Successfully!", position: 'bottomLeft'});                
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })



}
$scope.filter=function(){
var parm={};

  if($scope.selected_filtermode!=undefined)
    parm['mode']=$scope.selected_filtermode
   
if($scope.selected_filtertype!=undefined)
    parm['Amounttype']=$scope.selected_filtertype

console.log(parm)
      $http.post("https://espl.in.net/accountsapi/passbookBalancefilter",parm).
      success(function(data){
              if(data.success==true){           
             $scope.headers = data.headers;
              $scope.currentrecords=data.allData;
              $scope.Record=data.allData.length;
              $scope.amounttot=data.currentamt;
              $scope.passbook_in=data.In;
              $scope.passbook_out=data.Out;
              $scope.deletevar=true;

              iziToast.success({title: 'Success',message: "Passbook Reloaded", position: 'bottomLeft'}); 
            }
            else
            {
         iziToast.error({title: 'Error',message: "Passbook Reload Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Passbook Reload Failed", position: 'bottomLeft'});
        
      })

 
   
}

 

$scope.showhideval=function(){

  console.log($scope.selected_paymentoption)
  if($scope.selected_paymentoption=='Cheque'){
    $scope.chqvar=true;
    $scope.cashvar=false;
  }
  else if($scope.selected_paymentoption=='Cash'){
    $scope.chqvar=false;
    $scope.cashvar=true;
  }
  else{
     $scope.chqvar=true;
    $scope.cashvar=false;
  }

}

$scope.addpassbookpayment=function(){

var parm;
 var flag=0
  if($scope.selected_paymentoption=='Cash'){
 
   parm=JSON.stringify({"mode":"cash","Amounttype":$scope.selected_amountype,"Amount":$scope.selected_cashamount,"entrydate": $scope.seleced_date,"description":$scope.description})
   if($scope.selected_cashamount=="")
        flag=1
    
      
  }
  else
    {
      var mode=$scope.selected_paymentoption
      parm=JSON.stringify({"mode":mode,"Amounttype":$scope.selected_amountype,"Amount":$scope.selected_totalamount,"entrydate": $scope.seleced_date,"chequedate":$scope.seleced_chqdate
      ,"chequeno":$scope.selected_chequeno,"chequeholdername":$scope.selected_holdername,"description":$scope.description})

      if($scope.selected_totalamount==""||$scope.selected_chequeno==""||$scope.selected_holdername=="")
        flag=1

    
    }

        if(flag==0){
     $http.post("https://espl.in.net/accountsapi/savepassbookrecord",parm).
      success(function(data){
          if(data.success==true){
                 iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                angular.element('#modelcreditdebit').modal('hide');       
                $scope.gettotalpassbookBalance();
            }
            else
            {
         iziToast.error({title: 'Error',message: "Passbook Entry Failed", position: 'bottomLeft'});
            }
      })
      .error(function(data){
 iziToast.error({title: 'Error',message: "Passbook Entry Failed", position: 'bottomLeft'});
      })
    }
    else
    {
      iziToast.error({title: 'Error',message: "Blank Field Not Allowed", position: 'bottomLeft'});
    }
 


}

$scope.addBalance=function(uname,upass,balance){

var parm=JSON.stringify({"uname":uname,"upass":upass,"balance":balance})
      $http.post("https://espl.in.net/accountsapi/addbalance",parm).
      success(function(data){
          angular.element('#modellogin').modal('hide');
          $scope.gettotalpassbookBalance();   
      })
      .error(function(data){

      })

}


$scope.balanceclick=function(){

    angular.element('#modellogin').modal('show');

    
}

$scope.showdashpassbook=function(){
      $scope.gettotalpassbookBalance();
}

$scope.gettotalpassbookBalance=function(){

  //here  we calculate passbook actual balance plus minu credit debit balance
                     
      $http.post("https://espl.in.net/accountsapi/gettotalpassbookBalance").
      success(function(data){
              if(data.success==true){         
              $scope.headers = data.headers;
              $scope.currentrecords=data.allData;
              $scope.Record=data.allData.length;
              $scope.amounttot=data.currentamt;
              $scope.passbook_in=data.In;
              $scope.passbook_out=data.Out;
              $scope.deletevar=true;

              iziToast.success({title: 'Success',message: "Passbook Reloaded", position: 'bottomLeft'}); 
            }
            else
            {
         iziToast.error({title: 'Error',message: "Passbook Reload Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Passbook Reload Failed", position: 'bottomLeft'});
        
      })
            


 

}

 

});

//chequerecordscontoller
riddlerApp.controller('chequerecordsController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
      console.log("Hello")
      $scope.accounts = localStorage.accounts;
      $scope.checkLogin = function()
  {
    console.log('inside chequerecordsController');
    if (!localStorage.accounts) {
      console.log('inside checkLogin if');  
      $location.path('accountLogin');
    }
  }

  $scope.changestatustopaid=function(rec,option){
    
    var obj={}
    obj['_id']=rec['_id']
    obj['pay']=rec['pay']
    if(option=="1")
      obj['status']='Paid'
    else
      obj['status']='Pending'
    var parm=JSON.stringify(obj)
      $http.post("https://espl.in.net/accountsapi/changestatustopaid",parm)
                      .success(function(data){
                          if(data.success==true){
                            $scope.chequerecordsgetall();
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })

  }
  $scope.chequerecordsgetall=function(){
     $http.post("https://espl.in.net/accountsapi/chequerecordsgetall")
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.records;
                            $scope.Record=data.records.length;
                            $scope.paid=data.paid;
                            $scope.pending=data.pending;
                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })

  }



});


//studentsInOutController
riddlerApp.controller('studentsInOutController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

	$scope.accounts = localStorage.accounts;


$scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }


    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };


$scope.gettotalouttranscations=function(){

      $scope.filterhideshow=false;
      $http.post("https://espl.in.net/accountsapi/getoutentrys").
      success(function(data){
              if(data.success==true){           
              $scope.headers = data.headers;
              $scope.currentrecords=data.allData;
              $scope.totalout=data.tot_amountout;
              $scope.out_pending=data.tot_pedingout;
              iziToast.success({title: 'Success',message: "OUT Entries Reloaded", position: 'bottomLeft'}); 
            }
            else
            {
         iziToast.error({title: 'Error',message: "OUT Entries Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "OUT Entries Failed", position: 'bottomLeft'});
        
      })
}

$scope.addoutrecord=function(){

  var parm;
 var flag=0
  if($scope.selected_paymentoption=='Cheque'){
   
    parm=JSON.stringify({"mode":"cheque","Amount":$scope.selected_totalamount,"chequedate":$scope.seleced_chqdate
      ,"chequeno":$scope.selected_chequeno,"chequebankname":$scope.selected_bankname,"chequebranchname":$scope.selected_branchname,
      "chequeholdername":$scope.selected_holdername,"entrydate": $scope.seleced_date,
      "status":$scope.selected_chqstatus,"outdesciption":$scope.selected_outdesscription,
        "esplcity":$scope.selected_esplcity,"esplbranch":$scope.selected_esplbranch})
      if($scope.selected_totalamount==""||$scope.selected_chequeno==""||$scope.selected_bankname==""||
        $scope.selected_branchname==""||$scope.selected_holdername=="")
        flag=1
      
  }
  else
    {

    parm=JSON.stringify({"mode":"cash","Amount":$scope.selected_totalamount,"entrydate": $scope.seleced_date,
        "esplcity":$scope.selected_esplcity,"esplbranch":$scope.selected_esplbranch,"outdesciption":$scope.selected_outdesscription})
    if($scope.selected_totalamount=="")
        flag=1
    }

    console.log(parm)
        if(flag==0){
     $http.post("https://espl.in.net/accountsapi/saveoutrecords",parm).
      success(function(data){
          if(data.success==true){
                 iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                angular.element('#modalouttranscation').modal('hide');       
                $scope.gettotalouttranscations();
            }
            else
            {
         iziToast.error({title: 'Error',message: "OUT Entry Failed", position: 'bottomLeft'});
            }
      })
      .error(function(data){
 iziToast.error({title: 'Error',message: "OUT Entry Failed", position: 'bottomLeft'});
      })
    }
    else
    {
      iziToast.error({title: 'Error',message: "Blank Field Not Allowed", position: 'bottomLeft'});
    }

}

  
$scope.showhideval=function(){

  console.log($scope.selected_paymentoption)
  if($scope.selected_paymentoption=='Cheque')
    $scope.chqvar=true;
  else
    $scope.chqvar=false;

}

    $scope.modeloutcall=function(){
      angular.element('#modalouttranscation').modal('show');  
      $scope.selected_paymentoption="";
      $scope.selected_esplbranch="";
      $scope.selected_esplcity="";
      $scope.selected_totalamount="";
      $scope.seleced_date="";
      $scope.selected_holdername="";
      $scope.selected_bankname="";
      $scope.selected_branchname="";
      $scope.selected_chequeno="";
      $scope.seleced_chqdate="";
      $scope.selected_chqstatus="";
      $scope.selected_chqoption="";
      $scope.selected_outdesscription="";
    }
    



       $scope.filters=function(){

        if($scope.filterhideshow==true){
        var obj = {};
         if($scope.filters_selected_city!=undefined)
          obj['City']=$scope.filters_selected_city
        if($scope.filters_selected_Branch!=undefined)
          obj['Center']=$scope.filters_selected_Branch
        if($scope.filters_selected_Batch!=undefined)
           obj['Batch']=$scope.filters_selected_Batch
        if($scope.filters_selected_product!=undefined)
           obj['Product']=$scope.filters_selected_product
        if($scope.filters_selected_mode!=undefined)
           obj['Mode']=$scope.filters_selected_mode
            

         console.log(obj)
         var parm=JSON.stringify(obj)     
                 $http.post("https://espl.in.net/accountsapi/sudentinoutrecordsfilter",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.records;
                            $scope.totalamount=data.total_amount;
                            $scope.paid_in=data.paid_in;
                            $scope.pending_in=data.pending_in;
                            $scope.TotalRecord=data.records.length;
                             
                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })


       }
       else{

             var obj = {};
         if($scope.filters_selected_city!=undefined)
          obj['esplcity']=$scope.filters_selected_city
        if($scope.filters_selected_Branch!=undefined)
          obj['esplbranch']=$scope.filters_selected_Branch
        if($scope.filters_selected_mode!=undefined)
           obj['mode']=$scope.filters_selected_mode.toLowerCase();
         var parm=JSON.stringify(obj)     
         console.log(parm)
       $http.post("https://espl.in.net/accountsapi/getoutentrysfilter",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.allData;
                            $scope.totalout=data.tot_amountout;
                            $scope.out_pending=data.tot_pedingout;
          
                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
         //end of else
       }

  }

       $scope.showin=function(){
          $scope.getallstudentData();
       }

       $scope.getallstudentData=function(){
        $scope.filterhideshow=true;
       $http.post("https://espl.in.net/accountsapi/sudentinoutrecords")
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.records;
                            $scope.city=data.city;
                            $scope.center=data.center;
                            $scope.batch=data.batch;
                            $scope.product=data.product;
                            $scope.mode=data.mode;
                            $scope.status=data.status;
                            $scope.board=data.board;
                            $scope.totalamount=data.total_amount;
                            $scope.paid_in=data.paid_in;
                            $scope.pending_in=data.pending_in;
                            $scope.TotalRecord=data.records.length;
                            

                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
       }
  });
  
riddlerApp.controller('papersinoutController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
   
	$scope.accounts = localStorage.accounts;


   	$scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

        //clear button funcition
        $scope.clear=function(){

          $scope.quantity="";
          $scope.Subject="";
          $scope.date="";
          $scope.selected_branch="";
          $scope.selected_faculty="";


        }
        //filters function goes here in this all filter code is write 
        $scope.filters=function(){

        var obj = {};
         if($scope.filters_selected_status!=undefined)
          obj['Status']=$scope.filters_selected_status
        if($scope.filters_selected_branch!=undefined)
          obj['Branch']=$scope.filters_selected_branch
        if($scope.filter_Subject!=undefined)
           obj['Subject']=$scope.filter_Subject.toLowerCase();

          obj['isDeleted']="False";
          var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/paperinoutfilter",parm)
                      .success(function(data){
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.paperData;
                            $scope.Totalamounttop=data.total_amount;
                            $scope.TotalpaprIn=data.total_in;
                            $scope.Totalpaperout=data.total_out;
                            $scope.TotalRecord=data.paperData.length;
                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
           




        }

        $scope.managepen=function(){
            $scope.edittitalamt=$scope.editrate*$scope.editquantity;
            console.log('AMT '+$scope.edittitalamt);
            var penalty=$scope.editpenalty;
            var perday=(penalty*$scope.editquantity);

            var subdate = $scope.editdateofsub.split(/\-/).reverse().join('-');
            subdate = new Date(subdate);
            var expecteddate = $scope.editdateofexpsub.split(/\-/).reverse().join('-');
            expecteddate = new Date(expecteddate);
            var timeDiff = (expecteddate.getTime() - subdate.getTime());
            var diffDays = (timeDiff / (1000 * 3600 * 24)); 
              if(diffDays<0){
                var amt=$scope.edittitalamt;
                penalty= Math.abs(diffDays)*perday;
                $scope.edittitalamt=amt-penalty;
               }

        }
          
           

            // ngchange on Rate vaalue this function is call to calculate totl amount
         $scope.amountmulti=function(){
          $scope.edittitalamt=$scope.editrate*$scope.editquantity;
          if($scope.editpenalty!='' && $scope.editpenalty != undefined)
               $scope.managepen();
         }

         //to revert decision of IN
         $scope.paperout=function(res){
            var parm=JSON.stringify({
              "id":$scope.editid=res['_id']
          })

            $http.post("https://espl.in.net/accountsapi/paperOutentryrevert",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Reverted!", position: 'bottomLeft'});                
                             $scope.getallinoutData();
                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })

         }
          //to mark paper are complte this function is used on complete btn click
         $scope.paperIn=function(res){

          var parm=JSON.stringify({
              "id":$scope.editid=res['_id']
          })

              $http.post("https://espl.in.net/accountsapi/paperInentry",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Successfully Marked as IN!", position: 'bottomLeft'});                
                             $scope.getallinoutData();
                          }
                          else
                              iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
                      .error(function(err){
                iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })


         }

         //when model update button press this function perfrom updates 
        $scope.editupdate=function(){

              var parm=JSON.stringify({
            "Assign_Date":$scope.editdateofassign,
            "Subject":$scope.editSubject,
            "Quantity":$scope.editquantity,
            "Rate":$scope.editrate,
            "Total_Amount":$scope.edittitalamt,
            "Submission_Date":$scope.editdateofsub,
            "editid":$scope.editid,
            "Exp_Submission_Date":$scope.editdateofexpsub,
            "penalty":$scope.editpenalty,
            "batch":$scope.selected_edtbatch
       })

              
              $http.post("https://espl.in.net/accountsapi/paperinoutedit",parm)
                      .success(function(data){

                       if(data.success==true){
 iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
 angular.element('#modellogin').modal('hide');
 $scope.getallinoutData();

}
else
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
                      })
                      .error(function(err){
  iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
     

        }
        //when edit on row is click this function execute and pass data to model
      $scope.paperEditeditdata=function(res){

        $scope.editstaffname=res['Faculty_Name']
       $scope.editdateofassign=res['Assign_Date']
       $scope.editSubject=res['Subject']
       $scope.editquantity=res['Quantity']
       if(res['Rate']!='')
       $scope.editrate=res['Rate']
        else
       $scope.editrate=0
       
       $scope.editid=res['_id']
       if(res['Submission_Date']!='')
       $scope.editdateofsub=res['Submission_Date']
       else
       $scope.editdateofsub=''

       if(res['Total_Amount']!='')
        $scope.edittitalamt=res['Total_Amount'] 
       else
        $scope.edittitalamt=0

       if(res['Exp_Submission_Date']!='')
        $scope.editdateofexpsub=res['Exp_Submission_Date'] 
       else
        $scope.editdateofexpsub=''



       if('penalty' in res){
      if(res['penalty']!='')
        $scope.editpenalty=res['penalty'] 
       else
        $scope.editpenalty=0
        }
        else{

           $scope.editpenalty=0
        }

    if(res['batch']!=''){
       
        $scope.selected_edtbatch=res['batch'];
         console.log('was batch setbatch '+$scope.selected_edtbatch)
      }
      else{
        $scope.selected_edtbatch=''
      }

        console.log('Data as')
        console.log(res)
      angular.element('#modellogin').modal('show');
      }

$scope.deletepaper=function(rec){
  
  //soft delete
 var parm=JSON.stringify({"_id":rec['_id']}) 
$http.post("https://espl.in.net/accountsapi/softdeletepaperrec",parm)
                      .success(function(data){
                            if(data.success==true){
    iziToast.success({title: 'Success',message: "Successfully Deleted!", position: 'bottomLeft'});
    $scope.getallinoutData();
                              }
                             else{
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});                           
                             } 

                      })
                      .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })


}

//this function read all inout data and display in table
     $scope.getallinoutData=function(){
              $http.post("https://espl.in.net/accountsapi/paperinoutreadall")
                      .success(function(data){
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.paperData;
                            $scope.Totalamounttop=data.total_amount;
                            $scope.TotalpaprIn=data.total_in;
                            $scope.Totalpaperout=data.total_out;
                            $scope.TotalRecord=data.paperData.length;



                      })
                      .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
     } 

      $scope.getbatches=function(){

        var branch=$scope.selected_branch;
        var subbranch=branch.substring(0,branch.indexOf('('))
        console.log(subbranch)
        var obj={}
        obj['branch']=subbranch;
        var parm=JSON.stringify(obj)
        $http.post("https://espl.in.net/accountsapi/getbatchesfrombranchpapers",parm).
        success(function(data){
              if(data.success==true){
                  $scope.batches=data.batches;
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })


      }
     //this function read staff name branches and provide in drop down button
      $scope.getpaperData=function(){

        $http.post("https://espl.in.net/accountsapi/paperinoutgetstaff").
        success(function(data){
              if(data.success==true){
                $scope.stafflist=data.name;
                $scope.branches=data.branches;
                $scope.batches=data.batches;
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })



      }

//this function performn out entry
      $scope.savepaperOut=function(){

       var parm=JSON.stringify({
            "Faculty_Name":$scope.selected_faculty,
            "Branch":$scope.selected_branch,
            "Assign_Date":$scope.date,
            "Subject":$scope.Subject,
            "Quantity":$scope.quantity,
            "Rate":"0",
            "Total_Amount":"0",
            "Submission_Date":"0",
            "Status":"Out",
            "isDeleted":"False",
            "batch":$scope.selected_batch,
            "Exp_Submission_Date":$scope.dateofexpsubadd
       })
         
        $http.post("https://espl.in.net/accountsapi/paperinoutaddout",parm)
      .success(function(data){
              
              if(data.success==true){
iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
$scope.getallinoutData();

              }
              else
              {
iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});                
              }
      })
      .error(function(data){
iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
      })
      }

});

riddlerApp.controller('accounterrorsController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
        console.log('IN Error CONSOLE')
        $scope.checkLogin = function()
  {
    console.log('inside checkLogin');
    if (!localStorage.accounts) {
      console.log('inside checkLogin if');  
      $location.path('accountLogin');
    }
  }

$scope.loaderrors=function(){

$http.post("https://espl.in.net/accountsapi/getaccounterros")
                      .success(function(data){
                          if(data.success==true){
                            console.log(data.filterdata)
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.alldata;
                            iziToast.success({title: 'Success',message: data.message, position: 'bottomLeft'});                
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: data.message, position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: data.message, position: 'bottomLeft'});

                      })


}  



  });

riddlerApp.controller('feedbackadminController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
          
  $scope.accounts = localStorage.accounts;


$scope.checkLogin = function()
  {
    console.log('inside checkLogin');
    if (!localStorage.accounts) {
      console.log('inside checkLogin if');  
      $location.path('accountLogin');
    }
  }

    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
      localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

          $scope.allowfeedback=function(){
            var parm=JSON.stringify({"status":$scope.feedopt,"_id":$scope.buttondata._id})
            $http.post("https://espl.in.net/accountsapi/buttonstatusfeedback",parm).
        success(function(data){
              if(data.success==true){
                    $scope.getfeedbackdata();
                  iziToast.success({title: 'success! ',message: "Button Status Updated!!", position: 'bottomLeft'});            
              }
              else
              {
         iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
          })
          }

          $scope.deletestatus=function(rec){

            var parm=JSON.stringify({"_id":rec['_id']});
            $http.post("https://espl.in.net/accountsapi/deletefeedback",parm).
        success(function(data){
              if(data.success==true){
                    $scope.getfeedbackdata();
                  iziToast.success({title: 'success! ',message: "Record Deleted!!", position: 'bottomLeft'});            
              }
              else
              {
         iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
          })


          }

          $scope.approvestatus=function(rec,status){

               var obj={}
               obj['_id']=rec['_id']
               obj['approve']=status
               var parm=JSON.stringify(obj)
          $http.post("https://espl.in.net/accountsapi/approvefeedback",parm).
        success(function(data){
              if(data.success==true){
                
                  $scope.headers=data.headers;
                  $scope.currentrecords=data.alldata;
                  $scope.getfeedbackdata();
                  iziToast.success({title: 'success! ',message: "Record Updated!!!", position: 'bottomLeft'});            
              }
              else
              {
         iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
          })


          }

          $scope.getfeedbackdata=function(){

        $http.post("https://espl.in.net/accountsapi/getfeedback").
        success(function(data){
              if(data.success==true){
                
                  $scope.headers=data.headers;
                  $scope.currentrecords=data.alldata;
                  $scope.buttondata=data.buttondata[0];
                  if($scope.buttondata.visible=="on")
                    $scope.feedopt=true;
                  else
                    $scope.feedopt=false;
                   
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
          })

          }

  });

//feedback form controller
riddlerApp.controller('parentsfeedbackController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

        $scope.getcenters=function(){

            $http.post("https://espl.in.net/accountsapi/getbranches").
        success(function(data){
              if(data.success==true){
                
                  $scope.branches=data.branch;
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })
        }

        $scope.submitfeedback=function(){

  if($scope.name_parents == undefined || $scope.name_parents == "")
        {
            iziToast.error({title: 'Error',message: "Enter Name of the respondent", position: 'bottomLeft'});
        }
   else if($scope.name_ward == undefined || $scope.name_ward == ""){
            iziToast.error({title: 'Error',message: "Enter Name of the ward", position: 'bottomLeft'});     
   }    
    else if($scope.name_mobile == undefined || $scope.name_mobile == ""){
            iziToast.error({title: 'Error',message: "Enter Mobile No", position: 'bottomLeft'});     
   }
   else if($scope.name_mobile.length !=10){
              console.log($scope.name_mobile.length )
            iziToast.error({title: 'Error',message: "Incoorect Mobile No", position: 'bottomLeft'});  
   }
   else if($scope.name_branch == undefined || $scope.name_branch == ""){
            iziToast.error({title: 'Error',message: "Select Ward Center", position: 'bottomLeft'});  
   }
else if($scope.name_feedback == undefined || $scope.name_feedback == ""){
            iziToast.error({title: 'Error',message: "Enter Feedback", position: 'bottomLeft'});  
   }

else{
  var obj={}
  obj['name_parents']=$scope.name_parents;
  obj['name_ward']=$scope.name_ward;
  obj['name_mobile']=$scope.name_mobile;
  obj['name_branch']=$scope.name_branch;
  obj['name_feedback']=$scope.name_feedback;

  var parm=JSON.stringify(obj);
  $http.post("https://espl.in.net/accountsapi/addfeedback",parm)
                      .success(function(data){
                          if(data.success==true){
                                
                              iziToast.success({title: 'Success',message: "Feedback Recorded", position: 'bottomLeft'});
                              window.location.href = "https://espl.in.net/"; 
                             // $location.path('/');
                                              
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: data.message, position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
  
                }

        }


  });

//salary controller
riddlerApp.controller('accountsalaryController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

	$scope.accounts = localStorage.accounts;


$scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

    $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

$scope.calnetpay=function(){

    $scope.modaltds=($scope.modalsalary)*0.1;
    $scope.modalnetpay=$scope.modalsalary-$scope.modaltds;

}

$scope.showmodelstaff=function(rec){
	console.log(rec)
$scope.selected_staffid=rec['staffid'];
$scope.selected_idinsalary=rec['_id'];

 angular.element('#modalouttranscation').modal('show');
 $scope.modalname=rec['Name']
 $scope.lecdata=rec.staff_all_lect_data
 $scope.lecheaders=['batch','date','startTime','endTime','duration','rate','total']
 $scope.modalsalary=rec['Salary']
 $scope.modaltds=rec['Tds']
 $scope.modalnetpay=rec['Netpay']
 $scope.modaladvaance=rec['Advance']
$scope.modalstaffid=rec['staffid']
 console.log('')

}
$scope.openfiltermodal=function(){
  $scope.modified_center=[];
  for(var i=0;i<$scope.center.length;i++){
    var obj={}
    obj['name']=$scope.center[i];
    obj['Selected']=true;
    $scope.modified_center.push(obj);

  }

  
  angular.element('#modalfilterstaff').modal('show');
  

}

$scope.filterssal=function(){
          var selected_staff=[];
          var selected_center_cnt=0;

                for (var i = 0; i < $scope.staffnameinfilter.length; i++) {
                    if ($scope.staffnameinfilter[i].Selected) {
                        var obj={}
                        obj['staffid']=$scope.staffnameinfilter[i].staffid;
                        obj['name']=$scope.staffnameinfilter[i].name;
                        selected_staff.push(obj)
                    }
                }

                if($scope.modified_center!=undefined){
                for (var i = 0; i < $scope.modified_center.length; i++) {
                    if ($scope.modified_center[i].Selected) {
                        selected_center_cnt+=1;
                    }
                }
              }
 angular.element('#modalfilterstaff').modal('hide');
  
 var obj = {};
         if($scope.salarydatefilter!=undefined)
          obj['salarydate']=$scope.salarydatefilter

        if($scope.filters_selected_monthtype!=undefined)
          obj['DateType']=$scope.filters_selected_monthtype

        if($scope.filters_selected_city!=undefined)
           obj['city']=$scope.filters_selected_city

        if($scope.filters_selected_Branch!=undefined)
           obj['branch']=$scope.filters_selected_Branch

        if($scope.filters_selected_Batch!=undefined)
           obj['batch']=$scope.filters_selected_Batch

        if($scope.filters_selected_coursename!=undefined)
           obj['course']=$scope.filters_selected_coursename

        if($scope.filters_selected_stafftype!=undefined)
           obj['Designation']=$scope.filters_selected_stafftype

        if(selected_staff.length!=0)
         obj['staffdetails']=selected_staff
         obj['selected_center_cnt']=selected_center_cnt 


         console.log(obj)
         var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/salaryfilter",parm)
                      .success(function(data){
                          if(data.success==true){
                            console.log(data.filterdata)
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.alldata;
                            $scope.CMP_PF=data.CMP_PF;
                            $scope.EMP_PF=data.EMP_PF;
                            $scope.total_tds=data.total_tds;
                            $scope.Total_PF=data.CMP_PF+data.EMP_PF
                            $scope.TotalRecord=data.alldata.length
                            $scope.totalsal=data.total_amount;
                            $scope.fixsalary=data.fixsalary;
                            $scope.director=data.director;
                            $scope.employee=data.employee;
                            iziToast.success({title: 'Success',message: "Fetch Successfully!", position: 'bottomLeft'});                
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })


 
}

//get getfilerdatasal
$scope.getfilerdatasal=function(){

  $http.post("https://espl.in.net/accountsapi/getfilerdatasal")
                      .success(function(data){
                            console.log(data)
                        
                          if(data.success==true){
                            console.log(data)
                            $scope.city=data.city;
                            $scope.center=data.branches;
                            $scope.batch=data.batchname;
                            $scope.coursename=data.coursename;
                            $scope.staffnameinfilter=data.staffname;
                            console.log($scope.staffnameinfilter)
                            iziToast.success({title: 'Success',message: "Load Successfully!", position: 'bottomLeft'});                
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                        console.log(err)
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })

}
 




$scope.deleteadvance=function(parm){
    console.log(parm)
 var obj={};
    obj['_id']=parm['_id']
var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/deleteadvance",parm)
                      .success(function(data){
                          if(data.success==true){
                            $scope.getadvanceDetails();
                            $scope.getsalary();
                            iziToast.success({title: 'Success',message: "Deleted Successfully!", position: 'bottomLeft'});                
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })


}

$scope.updaterow=function(rec){
//tis rec is from internal table
var obj={}
obj['_id']=rec['_id'];
obj['duration']=rec['duration'];


var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/updatestffattenfromaccount",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Updated Successfully!", position: 'bottomLeft'});                
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
}



$scope.updatemodal=function(){

var staff={}
staff['staffid']=$scope.selected_staffid
staff['_id']=$scope.selected_idinsalary

//now delte record from salary
              $http.post("https://espl.in.net/accountsapi/deletefromsalaryaccount",staff)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Updated Successfully!", position: 'bottomLeft'});                
                             angular.element('#modalouttranscation').modal('hide');
                            $scope.getsalary();                  
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
     
                          }

                      })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })

console.log($scope.selected_staffid,$scope.selected_idinsalary)

}


$scope.showadvbtn=function(){

  $scope.upadvance=true;
}

$scope.updaeadvancemodal=function(){

//advnce update
var obj={};
var res = $scope.salarydate.split("-");
obj['month']=res[0];
obj['year']=res[1];
obj['staffid']=$scope.modalstaffid
obj['newadvance']=$scope.modaladvaance
var parm=JSON.stringify(obj)

$http.post("https://espl.in.net/accountsapi/advanceupdateinsalary",parm)
                      .success(function(data){
                          if(data.success==true){
                            iziToast.success({title: 'Success',message: "Updated Successfully!", position: 'bottomLeft'});                
                            angular.element('#modalouttranscation').modal('hide');
                            $scope.getsalary();                  
                  
                          }
                          else
                          {
                        iziToast.error({title: 'Oops! ',message: data.message, position: 'bottomLeft'});
     
                          }

                      })
                       .error(function(err){
                   iziToast.error({title: 'Oops! ',message: data.message, position: 'bottomLeft'});
     
                      })


}



$scope.getadvanceDetails=function(){

$http.post("https://espl.in.net/accountsapi/getadvanceDetails").
        success(function(data){
              if(data.success==true){

                $scope.advancecolleciton=data.alldata;
                $scope.advanceheaders=data.headers;
                iziToast.success({title: 'Success',message: 'Data Loaded Successfully!!', position: 'bottomLeft'});                
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: 'Something Went Wrong!', position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })

}

$scope.showhideval=function(){
  if($scope.selected_paymentoption=='PAY ADVANCE'){
    $scope.advancevar=false;
    $scope.addvar=true;
  }

 if($scope.selected_paymentoption=='ADVANCE RECORDS')
   {
     $scope.advancevar=true;
    $scope.addvar=false;
    $scope.getadvanceDetails();

    
    
    
   }
}
/*$scope.updateadvance=function(rec){
    console.log(rec)
    var obj={}
  obj['_id']=rec['_id']
  obj['dateofassign']=rec['DOA']
  obj['advamt']=rec['amount']
  obj['currentremadv']=rec['amount']
  obj['deduction']=rec['deduction']
  obj['lastdeductionmonth']="0"
  obj['staffid']=rec['staffid']
  var parm=JSON.stringify(obj)
  console.log(parm)
  $http.post("https://espl.in.net/accountsapi/updateadvance",parm).
        success(function(data){
              if(data.success==true){
                $scope.getadvanceDetails();
                  angular.element('#modaladvance').modal('hide');
                  $scope.getsalary();

                iziToast.success({title: 'Success',message: 'Data Updated Successfully!!', position: 'bottomLeft'});                
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: 'Something Went Wrong!', position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })

  
  
  

}*/

$scope.addadvance=function(){
    
  var obj={}
  obj['advamt']=$scope.advanceno;
  obj['staffid']=$scope.stafflist[$scope.selected_faculty];
  obj['staffname']=$scope.selected_faculty;
  obj['dateofassign']=$scope.advanceassign;
  obj['deduction']=$scope.deduction;
  obj['currentremadv']=$scope.advanceno;
  obj['lastdeductionmonth']=0;
  obj['isactive']="true";
  var parm=JSON.stringify(obj);
  $http.post("https://espl.in.net/accountsapi/addadvanceacc",parm).
        success(function(data){
              if(data.success==true){

                iziToast.success({title: 'Success',message: data.message, position: 'bottomLeft'}); 
                  angular.element('#modaladvance').modal('hide');
                  $scope.getsalary()
                     
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: data.message, position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })




}

 $scope.getstaffname=function(){

        $http.post("https://espl.in.net/accountsapi/getstafflistacc").
        success(function(data){
              if(data.success==true){
                $scope.stafflist=data.names;
                
              }
              else
              {
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});            
              }
        })
        .error(function(err){
    iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
        })



      }

$scope.salarycsv=function(){
          var obj={};
          var res = $scope.salarydate.split("-");
          obj['month']=res[0];
          obj['year']=res[1];
          obj['director']=$scope.director;
          obj['fixsalary']=$scope.fixsalary;
          obj['contract']=$scope.contract;
          obj['employee']=$scope.employee;

          var parm=JSON.stringify(obj)
          $http.post("https://espl.in.net/accountsapi/export",parm)
                      .success(function(data){
                              if(data.success==true){

                              url1="https://espl.in.net/accounts/staff_salary.csv"
                              url2="https://espl.in.net/accounts/employee_salary.csv"
                              $window.open(url1,'_blank');
                              $window.open(url2,'_blank');
                              iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            
                          }

                           })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
}

  $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

$scope.shoadvancemodal=function(){

  angular.element('#modaladvance').modal('show');
  $scope.advanceassign="";
  $scope.advanceno="";
  

 
}
//save in DB for oher calculations
$scope.getsalaryandsaveindb=function(){

if (confirm('Are you sure you want to delete salary of '+$scope.salarydate+'!!')) {
    
  if (confirm('After Recalculation,changes in Teacher or Employees times cannot get affected!!')) {
 		
        	
        	$scope.salaryreload();    
            

      }  
  } 

}



$scope.salaryreload=function(){

//same as get salary only diff set dbflag=1 save in  db
          var obj={};
          
          var res = $scope.salarydate.split("-");
          obj['month']=res[0];
          obj['year']=res[1];
          obj['dbflag']='1'
          var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/getsalarymonthwise",parm)
                      .success(function(data){
                              if(data.success==true){
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.all_salary;
                            $scope.total_tds=data.total_tds;
                            $scope.CMP_PF=data.CMP_PF;
                            $scope.EMP_PF=data.EMP_PF;
                            $scope.fixsalary=data.fixsalary
                            $scope.contract=data.contract
                            $scope.director=data.director
                            $scope.employee=data.employee
                            $scope.TotalRecord=data.all_salary.length
                            $scope.totalsal=data.fixsalary+data.contract+data.director+data.employee
                            $scope.Total_PF=data.CMP_PF+data.EMP_PF
                            console.log('TDS '+$scope.total_tds)
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            
                          }

                           })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
          

}

    $scope.viewsalary=function(){
          var obj={};
          var res = $scope.salarydate.split("-");
          obj['month']=res[0];
          obj['year']=res[1];
          var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/viewsalarymonthwise",parm)
                      .success(function(data){
                              if(data.success==true){
                            if(data.all_salary.length!=0){
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.all_salary;
                            $scope.total_tds=data.total_tds;
                            $scope.CMP_PF=data.CMP_PF;
                            $scope.EMP_PF=data.EMP_PF;
                            $scope.fixsalary=data.fixsalary
                            $scope.contract=data.contract
                            $scope.director=data.director
                            $scope.employee=data.employee
                            $scope.TotalRecord=data.all_salary.length
                            $scope.totalsal=data.fixsalary+data.contract+data.director+data.employee
                            $scope.Total_PF=data.CMP_PF+data.EMP_PF
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            }
                            else{
                             iziToast.error({title: 'Oops!',message: "Something Went Wrong or Salary Not Genrated for Selected Month", position: 'bottomLeft'});
                             $scope.currentrecords ={};
                            $scope.total_tds=0;
                            $scope.CMP_PF=0;
                            $scope.EMP_PF=0;
                            $scope.fixsalary=0;
                            $scope.contract=0;
                            $scope.director=0;
                            $scope.employee=0;
                            $scope.TotalRecord=0;
                            $scope.totalsal=0;
                            $scope.Total_PF=0;
                            
                            }
                          }


                           })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
          
}

    $scope.getsalary=function(){
          var obj={};
          var res = $scope.salarydate.split("-");
          obj['month']=res[0];
          obj['year']=res[1];
          obj['dbflag']='0';
          var parm=JSON.stringify(obj)
              $http.post("https://espl.in.net/accountsapi/getsalarymonthwise",parm)
                      .success(function(data){
                              if(data.success==true){
                            $scope.headers = data.headers;
                            $scope.currentrecords = data.all_salary;
                            $scope.total_tds=data.total_tds;
                            $scope.CMP_PF=data.CMP_PF;
                            $scope.EMP_PF=data.EMP_PF;
                            $scope.fixsalary=data.fixsalary
                            $scope.contract=data.contract
                            $scope.director=data.director
                            $scope.employee=data.employee
                            $scope.TotalRecord=data.all_salary.length
                            $scope.totalsal=data.fixsalary+data.contract+data.director+data.employee
                            $scope.Total_PF=data.CMP_PF+data.EMP_PF
                            console.log('TDS '+$scope.total_tds)
                            iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                            
                          }

                           })
                      .error(function(err){
                       iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});

                      })
           




        }

});

riddlerApp.controller('accountadminDashboardController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {
 
	$scope.accounts = localStorage.accounts;

 	$scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

 $scope.piechart=function(){
google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {

        var data = google.visualization.arrayToDataTable($scope.piedata);

        var options = {
          title: ''
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));

        chart.draw(data, options);
      }
 }

 $scope.showchart=function(){
google.charts.load('current', {'packages':['bar']});
      google.charts.setOnLoadCallback(drawChart);
       function drawChart() {
        var data = google.visualization.arrayToDataTable($scope.allData);

        var options = {
          chart: {
        	"thousandSeparatorPosition": "2,3"          
          }
        };

        var chart = new google.charts.Bar(document.getElementById('columnchart_material'));

        chart.draw(data, google.charts.Bar.convertOptions(options));
      }
    }

$scope.downloadsalaryreport=function(){
  var obj={}
  obj['startdate']=$scope.seleced_startdate;
  obj['enddate']=$scope.seleced_enddate;
  var parm=JSON.stringify(obj)
  $http.post("https://espl.in.net/accountsapi/accountdashsalryrecpt",parm).
      success(function(data){
              if(data.success==true){           
              url="https://espl.in.net/mt/"+data.filename
               $window.open(url,'_blank');
                iziToast.success({title: 'Success',message: "Successfully Upload!", position: 'bottomLeft'});                
                  angular.element('#modalsalaryrange').modal('hide');  
       
              }
            else
            {
         iziToast.error({title: 'Error',message: "Entries Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Entries Failed", position: 'bottomLeft'});
        
      })

}
$scope.showpie=function(rec){
 google.charts.load("current", {packages:['corechart']});
    google.charts.setOnLoadCallback(drawChart);
    function drawChart() {
      var data = google.visualization.arrayToDataTable([
        ["STAFF TYPE", "TOTAL SALARY", { role: "style" } ],
        ["Teacher(Fix)", rec['fixsalary'], "color:#5773bf"],
        ["Teacher(Contract)", rec['contract'], "color:#E6662E"],
        ["Employee", rec['employee'], "color:#60bf57"],
        ["Director", rec['director'], "color: #e5e4e2"]
      ]);

      var view = new google.visualization.DataView(data);
      view.setColumns([0, 1,
                       { calc: "stringify",
                         sourceColumn: 1,
                         type: "string",
                         role: "annotation" },
                       2]);

      var options = {
        title: "",
        width: 650,
        height: 450,
        bar: {groupWidth: "100%"},
        legend: { position: "none" },
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("columnchart_values"));
      chart.draw(view, options); angular.element('#modalbifur').modal('show');  
}

}

$scope.showmodal=function(){
        angular.element('#modalsalaryrange').modal('show');  

}

  $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };


    $scope.getinitdata=function(){

      $http.post("https://espl.in.net/accountsapi/accountDash").
      success(function(data){
              if(data.success==true){           
              $scope.accountbalance=data.total_credit;
              $scope.lastupdatedate=data.datesdata;
              $scope.totalin=data.total_amount;
              $scope.pendingin=data.pending_in;
              $scope.paidin=data.paid_in;
              $scope.salarydata=data.salarydata;
			  console.log('Data '+$scope.salarydata);
              $scope.headers=['Sr.No','DATE','AMOUNT','TDS']
              $scope.allData=data.allData;
              $scope.piedata=data.piedata;
              $scope.showchart();
              $scope.piechart();
              iziToast.success({title: 'Success',message: "Account Data Loaded", position: 'bottomLeft'}); 
            }
            else
            {
         iziToast.error({title: 'Error',message: "Entries Failed", position: 'bottomLeft'});
            }

      })
      .error(function(data){

 iziToast.error({title: 'Error',message: "Entries Failed", position: 'bottomLeft'});
        
      })


    }



});


// riddlerApp.controller('accountadminDashboardController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

// 	$scope.accounts = localStorage.accounts;

// 	$scope.checkLogin = function()
//   {
//   	console.log('inside checkLogin');
//     if (!localStorage.accounts) {
//   		console.log('inside checkLogin if');	
//     	$location.path('accountLogin');
//     }
//   }
 
//     $scope.getinitdata=function(){

//       $http.post("https://espl.in.net/accountsapi/accountDash").
//       success(function(data){
//               if(data.success==true){           
//               $scope.accountbalance=data.total_credit;
//               $scope.lastupdatedate=data.datesdata;
//               $scope.totalin=data.total_amount;
//               $scope.pendingin=data.pending_in;
//               $scope.paidin=data.paid_in;
//               iziToast.success({title: 'Success',message: "Account Data Loaded", position: 'bottomLeft'}); 
//             }
//             else
//             {
//          iziToast.error({title: 'Error',message: "Entries Failed", position: 'bottomLeft'});
//             }

//       })
//       .error(function(data){

//  iziToast.error({title: 'Error',message: "Entries Failed", position: 'bottomLeft'});
        
//       })


//     }



// });

riddlerApp.controller('accountLoginController', function($scope,$http,$route,$window,$location,$timeout,$filter, idService) {

	$scope.accounts = localStorage.accounts;

	$scope.loginredirect = function()
  {
    if (localStorage.accounts) {
    	$location.path('accountadminDashboard');
    }
  }

  $scope.checkLogin = function()
  {
  	console.log('inside checkLogin');
    if (!localStorage.accounts) {
  		console.log('inside checkLogin if');	
    	$location.path('accountLogin');
    }
  }

  $scope.logout = function (path) {

            //localStorage.clear();
            localStorage.removeItem('loggedIn')
            localStorage.removeItem('loginData')
			localStorage.removeItem('accounts')

         //   localStorage.loggedIn = false;
          //  $scope.loggedIn = localStorage.loggedIn;
         //   //console.log(path);
            $location.path(path);
            //$state.reload();
            $window.location.reload();
        };

  $scope.loggedIn = localStorage.loggedIn;
  $scope.accountsdoLogin=function(){

                if($scope.username == undefined )
            {
                iziToast.error({title: 'Error',message: "Please Enter User name", position: 'bottomLeft'});

            } 

               else if($scope.password == undefined)
            {
                iziToast.error({title: 'Error',message: "Please Enter Password", position: 'bottomLeft'});
            }
          else{

                 var userData = JSON.stringify({
                        "username" : $scope.username,
                        "password" : $scope.password
                    });

                    $scope.loading = true;
                    $http.post("https://espl.in.net/accountsapi/accountsdoLogin",userData)
                        .success(function (data) {
                            $scope.loading = false;
                            if (data.success == "true") {
                                ////console.log(data.data[0]);
                                //localStorage.loggedIn = true;
                                localStorage.accounts = true;
                                localStorage.usertype = data.data[0].usertype;
                                $scope.loggedIn = localStorage.loggedIn;
                                localStorage.loginData = JSON.stringify(data.data[0]);

                                if (data.data[0].usertype === "0") {
                                    localStorage.showeditables = true;
                                }
                                else{ localStorage.showeditables = false;}
                                $location.path('accountadminDashboard');
                                $window.location.reload();
                                iziToast.show({theme: 'dark',title:'Success',message: data.message,position: 'bottomLeft',icon: 'fa fa-user',progressBarColor: 'rgb(0, 255, 184)'});
                            } else {
                                iziToast.error({title: 'Error',message: data.message, position: 'bottomLeft'});
                            }
                        })
                        .error(function (err) {
                            iziToast.error({title: 'Oops! ',message: "Something Went Wrong!", position: 'bottomLeft'});
                        });
        }
        




  }

});



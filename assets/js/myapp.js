/**
 * Created by Exabytes on 27-07-2017.
 */
var app = angular.module('myapp', []);

app.controller('myAppController', function ($scope,$http,$window) {


 $http.get("http://210.212.181.86:5128/getcities")
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data);
                        $scope.result1=data;
                        
                        //waitingDialog.hide();

                    } else {
                        toastr.error(data.reason);
                     //   waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });


    $scope.getCities = function () {
       //waitingDialog.show('...Please Wait');
       console.log("In function Get")
       $http.get("http://210.212.181.86:5128/getcities")
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data);
                        $scope.result1=data;
                        
                        //waitingDialog.hide();

                    } else {
                        toastr.error(data.reason);
                     //   waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });
    
    };

    $scope.singleBranchResultfn = function () {
        $scope.singleBranchResultid = localStorage.resultid;
        console.log($scope.singleBranchResult);

        var param=JSON.stringify({"cityid": $scope.singleBranchResultid})
       waitingDialog.show('...Please Wait');

       $http.post("http://210.212.181.86:5128/getallbranches",param)
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data.branches);
                        $scope.singleBranchResult = data.branches;
                        //localStorage.result = data.branches;
                        waitingDialog.hide();
                      

                    } else {
                        toastr.error(data.reason);
                        waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });


    };

    $scope.getBranches = function (id) {
        localStorage.resultid = id;
       // waitingDialog.hide();
        $window.location.href = "branches.html";
        

/*
        var param=JSON.stringify({"cityid":id})
       waitingDialog.show('...Please Wait');

       $http.post("http://210.212.181.86:5128/getallbranches",param)
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data.branches);
                        localStorage.result = data.branches;
                        waitingDialog.hide();
                        $window.location.href = "branches.html";
                        

                    } else {
                        toastr.error(data.reason);
                        waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });
*/    };

});